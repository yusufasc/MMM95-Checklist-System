const express = require('express');
const router = express.Router();
const { simpleAuth } = require('../middleware/myActivityAuth');
const { myActivityCache } = require('../middleware/cache');
const MyActivityController = require('../controllers/myActivityController');

/**
 * MyActivity Routes (Refactored)
 * Clean, modular route definitions using controller pattern
 */

// @route   GET /api/my-activity/test
// @desc    Test route for authentication
// @access  Private
router.get('/test', simpleAuth, MyActivityController.testEndpoint);

// @route   GET /api/my-activity/summary
// @desc    Get user activity summary (default 30 days)
// @access  Private
router.get(
  '/summary',
  simpleAuth,
  myActivityCache('summary'),
  MyActivityController.getSummary,
); // 🚀 CACHE: 5 dakika

// @route   GET /api/my-activity/detailed
// @desc    Get detailed activity list with pagination
// @access  Private
router.get(
  '/detailed',
  simpleAuth,
  myActivityCache('detailed'),
  MyActivityController.getDetailed,
); // 🚀 CACHE: 5 dakika

// @route   GET /api/my-activity/scores-detail
// @desc    Get score details with pagination
// @access  Private
router.get(
  '/scores-detail',
  simpleAuth,
  myActivityCache('scores'),
  MyActivityController.getScoresDetail,
); // 🚀 CACHE: 5 dakika

// @route   GET /api/my-activity/task-details/:id
// @desc    Get task details by ID (supports all task types)
// @access  Private
router.get(
  '/task-details/:id',
  simpleAuth,
  MyActivityController.getTaskDetails,
);

// @route   GET /api/my-activity/daily-performance
// @desc    Get daily performance data for charts
// @access  Private
router.get(
  '/daily-performance',
  simpleAuth,
  MyActivityController.getDailyPerformance,
);

// @route   GET /api/my-activity/debug-user
// @desc    Debug endpoint for user authentication
// @access  Private
router.get('/debug-user', simpleAuth, MyActivityController.debugUser);

// @route   GET /api/my-activity/ranking
// @desc    Get role-based ranking by scores
// @access  Private
router.get(
  '/ranking',
  simpleAuth,
  myActivityCache('ranking'),
  MyActivityController.getRanking,
); // 🚀 CACHE: 5 dakika

// @route   GET /api/my-activity/score-breakdown
// @desc    Get detailed score breakdown with filters
// @access  Private
router.get(
  '/score-breakdown',
  simpleAuth,
  MyActivityController.getScoreBreakdown,
);

// @route   GET /api/my-activity/monthly-totals
// @desc    Get monthly score totals by category - Aylık toplam puanları kategorize ederek getir
// @access  Private
router.get(
  '/monthly-totals',
  simpleAuth,
  myActivityCache('monthly'),
  MyActivityController.getMonthlyTotals,
); // �� CACHE: 30 dakika

// @route   GET /api/my-activity/quality-criteria-breakdown
// @desc    Get quality control criteria breakdown by month/year
// @access  Private
router.get(
  '/quality-criteria-breakdown',
  simpleAuth,
  myActivityCache('quality-criteria'),
  MyActivityController.getQualityCriteriaBreakdown,
); // 🚀 CACHE: 5 dakika

module.exports = router;
