/**
 * Daily Performance Helper Module
 * Extracted from myActivityHelpers.js for better modularity
 *
 * Handles:
 * - Daily performance calculations
 * - Day score calculations
 * - Performance analytics
 */

const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');

class DailyPerformanceHelpers {
  /**
   * Get daily performance data for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Promise<Object>} Daily performance data
   */
  static async getDailyPerformance(userId, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(String(days)));

      const dayPromises = Array.from(
        { length: parseInt(String(days)) },
        (_, i) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);

          return this.getDayPerformanceData(userId, currentDate);
        },
      );

      const dayResults = await Promise.all(dayPromises);

      return {
        userId,
        days: parseInt(String(days)),
        startDate,
        endDate,
        dailyData: dayResults,
        summary: this.calculatePerformanceSummary(dayResults),
      };
    } catch (error) {
      console.error('Error in getDailyPerformance:', error);
      throw error;
    }
  }

  /**
   * Get performance data for a specific day
   * @param {string} userId - User ID
   * @param {Date} date - Target date
   * @returns {Promise<Object>} Day performance data
   */
  static async getDayPerformanceData(userId, date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const [dayTasks, dayWorkTasks] = await Promise.all([
      Task.find({
        atananKullanici: userId,
        tamamlanmaTarihi: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        durum: 'Tamamlandı',
      }),

      WorkTask.find({
        $or: [
          { usta: userId },
          { operatorler: userId },
          { vardiyaAmiri: userId },
        ],
        tamamlanmaTarihi: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        durum: 'Tamamlandı',
      }),
    ]);

    return this.calculateDayScores(date, dayTasks, dayWorkTasks);
  }

  /**
   * Calculate scores for a specific day
   * @param {Date} date - Target date
   * @param {Array} dayTasks - Tasks for the day
   * @param {Array} dayWorkTasks - Work tasks for the day
   * @returns {Object} Day score data
   */
  static calculateDayScores(date, dayTasks, dayWorkTasks) {
    const taskScore = dayTasks.reduce((total, task) => {
      return total + (task.puan || 0);
    }, 0);

    const workTaskScore = dayWorkTasks.reduce((total, workTask) => {
      return total + (workTask.toplamPuan || 0);
    }, 0);

    return {
      date: date.toISOString().split('T')[0],
      taskCount: dayTasks.length,
      workTaskCount: dayWorkTasks.length,
      taskScore,
      workTaskScore,
      totalScore: taskScore + workTaskScore,
      tasks: dayTasks.map(task => ({
        id: task._id,
        baslik: task.baslik,
        puan: task.puan,
        tamamlanmaTarihi: task.tamamlanmaTarihi,
      })),
      workTasks: dayWorkTasks.map(workTask => ({
        id: workTask._id,
        makina: workTask.makina,
        toplamPuan: workTask.toplamPuan,
        tamamlanmaTarihi: workTask.tamamlanmaTarihi,
      })),
    };
  }

  /**
   * Calculate summary statistics for performance data
   * @param {Array} dailyData - Array of daily performance data
   * @returns {Object} Performance summary
   */
  static calculatePerformanceSummary(dailyData) {
    const totalDays = dailyData.length;
    const activeDays = dailyData.filter(day => day.totalScore > 0).length;

    const totalScore = dailyData.reduce((sum, day) => sum + day.totalScore, 0);
    const totalTasks = dailyData.reduce((sum, day) => sum + day.taskCount, 0);
    const totalWorkTasks = dailyData.reduce(
      (sum, day) => sum + day.workTaskCount,
      0,
    );

    const averageScorePerDay = totalDays > 0 ? totalScore / totalDays : 0;
    const averageTasksPerDay = totalDays > 0 ? totalTasks / totalDays : 0;

    return {
      totalDays,
      activeDays,
      activityRate: totalDays > 0 ? (activeDays / totalDays) * 100 : 0,
      totalScore,
      totalTasks,
      totalWorkTasks,
      averageScorePerDay: Math.round(averageScorePerDay * 100) / 100,
      averageTasksPerDay: Math.round(averageTasksPerDay * 100) / 100,
      bestDay: this.findBestDay(dailyData),
      consistency: this.calculateConsistency(dailyData),
    };
  }

  /**
   * Find the best performing day
   * @param {Array} dailyData - Daily performance data
   * @returns {Object} Best day data
   */
  static findBestDay(dailyData) {
    if (dailyData.length === 0) {
      return null;
    }

    return dailyData.reduce((best, current) => {
      return current.totalScore > best.totalScore ? current : best;
    });
  }

  /**
   * Calculate performance consistency score
   * @param {Array} dailyData - Daily performance data
   * @returns {number} Consistency score (0-100)
   */
  static calculateConsistency(dailyData) {
    if (dailyData.length < 2) {
      return 100;
    }

    const scores = dailyData.map(day => day.totalScore);
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (average === 0) {
      return 100;
    }

    const variance =
      scores.reduce((sum, score) => {
        return sum + Math.pow(score - average, 2);
      }, 0) / scores.length;

    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / average;

    // Convert to consistency score (lower variation = higher consistency)
    return Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));
  }
}

module.exports = DailyPerformanceHelpers;
