const pool = require('../db/pool');

// Log audit trail to DB
const logAudit = async ({ collegeId, userId, userName, action, tableName, recordId, oldValues, newValues, ipAddress }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (college_id, user_id, user_name, action, table_name, record_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [collegeId, userId, userName, action, tableName, recordId,
       oldValues ? JSON.stringify(oldValues) : null,
       newValues ? JSON.stringify(newValues) : null,
       ipAddress]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// Central error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Record already exists (duplicate).' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // PostgreSQL check constraint
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Invalid value for constrained field.' });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Validation failed', details: err.details });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = { errorHandler, logAudit };
