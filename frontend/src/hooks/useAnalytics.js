import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * 📊 useAnalytics Hook
 * Analytics data management ve dashboard metrics
 */
export const useAnalytics = () => {
  const { user } = useAuth();
  const userRole = user?.rol;

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Analytics data
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [meetingAnalytics, setMeetingAnalytics] = useState(null);
  const [taskAnalytics, setTaskAnalytics] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [notificationAnalytics, setNotificationAnalytics] = useState(null);

  // Filters and options
  const [filters, setFilters] = useState({
    period: '30d', // 7d, 30d, 90d, 1y
    dateFrom: null,
    dateTo: null,
    departmentId: null,
    organizatorId: null,
    assigneeId: null,
    personal: false,
  });

  /**
   * 📊 Load Dashboard Summary
   */
  const loadDashboardSummary = useCallback(async (personal = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.analytics.getDashboardSummary(personal);
      setDashboardSummary(response.data.data);

      return response.data.data;
    } catch (err) {
      console.error('Dashboard summary error:', err);
      setError('Dashboard verileri yüklenemedi');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 📅 Load Meeting Analytics
   */
  const loadMeetingAnalytics = useCallback(
    async (customFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = { ...filters, ...customFilters };
        const response = await api.analytics.getMeetingAnalytics(params);
        setMeetingAnalytics(response.data.data);

        return response.data.data;
      } catch (err) {
        console.error('Meeting analytics error:', err);
        setError('Meeting analitikleri yüklenemedi');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  /**
   * 📋 Load Task Analytics
   */
  const loadTaskAnalytics = useCallback(
    async (customFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = { ...filters, ...customFilters };
        const response = await api.analytics.getTaskAnalytics(params);
        setTaskAnalytics(response.data.data);

        return response.data.data;
      } catch (err) {
        console.error('Task analytics error:', err);
        setError('Task analitikleri yüklenemedi');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  /**
   * 👥 Load User Analytics (Admin/Manager only)
   */
  const loadUserAnalytics = useCallback(
    async (customFilters = {}) => {
      try {
        // Check permission
        if (!['Admin', 'Departman Yöneticisi'].includes(userRole)) {
          throw new Error('Bu analitikleri görme yetkiniz yok');
        }

        setLoading(true);
        setError(null);

        const params = { ...filters, ...customFilters };
        const response = await api.analytics.getUserAnalytics(params);
        setUserAnalytics(response.data.data);

        return response.data.data;
      } catch (err) {
        console.error('User analytics error:', err);
        setError('Kullanıcı analitikleri yüklenemedi');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters, userRole],
  );

  /**
   * 🔔 Load Notification Analytics (Admin only)
   */
  const loadNotificationAnalytics = useCallback(
    async (customFilters = {}) => {
      try {
        // Check permission
        if (userRole !== 'Admin') {
          throw new Error('Sadece admin bu analitikleri görebilir');
        }

        setLoading(true);
        setError(null);

        const params = { ...filters, ...customFilters };
        const response = await api.analytics.getNotificationAnalytics(params);
        setNotificationAnalytics(response.data.data);

        return response.data.data;
      } catch (err) {
        console.error('Notification analytics error:', err);
        setError('Bildirim analitikleri yüklenemedi');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters, userRole],
  );

  /**
   * 📤 Export Analytics
   */
  const exportAnalytics = useCallback(
    async (type = 'meetings', format = 'json') => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          type,
          format,
          period: filters.period,
          ...filters,
        };

        const response = await api.analytics.exportAnalytics(params);

        if (format === 'json') {
          // For JSON export, return data
          return response.data;
        } else {
          // For future file downloads (PDF, Excel)
          // Will be implemented later
          throw new Error('Bu format henüz desteklenmiyor');
        }
      } catch (err) {
        console.error('Export analytics error:', err);
        setError('Analytics export edilemedi');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  /**
   * 🔧 Update Filters
   */
  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * 🔄 Refresh All Data
   */
  const refreshAll = useCallback(async () => {
    try {
      const promises = [];

      // Always load dashboard summary
      promises.push(loadDashboardSummary(filters.personal));

      // Load other analytics based on permissions
      if (user) {
        promises.push(loadMeetingAnalytics());
        promises.push(loadTaskAnalytics());

        if (['Admin', 'Departman Yöneticisi'].includes(user.rol)) {
          promises.push(loadUserAnalytics());
        }

        if (user.rol === 'Admin') {
          promises.push(loadNotificationAnalytics());
        }
      }

      await Promise.all(promises);
    } catch (err) {
      console.error('Refresh all analytics error:', err);
    }
  }, [
    loadDashboardSummary,
    loadMeetingAnalytics,
    loadTaskAnalytics,
    loadUserAnalytics,
    loadNotificationAnalytics,
    filters.personal,
    user,
  ]);

  /**
   * 📊 Get Chart Data Formatted
   */
  const getChartData = useCallback(
    (type, chartType) => {
      switch (type) {
        case 'meetings':
          if (!meetingAnalytics?.charts) {
            return [];
          }

          switch (chartType) {
            case 'status':
              return (
                meetingAnalytics.charts.statusDistribution?.map(item => ({
                  name: item._id,
                  value: item.count,
                  label:
                    item._id === 'tamamlandı'
                      ? 'Tamamlandı'
                      : item._id === 'planlanıyor'
                        ? 'Planlanıyor'
                        : item._id === 'devam-ediyor'
                          ? 'Devam Ediyor'
                          : item._id === 'iptal'
                            ? 'İptal'
                            : item._id,
                })) || []
              );

            case 'category':
              return (
                meetingAnalytics.charts.categoryDistribution?.map(item => ({
                  name: item._id,
                  value: item.count,
                  label: item._id,
                })) || []
              );

            case 'monthly':
              return meetingAnalytics.charts.monthlyTrend || [];

            default:
              return [];
          }

        case 'tasks':
          if (!taskAnalytics?.charts) {
            return [];
          }

          switch (chartType) {
            case 'status':
              return (
                taskAnalytics.charts.statusDistribution?.map(item => ({
                  name: item._id,
                  value: item.count,
                  label:
                    item._id === 'tamamlandi'
                      ? 'Tamamlandı'
                      : item._id === 'bekliyor'
                        ? 'Bekliyor'
                        : item._id === 'baslatildi'
                          ? 'Başlatıldı'
                          : item._id === 'iptal'
                            ? 'İptal'
                            : item._id,
                })) || []
              );

            case 'priority':
              return (
                taskAnalytics.charts.priorityDistribution?.map(item => ({
                  name: item._id,
                  value: item.count,
                  label:
                    item._id === 'kritik'
                      ? 'Kritik'
                      : item._id === 'yüksek'
                        ? 'Yüksek'
                        : item._id === 'normal'
                          ? 'Normal'
                          : item._id === 'düşük'
                            ? 'Düşük'
                            : item._id,
                })) || []
              );

            case 'performers':
              return taskAnalytics.charts.topPerformers || [];

            default:
              return [];
          }

        default:
          return [];
      }
    },
    [meetingAnalytics, taskAnalytics],
  );

  /**
   * 🎯 Get KPI Values
   */
  const getKPIs = useCallback(() => {
    return {
      meetings: {
        total: meetingAnalytics?.overview?.totalMeetings || 0,
        completed: meetingAnalytics?.overview?.completionRate || 0,
        avgDuration: Math.round(
          meetingAnalytics?.overview?.averageDuration || 0,
        ),
        participation: meetingAnalytics?.overview?.participationRate || 0,
      },
      tasks: {
        total: taskAnalytics?.overview?.totalTasks || 0,
        completed: taskAnalytics?.overview?.completedTasks || 0,
        overdue: taskAnalytics?.overview?.overdueCount || 0,
        completion: taskAnalytics?.overview?.completionRate || 0,
        avgTime: Math.round(
          taskAnalytics?.overview?.averageCompletionTime || 0,
        ),
      },
      dashboard: {
        recent: dashboardSummary?.summary?.recentMeetings || 0,
        upcoming: dashboardSummary?.summary?.upcomingMeetings || 0,
        pending: dashboardSummary?.summary?.pendingTasks || 0,
      },
    };
  }, [meetingAnalytics, taskAnalytics, dashboardSummary]);

  // Auto-load dashboard summary on mount
  useEffect(() => {
    if (user) {
      loadDashboardSummary(filters.personal);
    }
  }, [user, loadDashboardSummary, filters.personal]);

  return {
    // Loading states
    loading,
    error,

    // Data
    dashboardSummary,
    meetingAnalytics,
    taskAnalytics,
    userAnalytics,
    notificationAnalytics,

    // Filters
    filters,
    updateFilters,

    // Actions
    loadDashboardSummary,
    loadMeetingAnalytics,
    loadTaskAnalytics,
    loadUserAnalytics,
    loadNotificationAnalytics,
    exportAnalytics,
    refreshAll,

    // Helpers
    getChartData,
    getKPIs,

    // Permissions
    canViewUserAnalytics: ['Admin', 'Departman Yöneticisi'].includes(user?.rol),
    canViewNotificationAnalytics: user?.rol === 'Admin',
  };
};
