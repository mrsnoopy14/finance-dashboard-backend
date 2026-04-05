const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authorizeRoles } = require('../middleware/auth');

// Get dashboard (viewer, analyst, or admin)
router.get('/dashboard/:userId?', authorizeRoles(['viewer', 'analyst', 'admin']), analyticsController.getDashboard);

// Get summary (viewer, analyst, or admin)
router.get('/summary/:userId?', authorizeRoles(['viewer', 'analyst', 'admin']), analyticsController.getSummary);

// Get category breakdown (analyzer or admin)
router.get(
  '/breakdown/category/:userId?',
  authorizeRoles(['analyst', 'admin']),
  analyticsController.getCategoryBreakdown
);

// Get type breakdown (analyzer or admin)
router.get(
  '/breakdown/type/:userId?',
  authorizeRoles(['analyst', 'admin']),
  analyticsController.getTypeBreakdown
);

// Get recent transactions (viewer, analyst, or admin)
router.get(
  '/transactions/recent/:userId?',
  authorizeRoles(['viewer', 'analyst', 'admin']),
  analyticsController.getRecentTransactions
);

// Get monthly trends (analyzer or admin)
router.get(
  '/trends/monthly/:userId?',
  authorizeRoles(['analyst', 'admin']),
  analyticsController.getMonthlyTrends
);

module.exports = router;
