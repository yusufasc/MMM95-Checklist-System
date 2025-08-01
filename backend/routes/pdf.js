const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');

/**
 * 📄 PDF Export Routes
 * Professional PDF report generation endpoints
 */

/**
 * @route   GET /api/pdf/analytics
 * @desc    Generate analytics dashboard PDF report
 * @access  Private (Dashboard module access required)
 */
router.get(
  '/analytics',
  auth,
  checkModulePermission('Dashboard', 'gorebilir'),
  pdfController.generateAnalyticsPDF,
);

/**
 * @route   GET /api/pdf/meeting/:id
 * @desc    Generate individual meeting PDF report
 * @access  Private (Meeting module access required)
 */
router.get(
  '/meeting/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'gorebilir'),
  pdfController.generateMeetingPDF,
);

/**
 * @route   POST /api/pdf/custom
 * @desc    Generate custom PDF report with charts
 * @access  Private (Admin/Manager roles only)
 */
router.post(
  '/custom',
  auth,
  (req, res, next) => {
    // Custom role check for admin/manager
    const { user } = req.user;
    const allowedRoles = ['admin', 'departman-yoneticisi', 'usta'];

    if (!allowedRoles.includes(user?.rol?.ad?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz bulunmamaktadır',
      });
    }
    next();
  },
  pdfController.generateCustomPDF,
);

/**
 * @route   GET /api/pdf/performance
 * @desc    Generate performance PDF report
 * @access  Private (Admin/Manager roles only)
 */
router.get(
  '/performance',
  auth,
  (req, res, next) => {
    // Custom role check for admin/manager
    const { user } = req.user;
    const allowedRoles = ['admin', 'departman-yoneticisi', 'usta'];

    if (!allowedRoles.includes(user?.rol?.ad?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz bulunmamaktadır',
      });
    }
    next();
  },
  pdfController.generatePerformancePDF,
);

/**
 * @route   GET /api/pdf/batch
 * @desc    Generate multiple PDFs in batch
 * @access  Private (Admin only)
 */
router.get(
  '/batch',
  auth,
  (req, res, next) => {
    // Admin only access
    const { user } = req.user;

    if (user?.rol?.ad?.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem sadece admin kullanıcılar için mevcuttur',
      });
    }
    next();
  },
  pdfController.generateBatchPDF,
);

/**
 * @route   GET /api/pdf/test
 * @desc    Test PDF generation service
 * @access  Private (Development only)
 */
router.get('/test', auth, async (req, res) => {
  try {
    // Simple test response
    res.json({
      success: true,
      message: 'PDF service is running',
      timestamp: new Date(),
      user: req.user?.isim,
      availableEndpoints: [
        'GET /api/pdf/analytics - Analytics dashboard PDF',
        'GET /api/pdf/meeting/:id - Individual meeting PDF',
        'POST /api/pdf/custom - Custom report PDF',
        'GET /api/pdf/performance - Performance report PDF',
        'GET /api/pdf/batch - Batch PDF generation',
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'PDF service test failed',
      error: error.message,
    });
  }
});

module.exports = router;
