const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const { logAudit } = require('../middleware/errorHandler');

// Get all tasks (optionally filtered)
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assigned_to } = req.query;

    let query = `
      SELECT ai.*, u.name AS assigned_to_name, cu.name AS created_by_name,
             rs.title AS session_title
      FROM action_items ai
      LEFT JOIN users u  ON u.id  = ai.assigned_to
      LEFT JOIN users cu ON cu.id = ai.created_by
      LEFT JOIN review_sessions rs ON rs.id = ai.session_id
      WHERE ai.college_id = $1
    `;
    const params = [req.collegeId];

    if (status) { params.push(status); query += ` AND ai.status = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND ai.priority = $${params.length}`; }
    if (assigned_to) { params.push(assigned_to); query += ` AND ai.assigned_to = $${params.length}`; }

    query += ` ORDER BY
      CASE ai.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      ai.due_date ASC NULLS LAST, ai.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

// Create task
const createTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }

  const { title, description, session_id, entry_id, assigned_to, priority, due_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO action_items
         (college_id, session_id, entry_id, title, description, assigned_to, created_by, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.collegeId, session_id || null, entry_id || null, title, description,
       assigned_to || null, req.user.id, priority || 'medium', due_date || null]
    );

    const task = result.rows[0];

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'CREATE_TASK', tableName: 'action_items', recordId: task.id,
      newValues: task, ipAddress: req.ip
    });

    res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    next(err);
  }
};

// Update task status (open → in_progress → resolved)
const updateTask = async (req, res, next) => {
  const { id } = req.params;
  const { status, title, description, assigned_to, priority, due_date } = req.body;

  try {
    // Build SET clause dynamically so we only update provided fields
    const setClauses = [];
    const params = [];

    if (status !== undefined) {
      params.push(status);
      setClauses.push(`status=$${params.length}`);
      // Also update resolved_at timestamp
      if (status === 'resolved') {
        setClauses.push('resolved_at=NOW()');
      } else if (status === 'open' || status === 'in_progress') {
        setClauses.push('resolved_at=NULL::TIMESTAMPTZ');
      }
    }
    if (title !== undefined)       { params.push(title);       setClauses.push(`title=$${params.length}`); }
    if (description !== undefined) { params.push(description); setClauses.push(`description=$${params.length}`); }
    if (assigned_to !== undefined) { params.push(assigned_to || null); setClauses.push(`assigned_to=$${params.length}`); }
    if (priority !== undefined)    { params.push(priority);    setClauses.push(`priority=$${params.length}`); }
    if (due_date !== undefined)    { params.push(due_date || null); setClauses.push(`due_date=$${params.length}`); }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id, req.collegeId);
    const result = await pool.query(
      `UPDATE action_items SET ${setClauses.join(', ')}
       WHERE id=$${params.length - 1} AND college_id=$${params.length}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'UPDATE_TASK', tableName: 'action_items', recordId: id,
      newValues: req.body, ipAddress: req.ip
    });

    res.json({ message: 'Task updated', task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Delete task
const deleteTask = async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM action_items WHERE id=$1 AND college_id=$2 RETURNING id`,
      [req.params.id, req.collegeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
