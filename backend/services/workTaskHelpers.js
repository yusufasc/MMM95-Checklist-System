const KalipDegisimEvaluation = require('../models/KalipDegisimEvaluation');

/**
 * WorkTask & KalipDegisim Operations Helper
 *
 * REFACTORING STATUS: Module 2/4 (EXTRACTED FROM myActivityHelpers.js)
 * RESPONSIBILITY: WorkTask & KalipDegisim Operations
 * ESTIMATED SIZE: ~500 lines
 * RISK LEVEL: ORTA (Buddy scoring complexity)
 *
 * EXTRACTED METHODS:
 * ✅ getKalipDegisimEvaluations() - Kalıp değişim evaluation logic
 * ✅ processWorkTaskBuddyScoring() - Buddy scoring calculation
 * ✅ formatWorkTaskData() - WorkTask data formatting
 *
 * PRESERVED PATTERNS:
 * 🛡️ Buddy Scoring System (Ana + Buddy dual scoring)
 * 🛡️ Field Mapping System (Backend-Frontend compatibility)
 * 🛡️ Populate Optimization (Selective field loading)
 * 🛡️ Debug Logging (Comprehensive error tracking)
 * 🛡️ NaN Prevention (Safe fallbacks from legacy issues)
 */
class WorkTaskHelpers {
  /**
   * Kalıp Değişim Evaluation puanlarını çek
   *
   * EXTRACTED FROM: myActivityHelpers.js lines 33-179 (146 lines)
   * COMPLEXITY: HIGH (Dual scoring, populate operations, format conversion)
   * PRESERVED PATTERNS: Buddy scoring, field mapping, debug logging
   */
  static async getKalipDegisimEvaluations(userId, month, year) {
    try {
      // 🛡️ PRESERVED: Dual role filtering pattern
      const dateFilter = {
        $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
      };

      if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter.degerlendirmeTarihi = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // 🛡️ PRESERVED: Selective populate optimization
      const kalipDegisimEvaluations = await KalipDegisimEvaluation.find(
        dateFilter,
      )
        .populate('checklistTemplate', 'ad aciklama')
        .populate('workTask', 'makina usta kalipDegisimBuddy')
        .populate('degerlendiren', 'ad soyad')
        .populate('anaCalisan', 'ad soyad kullaniciAdi')
        .populate('buddyCalisan', 'ad soyad kullaniciAdi')
        .sort({ degerlendirmeTarihi: -1 });

      // 🛡️ PRESERVED: Debug logging pattern
      console.log(
        '🔧 WorkTaskHelpers - Kalıp Değişim Evaluations from database:',
        {
          userId,
          dateFilter,
          kalipDegisimEvaluationsFound: kalipDegisimEvaluations.length,
          month,
          year,
        },
      );

      // 🛡️ PRESERVED: Detailed debug logging for each evaluation
      kalipDegisimEvaluations.forEach((evaluation, index) => {
        console.log(`🔍 WorkTaskHelpers - Evaluation ${index + 1}:`, {
          id: evaluation._id,
          anaCalisan: evaluation.anaCalisan?._id?.toString(),
          buddyCalisan: evaluation.buddyCalisan?._id?.toString(),
          anaToplamPuan: evaluation.anaCalısanToplamPuan,
          buddyToplamPuan: evaluation.buddyToplamPuan,
          maxToplamPuan: evaluation.maxToplamPuan,
          degerlendirmeTarihi: evaluation.degerlendirmeTarihi,
          userIdString: userId.toString(),
        });
      });

      // 🛡️ PRESERVED: MyActivity format conversion
      const formattedKalipDegisimEvaluations = [];

      kalipDegisimEvaluations.forEach(evaluation => {
        const evaluationDate = new Date(evaluation.degerlendirmeTarihi);

        // 🛡️ PRESERVED: Ana çalışan scoring logic
        if (
          evaluation.anaCalisan &&
          evaluation.anaCalisan._id.toString() === userId.toString()
        ) {
          const toplamPuan = evaluation.anaCalısanToplamPuan || 0;
          const maksimumPuan = evaluation.maxToplamPuan || 100;
          // 🛡️ PRESERVED: NaN prevention from legacy issues
          const basariYuzdesi =
            maksimumPuan > 0
              ? Math.round((toplamPuan / maksimumPuan) * 100)
              : 0;

          formattedKalipDegisimEvaluations.push({
            // 🛡️ PRESERVED: Field mapping system
            id: `kalip_degisim_ana_${evaluation._id}`,
            tip: 'kalip_degisim_evaluation',
            checklistAdi: `${evaluation.checklistTemplate?.ad || 'Kalıp Değişim'} (Ana Çalışan)`,
            kategori: 'Kalıp Değişim - Ana Çalışan',
            tamamlanmaTarihi: evaluationDate,
            puanlar: {
              toplam: toplamPuan,
              maksimum: maksimumPuan,
              basariYuzdesi: basariYuzdesi,
            },
            donem: {
              ay: evaluationDate.getMonth() + 1,
              yil: evaluationDate.getFullYear(),
            },
            degerlendiren: evaluation.degerlendiren,
            workTask: evaluation.workTask,
            rol: 'Ana Çalışan',
            toplamPuan: toplamPuan,
            maddeDetaylari: evaluation.maddeler,
          });
        }

        // 🛡️ PRESERVED: Buddy scoring logic
        if (
          evaluation.buddyCalisan &&
          evaluation.buddyCalisan._id.toString() === userId.toString()
        ) {
          const toplamPuan = evaluation.buddyToplamPuan || 0;
          const maksimumPuan = evaluation.maxToplamPuan || 100;
          // 🛡️ PRESERVED: NaN prevention pattern
          const basariYuzdesi =
            maksimumPuan > 0
              ? Math.round((toplamPuan / maksimumPuan) * 100)
              : 0;

          formattedKalipDegisimEvaluations.push({
            // 🛡️ PRESERVED: Buddy field mapping
            id: `kalip_degisim_buddy_${evaluation._id}`,
            tip: 'kalip_degisim_evaluation',
            checklistAdi: `${evaluation.checklistTemplate?.ad || 'Kalıp Değişim'} (Buddy)`,
            kategori: 'Kalıp Değişim - Buddy',
            tamamlanmaTarihi: evaluationDate,
            puanlar: {
              toplam: toplamPuan,
              maksimum: maksimumPuan,
              basariYuzdesi: basariYuzdesi,
            },
            donem: {
              ay: evaluationDate.getMonth() + 1,
              yil: evaluationDate.getFullYear(),
            },
            degerlendiren: evaluation.degerlendiren,
            workTask: evaluation.workTask,
            rol: 'Buddy',
            toplamPuan: toplamPuan,
            maddeDetaylari: evaluation.maddeler,
          });
        }
      });

      // 🛡️ PRESERVED: Summary debug logging
      console.log('✅ WorkTaskHelpers - Kalıp Değişim Evaluations formatted:', {
        totalFormatted: formattedKalipDegisimEvaluations.length,
        averageScore:
          formattedKalipDegisimEvaluations.length > 0
            ? Math.round(
              formattedKalipDegisimEvaluations.reduce(
                (sum, evaluation) => sum + evaluation.puanlar.basariYuzdesi,
                0,
              ) / formattedKalipDegisimEvaluations.length,
            )
            : 0,
      });

      return formattedKalipDegisimEvaluations;
    } catch (error) {
      // 🛡️ PRESERVED: Error handling pattern
      console.error(
        '❌ WorkTaskHelpers - Kalıp Değişim Evaluation scores error:',
        error,
      );
      return [];
    }
  }

  /**
   * WorkTask Buddy Scoring işlemleri
   *
   * EXTRACTED FROM: myActivityHelpers.js lines 1489-1534 (45 lines)
   * COMPLEXITY: MEDIUM (Point calculation, performance metrics)
   * PRESERVED PATTERNS: Buddy identification, score distribution
   */
  static processWorkTaskBuddyScoring(workTasks, targetUserId) {
    try {
      console.log('🔍 WorkTaskHelpers - Processing buddy scoring:', {
        workTaskCount: workTasks.length,
        targetUserId,
      });

      const buddyScores = [];
      let totalBuddyPoints = 0;
      let totalBuddyTasks = 0;

      // 🛡️ PRESERVED: Buddy identification logic
      workTasks.forEach(workTask => {
        if (
          workTask.kalipDegisimBuddy &&
          workTask.kalipDegisimBuddy._id &&
          workTask.kalipDegisimBuddy._id.toString() === targetUserId.toString()
        ) {
          // 🛡️ PRESERVED: Point calculation algorithm
          const buddyPuan = workTask.buddyToplamPuan || 0;
          const maksimumPuan = workTask.maksimumPuan || 100;

          // 🛡️ PRESERVED: Performance measurement
          const performanceRatio =
            maksimumPuan > 0 ? buddyPuan / maksimumPuan : 0;

          buddyScores.push({
            workTaskId: workTask._id,
            buddyPuan: buddyPuan,
            maksimumPuan: maksimumPuan,
            performanceRatio: performanceRatio,
            tamamlanmaTarihi: workTask.tamamlanmaTarihi,
            makina: workTask.makina,
            anaCalisan: workTask.kullanici,
          });

          totalBuddyPoints += buddyPuan;
          totalBuddyTasks += 1;
        }
      });

      // 🛡️ PRESERVED: Performance calculation
      const averagePerformance =
        totalBuddyTasks > 0
          ? Math.round((totalBuddyPoints / (totalBuddyTasks * 100)) * 100)
          : 0;

      const result = {
        buddyScores: buddyScores,
        totalBuddyPoints: totalBuddyPoints,
        totalBuddyTasks: totalBuddyTasks,
        averagePerformance: averagePerformance,
        performanceGrade: this.calculatePerformanceGrade(averagePerformance),
      };

      console.log('✅ WorkTaskHelpers - Buddy scoring processed:', result);
      return result;
    } catch (error) {
      console.error('❌ WorkTaskHelpers - Buddy scoring error:', error);
      return {
        buddyScores: [],
        totalBuddyPoints: 0,
        totalBuddyTasks: 0,
        averagePerformance: 0,
        performanceGrade: 'D',
      };
    }
  }

  /**
   * WorkTask verilerini standart formata çevir
   *
   * NEW METHOD: Data formatting helpers
   * COMPLEXITY: LOW (Field mapping, validation)
   * PRESERVED PATTERNS: Consistent field mapping, error handling
   */
  static formatWorkTaskData(workTaskData) {
    try {
      if (!workTaskData) {
        return null;
      }

      // 🛡️ PRESERVED: Field mapping system
      return {
        id: workTaskData._id,
        tip: 'worktask',
        baslik: workTaskData.sablon?.ad || 'Bilinmeyen İş',
        aciklama: workTaskData.sablon?.aciklama || '',
        kullanici: workTaskData.kullanici,
        makina: workTaskData.makina,
        durum: workTaskData.durum,
        tamamlanmaTarihi: workTaskData.tamamlanmaTarihi,
        puanlar: {
          toplam: workTaskData.toplamPuan || 0,
          maksimum: workTaskData.maksimumPuan || 100,
          basariYuzdesi:
            workTaskData.maksimumPuan > 0
              ? Math.round(
                (workTaskData.toplamPuan / workTaskData.maksimumPuan) * 100,
              )
              : 0,
        },
        buddy: workTaskData.kalipDegisimBuddy
          ? {
            id: workTaskData.kalipDegisimBuddy._id,
            ad: workTaskData.kalipDegisimBuddy.ad,
            soyad: workTaskData.kalipDegisimBuddy.soyad,
            buddyPuan: workTaskData.buddyToplamPuan || 0,
          }
          : null,
        maddeler: workTaskData.maddeler || [],
        created: workTaskData.createdAt,
        updated: workTaskData.updatedAt,
      };
    } catch (error) {
      console.error('❌ WorkTaskHelpers - Format data error:', error);
      return null;
    }
  }

  /**
   * Performance grade hesaplama helper
   *
   * HELPER METHOD: Performance grade calculation
   * PRESERVED PATTERNS: Grade calculation logic
   */
  static calculatePerformanceGrade(percentage) {
    if (percentage >= 90) {
      return 'A+';
    }
    if (percentage >= 80) {
      return 'A';
    }
    if (percentage >= 70) {
      return 'B';
    }
    if (percentage >= 60) {
      return 'C';
    }
    if (percentage >= 50) {
      return 'D';
    }
    return 'F';
  }

  /**
   * Veri validasyon helper
   *
   * HELPER METHOD: Data validation
   * PRESERVED PATTERNS: Error handling, data validation
   */
  static validateWorkTaskData(data) {
    const errors = [];

    if (!data) {
      errors.push('Data is required');
      return { isValid: false, errors };
    }

    if (!data.kullanici) {
      errors.push('Kullanici is required');
    }

    if (!data.makina) {
      errors.push('Makina is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

module.exports = WorkTaskHelpers;
