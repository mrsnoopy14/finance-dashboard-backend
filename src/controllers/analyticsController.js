const Analytics = require('../models/Analytics');

// Get financial summary
const getSummary = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check access
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const summary = await Analytics.getSummary(userId, filters);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message,
    });
  }
};

// Get category breakdown
const getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check access
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const breakdown = await Analytics.getCategoryBreakdown(userId, filters);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category breakdown',
      error: error.message,
    });
  }
};

// Get recent transactions
const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    // Check access
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const transactions = await Analytics.getRecentTransactions(userId, limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent transactions',
      error: error.message,
    });
  }
};

// Get monthly trends
const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const months = req.query.months ? parseInt(req.query.months) : 12;

    // Check access
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const trends = await Analytics.getMonthlyTrends(userId, months);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly trends',
      error: error.message,
    });
  }
};

// Get type breakdown
const getTypeBreakdown = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check access
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const breakdown = await Analytics.getTypeBreakdown(userId, filters);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching type breakdown',
      error: error.message,
    });
  }
};

// Get complete dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check access
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const [summary, categoryBreakdown, typeBreakdown, recentTransactions, monthlyTrends] = await Promise.all([
      Analytics.getSummary(userId, filters),
      Analytics.getCategoryBreakdown(userId, filters),
      Analytics.getTypeBreakdown(userId, filters),
      Analytics.getRecentTransactions(userId, 5),
      Analytics.getMonthlyTrends(userId, 12),
    ]);

    res.json({
      success: true,
      data: {
        summary,
        categoryBreakdown,
        typeBreakdown,
        recentTransactions,
        monthlyTrends,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message,
    });
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyTrends,
  getTypeBreakdown,
  getDashboard,
};
