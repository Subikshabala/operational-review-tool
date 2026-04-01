const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001', // React sometimes uses 3001 if 3000 is taken
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later.' }
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);

// Logging & parsing
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'College Review System', timestamp: new Date() });
});

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎓 College Review System running on port ${PORT}`);
});

module.exports = app;

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await require('./db/pool').query('SELECT NOW()');
    res.json({
      status: 'DB connected',
      time: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'DB connection failed',
      error: err.message
    });
  }
});