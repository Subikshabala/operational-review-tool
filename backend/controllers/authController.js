const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const { logAudit } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'college_secret_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';

// Register new college + admin user
const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }

  const { collegeName, collegeCode, adminName, email, password } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create college
    const collegeResult = await client.query(
      `INSERT INTO colleges (name, code) VALUES ($1, $2) RETURNING id, name, code`,
      [collegeName, collegeCode.toUpperCase()]
    );
    const college = collegeResult.rows[0];

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin user
    const userResult = await client.query(
      `INSERT INTO users (college_id, name, email, password, role, designation)
       VALUES ($1, $2, $3, $4, 'admin', 'College Administrator')
       RETURNING id, name, email, role, designation`,
      [college.id, adminName, email.toLowerCase(), hashedPassword]
    );
    const user = userResult.rows[0];

    await client.query('COMMIT');

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    await logAudit({
      collegeId: college.id, userId: user.id, userName: user.name,
      action: 'REGISTER_COLLEGE', tableName: 'colleges', recordId: college.id,
      newValues: { collegeName, collegeCode }, ipAddress: req.ip
    });

    res.status(201).json({
      message: 'College registered successfully',
      token,
      user: { ...user, college_id: college.id },
      college
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Login
const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT u.id, u.college_id, u.name, u.email, u.password, u.role, u.department, u.designation,
              c.name AS college_name, c.code AS college_code
       FROM users u
       JOIN colleges c ON c.id = u.college_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const { password: _, ...safeUser } = user;

    await logAudit({
      collegeId: user.college_id, userId: user.id, userName: user.name,
      action: 'LOGIN', tableName: 'users', recordId: user.id,
      ipAddress: req.ip
    });

    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

// Get current user profile
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.college_id, u.name, u.email, u.role, u.department, u.designation,
              c.name AS college_name, c.code AS college_code
       FROM users u JOIN colleges c ON c.id = u.college_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
