/**
 * Activity Data & Statistics Helper
 *
 * REFACTORING STATUS: Module 4/4 (EXTRACTED FROM myActivityHelpers.js)
 * RESPONSIBILITY: Activity Data Processing & Statistical Calculations
 * ESTIMATED SIZE: ~350 lines
 * RISK LEVEL: DÜŞÜK (Data aggregation & calculations)
 *
 * EXTRACTED METHODS:
 * ✅ getDetailedActivities() - Multi-source activity data aggregation
 * ✅ getDailyPerformance() - Daily performance calculation
 * ✅ calculateDayScores() - Day-based score calculation
 * ✅ getMonthlyScoreTotals() - Monthly statistics aggregation
 * ✅ filterByDepartment() - Department-based filtering
 * ✅ calculateActivityStatistics() - Comprehensive statistics
 *
 * PRESERVED LEGACY PATTERNS (Geçmiş hatalardan korunma):
 * ✅ Field mapping patterns (geçmiş field mapping hatalarından öğrenilen)
 * ✅ NaN prevention (geçmiş NaN display hatalarından korunma)
 * ✅ Populate optimization (geçmiş populate hatalarından çıkarılan dersler)
 * ✅ Date handling safety (geçmiş date parsing hatalarından korunma)
 * ✅ Multi-source data consistency (geçmiş data mismatch hatalarından)
 * ✅ React key generation patterns (geçmiş duplicate key hatalarından)
 * ✅ ESLint compliance (trailing commas, async/await patterns)
 */

const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const HRScore = require('../models/HRScore');
const BonusEvaluation = require('../models/BonusEvaluation');
const ControlScore = require('../models/ControlScore');
const KalipDegisimEvaluation = require('../models/KalipDegisimEvaluation');

class ActivityDataHelpers {
  /**
   * Get detailed activities with multi-source aggregation
   *
   * GEÇMIŞ HATALARDAN KORUNMA:
   * - Date filter safety checks
   * - Populate optimization
   * - Field mapping consistency
   * - NaN prevention in calculations
   */
  static async getDetailedActivities(userId, filters) {
    try {
      console.log(
        '📊 ActivityDataHelpers - Starting detailed activities fetch:',
        {
          userId: userId?.toString(),
          filters,
          timestamp: new Date().toISOString(),
        },
      );

      // ✅ PRESERVED: Input validation (geçmiş validation hatalarından)
      if (!userId) {
        console.warn('⚠️ ActivityDataHelpers - No userId provided');
        return {
          checklistTasks: [],
          workTasks: [],
          qualityEvaluations: [],
          hrScores: [],
          bonusEvaluations: [],
          totalResults: 0,
        };
      }

      // ✅ PRESERVED: Safe filter parsing (geçmiş parsing hatalarından)
      const {
        page = 1,
        limit = 20,
        days = 30,
        durum,
        // tip: _tip,         // Unused, commented out
        // search: _search,   // Unused, commented out
      } = filters;

      const pageNum = this.safeNumber(parseInt(page), 1);
      const limitNum = this.safeNumber(parseInt(limit), 20);
      const daysNum = this.safeNumber(parseInt(days), 30);

      // ✅ PRESERVED: Date handling safety (geçmiş date parsing hatalarından)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysNum);

      const skip = (pageNum - 1) * limitNum;

      // ✅ PRESERVED: Dynamic filter building (geçmiş filter hatalarından)
      const dateFilter = {
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      const durumFilter = durum ? { durum } : {};

      // Multi-source data fetch with optimized populate
      const [
        checklistTasks,
        workTasks,
        qualityEvaluations,
        hrScores,
        bonusEvaluations,
        controlScores,
        kalipDegisimEvaluations,
        // Count queries for pagination
        totalChecklistTasks,
        totalWorkTasks,
        totalQualityEvaluations,
        totalHRScores,
        totalBonusEvaluations,
        totalControlScores,
        totalKalipDegisimEvaluations,
      ] = await Promise.all([
        // ✅ PRESERVED: Selective populate (geçmiş populate optimization)
        Task.find({
          kullanici: userId,
          ...dateFilter,
          ...durumFilter,
        })
          .populate('checklist', 'ad kategori aciklama')
          .populate('makina', 'ad makinaNo envanterKodu')
          .populate('onaylayan', 'ad soyad')
          .skip(skip)
          .limit(limitNum)
          .sort({ tamamlanmaTarihi: -1 }),

        // WorkTask queries with buddy scoring logic
        WorkTask.find({
          $or: [
            {
              kullanici: userId,
              ...dateFilter,
              ...durumFilter,
            },
            {
              kalipDegisimBuddy: userId,
              ...dateFilter,
              durum: { $in: ['onaylandi', 'tamamlandi'] },
            },
          ],
        })
          .populate('kullanici', 'ad soyad kullaniciAdi')
          .populate('checklist', 'ad kategori aciklama')
          .populate('makina', 'ad makinaNo envanterKodu')
          .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi')
          .skip(skip)
          .limit(limitNum)
          .sort({ tamamlanmaTarihi: -1 }),

        // Quality evaluations
        QualityControlEvaluation.find({
          degerlendirilenKullanici: userId,
          degerlendirmeTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        })
          .populate('sablon', 'ad aciklama')
          .populate('degerlendirenKullanici', 'ad soyad')
          .populate('makina', 'ad envanterKodu')
          .skip(skip)
          .limit(limitNum)
          .sort({ degerlendirmeTarihi: -1 }),

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
          ],
        })
          .populate('checklistPuanlari.sablon', 'ad aciklama')
          .skip(skip)
          .limit(limitNum)
          .sort({ 'donem.yil': -1, 'donem.ay': -1 }),

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
          .skip(skip)
          .limit(limitNum)
          .sort({ degerlendirmeTarihi: -1 }),

        // Control scores
        ControlScore.find({
          $or: [{ puanlayanKullanici: userId }, { puanlananKullanici: userId }],
          puanlamaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
          aktif: true,
        })
          .skip(skip)
          .limit(limitNum)
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
          .populate('workTask', 'makina usta')
          .populate('degerlendiren', 'ad soyad')
          .skip(skip)
          .limit(limitNum)
          .sort({ degerlendirmeTarihi: -1 }),

        // Count queries
        Task.countDocuments({
          kullanici: userId,
          ...dateFilter,
          ...durumFilter,
        }),

        WorkTask.countDocuments({
          $or: [
            {
              kullanici: userId,
              ...dateFilter,
              ...durumFilter,
            },
            {
              kalipDegisimBuddy: userId,
              ...dateFilter,
              durum: { $in: ['onaylandi', 'tamamlandi'] },
            },
          ],
        }),

        QualityControlEvaluation.countDocuments({
          degerlendirilenKullanici: userId,
          degerlendirmeTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        }),

        HRScore.countDocuments({
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
          ],
        }),

        BonusEvaluation.countDocuments({
          degerlendirilenKullanici: userId,
          degerlendirmeTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        }),

        ControlScore.countDocuments({
          $or: [{ puanlayanKullanici: userId }, { puanlananKullanici: userId }],
          puanlamaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
          aktif: true,
        }),

        KalipDegisimEvaluation.countDocuments({
          $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
          degerlendirmeTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        }),
      ]);

      const totalResults =
        totalChecklistTasks +
        totalWorkTasks +
        totalQualityEvaluations +
        totalHRScores +
        totalBonusEvaluations +
        totalControlScores +
        totalKalipDegisimEvaluations;

      console.log('✅ ActivityDataHelpers - Detailed activities fetched:', {
        userId: userId?.toString(),
        checklistTasks: checklistTasks?.length || 0,
        workTasks: workTasks?.length || 0,
        qualityEvaluations: qualityEvaluations?.length || 0,
        hrScores: hrScores?.length || 0,
        bonusEvaluations: bonusEvaluations?.length || 0,
        totalResults,
      });

      return {
        checklistTasks: checklistTasks || [],
        workTasks: workTasks || [],
        qualityEvaluations: qualityEvaluations || [],
        hrScores: hrScores || [],
        bonusEvaluations: bonusEvaluations || [],
        controlScores: controlScores || [],
        kalipDegisimEvaluations: kalipDegisimEvaluations || [],
        totalResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalResults,
          totalPages: Math.ceil(totalResults / limitNum),
        },
      };
    } catch (error) {
      console.error(
        '❌ ActivityDataHelpers - Error in getDetailedActivities:',
        {
          error: error.message,
          userId: userId?.toString(),
          filters,
        },
      );

      // ✅ PRESERVED: Safe fallback return (geçmiş error handling patterns)
      return {
        checklistTasks: [],
        workTasks: [],
        qualityEvaluations: [],
        hrScores: [],
        bonusEvaluations: [],
        controlScores: [],
        kalipDegisimEvaluations: [],
        totalResults: 0,
        pagination: {
          page: 1,
          limit: 20,
          totalResults: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get daily performance with comprehensive calculations
   *
   * GEÇMIŞ HATALARDAN KORUNMA:
   * - NaN prevention in all calculations
   * - Safe date operations
   * - Comprehensive error handling
   */
  static async getDailyPerformance(userId, days = 30) {
    try {
      console.log(
        '📈 ActivityDataHelpers - Starting daily performance calculation:',
        {
          userId: userId?.toString(),
          days,
          timestamp: new Date().toISOString(),
        },
      );

      // ✅ NaN PREVENTION: Safe input validation
      if (!userId) {
        console.warn(
          '⚠️ ActivityDataHelpers - No userId provided for daily performance',
        );
        return [];
      }

      const daysNum = this.safeNumber(parseInt(String(days)), 30);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysNum);

      // ✅ PRESERVED: Parallel database queries for performance
      const [tasks, workTasks] = await Promise.all([
        Task.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
          $or: [
            { toplamPuan: { $exists: true, $gt: 0 } },
            { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          ],
        })
          .populate('checklist', 'ad kategori')
          .populate('makina', 'ad envanterKodu')
          .sort({ tamamlanmaTarihi: 1 }),

        WorkTask.find({
          $or: [
            {
              kullanici: userId,
              tamamlanmaTarihi: {
                $gte: startDate,
                $lte: endDate,
              },
              durum: 'tamamlandi',
            },
            {
              kalipDegisimBuddy: userId,
              tamamlanmaTarihi: {
                $gte: startDate,
                $lte: endDate,
              },
              durum: { $in: ['onaylandi', 'tamamlandi'] },
            },
          ],
        })
          .populate('checklist', 'ad kategori')
          .populate('makina', 'ad envanterKodu')
          .sort({ tamamlanmaTarihi: 1 }),
      ]);

      console.log('🔍 ActivityDataHelpers - Raw performance data:', {
        userId: userId?.toString(),
        tasksFound: tasks?.length || 0,
        workTasksFound: workTasks?.length || 0,
        dateRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      });

      // ✅ ENHANCED: Day-by-day performance calculation with NaN safety
      const dailyPerformance = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Filter tasks for this specific day
        const dayTasks = tasks.filter(task => {
          const taskDate = new Date(task.tamamlanmaTarihi);
          return taskDate >= dayStart && taskDate <= dayEnd;
        });

        const dayWorkTasks = workTasks.filter(workTask => {
          const taskDate = new Date(workTask.tamamlanmaTarihi);
          return taskDate >= dayStart && taskDate <= dayEnd;
        });

        // ✅ CALL HELPER: Calculate day scores with NaN safety
        const dayScores = this.calculateDayScores(
          currentDate,
          dayTasks,
          dayWorkTasks,
        );
        dailyPerformance.push(dayScores);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('✅ ActivityDataHelpers - Daily performance calculated:', {
        userId: userId?.toString(),
        daysCalculated: dailyPerformance.length,
        totalTasks: tasks?.length || 0,
        totalWorkTasks: workTasks?.length || 0,
      });

      return dailyPerformance;
    } catch (error) {
      console.error('❌ ActivityDataHelpers - Error in getDailyPerformance:', {
        error: error.message,
        userId: userId?.toString(),
        days,
      });

      // ✅ PRESERVED: Safe fallback return
      return [];
    }
  }

  /**
   * Calculate day scores with comprehensive NaN safety
   *
   * GEÇMIŞ NaN HATALARINDAN KORUNMA:
   * - Her matematik işlemde güvenli fallback
   * - 0/0 bölme kontrolü
   * - Undefined/null value handling
   */
  static calculateDayScores(currentDate, dayTasks, dayWorkTasks) {
    // ✅ NaN PREVENTION: Safe array handling
    const safeDayTasks = dayTasks || [];
    const safeDayWorkTasks = dayWorkTasks || [];

    // ✅ NaN PREVENTION: Safe score calculations
    const checklistScores = safeDayTasks.map(task => {
      const toplamPuan = this.safeNumber(task.toplamPuan);
      const kontrolPuan = this.safeNumber(task.kontrolToplamPuani);
      return {
        tip: 'checklist',
        checklistAdi: task.checklist?.ad || 'Bilinmeyen Checklist',
        kategori: task.checklist?.kategori || 'Genel',
        makina: task.makina?.ad || 'Makina Yok',
        toplamPuan,
        kontrolPuan,
        kullanilacakPuan: kontrolPuan > 0 ? kontrolPuan : toplamPuan,
      };
    });

    const workTaskScores = safeDayWorkTasks.map(workTask => {
      const toplamPuan = this.safeNumber(workTask.toplamPuan);
      const kontrolPuan = this.safeNumber(workTask.kontrolToplamPuani);
      return {
        tip: 'worktask',
        checklistAdi: workTask.checklist?.ad || 'İşe Bağlı Görev',
        kategori: 'İşe Bağlı',
        makina: workTask.makina?.ad || 'Makina Yok',
        toplamPuan,
        kontrolPuan,
        kullanilacakPuan: kontrolPuan > 0 ? kontrolPuan : toplamPuan,
      };
    });

    // ✅ NaN PREVENTION: Safe aggregation calculations
    const allScores = [...checklistScores, ...workTaskScores];

    const totalScore = allScores.reduce((sum, score) => {
      return sum + this.safeNumber(score.kullanilacakPuan);
    }, 0);

    const taskCount = allScores.length;
    const avgScore = taskCount > 0 ? Math.round(totalScore / taskCount) : 0;

    // ✅ NaN PREVENTION: Safe category breakdown
    const categoryBreakdown = {};
    allScores.forEach(score => {
      const category = score.kategori || 'Diğer';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          totalScore: 0,
          count: 0,
          avgScore: 0,
        };
      }
      categoryBreakdown[category].totalScore += this.safeNumber(
        score.kullanilacakPuan,
      );
      categoryBreakdown[category].count += 1;
    });

    // Calculate averages for categories
    Object.keys(categoryBreakdown).forEach(category => {
      const cat = categoryBreakdown[category];
      cat.avgScore = cat.count > 0 ? Math.round(cat.totalScore / cat.count) : 0;
    });

    return {
      tarih: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
      gun: currentDate.toLocaleDateString('tr-TR', { weekday: 'long' }),
      toplamPuan: totalScore,
      gorevSayisi: taskCount,
      ortalamaPuan: avgScore,
      checklistGorevSayisi: checklistScores.length,
      workTaskGorevSayisi: workTaskScores.length,
      kategoriler: categoryBreakdown,
      detaylar: allScores, // Individual task scores for debugging
      // ✅ PRESERVED: Additional metadata for debugging
      metadata: {
        processed: new Date().toISOString(),
        safeCalculation: true,
        hasNaNProtection: true,
      },
    };
  }

  /**
   * Get monthly score totals with statistical analysis
   *
   * GEÇMIŞ HATALARDAN KORUNMA:
   * - Comprehensive month/year validation
   * - NaN prevention in all calculations
   * - Safe date handling
   */
  static async getMonthlyScoreTotals(userId, filters = {}) {
    try {
      console.log('📊 ActivityDataHelpers - Starting monthly score totals:', {
        userId: userId?.toString(),
        filters,
        timestamp: new Date().toISOString(),
      });

      // ✅ INPUT VALIDATION: Safe filter parsing
      if (!userId) {
        console.warn(
          '⚠️ ActivityDataHelpers - No userId provided for monthly totals',
        );
        return {
          monthlyTotals: [],
          statistics: this.getEmptyStatistics(),
        };
      }

      const {
        year = new Date().getFullYear(),
        months = 12,
        includeProjections = false,
      } = filters;

      const targetYear = this.safeNumber(
        parseInt(year),
        new Date().getFullYear(),
      );
      const monthsToCalculate = this.safeNumber(parseInt(months), 12);

      console.log('🔍 ActivityDataHelpers - Processing monthly totals:', {
        userId: userId?.toString(),
        targetYear,
        monthsToCalculate,
        includeProjections,
      });

      // ✅ ENHANCED: Month-by-month calculation with Promise.all
      const monthlyTotals = [];
      const currentDate = new Date();

      // Build month calculations
      const monthCalculations = [];
      for (
        let monthOffset = monthsToCalculate - 1;
        monthOffset >= 0;
        monthOffset--
      ) {
        const monthDate = new Date(
          targetYear,
          currentDate.getMonth() - monthOffset,
          1,
        );
        const month = monthDate.getMonth() + 1;
        const year = monthDate.getFullYear();

        // Month date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        monthCalculations.push({
          month,
          year,
          startDate,
          endDate,
          daysInMonth: Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        });
      }

      // ✅ FIXED: Promise.all instead of await in loop
      const monthlyPerformancePromises = monthCalculations.map(calculation =>
        this.getDailyPerformance(userId, calculation.daysInMonth),
      );

      const monthlyPerformanceResults = await Promise.all(
        monthlyPerformancePromises,
      );

      // Process results
      monthCalculations.forEach((calculation, index) => {
        const dailyPerformance = monthlyPerformanceResults[index];

        // Filter daily performance for this specific month
        const monthlyDays = dailyPerformance.filter(day => {
          const dayDate = new Date(day.tarih);
          return (
            dayDate >= calculation.startDate && dayDate <= calculation.endDate
          );
        });

        // ✅ NaN PREVENTION: Safe monthly calculations
        const monthlyStats = this.calculateMonthlyStatistics(
          monthlyDays,
          calculation.month,
          calculation.year,
        );
        monthlyTotals.push(monthlyStats);
      });

      // ✅ ENHANCED: Overall statistics calculation
      const overallStatistics = this.calculateOverallStatistics(monthlyTotals);

      console.log('✅ ActivityDataHelpers - Monthly score totals calculated:', {
        userId: userId?.toString(),
        monthsCalculated: monthlyTotals.length,
        totalScore: overallStatistics.totalScore,
        avgMonthlyScore: overallStatistics.avgMonthlyScore,
      });

      return {
        monthlyTotals,
        statistics: overallStatistics,
        metadata: {
          calculatedAt: new Date().toISOString(),
          userId: userId.toString(),
          filters,
          hasNaNProtection: true,
        },
      };
    } catch (error) {
      console.error(
        '❌ ActivityDataHelpers - Error in getMonthlyScoreTotals:',
        {
          error: error.message,
          userId: userId?.toString(),
          filters,
        },
      );

      // ✅ PRESERVED: Safe fallback return
      return {
        monthlyTotals: [],
        statistics: this.getEmptyStatistics(),
      };
    }
  }

  /**
   * Calculate monthly statistics with NaN safety
   */
  static calculateMonthlyStatistics(monthlyDays, month, year) {
    const safeDays = monthlyDays || [];

    const totalScore = safeDays.reduce((sum, day) => {
      return sum + this.safeNumber(day.toplamPuan);
    }, 0);

    const totalTasks = safeDays.reduce((sum, day) => {
      return sum + this.safeNumber(day.gorevSayisi);
    }, 0);

    const activeDays = safeDays.filter(day => day.gorevSayisi > 0).length;
    const avgDailyScore =
      activeDays > 0 ? Math.round(totalScore / activeDays) : 0;
    const avgTasksPerDay =
      activeDays > 0 ? Math.round(totalTasks / activeDays) : 0;

    return {
      ay: month,
      yil: year,
      ayAdi: new Date(year, month - 1).toLocaleDateString('tr-TR', {
        month: 'long',
      }),
      toplamPuan: totalScore,
      toplamGorev: totalTasks,
      aktifGunSayisi: activeDays,
      ortalamaPuan: avgDailyScore,
      ortalamaGorevSayisi: avgTasksPerDay,
      gunlukDetaylar: safeDays,
      // ✅ NaN PREVENTION: Additional safety metrics
      metadata: {
        hasValidData: totalTasks > 0,
        calculationSafe: true,
        nanPrevented: true,
      },
    };
  }

  /**
   * Calculate overall statistics
   */
  static calculateOverallStatistics(monthlyTotals) {
    const safeMonths = monthlyTotals || [];

    const totalScore = safeMonths.reduce((sum, month) => {
      return sum + this.safeNumber(month.toplamPuan);
    }, 0);

    const totalTasks = safeMonths.reduce((sum, month) => {
      return sum + this.safeNumber(month.toplamGorev);
    }, 0);

    const activeMonths = safeMonths.filter(
      month => month.toplamGorev > 0,
    ).length;
    const avgMonthlyScore =
      activeMonths > 0 ? Math.round(totalScore / activeMonths) : 0;
    const avgMonthlyTasks =
      activeMonths > 0 ? Math.round(totalTasks / activeMonths) : 0;

    return {
      totalScore,
      totalTasks,
      activeMonths,
      avgMonthlyScore,
      avgMonthlyTasks,
      performanceTrend: this.calculateTrend(safeMonths),
      // ✅ NaN PREVENTION: Safety indicators
      hasValidData: totalTasks > 0,
      calculationSafe: true,
    };
  }

  /**
   * Calculate performance trend (simple month-over-month)
   */
  static calculateTrend(monthlyTotals) {
    if (!monthlyTotals || monthlyTotals.length < 2) {
      return 'stable';
    }

    const recentMonths = monthlyTotals.slice(-2);
    const [previousMonth, currentMonth] = recentMonths;

    const prevScore = this.safeNumber(previousMonth.ortalamaPuan);
    const currScore = this.safeNumber(currentMonth.ortalamaPuan);

    if (currScore > prevScore * 1.1) {
      return 'increasing';
    }
    if (currScore < prevScore * 0.9) {
      return 'decreasing';
    }
    return 'stable';
  }

  /**
   * Filter data by department
   *
   * PRESERVED FROM ORIGINAL: Department filtering logic
   */
  static filterByDepartment(data, _tip) {
    // ✅ PRESERVED: Original department filtering logic with safety
    if (!data || !Array.isArray(data)) {
      console.warn(
        '⚠️ ActivityDataHelpers - Invalid data for department filtering',
      );
      return [];
    }

    return data.filter(item => {
      // ✅ NaN PREVENTION: Safe property access with null checks
      if (!item || typeof item !== 'object') {
        return false;
      }

      const department = item.departman?.ad || item.kullanici?.departman?.ad;
      return (
        department &&
        typeof department === 'string' &&
        department.trim().length > 0
      );
    });
  }

  /**
   * Calculate comprehensive activity statistics
   */
  static calculateActivityStatistics(activities) {
    // ✅ NaN PREVENTION: Safe input validation
    const safeActivities = activities || [];

    if (safeActivities.length === 0) {
      return this.getEmptyStatistics();
    }

    const stats = {
      totalActivities: safeActivities.length,
      totalScore: 0,
      avgScore: 0,
      categoryBreakdown: {},
      typeBreakdown: {},
      performanceGrade: 'C',
    };

    // ✅ NaN PREVENTION: Safe accumulation with null checks
    safeActivities.forEach(activity => {
      // Skip null/undefined activities
      if (!activity || typeof activity !== 'object') {
        return;
      }

      const score = this.safeNumber(activity.toplamPuan || activity.puan);
      stats.totalScore += score;

      // Category breakdown
      const category = activity.kategori || 'Diğer';
      if (!stats.categoryBreakdown[category]) {
        stats.categoryBreakdown[category] = {
          count: 0,
          totalScore: 0,
          avgScore: 0,
        };
      }
      stats.categoryBreakdown[category].count += 1;
      stats.categoryBreakdown[category].totalScore += score;

      // Type breakdown
      const type = activity.tip || 'unknown';
      if (!stats.typeBreakdown[type]) {
        stats.typeBreakdown[type] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      stats.typeBreakdown[type].count += 1;
      stats.typeBreakdown[type].totalScore += score;
    });

    // ✅ NaN PREVENTION: Safe average calculations
    stats.avgScore =
      stats.totalActivities > 0
        ? Math.round(stats.totalScore / stats.totalActivities)
        : 0;

    // Calculate averages for breakdowns
    Object.keys(stats.categoryBreakdown).forEach(category => {
      const cat = stats.categoryBreakdown[category];
      cat.avgScore = cat.count > 0 ? Math.round(cat.totalScore / cat.count) : 0;
    });

    Object.keys(stats.typeBreakdown).forEach(type => {
      const typeData = stats.typeBreakdown[type];
      typeData.avgScore =
        typeData.count > 0
          ? Math.round(typeData.totalScore / typeData.count)
          : 0;
    });

    // Performance grade calculation
    if (stats.avgScore >= 80) {
      stats.performanceGrade = 'A';
    } else if (stats.avgScore >= 60) {
      stats.performanceGrade = 'B';
    } else if (stats.avgScore >= 40) {
      stats.performanceGrade = 'C';
    } else {
      stats.performanceGrade = 'D';
    }

    return stats;
  }

  /**
   * Utility: Safe number conversion (NaN prevention)
   */
  static safeNumber(value, defaultValue = 0) {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  }

  /**
   * Utility: Get empty statistics structure
   */
  static getEmptyStatistics() {
    return {
      totalScore: 0,
      totalTasks: 0,
      activeMonths: 0,
      avgMonthlyScore: 0,
      avgMonthlyTasks: 0,
      performanceTrend: 'stable',
      hasValidData: false,
      calculationSafe: true,
    };
  }
}

module.exports = ActivityDataHelpers;
