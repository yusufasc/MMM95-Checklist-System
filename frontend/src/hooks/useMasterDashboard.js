import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, performanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  SCORE_COLORS,
  SCORE_LABELS,
  REFRESH_INTERVAL,
  processControlTasks,
  calculateUserRanking,
} from '../utils/dashboardConfig';

export const useMasterDashboard = () => {
  const { user } = useAuth();

  // Extract user ID for dependency array
  const userId = user?._id;

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [myTasks, setMyTasks] = useState([]);
  const [controlTasks, setControlTasks] = useState([]);
  const [dailyScores, setDailyScores] = useState({});
  const [ranking, setRanking] = useState([]);

  // Computed values
  const myTasksCount = myTasks.length;
  const controlTasksCount = controlTasks.length;
  const dailyAverage = dailyScores.toplamPuan || 85;
  const userRanking = calculateUserRanking(ranking, userId);

  // Load my pending tasks
  const loadMyTasks = useCallback(async () => {
    try {
      const tasksRes = await tasksAPI.getMy();
      if (tasksRes.data) {
        const pendingTasks = tasksRes.data.filter(
          task =>
            task.durum === 'bekliyor' ||
            task.durum === 'beklemede' ||
            task.durum === 'devamEdiyor',
        );
        console.log('🔍 UstaDashboard - Tüm görevler:', tasksRes.data.length);
        console.log(
          '🔍 UstaDashboard - Bekleyen görevler:',
          pendingTasks.length,
        );
        setMyTasks(pendingTasks.slice(0, 6));
        return true;
      }
      return false;
    } catch (taskError) {
      console.log('Görevler yüklenemedi:', taskError);
      setMyTasks([]);
      return false;
    }
  }, []);

  // Load control pending tasks
  const loadControlTasks = useCallback(async () => {
    try {
      const controlRes = await tasksAPI.getControlPending();
      console.log('🔍 UstaDashboard - Control API Response:', controlRes.data);

      const controlPending = processControlTasks(controlRes.data);
      console.log(
        '🔍 UstaDashboard - Kontrol bekleyen görevler:',
        controlPending.length,
      );

      setControlTasks(controlPending.slice(0, 6));
      return true;
    } catch (controlError) {
      console.error(
        '❌ UstaDashboard - Kontrol verileri yüklenemedi:',
        controlError,
      );
      setControlTasks([]);
      return false;
    }
  }, []);

  // Load performance ranking
  const loadRanking = useCallback(async () => {
    try {
      const performanceRes = await performanceAPI.getScores();
      if (performanceRes.data.Usta) {
        setRanking(performanceRes.data.Usta.slice(0, 5));
        return true;
      }
      return false;
    } catch (perfError) {
      console.log('Performance verileri yüklenemedi:', perfError);
      setRanking([]);
      return false;
    }
  }, []);

  // Load daily scores
  const loadDailyScores = useCallback(async () => {
    if (!userId) {
      return false;
    }

    try {
      const userPerformance = await performanceAPI.getUserPerformance(userId);
      const todayScore = userPerformance.data[0] || {};
      setDailyScores(todayScore);
      return true;
    } catch (userPerfError) {
      console.log('Kullanıcı performance verileri yüklenemedi:', userPerfError);
      setDailyScores({});
      return false;
    }
  }, [userId]);

  // Main data loading function
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Parallel API calls for better performance
      const [tasksSuccess, controlSuccess] = await Promise.all([
        loadMyTasks(),
        loadControlTasks(),
        loadRanking(),
        loadDailyScores(),
      ]);

      // Check if any critical data failed to load
      if (!tasksSuccess && !controlSuccess) {
        setError('Bazı veriler yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    } catch (error) {
      console.error('Dashboard yükleme hatası:', error);
      setError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [loadMyTasks, loadControlTasks, loadRanking, loadDailyScores]);

  // Auto-refresh effect
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Get score data with colors for visualization
  const getScoreData = useCallback(() => {
    return Object.entries(SCORE_COLORS).map(([key, color]) => {
      const score =
        dailyScores.scores?.[key] || Math.floor(Math.random() * 30) + 70;
      return {
        key,
        score,
        color,
        label: SCORE_LABELS[key],
        percentage: (score / 100) * 100,
      };
    });
  }, [dailyScores]);

  // Navigation helpers
  const navigateToTasks = useCallback(navigate => {
    navigate('/tasks');
  }, []);

  const navigateToControlPending = useCallback(navigate => {
    navigate('/control-pending');
  }, []);

  const navigateToPerformance = useCallback(navigate => {
    navigate('/performance');
  }, []);

  const navigateToTask = useCallback((navigate, taskId) => {
    navigate(`/tasks/${taskId}`);
  }, []);

  // Task status helpers
  const getTaskStatusInfo = useCallback(task => {
    const isPending = task.durum === 'beklemede';

    return {
      label: isPending ? 'Beklemede' : 'Devam Ediyor',
      color: isPending ? 'warning' : 'info',
      chipProps: {
        color: isPending ? 'warning' : 'info',
        size: 'small',
      },
    };
  }, []);

  // Summary statistics
  const getSummaryStats = useCallback(() => {
    return {
      myTasksCount,
      controlTasksCount,
      dailyAverage,
      userRanking,
    };
  }, [myTasksCount, controlTasksCount, dailyAverage, userRanking]);

  return {
    // Loading and error states
    loading,
    error,

    // Data states
    myTasks,
    controlTasks,
    dailyScores,
    ranking,

    // Computed values
    myTasksCount,
    controlTasksCount,
    dailyAverage,
    userRanking,

    // Data loading functions
    loadDashboardData,
    forceRefresh,

    // Utility functions
    getScoreData,
    getSummaryStats,
    getTaskStatusInfo,

    // Navigation helpers
    navigateToTasks,
    navigateToControlPending,
    navigateToPerformance,
    navigateToTask,

    // Constants
    scoreColors: SCORE_COLORS,
    scoreLabels: SCORE_LABELS,
  };
};
