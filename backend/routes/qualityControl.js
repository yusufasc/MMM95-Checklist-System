const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');

// Controllers
const templateController = require('../controllers/templateController');
const workerController = require('../controllers/workerController');
const evaluationController = require('../controllers/evaluationController');
const statisticsController = require('../controllers/statisticsController');

// ===============================
// TEMPLATE ROUTES
// ===============================

// Tüm şablonları getir (admin için)
router.get(
  '/templates',
  auth,
  checkModulePermission('Kalite Kontrol'),
  templateController.getAllTemplates,
);

// Aktif şablonları getir - zaman kontrolü ile
router.get(
  '/templates/active',
  auth,
  checkModulePermission('Kalite Kontrol'),
  templateController.getActiveTemplates,
);

// Debug endpoint - tüm şablonları zaman bilgisi ile göster
router.get(
  '/templates/debug',
  auth,
  checkModulePermission('Kalite Kontrol'),
  templateController.getDebugTemplates,
);

// Şablon detayı getir
router.get(
  '/templates/:id',
  auth,
  checkModulePermission('Kalite Kontrol'),
  templateController.getTemplateById,
);

// Role göre aktif şablon getir
router.get(
  '/templates/role/:roleId',
  auth,
  checkModulePermission('Kalite Kontrol'),
  templateController.getTemplateByRole,
);

// Yeni şablon oluştur
router.post(
  '/templates',
  auth,
  checkModulePermission('Kalite Kontrol', 'duzenleyebilir'),
  templateController.createTemplate,
);

// Şablon güncelle
router.put(
  '/templates/:id',
  auth,
  checkModulePermission('Kalite Kontrol', 'duzenleyebilir'),
  templateController.updateTemplate,
);

// Şablon sil - gelişmiş silme sistemi ile
router.delete(
  '/templates/:id',
  auth,
  checkModulePermission('Kalite Kontrol', 'duzenleyebilir'),
  templateController.deleteTemplate,
);

// ===============================
// WORKER ROUTES
// ===============================

// Şablona göre aktif çalışanları listele
router.get(
  '/active-workers/:templateId',
  auth,
  checkModulePermission('Kalite Kontrol'),
  workerController.getActiveWorkersByTemplate,
);

// ===============================
// EVALUATION ROUTES
// ===============================

// Yeni değerlendirme oluştur
router.post(
  '/evaluations',
  auth,
  checkModulePermission('Kalite Kontrol'),
  evaluationController.createEvaluation,
);

// Değerlendirmeleri listele
router.get(
  '/evaluations',
  auth,
  checkModulePermission('Kalite Kontrol'),
  evaluationController.getEvaluations,
);

// Değerlendirme detayı
router.get(
  '/evaluations/:id',
  auth,
  checkModulePermission('Kalite Kontrol'),
  evaluationController.getEvaluationById,
);

// ===============================
// STATISTICS ROUTES
// ===============================

// İstatistikler
router.get(
  '/statistics',
  auth,
  checkModulePermission('Kalite Kontrol'),
  statisticsController.getStatistics,
);

// ===============================
// DASHBOARD ROUTES
// ===============================

// Dashboard özet bilgileri
router.get(
  '/dashboard/summary',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const QualityTemplate = require('../models/QualityControlTemplate');
      const QualityEvaluation = require('../models/QualityControlEvaluation');

      // Aktif şablonlar
      const activeTemplates = await QualityTemplate.countDocuments({
        aktif: true,
      });

      // Bu ay yapılan değerlendirmeler
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyEvaluations = await QualityEvaluation.countDocuments({
        createdAt: { $gte: thisMonth },
      });

      // Bugün yapılan değerlendirmeler
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayEvaluations = await QualityEvaluation.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      });

      // Ortalama puan (bu ay)
      const avgScoreResult = await QualityEvaluation.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, avgScore: { $avg: '$toplamPuan' } } },
      ]);

      const avgScore =
        avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

      res.json({
        success: true,
        data: {
          activeTemplates,
          monthlyEvaluations,
          todayEvaluations,
          avgScore: Math.round(avgScore * 100) / 100,
        },
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Son değerlendirmeler
router.get(
  '/dashboard/recent-evaluations',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const QualityEvaluation = require('../models/QualityControlEvaluation');

      const recentEvaluations = await QualityEvaluation.find()
        .populate('degerlendirilenKullanici', 'ad soyad')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('sablon', 'ad')
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          'degerlendirilenKullanici degerlendirenKullanici sablon toplamPuan createdAt',
        );

      res.json({
        success: true,
        data: recentEvaluations,
      });
    } catch (error) {
      console.error('Recent evaluations error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Performans trendi (son 7 gün)
router.get(
  '/dashboard/performance-trend',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const QualityEvaluation = require('../models/QualityControlEvaluation');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trendData = await QualityEvaluation.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            avgScore: { $avg: '$toplamPuan' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        data: trendData,
      });
    } catch (error) {
      console.error('Performance trend error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Departman bazlı performans
router.get(
  '/dashboard/department-performance',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const QualityEvaluation = require('../models/QualityControlEvaluation');

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const departmentPerformance = await QualityEvaluation.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        {
          $lookup: {
            from: 'users',
            localField: 'degerlendirilenKullanici',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'departments',
            localField: 'user.departman',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: '$department' },
        {
          $group: {
            _id: '$department.ad',
            avgScore: { $avg: '$toplamPuan' },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgScore: -1 } },
      ]);

      res.json({
        success: true,
        data: departmentPerformance,
      });
    } catch (error) {
      console.error('Department performance error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

module.exports = router;
