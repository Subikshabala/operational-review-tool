const pool = require('../db/pool');

// Dashboard summary stats
const getDashboard = async (req, res, next) => {
  try {
    const collegeId = req.collegeId;

    // Aggregate stats
    const statsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM review_items WHERE college_id=$1 AND is_active=TRUE)::int AS active_metrics,
        (SELECT COUNT(*) FROM review_sessions WHERE college_id=$1 AND status='submitted')::int AS submitted_sessions,
        (SELECT COUNT(*) FROM action_items WHERE college_id=$1 AND status != 'resolved')::int AS open_tasks,
        (SELECT COUNT(*) FROM action_items WHERE college_id=$1 AND status != 'resolved' AND due_date < CURRENT_DATE)::int AS overdue_tasks,
        (SELECT COUNT(*) FROM users WHERE college_id=$1)::int AS total_members`,
      [collegeId]
    );

    // Recent sessions with health summary
    const recentSessions = await pool.query(
      `SELECT rs.id, rs.title, rs.session_date, rs.status, rs.session_type,
              COUNT(re.id) AS total,
              COUNT(CASE WHEN re.status='green'  THEN 1 END) AS green,
              COUNT(CASE WHEN re.status='yellow' THEN 1 END) AS yellow,
              COUNT(CASE WHEN re.status='red'    THEN 1 END) AS red
       FROM review_sessions rs
       LEFT JOIN review_entries re ON re.session_id = rs.id
       WHERE rs.college_id=$1 AND rs.status='submitted'
       GROUP BY rs.id, rs.title, rs.session_date, rs.status, rs.session_type
       ORDER BY rs.session_date DESC
       LIMIT 8`,
      [collegeId]
    );

    // Metric trend data for top 5 active metrics
    const metricTrend = await pool.query(
      `SELECT ri.id, ri.name, ri.category,
              array_agg(re.actual_value ORDER BY rs.session_date) AS values,
              array_agg(rs.session_date ORDER BY rs.session_date) AS dates,
              array_agg(re.status ORDER BY rs.session_date) AS statuses
       FROM review_items ri
       JOIN review_entries re ON re.review_item_id = ri.id
       JOIN review_sessions rs ON rs.id = re.session_id
       WHERE ri.college_id=$1 AND ri.is_active=TRUE
         AND rs.status='submitted' AND re.actual_value IS NOT NULL
       GROUP BY ri.id, ri.name, ri.category
       ORDER BY ri.name
       LIMIT 5`,
      [collegeId]
    );

    // Department health
    const deptHealth = await pool.query(
      `SELECT ri.category AS department,
              COUNT(re.id) AS total,
              COUNT(CASE WHEN re.status='green'  THEN 1 END) AS green,
              COUNT(CASE WHEN re.status='yellow' THEN 1 END) AS yellow,
              COUNT(CASE WHEN re.status='red'    THEN 1 END) AS red
       FROM review_items ri
       JOIN review_entries re ON re.review_item_id = ri.id
       JOIN review_sessions rs ON rs.id = re.session_id
       WHERE ri.college_id=$1 AND rs.status='submitted'
         AND re.actual_value IS NOT NULL
       GROUP BY ri.category
       ORDER BY ri.category`,
      [collegeId]
    );

    // Priority tasks
    const priorityTasks = await pool.query(
      `SELECT ai.id, ai.title, ai.priority, ai.status, ai.due_date,
              u.name AS assigned_to_name
       FROM action_items ai
       LEFT JOIN users u ON u.id = ai.assigned_to
       WHERE ai.college_id=$1 AND ai.status != 'resolved'
       ORDER BY CASE ai.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
                ai.due_date ASC NULLS LAST
       LIMIT 5`,
      [collegeId]
    );

    res.json({
      stats: statsResult.rows[0],
      recentSessions: recentSessions.rows,
      metricTrends: metricTrend.rows,
      departmentHealth: deptHealth.rows,
      priorityTasks: priorityTasks.rows
    });
  } catch (err) {
    next(err);
  }
};

// Audit log
const getAuditLog = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE college_id=$1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.collegeId, parseInt(limit), parseInt(offset)]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getAuditLog };
