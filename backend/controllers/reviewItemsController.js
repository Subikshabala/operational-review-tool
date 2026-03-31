const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const { logAudit } = require('../middleware/errorHandler');

// Get all metrics for a college
const getItems = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ri.*, u.name AS created_by_name
       FROM review_items ri
       LEFT JOIN users u ON u.id = ri.created_by
       WHERE ri.college_id = $1
       ORDER BY ri.category, ri.name`,
      [req.collegeId]
    );
    res.json({ items: result.rows });
  } catch (err) {
    next(err);
  }
};

// Get single metric
const getItem = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM review_items WHERE id=$1 AND college_id=$2`,
      [req.params.id, req.collegeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Metric not found' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Create new metric
const createItem = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, category, description, target_value, unit, metric_type, review_frequency, warning_threshold, critical_threshold } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO review_items
         (college_id, name, category, description, target_value, unit, metric_type, review_frequency, warning_threshold, critical_threshold, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [req.collegeId, name, category, description, target_value, unit,
       metric_type || 'higher_better',
       review_frequency || 'monthly',
       warning_threshold || 80,
       critical_threshold || 60,
       req.user.id]
    );

    const item = result.rows[0];

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'CREATE_METRIC', tableName: 'review_items', recordId: item.id,
      newValues: item, ipAddress: req.ip
    });

    res.status(201).json({ message: 'Performance metric created', item });
  } catch (err) {
    next(err);
  }
};

// Update metric
const updateItem = async (req, res, next) => {
  const { name, category, description, target_value, unit, metric_type, review_frequency, warning_threshold, critical_threshold, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE review_items SET
         name=$1, category=$2, description=$3, target_value=$4, unit=$5,
         metric_type=$6, review_frequency=$7, warning_threshold=$8,
         critical_threshold=$9, is_active=$10
       WHERE id=$11 AND college_id=$12
       RETURNING *`,
      [name, category, description, target_value, unit, metric_type,
       review_frequency, warning_threshold, critical_threshold, is_active,
       req.params.id, req.collegeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Metric not found' });

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'UPDATE_METRIC', tableName: 'review_items', recordId: req.params.id,
      newValues: req.body, ipAddress: req.ip
    });

    res.json({ message: 'Metric updated', item: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Delete metric
const deleteItem = async (req, res, next) => {
  try {
    // Check if metric has any linked review entries
    const entryCheck = await pool.query(
      `SELECT COUNT(*) FROM review_entries WHERE review_item_id=$1`,
      [req.params.id]
    );
    if (parseInt(entryCheck.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete metric: it has existing review entries. Deactivate it instead.'
      });
    }

    const result = await pool.query(
      `DELETE FROM review_items WHERE id=$1 AND college_id=$2 RETURNING id, name`,
      [req.params.id, req.collegeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Metric not found' });

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'DELETE_METRIC', tableName: 'review_items', recordId: req.params.id, ipAddress: req.ip
    });

    res.json({ message: 'Metric deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
