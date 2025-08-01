const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
} = require('date-fns');
const { tr } = require('date-fns/locale');

/**
 * 📊 MMM95 Analytics Service
 * Meeting, Task ve User analytics için data processing
 */
class AnalyticsService {
  /**
   * 📅 Meeting Analytics - Overview
   */
  async getMeetingAnalytics(options = {}) {
    try {
      const {
        dateFrom = subDays(new Date(), 30),
        dateTo = new Date(),
        departmentId = null,
        organizatorId = null,
      } = options;

      // Base query filters
      const baseQuery = {
        tarih: { $gte: dateFrom, $lte: dateTo },
        silindiMi: false,
      };

      if (departmentId) {
        baseQuery.departman = departmentId;
      }
      if (organizatorId) {
        baseQuery.organizator = organizatorId;
      }

      // Parallel aggregation queries
      const [
        totalMeetings,
        meetingsByStatus,
        meetingsByCategory,
        meetingsByDepartment,
        averageDuration,
        participationRates,
        monthlyTrend,
      ] = await Promise.all([
        // Total meetings count
        Meeting.countDocuments(baseQuery),

        // Meetings by status
        Meeting.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$durum', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Meetings by category
        Meeting.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$kategori', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Meetings by department
        Meeting.aggregate([
          { $match: baseQuery },
          {
            $lookup: {
              from: 'departments',
              localField: 'departman',
              foreignField: '_id',
              as: 'dept',
            },
          },
          { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
          { $group: { _id: '$dept.ad', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),

        // Average meeting duration
        Meeting.aggregate([
          { $match: { ...baseQuery, toplamSure: { $exists: true, $gt: 0 } } },
          { $group: { _id: null, avgDuration: { $avg: '$toplamSure' } } },
        ]),

        // Participation rates
        Meeting.aggregate([
          { $match: baseQuery },
          {
            $addFields: {
              totalInvited: { $size: '$katilimcilar' },
              totalAttended: {
                $size: {
                  $filter: {
                    input: '$katilimcilar',
                    cond: { $eq: ['$$this.katilimDurumu', 'katıldı'] },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              avgInvited: { $avg: '$totalInvited' },
              avgAttended: { $avg: '$totalAttended' },
              totalInvited: { $sum: '$totalInvited' },
              totalAttended: { $sum: '$totalAttended' },
            },
          },
        ]),

        // Monthly trend (last 6 months)
        Meeting.aggregate([
          {
            $match: {
              tarih: { $gte: subDays(new Date(), 180), $lte: new Date() },
              silindiMi: false,
            },
          },
          {
            $addFields: {
              month: { $dateToString: { format: '%Y-%m', date: '$tarih' } },
            },
          },
          {
            $group: {
              _id: '$month',
              meetings: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$durum', 'tamamlandı'] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 6 },
        ]),
      ]);

      return {
        overview: {
          totalMeetings,
          averageDuration: averageDuration[0]?.avgDuration || 0,
          completionRate: this.calculateCompletionRate(meetingsByStatus),
          participationRate: this.calculateParticipationRate(
            participationRates[0],
          ),
        },
        charts: {
          statusDistribution: meetingsByStatus,
          categoryDistribution: meetingsByCategory,
          departmentDistribution: meetingsByDepartment,
          monthlyTrend: monthlyTrend.map(item => ({
            month: format(new Date(item._id + '-01'), 'MMM yyyy', {
              locale: tr,
            }),
            meetings: item.meetings,
            completed: item.completed,
            completionRate:
              item.meetings > 0
                ? Math.round((item.completed / item.meetings) * 100)
                : 0,
          })),
        },
        period: {
          from: dateFrom,
          to: dateTo,
          days: Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24)),
        },
      };
    } catch (error) {
      console.error('❌ Meeting analytics error:', error);
      throw error;
    }
  }

  /**
   * 📋 Task Analytics - Performance metrics
   */
  async getTaskAnalytics(options = {}) {
    try {
      const {
        dateFrom = subDays(new Date(), 30),
        dateTo = new Date(),
        departmentId = null,
        assigneeId = null,
        meetingOnly = false,
      } = options;

      const baseQuery = {
        olusturmaTarihi: { $gte: dateFrom, $lte: dateTo },
        silindiMi: false,
      };

      if (departmentId) {
        baseQuery.departman = departmentId;
      }
      if (assigneeId) {
        baseQuery.kullanici = assigneeId;
      }
      if (meetingOnly) {
        baseQuery.meetingGoreviMi = true;
      }

      const [
        totalTasks,
        tasksByStatus,
        tasksByPriority,
        completionTime,
        overdueCount,
        tasksByUser,
        meetingTasks,
      ] = await Promise.all([
        // Total tasks
        Task.countDocuments(baseQuery),

        // Tasks by status
        Task.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$durum', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Tasks by priority
        Task.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$oncelik', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Average completion time
        Task.aggregate([
          {
            $match: {
              ...baseQuery,
              durum: 'tamamlandi',
              tamamlanmaTarihi: { $exists: true },
            },
          },
          {
            $addFields: {
              completionDays: {
                $divide: [
                  { $subtract: ['$tamamlanmaTarihi', '$olusturmaTarihi'] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
          { $group: { _id: null, avgDays: { $avg: '$completionDays' } } },
        ]),

        // Overdue tasks
        Task.countDocuments({
          ...baseQuery,
          durum: { $nin: ['tamamlandi', 'iptal'] },
          teslimTarihi: { $lt: new Date() },
        }),

        // Top performers
        Task.aggregate([
          { $match: { ...baseQuery, durum: 'tamamlandi' } },
          {
            $lookup: {
              from: 'users',
              localField: 'kullanici',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $group: {
              _id: '$kullanici',
              userName: {
                $first: { $concat: ['$user.ad', ' ', '$user.soyad'] },
              },
              completed: { $sum: 1 },
            },
          },
          { $sort: { completed: -1 } },
          { $limit: 10 },
        ]),

        // Meeting-generated tasks
        Task.countDocuments({ ...baseQuery, meetingGoreviMi: true }),
      ]);

      return {
        overview: {
          totalTasks,
          completedTasks: this.getStatusCount(tasksByStatus, 'tamamlandi'),
          overdueCount,
          meetingTasks,
          completionRate: this.calculateTaskCompletionRate(tasksByStatus),
          averageCompletionTime: completionTime[0]?.avgDays || 0,
        },
        charts: {
          statusDistribution: tasksByStatus,
          priorityDistribution: tasksByPriority,
          topPerformers: tasksByUser.slice(0, 5),
        },
        period: {
          from: dateFrom,
          to: dateTo,
          days: Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24)),
        },
      };
    } catch (error) {
      console.error('❌ Task analytics error:', error);
      throw error;
    }
  }

  /**
   * 👥 User & Department Analytics
   */
  async getUserAnalytics(options = {}) {
    try {
      const { dateFrom = subDays(new Date(), 30), dateTo = new Date() } =
        options;

      const [
        totalUsers,
        activeUsers,
        departmentStats,
        userActivity,
        meetingOrganizers,
      ] = await Promise.all([
        // Total users
        User.countDocuments({ aktif: true }),

        // Active users (with recent activity)
        User.countDocuments({
          aktif: true,
          sonGiris: { $gte: subDays(new Date(), 7) },
        }),

        // Department statistics
        Department.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: 'departman',
              as: 'users',
            },
          },
          { $addFields: { userCount: { $size: '$users' } } },
          { $project: { ad: 1, userCount: 1 } },
          { $sort: { userCount: -1 } },
        ]),

        // User activity (meetings organized, tasks completed)
        User.aggregate([
          { $match: { aktif: true } },
          {
            $lookup: {
              from: 'meetings',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$organizator', '$$userId'] },
                    tarih: { $gte: dateFrom, $lte: dateTo },
                    silindiMi: false,
                  },
                },
              ],
              as: 'organizedMeetings',
            },
          },
          {
            $lookup: {
              from: 'tasks',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$kullanici', '$$userId'] },
                    olusturmaTarihi: { $gte: dateFrom, $lte: dateTo },
                    durum: 'tamamlandi',
                    silindiMi: false,
                  },
                },
              ],
              as: 'completedTasks',
            },
          },
          {
            $addFields: {
              meetingsOrganized: { $size: '$organizedMeetings' },
              tasksCompleted: { $size: '$completedTasks' },
              activityScore: {
                $add: [
                  { $multiply: [{ $size: '$organizedMeetings' }, 2] },
                  { $size: '$completedTasks' },
                ],
              },
            },
          },
          { $match: { activityScore: { $gt: 0 } } },
          {
            $project: {
              name: { $concat: ['$ad', ' ', '$soyad'] },
              meetingsOrganized: 1,
              tasksCompleted: 1,
              activityScore: 1,
            },
          },
          { $sort: { activityScore: -1 } },
          { $limit: 10 },
        ]),

        // Top meeting organizers
        Meeting.aggregate([
          {
            $match: {
              tarih: { $gte: dateFrom, $lte: dateTo },
              silindiMi: false,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'organizator',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $group: {
              _id: '$organizator',
              name: { $first: { $concat: ['$user.ad', ' ', '$user.soyad'] } },
              meetingsOrganized: { $sum: 1 },
              completedMeetings: {
                $sum: { $cond: [{ $eq: ['$durum', 'tamamlandı'] }, 1, 0] },
              },
            },
          },
          { $sort: { meetingsOrganized: -1 } },
          { $limit: 5 },
        ]),
      ]);

      return {
        overview: {
          totalUsers,
          activeUsers,
          activityRate:
            totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        },
        charts: {
          departmentDistribution: departmentStats,
          userActivity: userActivity.slice(0, 8),
          topOrganizers: meetingOrganizers,
        },
        period: {
          from: dateFrom,
          to: dateTo,
          days: Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24)),
        },
      };
    } catch (error) {
      console.error('❌ User analytics error:', error);
      throw error;
    }
  }

  /**
   * 🔔 Notification Analytics
   */
  async getNotificationAnalytics(options = {}) {
    try {
      const { dateFrom = subDays(new Date(), 7), dateTo = new Date() } =
        options;

      const [
        totalNotifications,
        notificationsByType,
        deliveryStats,
        readRates,
      ] = await Promise.all([
        // Total notifications
        Notification.countDocuments({
          olusturmaTarihi: { $gte: dateFrom, $lte: dateTo },
        }),

        // Notifications by type
        Notification.aggregate([
          { $match: { olusturmaTarihi: { $gte: dateFrom, $lte: dateTo } } },
          { $group: { _id: '$tip', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Delivery statistics
        Notification.aggregate([
          { $match: { olusturmaTarihi: { $gte: dateFrom, $lte: dateTo } } },
          { $group: { _id: '$gonderimDurumu', count: { $sum: 1 } } },
        ]),

        // Read rates
        Notification.aggregate([
          { $match: { olusturmaTarihi: { $gte: dateFrom, $lte: dateTo } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              read: { $sum: { $cond: ['$okundu', 1, 0] } },
            },
          },
        ]),
      ]);

      const readRate = readRates[0]
        ? Math.round((readRates[0].read / readRates[0].total) * 100)
        : 0;

      return {
        overview: {
          totalNotifications,
          readRate,
          deliveredRate: this.calculateDeliveryRate(deliveryStats),
        },
        charts: {
          typeDistribution: notificationsByType,
          deliveryStats,
        },
        period: {
          from: dateFrom,
          to: dateTo,
          days: Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24)),
        },
      };
    } catch (error) {
      console.error('❌ Notification analytics error:', error);
      throw error;
    }
  }

  /**
   * 📊 Dashboard Summary - Quick overview
   */
  async getDashboardSummary(userId = null) {
    try {
      const last30Days = subDays(new Date(), 30);
      const last7Days = subDays(new Date(), 7);

      const [recentMeetings, upcomingMeetings, pendingTasks, recentActivity] =
        await Promise.all([
          // Recent meetings (last 30 days)
          Meeting.countDocuments({
            tarih: { $gte: last30Days },
            silindiMi: false,
            ...(userId && { organizator: userId }),
          }),

          // Upcoming meetings (next 7 days)
          Meeting.countDocuments({
            tarih: { $gte: new Date(), $lte: subDays(new Date(), -7) },
            durum: { $nin: ['tamamlandı', 'iptal'] },
            silindiMi: false,
            ...(userId && { organizator: userId }),
          }),

          // Pending tasks
          Task.countDocuments({
            durum: { $nin: ['tamamlandi', 'iptal'] },
            silindiMi: false,
            ...(userId && { kullanici: userId }),
          }),

          // Recent activity
          Meeting.aggregate([
            {
              $match: {
                tarih: { $gte: last7Days },
                silindiMi: false,
                ...(userId && { organizator: userId }),
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'organizator',
                foreignField: '_id',
                as: 'org',
              },
            },
            { $unwind: '$org' },
            {
              $project: {
                baslik: 1,
                tarih: 1,
                durum: 1,
                organizator: { $concat: ['$org.ad', ' ', '$org.soyad'] },
              },
            },
            { $sort: { tarih: -1 } },
            { $limit: 5 },
          ]),
        ]);

      return {
        summary: {
          recentMeetings,
          upcomingMeetings,
          pendingTasks,
        },
        recentActivity,
      };
    } catch (error) {
      console.error('❌ Dashboard summary error:', error);
      throw error;
    }
  }

  // Helper methods
  calculateCompletionRate(statusData) {
    const total = statusData.reduce((sum, item) => sum + item.count, 0);
    const completed =
      statusData.find(item => item._id === 'tamamlandı')?.count || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  calculateParticipationRate(data) {
    if (!data || !data.totalInvited || data.totalInvited === 0) {
      return 0;
    }
    return Math.round((data.totalAttended / data.totalInvited) * 100);
  }

  calculateTaskCompletionRate(statusData) {
    const total = statusData.reduce((sum, item) => sum + item.count, 0);
    const completed =
      statusData.find(item => item._id === 'tamamlandi')?.count || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  calculateDeliveryRate(deliveryStats) {
    const total = deliveryStats.reduce((sum, item) => sum + item.count, 0);
    const delivered =
      deliveryStats.find(item => item._id === 'gonderildi')?.count || 0;
    return total > 0 ? Math.round((delivered / total) * 100) : 0;
  }

  getStatusCount(statusData, status) {
    return statusData.find(item => item._id === status)?.count || 0;
  }
}

// Export singleton instance
module.exports = new AnalyticsService();
