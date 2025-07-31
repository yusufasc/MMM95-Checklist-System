const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const HRScore = require('../models/HRScore');
const HRSettings = require('../models/HRSettings');
const ControlScore = require('../models/ControlScore');
const BonusEvaluation = require('../models/BonusEvaluation');

/**
 * MyActivity Service Layer
 * Handles all database operations and business logic for MyActivity routes
 */
class MyActivityService {
  /**
   * Get user activity summary for specified date range
   */
  static async getUserSummary(userId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(String(days)));

    // Get HR settings for current scoring values
    const hrSettings = await HRSettings.getSettings();

    // Parallel queries for all data
    const [
      checklistTasks,
      workTasks,
      qualityEvaluations,
      hrScores,
      controlScores,
      bonusEvaluations,
      kalipDegisimEvaluations,
    ] = await Promise.all([
      // Checklist tasks
      Task.find({
        kullanici: userId,
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('checklist', 'ad kategori')
        .populate('makina', 'ad makinaNo')
        .populate('onaylayan', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Work tasks (işe bağlı görevler) - Buddy sistemi dahil
      WorkTask.find({
        $or: [
          { kullanici: userId }, // Asıl kullanıcının görevleri
          { kalipDegisimBuddy: userId }, // Buddy olarak dahil olduğu görevler
        ],
        durum: { $in: ['tamamlandi', 'onaylandi'] },
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('kullanici', 'ad soyad')
        .populate('kalipDegisimBuddy', 'ad soyad')
        .populate('checklist', 'ad')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad')
        .populate('baglananHamade', 'envanterKodu ad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Quality Control evaluations
      QualityControlEvaluation.find({
        degerlendirilenKullanici: userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('sablon', 'ad')
        .populate('degerlendirenKullanici', 'ad soyad')
        .sort({ createdAt: -1 }),

      // HR scores
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
      }).populate('checklistPuanlari.sablon', 'ad'),

      // Control scores (kontrol puanları) - Kullanıcının ALDIĞI tüm puanlar
      ControlScore.find({
        puanlananKullanici: userId, // ✅ DÜZELTME: Kullanıcının aldığı puanlar
        aktif: true,
        puanlamaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate('puanlayanKullanici', 'ad soyad')
        .populate('sablon', 'ad')
        .sort({ puanlamaTarihi: -1 }),

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
        .sort({ degerlendirmeTarihi: -1 }),

      // Kalıp Değişim evaluations
      require('../models/KalipDegisimEvaluation')
        .find({
          $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
          degerlendirmeTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .populate('checklistTemplate', 'ad aciklama')
        .populate('workTask', 'makina usta kalipDegisimBuddy')
        .populate('degerlendiren', 'ad soyad')
        .sort({ degerlendirmeTarihi: -1 }),
    ]);

    // ✅ DEBUG: ControlScores verilerini kontrol et
    console.log('🔍 MyActivity Service getUserSummary ControlScores:', {
      count: controlScores.length,
      userId: userId.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (controlScores.length > 0) {
      console.log(
        '🔍 İlk 3 ControlScore örneği:',
        controlScores.slice(0, 3).map(score => ({
          _id: score._id,
          gorevTipi: score.gorevTipi,
          kontrolPuani: score.kontrolPuani,
          puanlamaTarihi: score.puanlamaTarihi,
          puanlananKullanici: score.puanlananKullanici,
        })),
      );
    }

    return {
      checklistTasks,
      workTasks,
      qualityEvaluations,
      hrScores,
      controlScores,
      bonusEvaluations,
      kalipDegisimEvaluations,
      hrSettings,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Calculate scores by category from raw data
   */
  static calculateScoresByCategory(data, userId) {
    const {
      checklistTasks,
      workTasks,
      qualityEvaluations,
      hrScores,
      controlScores,
      bonusEvaluations,
      kalipDegisimEvaluations,
      hrSettings,
    } = data;

    const scoresByCategory = {
      ik_sablon: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      ik_devamsizlik: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      fazla_mesai: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      checklist: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      is_bagli: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      kalite_kontrol: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      kontrol_puanlari: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      bonus_puanlari: { puan: 0, gorevSayisi: 0, ortalama: 0 },
    };

    // Process checklist tasks
    checklistTasks.forEach(task => {
      if (task.durum === 'tamamlandi' || task.durum === 'onaylandi') {
        const toplamTaskPuani = task.kontrolToplamPuani || 0;

        if (task.checklist && task.checklist.kategori === 'IK') {
          scoresByCategory.ik_sablon.puan += toplamTaskPuani;
          scoresByCategory.ik_sablon.gorevSayisi++;
        } else if (task.checklist && task.checklist.kategori === 'Kalite') {
          scoresByCategory.kalite_kontrol.puan += toplamTaskPuani;
          scoresByCategory.kalite_kontrol.gorevSayisi++;
        } else {
          scoresByCategory.checklist.puan += toplamTaskPuani;
          scoresByCategory.checklist.gorevSayisi++;
        }
      }
    });

    // Process work tasks (simple approach without buddy scoring for now)
    workTasks.forEach(task => {
      if (task.durum === 'tamamlandi') {
        const toplamTaskPuani = task.kontrolToplamPuani || 0;
        scoresByCategory.is_bagli.puan += toplamTaskPuani;
        scoresByCategory.is_bagli.gorevSayisi++;
      }
    });

    // Process quality evaluations
    qualityEvaluations.forEach(evaluation => {
      scoresByCategory.kalite_kontrol.puan += evaluation.toplamPuan || 0;
      scoresByCategory.kalite_kontrol.gorevSayisi++;
    });

    // Process HR scores with current settings
    hrScores.forEach(hrScore => {
      this.processHRScore(hrScore, scoresByCategory, hrSettings);
    });

    // Process control scores (kontrol puanları)
    controlScores.forEach(controlScore => {
      scoresByCategory.kontrol_puanlari.puan += controlScore.kontrolPuani || 0;
      scoresByCategory.kontrol_puanlari.gorevSayisi++;
    });

    // Process bonus evaluations
    bonusEvaluations.forEach(bonusEvaluation => {
      scoresByCategory.bonus_puanlari.puan += bonusEvaluation.toplamPuan || 0;
      scoresByCategory.bonus_puanlari.gorevSayisi++;
    });

    // Process kalıp değişim evaluations
    kalipDegisimEvaluations.forEach(kalipDegisimEvaluation => {
      // Ana çalışan puanı
      if (
        kalipDegisimEvaluation.anaCalisan &&
        kalipDegisimEvaluation.anaCalisan.toString() === userId.toString()
      ) {
        scoresByCategory.bonus_puanlari.puan +=
          kalipDegisimEvaluation.anaCalısanToplamPuan || 0;
        scoresByCategory.bonus_puanlari.gorevSayisi++;
      }

      // Buddy puanı
      if (
        kalipDegisimEvaluation.buddyCalisan &&
        kalipDegisimEvaluation.buddyCalisan.toString() === userId.toString()
      ) {
        scoresByCategory.bonus_puanlari.puan +=
          kalipDegisimEvaluation.buddyToplamPuan || 0;
        scoresByCategory.bonus_puanlari.gorevSayisi++;
      }
    });

    // Calculate averages
    Object.keys(scoresByCategory).forEach(key => {
      const category = scoresByCategory[key];
      if (category.gorevSayisi > 0) {
        category.ortalama = Math.round(category.puan / category.gorevSayisi);
      }
    });

    console.log('📊 Hesaplanan kategorilerePuanlar:', scoresByCategory);
    return scoresByCategory;
  }

  /**
   * Process HR Score data with current settings
   */
  static processHRScore(hrScore, scoresByCategory, hrSettings) {
    // Calculate updated scores based on current settings
    let guncellenenMesaiPuani = 0;
    let guncellenenDevamsizlikPuani = 0;

    // Manual mesai records
    hrScore.mesaiKayitlari?.forEach(mesai => {
      if (mesai.saat && hrSettings.mesaiPuanlama.aktif) {
        const hesaplananPuan =
          mesai.saat * hrSettings.mesaiPuanlama.saatBasinaPuan;
        guncellenenMesaiPuani += hesaplananPuan;
      }
    });

    // Manual devamsızlık records
    hrScore.devamsizlikKayitlari?.forEach(devamsizlik => {
      if (hrSettings.devamsizlikPuanlama.aktif) {
        if (devamsizlik.tur === 'gun' && devamsizlik.miktar) {
          guncellenenDevamsizlikPuani +=
            devamsizlik.miktar * hrSettings.devamsizlikPuanlama.gunBasinaPuan;
        } else if (devamsizlik.tur === 'saat' && devamsizlik.miktar) {
          guncellenenDevamsizlikPuani +=
            devamsizlik.miktar * hrSettings.devamsizlikPuanlama.saatBasinaPuan;
        }
      }
    });

    const toplamPuanlar = hrScore.toplamPuanlar;

    // IK template scores
    if (toplamPuanlar.checklistPuani !== 0 && toplamPuanlar.checklistPuani) {
      scoresByCategory.ik_sablon.puan += toplamPuanlar.checklistPuani;
      scoresByCategory.ik_sablon.gorevSayisi +=
        hrScore.checklistPuanlari?.length || 0;
    }

    // Overtime scores (updated calculation)
    if (guncellenenMesaiPuani > 0) {
      scoresByCategory.fazla_mesai.puan += guncellenenMesaiPuani;
      scoresByCategory.fazla_mesai.gorevSayisi +=
        hrScore.mesaiKayitlari?.length || 0;
    }

    // Absence scores (updated calculation, can be negative)
    if (guncellenenDevamsizlikPuani !== 0) {
      scoresByCategory.ik_devamsizlik.puan += guncellenenDevamsizlikPuani;
      scoresByCategory.ik_devamsizlik.gorevSayisi +=
        hrScore.devamsizlikKayitlari?.length || 0;
    }
  }

  /**
   * Get detailed activity list with pagination
   */
  static async getDetailedActivities(userId, filters) {
    const { page = 1, limit = 20, durum, tarih } = filters;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Date filter
    let dateFilter = {};
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
    }

    // Status filter
    const durumFilter = {};
    if (durum) {
      durumFilter.durum = durum;
    }

    // Parallel queries
    const [checklistTasks, workTasks, totalChecklistTasks, totalWorkTasks] =
      await Promise.all([
        // Checklist tasks
        Task.find({
          kullanici: userId,
          ...dateFilter,
          ...durumFilter,
        })
          .populate('checklist', 'ad kategori aciklama')
          .populate('makina', 'ad makinaNo envanterKodu')
          .populate('onaylayan', 'ad soyad')
          .sort({ tamamlanmaTarihi: -1 })
          .skip(skip)
          .limit(limitNum),

        // Work tasks
        WorkTask.find({
          kullanici: userId,
          ...dateFilter,
          ...durumFilter,
        })
          .populate('checklist', 'ad kategori aciklama')
          .populate('makina', 'envanterKodu ad')
          .populate('indirilenKalip', 'envanterKodu ad')
          .populate('baglananHamade', 'envanterKodu ad')
          .populate('onaylayanKullanici', 'ad soyad')
          .sort({ tamamlanmaTarihi: -1 })
          .skip(skip)
          .limit(limitNum),

        // Count totals for pagination
        Task.countDocuments({
          kullanici: userId,
          ...dateFilter,
          ...durumFilter,
        }),
        WorkTask.countDocuments({
          kullanici: userId,
          ...dateFilter,
          ...durumFilter,
        }),
      ]);

    return {
      checklistTasks,
      workTasks,
      totalChecklistTasks,
      totalWorkTasks,
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
    const { page = 1, limit = 20, days = 30 } = filters;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

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
      totalChecklistTasks,
      totalWorkTasks,
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
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 }),

      // Scored work tasks
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
        ],
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad')
        .populate('baglananHamade', 'envanterKodu ad')
        .populate('onaylayanKullanici', 'ad soyad')
        .populate('kontroleden', 'ad soyad')
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

      // HR scores
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

      // Count totals
      Task.countDocuments({
        kullanici: userId,
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      }),
      WorkTask.countDocuments({
        kullanici: userId,
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      }),
    ]);

    return {
      scoredChecklistTasks,
      scoredWorkTasks,
      qualityEvaluations,
      hrScores,
      totalChecklistTasks,
      totalWorkTasks,
      dateRange: { startDate, endDate },
      pagination: {
        pageNum,
        limitNum,
        skip,
      },
    };
  }

  /**
   * Get task details by ID
   */
  static async getTaskDetails(taskId, _userId) {
    // Check if it's an HR evaluation
    if (
      taskId.startsWith('hr_checklist_') ||
      taskId.startsWith('hr_mesai_') ||
      taskId.startsWith('hr_devamsizlik_')
    ) {
      return this.getHRTaskDetails(taskId);
    }

    // Check if it's a Quality Control evaluation
    if (taskId.length === 24 && !taskId.startsWith('hr_')) {
      const qualityEvaluation = await QualityControlEvaluation.findById(taskId)
        .populate('sablon', 'ad aciklama maddeler')
        .populate('degerlendirenKullanici', 'ad soyad');

      if (qualityEvaluation) {
        return this.formatQualityEvaluationDetails(qualityEvaluation);
      }
    }

    // Normal task details
    const task = await Task.findById(taskId)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklist', 'ad kategori aciklama maddeler')
      .populate('makina', 'ad makinaNo envanterKodu')
      .populate('onaylayan', 'ad soyad')
      .populate('kontroleden', 'ad soyad');

    if (!task) {
      throw new Error('Görev bulunamadı');
    }

    return this.formatTaskDetails(task);
  }

  /**
   * Get HR task details
   */
  static async getHRTaskDetails(taskId) {
    const [, type, hrScoreId, timestamp] = taskId.split('_');
    const hrScore = await HRScore.findById(hrScoreId).populate(
      'checklistPuanlari.sablon',
      'ad aciklama maddeler',
    );

    if (!hrScore) {
      throw new Error('İK değerlendirmesi bulunamadı');
    }

    const targetDate = new Date(parseInt(timestamp));
    let evaluation = null;

    if (type === 'checklist') {
      evaluation = hrScore.checklistPuanlari.find(
        p => p.tarih.getTime() === targetDate.getTime(),
      );
    } else if (type === 'mesai') {
      evaluation = hrScore.mesaiKayitlari.find(
        m => m.tarih.getTime() === targetDate.getTime(),
      );
    } else if (type === 'devamsizlik') {
      evaluation = hrScore.devamsizlikKayitlari.find(
        d => d.tarih.getTime() === targetDate.getTime(),
      );
    }

    if (!evaluation) {
      throw new Error('İK değerlendirmesi bulunamadı');
    }

    return this.formatHRTaskDetails(taskId, type, evaluation);
  }

  /**
   * Get daily performance data
   */
  static async getDailyPerformance(userId, days = 30) {
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

          // Quality Control evaluations
          QualityControlEvaluation.find({
            degerlendirilenKullanici: userId,
            createdAt: {
              $gte: currentDate,
              $lt: nextDate,
            },
          }),

          // Bonus evaluations
          BonusEvaluation.find({
            degerlendirilenKullanici: userId,
            degerlendirmeTarihi: {
              $gte: currentDate,
              $lt: nextDate,
            },
          }),

          // Control scores
          ControlScore.find({
            puanlayanKullanici: userId,
            puanlamaTarihi: {
              $gte: currentDate,
              $lt: nextDate,
            },
          }),
        ]).then(
          ([
            dayTasks,
            dayWorkTasks,
            qualityEvaluations,
            bonusEvaluations,
            controlScores,
          ]) => {
            return this.calculateDayScores(
              currentDate,
              dayTasks,
              dayWorkTasks,
              qualityEvaluations,
              bonusEvaluations,
              controlScores,
            );
          },
        );
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
  static calculateDayScores(
    currentDate,
    dayTasks,
    dayWorkTasks,
    qualityEvaluations = [],
    bonusEvaluations = [],
    controlScores = [],
  ) {
    const gunlukScores = {
      ik_sablon: 0,
      ik_devamsizlik: 0,
      fazla_mesai: 0,
      checklist: 0,
      is_bagli: 0,
      kalite_kontrol: 0,
      kontrol_puanlari: 0,
      bonus_puanlari: 0,
    };

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

    // Process quality evaluations
    qualityEvaluations.forEach(evaluation => {
      gunlukScores.kalite_kontrol += evaluation.toplamPuan || 0;
    });

    // Process bonus evaluations
    bonusEvaluations.forEach(evaluation => {
      gunlukScores.bonus_puanlari += evaluation.toplamPuan || 0;
    });

    // Process control scores
    controlScores.forEach(score => {
      gunlukScores.kontrol_puanlari += score.kontrolPuani || 0;
    });

    return {
      tarih: currentDate.toISOString().split('T')[0],
      tarihFormatli: currentDate.toLocaleDateString('tr-TR'),
      scores: gunlukScores,
      toplamPuan: Object.values(gunlukScores).reduce(
        (sum, score) => sum + score,
        0,
      ),
      gorevSayisi:
        dayTasks.length +
        dayWorkTasks.length +
        qualityEvaluations.length +
        bonusEvaluations.length +
        controlScores.length,
    };
  }

  /**
   * Format task details for response
   */
  static formatTaskDetails(task) {
    return {
      id: task._id,
      checklistAdi: task.checklist.ad,
      kategori: task.checklist.kategori,
      makina: task.makina
        ? `${task.makina.ad} (${task.makina.makinaNo})`
        : 'Makina Yok',
      durum: task.durum,
      tamamlanmaTarihi: task.tamamlanmaTarihi,
      onayTarihi: task.onayTarihi,
      kontrolTarihi: task.kontrolTarihi,
      onaylayan: task.onaylayan
        ? {
          ad: task.onaylayan.ad,
          soyad: task.onaylayan.soyad,
        }
        : null,
      kontroleden: task.kontroleden
        ? {
          ad: task.kontroleden.ad,
          soyad: task.kontroleden.soyad,
        }
        : null,
      puanlar: {
        toplamPuan: task.toplamPuan || 0,
        kontrolToplamPuani: task.kontrolToplamPuani || 0,
        genelToplam: (task.toplamPuan || 0) + (task.kontrolToplamPuani || 0),
      },
      maddeler: task.maddeler.map((madde, index) => ({
        sira: index + 1,
        soru: madde.soru,
        cevap: madde.cevap,
        kendiPuani: 0, // No self-scoring anymore
        maxPuan: madde.maxPuan || 0,
        kontrolPuani: madde.kontrolPuani || 0,
        yorum: madde.yorum || '',
        kontrolYorumu: madde.kontrolYorumu || '',
        resimUrl: madde.resimUrl || '',
        kontrolResimUrl: madde.kontrolResimUrl || '',
        toplamPuan: madde.kontrolPuani || 0,
      })),
    };
  }

  /**
   * Format HR task details
   */
  static formatHRTaskDetails(taskId, type, evaluation) {
    const baseDetails = {
      id: taskId,
      tip: `hr_${type}`,
      durum: 'tamamlandi',
      tamamlanmaTarihi: evaluation.tarih,
      puanlamaTarihi: evaluation.tarih,
      puanlar: {
        toplamPuan: evaluation.puan || 0,
        kontrolToplamPuani: evaluation.puan || 0,
        genelToplam: evaluation.puan || 0,
      },
      puanlayanKullanici: {
        ad: 'İK',
        soyad: 'Departmanı',
      },
    };

    if (type === 'checklist') {
      return {
        ...baseDetails,
        checklistAdi: evaluation.sablon?.ad || 'İK Şablon Değerlendirmesi',
        kategori: 'İK Checklist',
        maddeler: (evaluation.sablon?.maddeler || []).map((madde, index) => ({
          sira: index + 1,
          soru: madde.baslik || '',
          cevap: 'Değerlendirildi',
          kontrolPuani: madde.puan || 0,
          maxPuan: Math.abs(madde.puan || 0),
          kontrolYorumu: madde.aciklama || '',
          toplamPuan: madde.puan || 0,
          periyot: madde.periyot || 'aylik',
        })),
      };
    } else if (type === 'mesai') {
      return {
        ...baseDetails,
        checklistAdi: 'Mesai Puanlaması',
        kategori: 'İK Mesai',
        maddeler: [
          {
            sira: 1,
            soru: 'Mesai Saati',
            cevap: `${evaluation.saatSayisi} saat`,
            kontrolPuani: evaluation.puan || 0,
            maxPuan: evaluation.puan || 0,
            kontrolYorumu: evaluation.aciklama || '',
            toplamPuan: evaluation.puan || 0,
          },
        ],
      };
    } else {
      return {
        ...baseDetails,
        checklistAdi: 'Devamsızlık Puanlaması',
        kategori: 'İK Devamsızlık',
        maddeler: [
          {
            sira: 1,
            soru: 'Devamsızlık',
            cevap: `${evaluation.tip} - ${evaluation.saat || evaluation.gun} ${evaluation.tip === 'saatlik' ? 'saat' : 'gün'}`,
            kontrolPuani: evaluation.puan || 0,
            maxPuan: evaluation.puan || 0,
            kontrolYorumu: evaluation.aciklama || '',
            toplamPuan: evaluation.puan || 0,
          },
        ],
      };
    }
  }

  /**
   * Format Quality Control evaluation details
   */
  static formatQualityEvaluationDetails(qualityEvaluation) {
    return {
      id: qualityEvaluation._id,
      tip: 'quality_control',
      checklistAdi:
        qualityEvaluation.sablon?.ad || 'Kalite Kontrol Değerlendirmesi',
      kategori: 'Kalite Kontrol',
      durum: 'tamamlandi',
      tamamlanmaTarihi: qualityEvaluation.createdAt,
      puanlamaTarihi: qualityEvaluation.createdAt,
      puanlar: {
        toplamPuan: qualityEvaluation.toplamPuan || 0,
        kontrolToplamPuani: qualityEvaluation.toplamPuan || 0,
        genelToplam: qualityEvaluation.toplamPuan || 0,
      },
      puanlayanKullanici: qualityEvaluation.degerlendirenKullanici
        ? {
          ad: qualityEvaluation.degerlendirenKullanici.ad,
          soyad: qualityEvaluation.degerlendirenKullanici.soyad,
        }
        : null,
      maddeler: (qualityEvaluation.puanlamalar || []).map(
        (puanlama, index) => ({
          sira: index + 1,
          soru: puanlama.maddeBaslik || '',
          cevap: 'Değerlendirildi',
          kontrolPuani: puanlama.puan || 0,
          maxPuan: puanlama.maksimumPuan || 0,
          kontrolYorumu: puanlama.aciklama || '',
          toplamPuan: puanlama.puan || 0,
          resimUrl: puanlama.fotograflar?.[0] || '',
        }),
      ),
    };
  }
}

module.exports = MyActivityService;
