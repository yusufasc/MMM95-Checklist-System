const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * 📊 Analytics Routes
 * Dashboard analytics ve reporting endpoints
 */

// @route   GET /api/analytics/dashboard
// @desc    Dashboard summary widgets
// @access  Private (Dashboard module access required)
router.get(
  '/dashboard',
  auth,
  checkModulePermission('Dashboard', 'gorebilir'),
  analyticsController.getDashboardAnalytics,
);

// @route   GET /api/analytics/meetings
// @desc    Meeting analytics with charts
// @access  Private (Meeting module access or admin/manager roles)
router.get(
  '/meetings',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'gorebilir'),
  analyticsController.getMeetingAnalytics,
);

// @route   GET /api/analytics/tasks
// @desc    Task performance analytics
// @access  Private (Task module access or admin/manager roles)
router.get(
  '/tasks',
  auth,
  checkModulePermission('Görev Yönetimi', 'gorebilir'),
  analyticsController.getTaskAnalytics,
);

// @route   GET /api/analytics/users
// @desc    User and department analytics
// @access  Private (Admin and Departman Yöneticisi only)
router.get(
  '/users',
  auth,
  (req, res, next) => {
    // Additional role check - only admin and department managers
    if (!['Admin', 'Departman Yöneticisi'].includes(req.user.rol)) {
      return res.status(403).json({
        message:
          'Bu analitikleri görme yetkiniz yok. Sadece Admin ve Departman Yöneticisi erişebilir.',
      });
    }
    next();
  },
  analyticsController.getUserAnalytics,
);

// @route   GET /api/analytics/notifications
// @desc    Notification delivery analytics
// @access  Private (Admin only)
router.get(
  '/notifications',
  auth,
  (req, res, next) => {
    // Admin only check
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        message: 'Sadece Admin notification analytics görüntüleyebilir',
      });
    }
    next();
  },
  analyticsController.getNotificationAnalytics,
);

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private (Admin and Departman Yöneticisi)
router.get(
  '/export',
  auth,
  (req, res, next) => {
    // Admin and department manager check
    if (!['Admin', 'Departman Yöneticisi'].includes(req.user.rol)) {
      return res.status(403).json({
        message:
          'Analytics export yetkisiz. Sadece Admin ve Departman Yöneticisi.',
      });
    }
    next();
  },
  analyticsController.exportAnalytics,
);

module.exports = router;
