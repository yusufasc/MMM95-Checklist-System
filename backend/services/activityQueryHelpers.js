/**
 * Activity Query Helper Module
 * Extracted from myActivityHelpers.js for better modularity
 *
 * Handles:
 * - Complex activity queries with filters
 * - Multi-model data aggregation
 * - Activity pagination and filtering
 */

const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const HRScore = require('../models/HRScore');
const BonusEvaluation = require('../models/BonusEvaluation');
const ControlScore = require('../models/ControlScore');
const KalipDegisimEvaluation = require('../models/KalipDegisimEvaluation');

class ActivityQueryHelpers {
  /**
   * Get detailed activity list with pagination and filtering
   * @param {string} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Paginated activity data
   */
  static async getDetailedActivities(userId, filters) {
    const { page = 1, limit = 20, durum, tarih, month, year } = filters;
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const skip = (pageNum - 1) * limitNum;

    // Build date filters
    const dateFilters = this.buildDateFilters(tarih, month, year);
    const { dateFilter, qualityDateFilter, hrDateFilter } = dateFilters;

    try {
      // Execute parallel queries for all activity types
      const [
        scoredChecklistTasks,
        scoredWorkTasks,
        qualityEvaluations,
        hrScores,
        bonusEvaluations,
        kalipDegisimEvaluations,
        controlScores,
      ] = await Promise.all([
        this.getChecklistTasks(userId, dateFilter, durum),
        this.getWorkTasks(userId, dateFilter, durum),
        this.getQualityEvaluations(userId, qualityDateFilter),
        this.getHRScores(userId, hrDateFilter),
        this.getBonusEvaluations(userId, dateFilter),
        this.getKalipDegisimEvaluations(userId, dateFilter),
        this.getControlScores(userId, dateFilter),
      ]);

      // Combine and process results
      const combinedData = {
        scoredChecklistTasks,
        scoredWorkTasks,
        qualityEvaluations,
        hrScores,
        bonusEvaluations,
        kalipDegisimEvaluations,
        controlScores,
      };

      // Apply department filtering if specified
      const filteredData = filters.tip
        ? this.filterByDepartment(combinedData, filters.tip)
        : combinedData;

      // Flatten and paginate results
      const flattenedResults = this.flattenActivityData(filteredData);
      const sortedResults = this.sortActivitiesByDate(flattenedResults);

      const totalCount = sortedResults.length;
      const paginatedResults = sortedResults.slice(skip, skip + limitNum);

      return {
        activities: paginatedResults,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
          hasPrevPage: pageNum > 1,
        },
        summary: this.generateSummary(combinedData),
        filters: filters,
      };
    } catch (error) {
      console.error('Error in getDetailedActivities:', error);
      throw error;
    }
  }

  /**
   * Build date filters for different model types
   * @param {string} tarih - Specific date
   * @param {number} month - Month filter
   * @param {number} year - Year filter
   * @returns {Object} Date filter objects
   */
  static buildDateFilters(tarih, month, year) {
    let dateFilter = {};
    let qualityDateFilter = {};
    let hrDateFilter = {};

    if (tarih) {
      const startDate = new Date(tarih);
      const endDate = new Date(tarih);
      endDate.setDate(endDate.getDate() + 1);

      dateFilter = {
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
      };
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      dateFilter = {
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
      };

      qualityDateFilter = {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { degerlendirmeTarihi: { $gte: startDate, $lte: endDate } },
        ],
      };

      hrDateFilter = {
        $or: [
          { 'checklistPuanlari.tarih': { $gte: startDate, $lte: endDate } },
          { 'mesaiKayitlari.tarih': { $gte: startDate, $lte: endDate } },
          { 'devamsizlikKayitlari.tarih': { $gte: startDate, $lte: endDate } },
        ],
      };
    } else {
      // Default: last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      dateFilter = {
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
      };
    }

    return { dateFilter, qualityDateFilter, hrDateFilter };
  }

  /**
   * Get checklist tasks for user
   */
  static async getChecklistTasks(userId, dateFilter, durum) {
    const query = { atananKullanici: userId, ...dateFilter };
    if (durum) {
      query.durum = durum;
    }

    return Task.find(query)
      .populate('sablon', 'ad aciklama')
      .populate('makina', 'ad')
      .populate('atananKullanici', 'ad soyad kullaniciAdi')
      .sort({ tamamlanmaTarihi: -1 });
  }

  /**
   * Get work tasks for user
   */
  static async getWorkTasks(userId, dateFilter, durum) {
    const query = {
      $or: [
        { usta: userId },
        { operatorler: userId },
        { vardiyaAmiri: userId },
      ],
      ...dateFilter,
    };
    if (durum) {
      query.durum = durum;
    }

    return WorkTask.find(query)
      .populate('makina', 'ad')
      .populate('usta', 'ad soyad kullaniciAdi')
      .populate('operatorler', 'ad soyad kullaniciAdi')
      .populate('vardiyaAmiri', 'ad soyad kullaniciAdi')
      .sort({ tamamlanmaTarihi: -1 });
  }

  /**
   * Get quality evaluations for user
   */
  static async getQualityEvaluations(userId, qualityDateFilter) {
    return QualityControlEvaluation.find({
      degerlendirenKullanici: userId,
      ...qualityDateFilter,
    })
      .populate('sablon', 'ad')
      .populate('workTask')
      .populate('degerlendirenKullanici', 'ad soyad')
      .sort({ createdAt: -1 });
  }

  /**
   * Get HR scores for user
   */
  static async getHRScores(userId, hrDateFilter) {
    return HRScore.find({
      kullanici: userId,
      ...hrDateFilter,
    })
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .sort({ createdAt: -1 });
  }

  /**
   * Get bonus evaluations for user
   */
  static async getBonusEvaluations(userId, dateFilter) {
    return BonusEvaluation.find({
      degerlendirenKullanici: userId,
      degerlendirmeTarihi: dateFilter.tamamlanmaTarihi,
    })
      .populate('sablon', 'ad bonusKategorisi')
      .populate('degerlendirenKullanici', 'ad soyad')
      .populate('departman', 'ad')
      .sort({ degerlendirmeTarihi: -1 });
  }

  /**
   * Get Kalıp Değişim evaluations for user
   */
  static async getKalipDegisimEvaluations(userId, dateFilter) {
    return KalipDegisimEvaluation.find({
      $or: [{ anaCalisan: userId }, { buddyCalisan: userId }],
      degerlendirmeTarihi: dateFilter.tamamlanmaTarihi,
    })
      .populate('checklistTemplate', 'ad aciklama')
      .populate('workTask', 'makina usta kalipDegisimBuddy')
      .populate('degerlendiren', 'ad soyad')
      .populate('anaCalisan', 'ad soyad kullaniciAdi')
      .populate('buddyCalisan', 'ad soyad kullaniciAdi')
      .sort({ degerlendirmeTarihi: -1 });
  }

  /**
   * Get control scores for user
   */
  static async getControlScores(userId, dateFilter) {
    return ControlScore.find({
      puanlayanKullanici: userId,
      puanlamaTarihi: dateFilter.tamamlanmaTarihi,
      aktif: true,
    })
      .populate('puanlananKullanici', 'ad soyad kullaniciAdi')
      .populate('sablon', 'ad')
      .sort({ puanlamaTarihi: -1 });
  }

  /**
   * Filter activities by department
   */
  static filterByDepartment(data, tip) {
    // Apply department-specific filtering logic
    // This is a placeholder for department filtering
    return data;
  }

  /**
   * Flatten activity data into a single array
   */
  static flattenActivityData(data) {
    const activities = [];

    // Add tasks
    data.scoredChecklistTasks?.forEach(task => {
      activities.push({
        type: 'checklist_task',
        id: task._id,
        title: task.baslik,
        date: task.tamamlanmaTarihi,
        score: task.puan,
        status: task.durum,
        data: task,
      });
    });

    // Add work tasks
    data.scoredWorkTasks?.forEach(workTask => {
      activities.push({
        type: 'work_task',
        id: workTask._id,
        title: `${workTask.makina?.ad || 'İş Görevi'}`,
        date: workTask.tamamlanmaTarihi,
        score: workTask.toplamPuan,
        status: workTask.durum,
        data: workTask,
      });
    });

    // Add quality evaluations
    data.qualityEvaluations?.forEach(evaluation => {
      activities.push({
        type: 'quality_evaluation',
        id: evaluation._id,
        title: evaluation.sablon?.ad || 'Kalite Kontrolü',
        date: evaluation.createdAt,
        score: evaluation.toplamPuan,
        status: 'completed',
        data: evaluation,
      });
    });

    // Add other activity types...

    return activities;
  }

  /**
   * Sort activities by date (descending)
   */
  static sortActivitiesByDate(activities) {
    return activities.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Generate activity summary statistics
   */
  static generateSummary(data) {
    return {
      totalTasks: data.scoredChecklistTasks?.length || 0,
      totalWorkTasks: data.scoredWorkTasks?.length || 0,
      totalQualityEvaluations: data.qualityEvaluations?.length || 0,
      totalBonusEvaluations: data.bonusEvaluations?.length || 0,
      totalActivities: Object.values(data).reduce((total, arr) => {
        return total + (Array.isArray(arr) ? arr.length : 0);
      }, 0),
    };
  }
}

module.exports = ActivityQueryHelpers;
