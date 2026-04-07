const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const { authenticate, authorize, collegeScope } = require('../middleware/auth');
const authController = require('../controllers/authController');
const membersController = require('../controllers/membersController');
const reviewItemsController = require('../controllers/reviewItemsController');
const sessionsController = require('../controllers/sessionsController');
const actionItemsController = require('../controllers/actionItemsController');
const analyticsController = require('../controllers/analyticsController');

// ─── AUTH ─────────────────────────────────────────────────────────────
router.post('/auth/register',
  [
    body('collegeName').notEmpty().withMessage('College name is required'),
    body('collegeCode').notEmpty().isLength({ min: 2, max: 10 }).withMessage('College code 2-10 chars'),
    body('adminName').notEmpty().withMessage('Admin name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  authController.register
);

router.post('/auth/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  authController.login
);

router.get('/auth/me', authenticate, authController.getMe);

// ─── MEMBERS ──────────────────────────────────────────────────────────
router.get('/members', authenticate, collegeScope, membersController.getMembers);

router.post('/members', authenticate, collegeScope, authorize('admin', 'hod'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').isIn(['admin','hod','faculty','student']).withMessage('Invalid role'),
  ],
  membersController.addMember
);

router.put('/members/:id', authenticate, collegeScope, authorize('admin', 'hod'), membersController.updateMember);
router.delete('/members/:id', authenticate, collegeScope, authorize('admin'), membersController.removeMember);

router.post('/members/bulk-upload',
  authenticate,
  collegeScope,
  authorize('admin'),
  upload.single('file'),
  membersController.bulkUploadStudents
);

// ─── PERFORMANCE METRICS ──────────────────────────────────────────────
router.get('/metrics', authenticate, collegeScope, reviewItemsController.getItems);
router.get('/metrics/:id', authenticate, collegeScope, reviewItemsController.getItem);

router.post('/metrics', authenticate, collegeScope, authorize('admin', 'hod'),
  [
    body('name').notEmpty().withMessage('Metric name required'),
    body('target_value').isNumeric().withMessage('Target value must be numeric'),
  ],
  reviewItemsController.createItem
);

router.put('/metrics/:id', authenticate, collegeScope, authorize('admin', 'hod'), reviewItemsController.updateItem);
router.delete('/metrics/:id', authenticate, collegeScope, authorize('admin'), reviewItemsController.deleteItem);

// ─── REVIEW SESSIONS ──────────────────────────────────────────────────
router.get('/sessions', authenticate, collegeScope, sessionsController.getSessions);
router.get('/sessions/:id', authenticate, collegeScope, sessionsController.getSession);

router.post('/sessions', authenticate, collegeScope, authorize('admin', 'hod', 'faculty'),
  [
    body('title').notEmpty().withMessage('Session title required'),
    body('period_start').isDate().withMessage('Valid period start date required'),
    body('period_end').isDate().withMessage('Valid period end date required'),
    body('session_date').isDate().withMessage('Valid session date required'),
  ],
  sessionsController.createSession
);

router.put('/sessions/:id/entries', authenticate, collegeScope,
  authorize('admin', 'hod', 'faculty'),
  sessionsController.upsertEntry
);

router.post('/sessions/:id/submit', authenticate, collegeScope,
  authorize('admin', 'hod', 'faculty'),
  sessionsController.submitSession
);

router.delete('/sessions/:id', authenticate, collegeScope, authorize('admin', 'hod'), sessionsController.deleteSession);

// ─── TASKS (Action Items) ─────────────────────────────────────────────
router.get('/tasks', authenticate, collegeScope, actionItemsController.getTasks);

router.post('/tasks', authenticate, collegeScope,
  [
    body('title').notEmpty().withMessage('Task title required'),
  ],
  actionItemsController.createTask
);

router.put('/tasks/:id', authenticate, collegeScope, actionItemsController.updateTask);
router.delete('/tasks/:id', authenticate, collegeScope, authorize('admin', 'hod'), actionItemsController.deleteTask);

// ─── ANALYTICS & AUDIT ────────────────────────────────────────────────
router.get('/analytics/dashboard', authenticate, collegeScope, analyticsController.getDashboard);
router.get('/analytics/audit-log', authenticate, collegeScope, authorize('admin', 'hod'), analyticsController.getAuditLog);

module.exports = router;
