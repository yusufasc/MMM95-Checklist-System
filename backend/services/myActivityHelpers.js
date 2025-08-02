const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const HRScore = require('../models/HRScore');
const BonusEvaluation = require('../models/BonusEvaluation');
const ControlScore = require('../models/ControlScore');
const KalipDegisimEvaluation = require('../models/KalipDegisimEvaluation');

// ✅ REFACTORING: Import extracted helpers
const BonusEvaluationHelpers = require('./bonusEvaluationHelpers');
const WorkTaskHelpers = require('./workTaskHelpers');
const HRScoreHelpers = require('./hrScoreHelpers');
const ActivityDataHelpers = require('./activityDataHelpers');
const ActivityQueryHelpers = require('./activityQueryHelpers');

/**
 * MyActivity Service Helpers
 * Additional methods for data processing and formatting
 *
 * REFACTORING STATUS:
 * ✅ Bonus Evaluation Logic → Extracted to bonusEvaluationHelpers.js
 * 🚧 WorkTask & KalipDegisim Logic → To be extracted
 * 🚧 HR Score Logic → To be extracted
 * 🚧 General Activity Data → To be extracted
 */
class MyActivityHelpers {
  /**
   * Bonus evaluation verilerini çek ve formatla
   * REFACTORED: Now delegates to BonusEvaluationHelpers
   */
  static async getBonusEvaluations(userId, month, year) {
    // ✅ DELEGATED: Bonus evaluation logic moved to specialized helper
    return await BonusEvaluationHelpers.getBonusEvaluations(
      userId,
      month,
      year,
    );
  }

  /**
   * Kalıp Değişim Evaluation puanlarını çek
   *
   * REFACTORING: Delegated to WorkTaskHelpers module
   */
  static async getKalipDegisimEvaluations(userId, month, year) {
    return await WorkTaskHelpers.getKalipDegisimEvaluations(
      userId,
      month,
      year,
    );
  }

  /**
   * HR API'den şablon bazlı değerlendirme puanlarını çek
   */
  static async getHRScoresFromAPI(userId, month, year) {
    // ✅ REFACTORING: Delegate to HRScoreHelpers module
    return HRScoreHelpers.getHRScoresFromAPI(userId, month, year);
  }
  /**
   * Get detailed activity list with pagination
   * REFACTORED: Delegated to ActivityQueryHelpers module
   */
  static async getDetailedActivities(userId, filters) {
    return await ActivityQueryHelpers.getDetailedActivities(userId, filters);
  }

  /**
   * Get detailed activity list with pagination - ORIGINAL (kept for reference)
   * @deprecated Use ActivityQueryHelpers.getDetailedActivities instead
   */
  static async getDetailedActivitiesOriginal(userId, filters) {
    const { page = 1, limit = 20, durum, tarih, month, year } = filters;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Date filter
    let dateFilter = {};
    let qualityDateFilter = {};
    let hrDateFilter = {};

    if (tarih) {
      const startDate = new Date(tarih);
      const endDate = new Date(tarih);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter = {
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else if (month && year) {
      // Month/year filter for bonus evaluations compatibility
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      dateFilter = {
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
      qualityDateFilter = {
        $or: [
          {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            degerlendirmeTarihi: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      };
      hrDateFilter = {
        $or: [
          {
            'checklistPuanlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            'mesaiKayitlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            'devamsizlikKayitlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      };
    } else {
      // Default: last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      dateFilter = {
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
      qualityDateFilter = {
        $or: [
          {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            degerlendirmeTarihi: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      };
      hrDateFilter = {
        $or: [
          {
            'checklistPuanlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            'mesaiKayitlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            'devamsizlikKayitlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      };
    }

    // Status filter
    const durumFilter = {};
    if (durum) {
      durumFilter.durum = durum;
    }

    // Bonus evaluations date filter
    let bonusDateFilter = {};
    if (tarih) {
      const startDate = new Date(tarih);
      const endDate = new Date(tarih);
      endDate.setDate(endDate.getDate() + 1);
      bonusDateFilter = {
        degerlendirmeTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else if (month && year) {
      // Month/year filter for bonus evaluations
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      bonusDateFilter = {
        degerlendirmeTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else {
      // Default: last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      bonusDateFilter = {
        degerlendirmeTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // ControlScore date filter
    let controlScoreDateFilter = {};
    if (tarih) {
      const startDate = new Date(tarih);
      const endDate = new Date(tarih);
      endDate.setDate(endDate.getDate() + 1);
      controlScoreDateFilter = {
        puanlamaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else {
      // Default: last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      controlScoreDateFilter = {
        puanlamaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // Parallel queries - Tüm aktivite tiplerini dahil et
    const [
      checklistTasks,
      workTasks,
      qualityEvaluations,
      hrScores,
      bonusEvaluations,
      controlPendingTasks,
      controlScores,
      kalipDegisimEvaluations,
      totalChecklistTasks,
      totalWorkTasks,
      totalQualityEvaluations,
      totalHRScores,
      totalBonusEvaluations,
      totalControlPendingTasks,
      totalControlScores,
      totalKalipDegisimEvaluations,
      checklistControlScores,
    ] = await Promise.all([
      // Checklist tasks
      Task.find({
        kullanici: userId,
        ...dateFilter,
        ...durumFilter,
      })
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Work tasks (kullanıcının kendi yaptığı + buddy olduğu görevler)
      WorkTask.find({
        $or: [
          // Kullanıcının kendi yaptığı görevler
          {
            kullanici: userId,
            ...dateFilter,
            ...durumFilter,
          },
          // Kullanıcının buddy olduğu görevler
          {
            kalipDegisimBuddy: userId,
            ...dateFilter,
            ...durumFilter,
            durum: { $in: ['onaylandi', 'tamamlandi'] }, // Sadece puanlanmış buddy görevleri
            kontrolToplamPuani: { $exists: true, $gt: 0 }, // Puan almış olanlar
          },
        ],
      })
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('kullanici', 'ad soyad kullaniciAdi') // Ana kullanıcı bilgisi
        .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi') // Buddy bilgisi
        .populate('makina', 'envanterKodu ad dinamikAlanlar')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .populate('onaylayanKullanici', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Quality evaluations
      QualityControlEvaluation.find({
        degerlendirilenKullanici: userId,
        ...qualityDateFilter,
      })
        .populate('sablon', 'ad aciklama')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('makina', 'ad envanterKodu')
        .populate('kalip', 'ad envanterKodu')
        .sort({ degerlendirmeTarihi: -1, createdAt: -1 }),

      // HR scores
      HRScore.find({
        kullanici: userId,
        ...hrDateFilter,
      })
        .populate('checklistPuanlari.sablon', 'ad aciklama')
        .sort({ 'checklistPuanlari.tarih': -1 }),

      // Bonus evaluations
      BonusEvaluation.find({
        degerlendirilenKullanici: userId,
        ...bonusDateFilter,
      })
        .populate('sablon', 'ad bonusKategorisi')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('departman', 'ad')
        .sort({ degerlendirmeTarihi: -1 }),

      // Control pending tasks (puanlanmış görevler)
      Task.find({
        kullanici: userId,
        ...dateFilter,
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      })
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Control scores (puanlama yapan kullanıcının kontrol puanları)
      ControlScore.find({
        puanlayanKullanici: userId,
        ...controlScoreDateFilter,
        aktif: true,
      }),

      // Kalıp Değişim evaluations
      KalipDegisimEvaluation.find({
        $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
        ...bonusDateFilter, // Aynı tarih filtresi kullan
      })
        .populate('checklistTemplate', 'ad aciklama') // Doğru field adı
        .populate('workTask', 'makina usta kalipDegisimBuddy')
        .populate('degerlendiren', 'ad soyad') // Doğru field adı
        .sort({ degerlendirmeTarihi: -1 }),

      // Count totals for pagination
      Task.countDocuments({
        kullanici: userId,
        ...dateFilter,
        ...durumFilter,
      }),
      WorkTask.countDocuments({
        $or: [
          // Kullanıcının kendi yaptığı görevler
          {
            kullanici: userId,
            ...dateFilter,
            ...durumFilter,
          },
          // Kullanıcının buddy olduğu görevler
          {
            kalipDegisimBuddy: userId,
            ...dateFilter,
            ...durumFilter,
            durum: { $in: ['onaylandi', 'tamamlandi'] },
            kontrolToplamPuani: { $exists: true, $gt: 0 },
          },
        ],
      }),
      QualityControlEvaluation.countDocuments({
        degerlendirilenKullanici: userId,
        ...qualityDateFilter,
      }),
      HRScore.countDocuments({
        kullanici: userId,
        ...hrDateFilter,
      }),

      // Bonus evaluations count
      BonusEvaluation.countDocuments({
        degerlendirilenKullanici: userId,
        ...bonusDateFilter,
      }),

      // Control pending tasks count
      Task.countDocuments({
        kullanici: userId,
        ...dateFilter,
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      }),

      // Control scores count
      ControlScore.countDocuments({
        puanlayanKullanici: userId,
        ...controlScoreDateFilter,
        aktif: true,
      }),

      // Kalıp Değişim evaluations count
      KalipDegisimEvaluation.countDocuments({
        $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
        ...bonusDateFilter,
      }),

      // ✅ DÜZELTME: ControlScore'dan checklist şablonları puanları
      ControlScore.find({
        puanlananKullanici: userId,
        gorevTipi: 'Task-Checklist', // Sadece checklist puanları
        aktif: true,
        ...controlScoreDateFilter,
      }),
    ]);

    return {
      checklistTasks,
      workTasks,
      qualityEvaluations,
      hrScores,
      bonusEvaluations,
      controlPendingTasks,
      controlScores,
      kalipDegisimEvaluations,
      totalChecklistTasks,
      totalWorkTasks,
      totalQualityEvaluations,
      totalHRScores,
      totalBonusEvaluations,
      totalControlPendingTasks,
      totalControlScores,
      totalKalipDegisimEvaluations,
      checklistControlScores,
      pagination: {
        pageNum,
        limitNum,
        skip,
      },
    };
  }

  /**
   * Get score details with pagination
   */
  static async getScoreDetails(userId, filters) {
    const { page = 1, limit = 20, days = 30, tip } = filters;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(String(days)));

    // Parallel queries for scored tasks and evaluations
    const [
      scoredChecklistTasks,
      scoredWorkTasks,
      qualityEvaluations,
      hrScores,
      bonusEvaluations,
      controlScores,
      kalipDegisimEvaluations,
    ] = await Promise.all([
      // Scored checklist tasks
      Task.find({
        kullanici: userId,
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Scored work tasks (kendi yaptığı + buddy olduğu görevler)
      WorkTask.find({
        $or: [
          // Kullanıcının kendi yaptığı görevler
          {
            kullanici: userId,
            tamamlanmaTarihi: {
              $gte: startDate,
              $lte: endDate,
            },
            $or: [
              { toplamPuan: { $exists: true, $gt: 0 } },
              { kontrolToplamPuani: { $exists: true, $gt: 0 } },
              { durum: 'onaylandi' },
            ],
          },
          // Kullanıcının buddy olduğu görevler
          {
            kalipDegisimBuddy: userId,
            tamamlanmaTarihi: {
              $gte: startDate,
              $lte: endDate,
            },
            durum: { $in: ['onaylandi', 'tamamlandi'] },
            kontrolToplamPuani: { $exists: true, $gt: 0 },
          },
        ],
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('kullanici', 'ad soyad kullaniciAdi') // Ana kullanıcı
        .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi') // Buddy
        .populate('makina', 'envanterKodu ad makinaNo')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .populate('onaylayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Quality evaluations
      QualityControlEvaluation.find({
        degerlendirilenKullanici: userId,
        $or: [
          {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            degerlendirmeTarihi: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      })
        .populate('sablon', 'ad aciklama')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('makina', 'ad envanterKodu')
        .populate('kalip', 'ad envanterKodu')
        .sort({ degerlendirmeTarihi: -1, createdAt: -1 }),

      // HR scores - Simplified query for MyActivity
      HRScore.find({
        kullanici: userId,
        $or: [
          {
            'checklistPuanlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            'mesaiKayitlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
          {
            'devamsizlikKayitlari.tarih': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      }).populate('checklistPuanlari.sablon', 'ad aciklama'),

      // Bonus evaluations
      BonusEvaluation.find({
        degerlendirilenKullanici: userId,
        degerlendirmeTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('sablon', 'ad bonusKategorisi')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('departman', 'ad')
        .sort({ degerlendirmeTarihi: -1 }),

      // Control scores (puanlama yapan kullanıcının kontrol puanları)
      ControlScore.find({
        puanlayanKullanici: userId,
        puanlamaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
        aktif: true,
      })
        .populate('puanlananKullanici', 'ad soyad kullaniciAdi')
        .populate('sablon', 'ad')
        .sort({ puanlamaTarihi: -1 }),

      // Kalıp Değişim evaluations
      KalipDegisimEvaluation.find({
        $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
        degerlendirmeTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('checklistTemplate', 'ad aciklama')
        .populate('workTask', 'makina usta kalipDegisimBuddy')
        .populate('degerlendiren', 'ad soyad')
        .populate('anaCalisan', 'ad soyad kullaniciAdi')
        .populate('buddyCalisan', 'ad soyad kullaniciAdi')
        .sort({ degerlendirmeTarihi: -1 }),
    ]);

    // Birim bazlı filtreleme
    let filteredData = {
      scoredChecklistTasks,
      scoredWorkTasks,
      qualityEvaluations,
      hrScores,
      bonusEvaluations,
      kalipDegisimEvaluations,
    };

    if (tip) {
      filteredData = this.filterByDepartment(filteredData, tip);
    }

    // Debug log for KalipDegisimEvaluation
    console.log('🔍 getScoreDetails KalipDegisimEvaluation results:', {
      userId,
      startDate,
      endDate,
      kalipDegisimCount: kalipDegisimEvaluations.length,
      filteredKalipDegisimCount:
        filteredData.kalipDegisimEvaluations?.length || 0,
      tip,
    });

    return {
      ...filteredData,
      controlScores,
      dateRange: { startDate, endDate },
      pagination: {
        pageNum,
        limitNum,
      },
    };
  }

  /**
   * Filter scores by department/unit
   */
  static filterByDepartment(data, tip) {
    // ActivityDataHelpers.filterByDepartment expects array, but we have object
    // Use original implementation for backward compatibility
    return this.filterByDepartmentOriginal(data, tip);
  }

  /**
   * Filter scores by department/unit - ORIGINAL (kept for backward compatibility)
   */
  static filterByDepartmentOriginal(data, tip) {
    switch (tip) {
    case 'quality_control':
      return {
        scoredChecklistTasks: [],
        scoredWorkTasks: [],
        qualityEvaluations: data.qualityEvaluations,
        hrScores: [],
        bonusEvaluations: [],
      };

    case 'control_score':
      // 🎯 Sadece ControlScore kayıtları (puanlama yapan için)
      return {
        scoredChecklistTasks: [],
        scoredWorkTasks: [],
        qualityEvaluations: [],
        hrScores: [],
        bonusEvaluations: [],
        controlScores: data.controlScores || [],
      };

    case 'checklist':
      // 🎯 Sadece checklist puanları (/tasks + /control-pending sayfalarından)
      return {
        scoredChecklistTasks: data.scoredChecklistTasks,
        scoredWorkTasks: [],
        qualityEvaluations: [],
        hrScores: [],
        bonusEvaluations: [],
      };

    case 'worktask':
      // 🎯 Sadece WorkTask puanları (worktasks + worktask-control sayfalarından)
      return {
        scoredChecklistTasks: [],
        scoredWorkTasks: data.scoredWorkTasks,
        qualityEvaluations: [],
        hrScores: [],
        bonusEvaluations: [],
      };

    case 'hr':
      return {
        scoredChecklistTasks: [],
        scoredWorkTasks: [],
        qualityEvaluations: [],
        hrScores: data.hrScores,
        bonusEvaluations: [],
      };

    case 'bonus_evaluation':
      return {
        scoredChecklistTasks: [],
        scoredWorkTasks: [],
        qualityEvaluations: [],
        hrScores: [],
        bonusEvaluations: data.bonusEvaluations,
        kalipDegisimEvaluations: data.kalipDegisimEvaluations,
      };

    default:
      return {
        ...data,
        bonusEvaluations: data.bonusEvaluations || [],
        controlScores: data.controlScores || [],
      };
    }
  }

  /**
   * Get daily performance data - DELEGATED to ActivityDataHelpers
   */
  static async getDailyPerformance(userId, days = 30) {
    return ActivityDataHelpers.getDailyPerformance(userId, days);
  }

  /**
   * Get daily performance data - ORIGINAL (kept for backward compatibility)
   */
  static async getDailyPerformanceOriginal(userId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(String(days)));

    // Generate parallel queries for each day
    const dayPromises = Array.from(
      { length: parseInt(String(days)) },
      (_, i) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);

        return Promise.all([
          Task.find({
            kullanici: userId,
            tamamlanmaTarihi: {
              $gte: currentDate,
              $lt: nextDate,
            },
          }).populate('checklist', 'kategori'),

          WorkTask.find({
            kullanici: userId,
            tamamlanmaTarihi: {
              $gte: currentDate,
              $lt: nextDate,
            },
          }).populate('checklist', 'kategori'),
        ]).then(([dayTasks, dayWorkTasks]) => {
          return this.calculateDayScores(currentDate, dayTasks, dayWorkTasks);
        });
      },
    );

    const performansVerileri = await Promise.all(dayPromises);

    return {
      performansVerileri,
      toplamGun: parseInt(String(days)),
    };
  }

  /**
   * Calculate daily scores
   */
  static calculateDayScores(currentDate, dayTasks, dayWorkTasks) {
    return ActivityDataHelpers.calculateDayScores(
      currentDate,
      dayTasks,
      dayWorkTasks,
    );
  }

  /**
   * Calculate daily scores - ORIGINAL (kept for backward compatibility)
   */
  static calculateDayScoresOriginal(currentDate, dayTasks, dayWorkTasks) {
    const gunlukScores = {
      ik_sablon: 0,
      ik_devamsizlik: 0,
      fazla_mesai: 0,
      checklist: 0,
      is_bagli: 0,
      kalite_kontrol: 0,
    };

    console.log(
      `📅 ${currentDate.toLocaleDateString('tr-TR')} için günlük hesaplama:`,
      {
        dayTasks: dayTasks.length,
        dayWorkTasks: dayWorkTasks.length,
      },
    );

    // Process checklist tasks
    dayTasks.forEach(task => {
      if (task.durum === 'tamamlandi' || task.durum === 'onaylandi') {
        const toplamTaskPuani =
          (task.toplamPuan || 0) + (task.kontrolToplamPuani || 0);

        if (task.checklist && task.checklist.kategori === 'IK') {
          gunlukScores.ik_sablon += toplamTaskPuani;
        } else if (task.checklist && task.checklist.kategori === 'Kalite') {
          gunlukScores.kalite_kontrol += toplamTaskPuani;
        } else {
          gunlukScores.checklist += toplamTaskPuani;
        }
      }
    });

    // Process work tasks
    dayWorkTasks.forEach(task => {
      if (task.durum === 'tamamlandi') {
        const toplamTaskPuani =
          (task.toplamPuan || 0) + (task.kontrolToplamPuani || 0);
        gunlukScores.is_bagli += toplamTaskPuani;
      }
    });

    const toplamPuan = Object.values(gunlukScores).reduce(
      (sum, score) => sum + score,
      0,
    );
    const gorevSayisi = dayTasks.length + dayWorkTasks.length;

    return {
      tarih: currentDate.toISOString().split('T')[0],
      tarihFormatli: currentDate.toLocaleDateString('tr-TR'),
      scores: gunlukScores,
      toplamPuan,
      gorevSayisi,
      // Frontend için uyumlu field'lar
      gunlukPuan: toplamPuan,
      tamamlananGorev: gorevSayisi,
    };
  }

  /**
   * Get detailed score breakdown with filters
   */
  static async getScoreBreakdown(userId, filters) {
    const { days = 30, search, durum, tarihAraligi } = filters;

    // Date range calculation
    let startDate, endDate;
    if (tarihAraligi) {
      const daysNum = parseInt(tarihAraligi);
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - daysNum);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(String(days)));
    }

    // Build query filters
    const dateFilter = {
      tamamlanmaTarihi: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const statusFilter = {};
    if (durum && durum !== 'all') {
      statusFilter.durum = durum;
    }

    // Search filter (not used in current implementation)
    // let searchFilter = {};
    // if (search) {
    //   searchFilter = {
    //     $or: [
    //       { 'checklist.ad': { $regex: search, $options: 'i' } },
    //       { 'makina.ad': { $regex: search, $options: 'i' } },
    //       { 'makina.makinaNo': { $regex: search, $options: 'i' } },
    //     ],
    //   };
    // }

    // Parallel queries for all scored tasks
    const [checklistTasks, workTasks, qualityEvaluations] = await Promise.all([
      // Checklist tasks with detailed breakdown
      Task.find({
        kullanici: userId,
        ...dateFilter,
        ...statusFilter,
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
          { durum: 'tamamlandi' },
        ],
      })
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Work tasks with detailed breakdown
      WorkTask.find({
        kullanici: userId,
        ...dateFilter,
        ...statusFilter,
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
          { durum: 'tamamlandi' },
        ],
      })
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad')
        .populate('baglananHamade', 'envanterKodu ad')
        .populate('onaylayanKullanici', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Quality evaluations
      QualityControlEvaluation.find({
        degerlendirilenKullanici: userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('sablon', 'ad aciklama')
        .populate('degerlendirenKullanici', 'ad soyad')
        .sort({ createdAt: -1 }),
    ]);

    return {
      checklistTasks,
      workTasks,
      qualityEvaluations,
      dateRange: { startDate, endDate },
      filters: { search, durum, tarihAraligi },
    };
  }

  /**
   * Get monthly score totals by category - Aylık toplam puanları kategorize ederek hesapla
   */
  static async getMonthlyScoreTotals(userId, filters = {}) {
    const { month, year } = filters;

    // Ay ve yıl belirleme
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // 0-based
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Ayın başlangıç ve bitiş tarihleri
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    console.log(
      `📊 ${targetYear}/${targetMonth + 1} ayı için aylık puan toplamları hesaplanıyor...`,
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    );

    // Paralel sorgular - bu ayki tüm puanları çek (HR API logic kullanarak)
    const [checklistTasks, workTasks, qualityEvaluations, hrFormattedScores] =
      await Promise.all([
        // Checklist görevleri
        Task.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
          $or: [
            { toplamPuan: { $exists: true, $gt: 0 } },
            { kontrolToplamPuani: { $exists: true, $gt: 0 } },
            { durum: 'onaylandi' },
            { durum: 'tamamlandi' },
          ],
        }).populate('checklist', 'ad kategori'),

        // İşe bağlı görevler
        WorkTask.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
          $or: [
            { toplamPuan: { $exists: true, $gt: 0 } },
            { kontrolToplamPuani: { $exists: true, $gt: 0 } },
            { durum: 'onaylandi' },
            { durum: 'tamamlandi' },
          ],
        }).populate('checklist', 'ad kategori'),

        // Kalite kontrol değerlendirmeleri
        QualityControlEvaluation.find({
          degerlendirilenKullanici: userId,
          $or: [
            {
              createdAt: {
                $gte: startDate,
                $lte: endDate,
              },
            },
            {
              degerlendirmeTarihi: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          ],
        }).populate('sablon', 'ad'),

        // İK puanları - HR API formatı kullanarak
        this.getHRScoresFromAPI(userId, targetMonth + 1, targetYear),
      ]);

    // Kategori bazlı puan toplamları
    const monthlyTotals = {
      // İK toplamları
      ik: {
        checklistPuanlari: 0,
        mesaiPuanlari: 0,
        devamsizlikPuanlari: 0,
        gorevSayisi: 0,
        toplam: 0,
      },
      // Kalite kontrol toplamları
      kaliteKontrol: {
        toplamPuan: 0,
        gorevSayisi: 0,
        ortalamaPuan: 0,
      },
      // 🎯 WorkTask puanları (İşe Bağlı Görevler)
      workTask: {
        toplamPuan: 0,
        gorevSayisi: 0,
        ortalamaPuan: 0,
      },
      // Checklist şablonları toplamları
      checklistSablonlari: {
        rutinGorevler: 0,
        iseBagliGorevler: 0,
        gorevSayisi: 0,
        toplam: 0,
      },
      // Genel toplam
      genelToplam: {
        tumPuanlar: 0,
        tumGorevler: 0,
        ortalamaPuan: 0,
      },
      // Dönem bilgisi
      donem: {
        ay: targetMonth + 1,
        yil: targetYear,
        ayAdi: new Date(targetYear, targetMonth).toLocaleDateString('tr-TR', {
          month: 'long',
        }),
        donemAdi: `${new Date(targetYear, targetMonth).toLocaleDateString('tr-TR', { month: 'long' })} ${targetYear}`,
      },
    };

    // Checklist görevlerini işle
    checklistTasks.forEach(task => {
      const puan = (task.kontrolToplamPuani || 0) + (task.toplamPuan || 0);

      if (task.checklist && task.checklist.kategori === 'IK') {
        // İK kategorisindeki checklist'ler
        monthlyTotals.ik.checklistPuanlari += puan;
        monthlyTotals.ik.gorevSayisi++;
      } else {
        // Normal rutin görevler
        monthlyTotals.checklistSablonlari.rutinGorevler += puan;
        monthlyTotals.checklistSablonlari.gorevSayisi++;
      }

      monthlyTotals.genelToplam.tumPuanlar += puan;
      monthlyTotals.genelToplam.tumGorevler++;
    });

    // İşe bağlı görevleri işle (WorkTask)
    workTasks.forEach(task => {
      const puan = (task.kontrolToplamPuani || 0) + (task.toplamPuan || 0);

      // 🎯 Yeni WorkTask kategorisine ekle
      monthlyTotals.workTask.toplamPuan += puan;
      monthlyTotals.workTask.gorevSayisi++;

      // Backward compatibility için eski yapıyı da koru
      monthlyTotals.checklistSablonlari.iseBagliGorevler += puan;
      monthlyTotals.checklistSablonlari.gorevSayisi++;

      monthlyTotals.genelToplam.tumPuanlar += puan;
      monthlyTotals.genelToplam.tumGorevler++;
    });

    // Kalite kontrol değerlendirmelerini işle
    qualityEvaluations.forEach(evaluation => {
      const puan = evaluation.toplamPuan || 0;
      monthlyTotals.kaliteKontrol.toplamPuan += puan;
      monthlyTotals.kaliteKontrol.gorevSayisi++;
      monthlyTotals.genelToplam.tumPuanlar += puan;
      monthlyTotals.genelToplam.tumGorevler++;
    });

    // İK puanlarını işle - HR API formatından
    hrFormattedScores.forEach(hrFormattedScore => {
      const puan = hrFormattedScore.puanlar?.toplam || 0;

      if (hrFormattedScore.tip === 'hr_checklist') {
        // İK Checklist puanları
        monthlyTotals.ik.checklistPuanlari += puan;
        monthlyTotals.ik.gorevSayisi++;
      } else if (hrFormattedScore.tip === 'hr_mesai') {
        // Mesai puanları
        monthlyTotals.ik.mesaiPuanlari += puan;
      } else if (hrFormattedScore.tip === 'hr_devamsizlik') {
        // Devamsızlık puanları
        monthlyTotals.ik.devamsizlikPuanlari += puan;
      }

      // Genel toplama ekle
      monthlyTotals.genelToplam.tumPuanlar += puan;
      monthlyTotals.genelToplam.tumGorevler++;
    });

    // ❌ KALDIRILIYOR: ControlScore puanları zaten checklistTasks'ta dahil
    // Bu kod çoklu puan ekleme sorununa neden oluyor
    // checklistControlScores.forEach((controlScore) => {
    //   const puan = controlScore.kontrolPuani || 0;
    //   monthlyTotals.checklistSablonlari.rutinGorevler += puan;
    //   monthlyTotals.checklistSablonlari.gorevSayisi++;
    //   monthlyTotals.genelToplam.tumPuanlar += puan;
    //   monthlyTotals.genelToplam.tumGorevler++;
    // });

    console.log(
      '✅ ControlScore puanları checklistTasks içinde zaten dahil edildi',
    );

    // Toplam hesaplamaları tamamla
    monthlyTotals.ik.toplam =
      monthlyTotals.ik.checklistPuanlari +
      monthlyTotals.ik.mesaiPuanlari +
      monthlyTotals.ik.devamsizlikPuanlari;

    monthlyTotals.checklistSablonlari.toplam =
      monthlyTotals.checklistSablonlari.rutinGorevler +
      monthlyTotals.checklistSablonlari.iseBagliGorevler;

    // Ortalama hesaplamaları
    monthlyTotals.kaliteKontrol.ortalamaPuan =
      monthlyTotals.kaliteKontrol.gorevSayisi > 0
        ? Math.round(
          (monthlyTotals.kaliteKontrol.toplamPuan /
              monthlyTotals.kaliteKontrol.gorevSayisi) *
              100,
        ) / 100
        : 0;

    // 🎯 WorkTask ortalama puanı
    monthlyTotals.workTask.ortalamaPuan =
      monthlyTotals.workTask.gorevSayisi > 0
        ? Math.round(
          (monthlyTotals.workTask.toplamPuan /
              monthlyTotals.workTask.gorevSayisi) *
              100,
        ) / 100
        : 0;

    monthlyTotals.genelToplam.ortalamaPuan =
      monthlyTotals.genelToplam.tumGorevler > 0
        ? Math.round(
          (monthlyTotals.genelToplam.tumPuanlar /
              monthlyTotals.genelToplam.tumGorevler) *
              100,
        ) / 100
        : 0;

    console.log(
      `✅ ${monthlyTotals.donem.donemAdi} dönemi toplam puanları hesaplandı:`,
      {
        ikToplam: monthlyTotals.ik.toplam,
        kaliteKontrol: monthlyTotals.kaliteKontrol.toplamPuan,
        checklistSablonlari: monthlyTotals.checklistSablonlari.toplam,
        genelToplam: monthlyTotals.genelToplam.tumPuanlar,
      },
    );

    return monthlyTotals;
  }

  /**
   * Process WorkTask buddy scoring
   *
   * REFACTORING: Delegated to WorkTaskHelpers module
   */
  static processWorkTaskBuddyScoring(workTasks, targetUserId) {
    return WorkTaskHelpers.processWorkTaskBuddyScoring(workTasks, targetUserId);
  }
}

module.exports = MyActivityHelpers;
