const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const { logAudit } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

// List all members of a college
const getMembers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department, designation, created_at
       FROM users WHERE college_id = $1 ORDER BY role, name`,
      [req.collegeId]
    );
    res.json({ members: result.rows });
  } catch (err) {
    next(err);
  }
};

// Add a new member
const addMember = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, email, password, role, department, designation } = req.body;

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (college_id, name, email, password, role, department, designation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, department, designation, created_at`,
      [req.collegeId, name, email.toLowerCase(), hashed, role, department, designation]
    );

    const member = result.rows[0];

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'ADD_MEMBER', tableName: 'users', recordId: member.id,
      newValues: { name, email, role, department, designation }, ipAddress: req.ip
    });

    res.status(201).json({ message: 'Member added successfully', member });
  } catch (err) {
    next(err);
  }
};

// Update a member
const updateMember = async (req, res, next) => {
  const { id } = req.params;
  const { role, department, designation } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET role=$1, department=$2, designation=$3
       WHERE id=$4 AND college_id=$5
       RETURNING id, name, email, role, department, designation`,
      [role, department, designation, id, req.collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'UPDATE_MEMBER', tableName: 'users', recordId: id,
      newValues: { role, department, designation }, ipAddress: req.ip
    });

    res.json({ message: 'Member updated', member: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Remove a member
const removeMember = async (req, res, next) => {
  const { id } = req.params;

  if (String(id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot remove yourself' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 AND college_id=$2 RETURNING id, name`,
      [id, req.collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'REMOVE_MEMBER', tableName: 'users', recordId: id, ipAddress: req.ip
    });

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMembers, addMember, updateMember, removeMember };
