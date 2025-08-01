const analyticsService = require('../services/analyticsService');
const { subDays, startOfMonth, endOfMonth } = require('date-fns');

/**
 * 📊 MMM95 Analytics Controller
 * Dashboard analytics ve reporting endpoints
 */

// @route   GET /api/analytics/dashboard
// @desc    Dashboard summary analytics
// @access  Private (Admin, Departman Yöneticisi, Usta)
const getDashboardAnalytics = async (req, res) => {
  try {
    const { user } = req.user || {};

    // Get user ID for personal dashboard (optional)
    const userId = req.query.personal === 'true' ? req.user.id : null;

    const dashboardData = await analyticsService.getDashboardSummary(userId);

    res.json({
      message: 'Dashboard analytics başarıyla getirildi',
      data: dashboardData,
      personal: !!userId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      message: 'Dashboard analytics alınamadı',
      error: error.message,
    });
  }
};

// @route   GET /api/analytics/meetings
// @desc    Meeting analytics with charts
// @access  Private (Admin, Departman Yöneticisi, Usta)
const getMeetingAnalytics = async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      departmentId,
      organizatorId,
      period = '30d', // 7d, 30d, 90d, 1y
    } = req.query;

    // Calculate date range based on period
    let fromDate, toDate;
    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      toDate = new Date();
      switch (period) {
      case '7d':
        fromDate = subDays(toDate, 7);
        break;
      case '90d':
        fromDate = subDays(toDate, 90);
        break;
      case '1y':
        fromDate = subDays(toDate, 365);
        break;
      default: // 30d
        fromDate = subDays(toDate, 30);
      }
    }

    const analyticsData = await analyticsService.getMeetingAnalytics({
      dateFrom: fromDate,
      dateTo: toDate,
      departmentId,
      organizatorId,
    });

    res.json({
      message: 'Meeting analytics başarıyla getirildi',
      data: analyticsData,
      filters: {
        dateFrom: fromDate,
        dateTo: toDate,
        departmentId,
        organizatorId,
        period,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Meeting analytics error:', error);
    res.status(500).json({
      message: 'Meeting analytics alınamadı',
      error: error.message,
    });
  }
};

// @route   GET /api/analytics/tasks
// @desc    Task performance analytics
// @access  Private (Admin, Departman Yöneticisi, Usta)
const getTaskAnalytics = async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      departmentId,
      assigneeId,
      meetingOnly = false,
      period = '30d',
    } = req.query;

    // Calculate date range
    let fromDate, toDate;
    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      toDate = new Date();
      switch (period) {
      case '7d':
        fromDate = subDays(toDate, 7);
        break;
      case '90d':
        fromDate = subDays(toDate, 90);
        break;
      case '1y':
        fromDate = subDays(toDate, 365);
        break;
      default:
        fromDate = subDays(toDate, 30);
      }
    }

    const analyticsData = await analyticsService.getTaskAnalytics({
      dateFrom: fromDate,
      dateTo: toDate,
      departmentId,
      assigneeId,
      meetingOnly: meetingOnly === 'true',
    });

    res.json({
      message: 'Task analytics başarıyla getirildi',
      data: analyticsData,
      filters: {
        dateFrom: fromDate,
        dateTo: toDate,
        departmentId,
        assigneeId,
        meetingOnly,
        period,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({
      message: 'Task analytics alınamadı',
      error: error.message,
    });
  }
};

// @route   GET /api/analytics/users
// @desc    User and department analytics
// @access  Private (Admin, Departman Yöneticisi only)
const getUserAnalytics = async (req, res) => {
  try {
    // Check admin permission
    if (!['Admin', 'Departman Yöneticisi'].includes(req.user.rol)) {
      return res.status(403).json({
        message: 'Bu analitikleri görme yetkiniz yok',
      });
    }

    const { dateFrom, dateTo, period = '30d' } = req.query;

    // Calculate date range
    let fromDate, toDate;
    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      toDate = new Date();
      fromDate = subDays(
        toDate,
        period === '7d' ? 7 : period === '90d' ? 90 : 30,
      );
    }

    const analyticsData = await analyticsService.getUserAnalytics({
      dateFrom: fromDate,
      dateTo: toDate,
    });

    res.json({
      message: 'User analytics başarıyla getirildi',
      data: analyticsData,
      filters: {
        dateFrom: fromDate,
        dateTo: toDate,
        period,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      message: 'User analytics alınamadı',
      error: error.message,
    });
  }
};

// @route   GET /api/analytics/notifications
// @desc    Notification delivery analytics
// @access  Private (Admin only)
const getNotificationAnalytics = async (req, res) => {
  try {
    // Check admin permission
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        message: 'Sadece admin notification analytics görüntüleyebilir',
      });
    }

    const { dateFrom, dateTo, period = '7d' } = req.query;

    // Calculate date range
    let fromDate, toDate;
    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      toDate = new Date();
      fromDate = subDays(toDate, period === '30d' ? 30 : 7);
    }

    const analyticsData = await analyticsService.getNotificationAnalytics({
      dateFrom: fromDate,
      dateTo: toDate,
    });

    res.json({
      message: 'Notification analytics başarıyla getirildi',
      data: analyticsData,
      filters: {
        dateFrom: fromDate,
        dateTo: toDate,
        period,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Notification analytics error:', error);
    res.status(500).json({
      message: 'Notification analytics alınamadı',
      error: error.message,
    });
  }
};

// @route   GET /api/analytics/export
// @desc    Export analytics data (future: PDF/Excel)
// @access  Private (Admin, Departman Yöneticisi)
const exportAnalytics = async (req, res) => {
  try {
    const {
      type = 'meetings', // meetings, tasks, users
      format = 'json', // json, csv (future: pdf, excel)
      period = '30d',
    } = req.query;

    // For now, return JSON data - can be extended for PDF/Excel export
    let analyticsData;

    switch (type) {
    case 'meetings':
      analyticsData = await analyticsService.getMeetingAnalytics({
        dateFrom: subDays(
          new Date(),
          period === '7d' ? 7 : period === '90d' ? 90 : 30,
        ),
        dateTo: new Date(),
      });
      break;
    case 'tasks':
      analyticsData = await analyticsService.getTaskAnalytics({
        dateFrom: subDays(
          new Date(),
          period === '7d' ? 7 : period === '90d' ? 90 : 30,
        ),
        dateTo: new Date(),
      });
      break;
    case 'users':
      if (!['Admin', 'Departman Yöneticisi'].includes(req.user.rol)) {
        return res.status(403).json({ message: 'Yetkiniz yok' });
      }
      analyticsData = await analyticsService.getUserAnalytics({
        dateFrom: subDays(new Date(), period === '7d' ? 7 : 30),
        dateTo: new Date(),
      });
      break;
    default:
      return res.status(400).json({ message: 'Geçersiz export type' });
    }

    if (format === 'json') {
      res.json({
        message: `${type} analytics export`,
        data: analyticsData,
        exportType: type,
        format,
        period,
        exportedAt: new Date(),
      });
    } else {
      // Future: CSV, PDF, Excel export
      res.status(400).json({ message: 'Bu format henüz desteklenmiyor' });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      message: 'Analytics export edilemedi',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getMeetingAnalytics,
  getTaskAnalytics,
  getUserAnalytics,
  getNotificationAnalytics,
  exportAnalytics,
};
