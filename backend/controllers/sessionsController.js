const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const { logAudit } = require('../middleware/errorHandler');

// List all sessions for a college
const getSessions = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT rs.id, rs.title, rs.session_type, rs.period_start, rs.period_end,
              rs.session_date, rs.status, rs.notes, rs.created_at, rs.submitted_at,
              rs.created_by,
              u.name AS created_by_name,
              COUNT(re.id)::int AS total_entries,
              COUNT(CASE WHEN re.status='green'  THEN 1 END)::int AS green_count,
              COUNT(CASE WHEN re.status='yellow' THEN 1 END)::int AS yellow_count,
              COUNT(CASE WHEN re.status='red'    THEN 1 END)::int AS red_count
       FROM review_sessions rs
       LEFT JOIN users u ON u.id = rs.created_by
       LEFT JOIN review_entries re ON re.session_id = rs.id
       WHERE rs.college_id = $1
       GROUP BY rs.id, rs.title, rs.session_type, rs.period_start, rs.period_end,
                rs.session_date, rs.status, rs.notes, rs.created_at, rs.submitted_at,
                rs.created_by, u.name
       ORDER BY rs.session_date DESC`,
      [req.collegeId]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    next(err);
  }
};

// Get full session detail with entries
const getSession = async (req, res, next) => {
  try {
    const sessionResult = await pool.query(
      `SELECT rs.*, u.name AS created_by_name, su.name AS submitted_by_name
       FROM review_sessions rs
       LEFT JOIN users u  ON u.id  = rs.created_by
       LEFT JOIN users su ON su.id = rs.submitted_by
       WHERE rs.id=$1 AND rs.college_id=$2`,
      [req.params.id, req.collegeId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review session not found' });
    }

    const session = sessionResult.rows[0];

    // Get all active metrics with existing entries (or null if not filled)
    const entriesResult = await pool.query(
      `SELECT ri.id AS review_item_id, ri.name, ri.category, ri.target_value,
              ri.unit, ri.metric_type, ri.warning_threshold, ri.critical_threshold,
              re.id AS entry_id, re.actual_value, re.status, re.observation, re.entered_by
       FROM review_items ri
       LEFT JOIN review_entries re ON re.review_item_id = ri.id AND re.session_id = $1
       WHERE ri.college_id = $2 AND ri.is_active = TRUE
       ORDER BY ri.category, ri.name`,
      [req.params.id, req.collegeId]
    );

    // Get tasks linked to this session
    const tasksResult = await pool.query(
      `SELECT ai.*, u.name AS assigned_to_name, cu.name AS created_by_name
       FROM action_items ai
       LEFT JOIN users u  ON u.id  = ai.assigned_to
       LEFT JOIN users cu ON cu.id = ai.created_by
       WHERE ai.session_id=$1 AND ai.college_id=$2
       ORDER BY ai.priority DESC, ai.created_at DESC`,
      [req.params.id, req.collegeId]
    );

    res.json({ session, entries: entriesResult.rows, tasks: tasksResult.rows });
  } catch (err) {
    next(err);
  }
};

// Create new session
const createSession = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }

  const { title, session_type, period_start, period_end, session_date, notes } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO review_sessions (college_id, title, session_type, period_start, period_end, session_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.collegeId, title, session_type || 'monthly', period_start, period_end, session_date, notes, req.user.id]
    );

    const session = result.rows[0];

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'CREATE_SESSION', tableName: 'review_sessions', recordId: session.id,
      newValues: session, ipAddress: req.ip
    });

    res.status(201).json({ message: 'Review session created', session });
  } catch (err) {
    next(err);
  }
};

// Save/update an entry (actual value for a metric)
const upsertEntry = async (req, res, next) => {
  const { review_item_id, actual_value, observation } = req.body;
  const { id: session_id } = req.params;

  // Sanitize inputs
  const sanitizedValue = (actual_value === '' || actual_value === null || actual_value === undefined)
    ? null
    : parseFloat(actual_value);
  const sanitizedObs = observation || '';

  if (!review_item_id) {
    return res.status(400).json({ error: 'review_item_id is required' });
  }

  try {
    // Check session exists and is not submitted
    const sessionCheck = await pool.query(
      `SELECT id, status FROM review_sessions WHERE id=$1 AND college_id=$2`,
      [session_id, req.collegeId]
    );
    if (sessionCheck.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    if (sessionCheck.rows[0].status === 'submitted') {
      return res.status(400).json({ error: 'Session is already submitted and locked.' });
    }

    // Get metric thresholds
    const itemResult = await pool.query(
      `SELECT target_value, metric_type, warning_threshold, critical_threshold
       FROM review_items WHERE id=$1 AND college_id=$2`,
      [review_item_id, req.collegeId]
    );
    if (itemResult.rows.length === 0) return res.status(404).json({ error: 'Metric not found' });

    const item = itemResult.rows[0];
    const target = parseFloat(item.target_value);
    const warn   = isNaN(parseFloat(item.warning_threshold))  ? 80 : parseFloat(item.warning_threshold);
    const crit   = isNaN(parseFloat(item.critical_threshold)) ? 60 : parseFloat(item.critical_threshold);
    let status = 'pending';

    if (sanitizedValue !== null && !isNaN(sanitizedValue)) {
      let percentage;
      if (item.metric_type === 'lower_better') {
        // lower_better: actual=0 when target=50 → 200% (excellent)
        // actual=60 when target=50 → 83% (still green, only slightly over)
        percentage = target > 0
          ? Math.max(0, ((2 * target - sanitizedValue) / target) * 100)
          : 100;
      } else {
        // higher_better or target_exact
        percentage = target > 0 ? (sanitizedValue / target) * 100 : 100;
      }

      if (percentage >= warn)      status = 'green';
      else if (percentage >= crit) status = 'yellow';
      else                         status = 'red';
    }

    const result = await pool.query(
      `INSERT INTO review_entries (session_id, review_item_id, actual_value, status, observation, entered_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id, review_item_id) DO UPDATE SET
         actual_value=$3, status=$4, observation=$5, entered_by=$6, updated_at=NOW()
       RETURNING *`,
      [session_id, review_item_id, sanitizedValue, status, sanitizedObs, req.user.id]
    );

    res.json({ message: 'Entry saved', entry: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Submit session (lock it)
const submitSession = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE review_sessions SET status='submitted', submitted_by=$1, submitted_at=NOW()
       WHERE id=$2 AND college_id=$3 AND status='draft'
       RETURNING *`,
      [req.user.id, id, req.collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Session not found or already submitted.' });
    }

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'SUBMIT_SESSION', tableName: 'review_sessions', recordId: id, ipAddress: req.ip
    });

    res.json({ message: 'Session submitted successfully', session: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Delete session (only drafts)
const deleteSession = async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM review_sessions WHERE id=$1 AND college_id=$2 AND status='draft' RETURNING id`,
      [req.params.id, req.collegeId]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Session not found or cannot delete a submitted session.' });
    }
    res.json({ message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSessions, getSession, createSession, upsertEntry, submitSession, deleteSession };
