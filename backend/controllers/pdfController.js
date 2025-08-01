const pdfService = require('../services/pdfService');
const analyticsService = require('../services/analyticsService');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const User = require('../models/User');
const logger = require('../utils/logger');
const { subDays, startOfMonth, endOfMonth } = require('date-fns');

/**
 * 📄 MMM95 PDF Export Controller
 * Professional PDF report generation for analytics, meetings, and performance
 */

/**
 * @route   GET /api/pdf/analytics
 * @desc    Generate analytics dashboard PDF report
 * @access  Private (Dashboard module access)
 */
const generateAnalyticsPDF = async (req, res) => {
  try {
    const { user } = req.user || {};
    const {
      period = '30d',
      dateFrom,
      dateTo,
      departmentId,
      personal = false,
    } = req.query;

    logger.info(
      `📊 Generating analytics PDF for user: ${user?.isim}, period: ${period}`,
    );

    // Calculate date range
    let startDate, endDate;
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else {
      const days =
        period === '7d'
          ? 7
          : period === '90d'
            ? 90
            : period === '1y'
              ? 365
              : 30;
      startDate = subDays(new Date(), days);
      endDate = new Date();
    }

    // Fetch analytics data
    const analyticsData = await analyticsService.getDashboardSummary(
      personal === 'true' ? user?.id : null,
      { startDate, endDate, departmentId },
    );

    const meetingAnalytics = await analyticsService.getMeetingAnalytics({
      dateFrom: startDate,
      dateTo: endDate,
      departmentId,
      organizatorId: personal === 'true' ? user?.id : null,
    });

    const taskAnalytics = await analyticsService.getTaskAnalytics({
      dateFrom: startDate,
      dateTo: endDate,
      departmentId,
      assignedTo: personal === 'true' ? user?.id : null,
    });

    // Combine data for PDF
    const combinedData = {
      ...analyticsData,
      meetingFrequency: meetingAnalytics.chartData || [],
      departmentStats: analyticsData.departmentPerformance || [],
      systemUsage: 85, // Mock data
      mostActiveDay: 'Salı',
      avgMeetingDuration: meetingAnalytics.averageDuration || 60,
      mostProductiveMeeting: meetingAnalytics.mostProductive || 'Veri yok',
    };

    // Generate PDF
    const pdfResult = await pdfService.generateAnalyticsReport(combinedData, {
      period:
        period === '7d'
          ? '7 gün'
          : period === '90d'
            ? '90 gün'
            : period === '1y'
              ? '1 yıl'
              : '30 gün',
      personal: personal === 'true',
      userName: user?.isim,
      departmentName: user?.departman?.ad,
    });

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    logger.success(
      `✅ Analytics PDF generated: ${pdfResult.filename} (${pdfResult.size} bytes)`,
    );
    res.send(pdfResult.buffer);
  } catch (error) {
    logger.error('❌ Analytics PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Analiz raporu oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/pdf/meeting/:id
 * @desc    Generate individual meeting PDF report
 * @access  Private (Meeting module access)
 */
const generateMeetingPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.user || {};

    logger.info(`📝 Generating meeting PDF for ID: ${id}, user: ${user?.isim}`);

    // Fetch meeting data with full population
    const meeting = await Meeting.findById(id)
      .populate('organizator', 'isim email')
      .populate('katilimcilar.kullanici', 'isim email')
      .populate('departman', 'ad')
      .lean();

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı',
      });
    }

    // Fetch meeting notes
    const MeetingNote = require('../models/MeetingNote');
    const notes = await MeetingNote.find({ toplanti: id })
      .populate('olusturan', 'isim')
      .sort({ olusturmaTarihi: 1 })
      .lean();

    // Fetch generated tasks
    const tasks = await Task.find({ toplanti: id })
      .populate('atanan', 'isim')
      .sort({ olusturmaTarihi: 1 })
      .lean();

    // Combine meeting data
    const meetingData = {
      ...meeting,
      notlar: notes,
      olustrulanGorevler: tasks,
    };

    // Generate PDF
    const pdfResult = await pdfService.generateMeetingReport(meetingData, {
      generatedBy: user?.isim,
      userRole: user?.rol?.ad,
    });

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    logger.success(
      `✅ Meeting PDF generated: ${pdfResult.filename} (${pdfResult.size} bytes)`,
    );
    res.send(pdfResult.buffer);
  } catch (error) {
    logger.error('❌ Meeting PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı raporu oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/pdf/custom
 * @desc    Generate custom PDF report with charts
 * @access  Private (Admin/Manager only)
 */
const generateCustomPDF = async (req, res) => {
  try {
    const { user } = req.user || {};
    const {
      title,
      chartData,
      reportType = 'custom',
      includeAnalytics = false,
    } = req.body;

    logger.info(`🎨 Generating custom PDF: ${title}, user: ${user?.isim}`);

    if (!title || !chartData) {
      return res.status(400).json({
        success: false,
        message: 'Başlık ve chart verisi gerekli',
      });
    }

    // Optional: Include analytics data
    let additionalData = {};
    if (includeAnalytics) {
      additionalData = await analyticsService.getDashboardSummary();
    }

    // Generate PDF
    const pdfResult = await pdfService.generateCustomReport(chartData, {
      title,
      reportType,
      generatedBy: user?.isim,
      userRole: user?.rol?.ad,
      additionalData,
    });

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    logger.success(
      `✅ Custom PDF generated: ${pdfResult.filename} (${pdfResult.size} bytes)`,
    );
    res.send(pdfResult.buffer);
  } catch (error) {
    logger.error('❌ Custom PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Özel rapor oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/pdf/performance
 * @desc    Generate performance PDF report
 * @access  Private (Admin/Manager only)
 */
const generatePerformancePDF = async (req, res) => {
  try {
    const { user } = req.user || {};
    const {
      period = '30d',
      departmentId,
      userId,
      includeDetails = false,
    } = req.query;

    logger.info(
      `📈 Generating performance PDF, period: ${period}, user: ${user?.isim}`,
    );

    // Calculate date range
    const days =
      period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    // Fetch performance data
    const performanceData = await analyticsService.getUserAnalytics({
      dateFrom: startDate,
      dateTo: endDate,
      departmentId,
      userId,
    });

    // Generate PDF
    const pdfResult = await pdfService.generatePerformanceReport(
      performanceData,
      {
        period:
          period === '7d'
            ? '7 gün'
            : period === '90d'
              ? '90 gün'
              : period === '1y'
                ? '1 yıl'
                : '30 gün',
        includeDetails,
        generatedBy: user?.isim,
        targetUser: userId
          ? await User.findById(userId).select('isim').lean()
          : null,
      },
    );

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    logger.success(
      `✅ Performance PDF generated: ${pdfResult.filename} (${pdfResult.size} bytes)`,
    );
    res.send(pdfResult.buffer);
  } catch (error) {
    logger.error('❌ Performance PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Performans raporu oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/pdf/batch
 * @desc    Generate multiple PDFs in batch
 * @access  Private (Admin only)
 */
const generateBatchPDF = async (req, res) => {
  try {
    const { user } = req.user || {};
    const {
      reportTypes = ['analytics', 'performance'],
      period = '30d',
      departmentId,
    } = req.query;

    logger.info(
      `📦 Generating batch PDFs: ${reportTypes.join(',')}, user: ${user?.isim}`,
    );

    const results = [];

    for (const reportType of reportTypes.split(',')) {
      try {
        let pdfResult;

        switch (reportType.trim()) {
        case 'analytics': {
          // Generate analytics PDF (logic reused)
          const analyticsData = await analyticsService.getDashboardSummary();
          pdfResult = await pdfService.generateAnalyticsReport(
            analyticsData,
            { period },
          );
          break;
        }

        case 'performance': {
          // Generate performance PDF (logic reused)
          const performanceData = await analyticsService.getUserAnalytics({
            departmentId,
          });
          pdfResult = await pdfService.generatePerformanceReport(
            performanceData,
            { period },
          );
          break;
        }

        default:
          continue;
        }

        results.push({
          type: reportType,
          filename: pdfResult.filename,
          size: pdfResult.size,
          success: true,
        });
      } catch (error) {
        results.push({
          type: reportType,
          error: error.message,
          success: false,
        });
      }
    }

    res.json({
      success: true,
      message: 'Toplu rapor oluşturma tamamlandı',
      results,
      totalReports: results.length,
      successCount: results.filter(r => r.success).length,
    });
  } catch (error) {
    logger.error('❌ Batch PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplu rapor oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

module.exports = {
  generateAnalyticsPDF,
  generateMeetingPDF,
  generateCustomPDF,
  generatePerformancePDF,
  generateBatchPDF,
};
