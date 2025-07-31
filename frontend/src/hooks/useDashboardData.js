import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  usersAPI,
  checklistsAPI,
  tasksAPI,
  inventoryAPI,
  performanceAPI,
  rolesAPI,
  departmentsAPI,
} from '../services/api';

/**
 * Custom hook for Dashboard data management
 * Handles all API calls, state management, and data processing
 */
export const useDashboardData = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingApproval: 0,
    checklistTemplates: 0,
    inventoryItems: 0,
    inventoryCategories: 0,
    totalRoles: 0,
    totalDepartments: 0,
    todayCompletionRate: 0,
  });

  const [performanceData, setPerformanceData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, isAuthenticated, hasModulePermission } = useAuth();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Authentication kontrolü
      if (!isAuthenticated || !user) {
        setError('Lütfen giriş yapın');
        navigate('/login');
        return;
      }

      // Paralel veri yükleme
      const promises = [];
      const results = {};

      // Build promises based on permissions
      if (hasModulePermission('Kullanıcı Yönetimi')) {
        promises.push(
          usersAPI
            .getAll()
            .then(res => {
              results.users = res.data;
            })
            .catch(() => {
              results.users = [];
            }),
        );
      }

      if (hasModulePermission('Rol Yönetimi')) {
        promises.push(
          rolesAPI
            .getAll()
            .then(res => {
              results.roles = res.data;
            })
            .catch(() => {
              results.roles = [];
            }),
        );
      }

      if (hasModulePermission('Departman Yönetimi')) {
        promises.push(
          departmentsAPI
            .getAll()
            .then(res => {
              results.departments = res.data;
            })
            .catch(() => {
              results.departments = [];
            }),
        );
      }

      if (hasModulePermission('Checklist Yönetimi')) {
        promises.push(
          checklistsAPI
            .getAll()
            .then(res => {
              results.checklists = res.data;
            })
            .catch(() => {
              results.checklists = [];
            }),
        );
      }

      if (hasModulePermission('Görev Yönetimi')) {
        promises.push(
          tasksAPI
            .getAll()
            .then(res => {
              results.tasks = res.data;
            })
            .catch(() => {
              results.tasks = [];
            }),
        );
      }

      if (hasModulePermission('Envanter Yönetimi')) {
        promises.push(
          inventoryAPI
            .getDashboard()
            .then(res => {
              results.inventory = res.data;
            })
            .catch(() => {
              results.inventory = null;
            }),
        );
      }

      if (hasModulePermission('Performans')) {
        promises.push(
          performanceAPI
            .getScores()
            .then(res => {
              results.performance = res.data;
            })
            .catch(() => {
              results.performance = {};
            }),
        );
      }

      // Wait for all API calls
      await Promise.all(promises);

      // Dashboard API debug logging removed for production

      // Process and calculate statistics
      const processedStats = processStatistics(results);
      setStats(processedStats);

      // Process performance chart data
      if (results.performance) {
        const chartData = Object.entries(results.performance).map(
          ([role, users]) => ({
            name: role,
            value: users.length,
          }),
        );
        setPerformanceData(chartData);
      }

      // Process recent activities
      const activities = processRecentActivities(results);
      setRecentActivities(activities);
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('İstatistikler yüklenirken hata:', error);
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        navigate('/login');
        return;
      }

      setError('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, navigate, hasModulePermission]);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return {
    stats,
    performanceData,
    recentActivities,
    loading,
    error,
    refreshData: loadStats,
  };
};

/**
 * Process API results into dashboard statistics
 */
const processStatistics = results => {
  const users = results.users || [];
  const tasks = results.tasks || [];

  const activeUsers = users.filter(u => u.durum === 'aktif').length;
  const activeTasks = tasks.filter(t => t.durum === 'bekliyor').length;
  const completedTasks = tasks.filter(
    t => t.durum === 'tamamlandi' || t.durum === 'onaylandi',
  ).length;
  const pendingApproval = tasks.filter(
    t => t.durum === 'tamamlandi' && !t.toplamPuan,
  ).length;

  // Today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter(t => new Date(t.olusturmaTarihi) >= today);
  const todayCompleted = todayTasks.filter(
    t => t.durum === 'tamamlandi' || t.durum === 'onaylandi',
  ).length;
  const todayCompletionRate =
    todayTasks.length > 0
      ? Math.round((todayCompleted / todayTasks.length) * 100)
      : 0;

  // Inventory statistics
  const inventoryItems = results.inventory?.genel?.toplamEnvanter || 0;
  const inventoryCategories = results.inventory?.genel?.kategoriler || 0;

  return {
    totalUsers: users.length,
    activeUsers,
    totalTasks: tasks.length,
    activeTasks,
    completedTasks,
    pendingApproval,
    checklistTemplates: results.checklists?.length || 0,
    inventoryItems,
    inventoryCategories,
    totalRoles: results.roles?.length || 0,
    totalDepartments: results.departments?.length || 0,
    todayCompletionRate,
  };
};

/**
 * Process recent activities from API results
 */
const processRecentActivities = results => {
  const activities = [];
  const users = results.users || [];
  const tasks = results.tasks || [];

  // Recent users
  const recentUsers = users
    .sort((a, b) => new Date(b.olusturmaTarihi) - new Date(a.olusturmaTarihi))
    .slice(0, 3);

  recentUsers.forEach(u => {
    activities.push({
      type: 'user',
      message: `${u.ad} ${u.soyad} kullanıcısı eklendi`,
      time: u.olusturmaTarihi,
      icon: 'PeopleIcon',
      color: 'primary',
    });
  });

  // Recent completed tasks
  const recentCompleted = tasks
    .filter(t => t.durum === 'tamamlandi' || t.durum === 'onaylandi')
    .sort(
      (a, b) =>
        new Date(b.tamamlanmaTarihi || b.guncellemeTarihi) -
        new Date(a.tamamlanmaTarihi || a.guncellemeTarihi),
    )
    .slice(0, 3);

  recentCompleted.forEach(t => {
    activities.push({
      type: 'task',
      message: `${t.kullanici?.ad} ${t.kullanici?.soyad} ${t.checklist?.ad} tamamladı`,
      time: t.tamamlanmaTarihi || t.guncellemeTarihi,
      icon: 'CheckCircleIcon',
      color: 'success',
    });
  });

  // Sort by time and return top 5
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  return activities.slice(0, 5);
};
