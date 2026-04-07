const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const { logAudit } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

// List all members of a college
const getMembers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department, designation, roll_no, created_at
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

  const { name, email, password, role, department, designation, roll_no } = req.body;

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (college_id, name, email, password, role, department, designation, roll_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, department, designation, roll_no, created_at`,
      [req.collegeId, name, email.toLowerCase(), hashed, role, department, designation, roll_no || null]
    );

    const member = result.rows[0];

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'ADD_MEMBER', tableName: 'users', recordId: member.id,
      newValues: { name, email, role, department, designation, roll_no }, ipAddress: req.ip
    });

    res.status(201).json({ message: 'Member added successfully', member });
  } catch (err) {
    next(err);
  }
};

// Update a member
const updateMember = async (req, res, next) => {
  const { id } = req.params;
  const { role, department, designation, roll_no } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET role=$1, department=$2, designation=$3, roll_no=$4
       WHERE id=$5 AND college_id=$6
       RETURNING id, name, email, role, department, designation, roll_no`,
      [role, department, designation, roll_no || null, id, req.collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'UPDATE_MEMBER', tableName: 'users', recordId: id,
      newValues: { role, department, designation, roll_no }, ipAddress: req.ip
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

// Bulk upload students using Excel/CSV
const bulkUploadStudents = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty' });
    }

    const defaultPassword = 'Welcome@123';
    const hashed = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
    
    const results = {
      success: 0,
      skipped: 0,
      errors: []
    };

    // Sequential inserts to handle duplicates and validation per record
    for (const [index, row] of data.entries()) {
      const name = row.Name || row.name || row['Full Name'];
      const email = row.Email || row.email || row['Email Address'];
      const department = row.Department || row.department || row.Dept;
      const roll_no = row['Roll Number'] || row['Roll No'] || row.roll_no;
      const designation = row.Designation || row.designation || `Student - ${row.Year || ''}`;

      if (!name || !email || !department) {
        results.errors.push(`Row ${index + 2}: Missing required fields (Name, Email, or Department)`);
        results.skipped++;
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO users (college_id, name, email, password, role, department, designation, roll_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [req.collegeId, name, email.toLowerCase(), hashed, 'student', department, designation, roll_no || null]
        );
        results.success++;
      } catch (err) {
        if (err.code === '23505') {
          results.skipped++;
          results.errors.push(`Row ${index + 2}: Email ${email} already exists.`);
        } else {
          results.errors.push(`Row ${index + 2}: ${err.message}`);
          results.skipped++;
        }
      }
    }

    await logAudit({
      collegeId: req.collegeId, userId: req.user.id, userName: req.user.name,
      action: 'BULK_UPLOAD_STUDENTS', tableName: 'users',
      newValues: { success: results.success, skipped: results.skipped }, ipAddress: req.ip
    });

    res.json({
      message: `Bulk upload completed: ${results.success} added, ${results.skipped} skipped.`,
      results
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMembers, addMember, updateMember, removeMember, bulkUploadStudents };
