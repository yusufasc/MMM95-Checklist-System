import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PackagingDashboard from './PackagiingDashboard';
import OrtaDashboard from './OrtaDashboard';
import UstaDashboard from './UstaDashboard';

// Admin Dashboard (modern ve dinamik)
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  PendingActions as PendingActionsIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Category as CategoryIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  usersAPI,
  checklistsAPI,
  tasksAPI,
  inventoryAPI,
  performanceAPI,
  rolesAPI,
  departmentsAPI,
} from '../services/api';
import CountUp from 'react-countup';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  // Debug için console.log
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard - User:', user);

    console.log('Dashboard - User Roles:', user?.roller);

    console.log('Dashboard - isAuthenticated:', isAuthenticated);
  }

  // Authentication kontrolü
  if (!isAuthenticated || !user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard - Not authenticated, showing AdminDashboard');
    }
    return <AdminDashboard />;
  }

  // Rol bazlı dashboard yönlendirme
  if (user?.roller && Array.isArray(user.roller)) {
    const userRoles = user.roller.map(role => role.ad || role);

    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard - User Roles Array:', userRoles);

      console.log('Dashboard - Has Ortacı role?', userRoles.includes('Ortacı'));

      console.log('Dashboard - Has Admin role?', userRoles.includes('Admin'));
    }

    // Paketlemeci rolü varsa özel dashboard göster
    if (userRoles.includes('Paketlemeci') && !userRoles.includes('Admin')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard - Routing to PackagingDashboard');
      }
      return <PackagingDashboard />;
    }

    // Ortacı rolü varsa özel dashboard göster
    if (userRoles.includes('Ortacı') && !userRoles.includes('Admin')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard - Routing to OrtaDashboard');
      }
      return <OrtaDashboard />;
    }

    // Usta rolü varsa özel dashboard göster
    if (userRoles.includes('Usta') && !userRoles.includes('Admin')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard - Routing to UstaDashboard');
      }
      return <UstaDashboard />;
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard - No roles or roles not array:', user?.roller);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard - Routing to AdminDashboard');
  }
  // Admin Dashboard (mevcut dashboard)
  return <AdminDashboard />;
};

const AdminDashboard = () => {
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

      // Kullanıcı istatistikleri
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

      // Rol ve departman istatistikleri
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

      // Checklist istatistikleri
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

      // Görev istatistikleri
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

      // Envanter istatistikleri
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

      // Performance verileri
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

      // Tüm verileri bekle
      await Promise.all(promises);

      // Debug için API yanıtlarını logla
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard API Yanıtları:', {
          users: results.users?.length || 0,
          tasks: results.tasks?.length || 0,
          inventory: results.inventory,
          checklists: results.checklists?.length || 0,
          roles: results.roles?.length || 0,
          departments: results.departments?.length || 0,
          performance: results.performance,
        });
      }

      // İstatistikleri hesapla
      const users = results.users || [];
      const tasks = results.tasks || [];
      const activeUsers = users.filter(u => u.durum === 'aktif').length;
      const activeTasks = tasks.filter(t => t.durum === 'bekliyor').length;
      const completedTasks = tasks.filter(
        t => t.durum === 'tamamlandi' || t.durum === 'onaylandi',
      ).length;
      const pendingApproval = tasks.filter(t => t.durum === 'tamamlandi' && !t.toplamPuan).length;

      // Bugünkü görevler
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTasks = tasks.filter(t => new Date(t.olusturmaTarihi) >= today);
      const todayCompleted = todayTasks.filter(
        t => t.durum === 'tamamlandi' || t.durum === 'onaylandi',
      ).length;
      const todayCompletionRate =
        todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

      // Envanter istatistikleri - API'den dönen gerçek alan isimlerini kullan
      const inventoryItems = results.inventory?.genel?.toplamEnvanter || 0;
      const inventoryCategories = results.inventory?.genel?.kategoriler || 0;

      setStats({
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
      });

      // Performance chart verisi
      if (results.performance) {
        const chartData = Object.entries(results.performance).map(([role, users]) => ({
          name: role,
          value: users.length,
        }));
        setPerformanceData(chartData);
      }

      // Son aktiviteler
      const activities = [];

      // Son eklenen kullanıcılar
      const recentUsers = users
        .sort((a, b) => new Date(b.olusturmaTarihi) - new Date(a.olusturmaTarihi))
        .slice(0, 3);
      recentUsers.forEach(u => {
        activities.push({
          type: 'user',
          message: `${u.ad} ${u.soyad} kullanıcısı eklendi`,
          time: u.olusturmaTarihi,
          icon: <PeopleIcon />,
          color: 'primary',
        });
      });

      // Son tamamlanan görevler
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
          icon: <CheckCircleIcon />,
          color: 'success',
        });
      });

      // Zaman sırasına göre sırala
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
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
    // Her 30 saniyede bir yenile
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Widget renkleri
  const widgetColors = {
    users: '#1976d2',
    tasks: '#2e7d32',
    inventory: '#9c27b0',
    performance: '#d32f2f',
    pending: '#ed6c02',
    roles: '#0288d1',
  };

  // Performance chart renkleri
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

  const handleQuickAction = path => {
    navigate(path);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          m: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <CircularProgress sx={{ color: 'white', mb: 2 }} size={60} />
          <Typography variant="h5">Dashboard Yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Giriş Sayfasına Git
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              Hoş Geldiniz, {user?.ad} {user?.soyad}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              MMM Checklist Sistemi - Admin Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Yenile">
              <IconButton sx={{ color: 'white' }} onClick={loadStats}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <AdminIcon sx={{ fontSize: 80, opacity: 0.7 }} />
          </Box>
        </Box>
      </Paper>

      {/* Ana İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {hasModulePermission('Kullanıcı Yönetimi') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${widgetColors.users}20, ${widgetColors.users}10)`,
                border: `1px solid ${widgetColors.users}40`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 40, color: widgetColors.users }} />
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: widgetColors.users }}>
                    <CountUp end={stats.activeUsers} duration={1} />
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Aktif Kullanıcı
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats.activeUsers / stats.totalUsers) * 100 || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${widgetColors.users}20`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: widgetColors.users,
                    },
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Toplam {stats.totalUsers} kullanıcıdan
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {hasModulePermission('Görev Yönetimi') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${widgetColors.tasks}20, ${widgetColors.tasks}10)`,
                border: `1px solid ${widgetColors.tasks}40`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <TaskIcon sx={{ fontSize: 40, color: widgetColors.tasks }} />
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: widgetColors.tasks }}>
                    <CountUp end={stats.activeTasks} duration={1} />
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Aktif Görev
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    label={`${stats.completedTasks} Tamamlandı`}
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Chip
                    label={`%${stats.todayCompletionRate} Bugün`}
                    size="small"
                    color="info"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Toplam {stats.totalTasks} görevden
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {hasModulePermission('Envanter Yönetimi') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${widgetColors.inventory}20, ${widgetColors.inventory}10)`,
                border: `1px solid ${widgetColors.inventory}40`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 40, color: widgetColors.inventory }} />
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 'bold', color: widgetColors.inventory }}
                  >
                    <CountUp end={stats.inventoryItems} duration={1} />
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Envanter Öğesi
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {stats.inventoryCategories} Kategori
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <QrCodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    QR/Barkod Destekli
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {hasModulePermission('Kontrol Bekleyenler') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${widgetColors.pending}20, ${widgetColors.pending}10)`,
                border: `1px solid ${widgetColors.pending}40`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <PendingActionsIcon sx={{ fontSize: 40, color: widgetColors.pending }} />
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: widgetColors.pending }}>
                    <CountUp end={stats.pendingApproval} duration={1} />
                  </Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Onay Bekliyor
                </Typography>
                {stats.pendingApproval > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon sx={{ fontSize: 16, color: widgetColors.pending }} />
                    <Typography
                      variant="body2"
                      sx={{ color: widgetColors.pending, fontWeight: 'bold' }}
                    >
                      Hemen kontrol et!
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      Tümü kontrol edildi
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Sol Kolon - Modül Erişimleri ve Performance */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Hızlı Erişim Modülleri */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              Hızlı Erişim
            </Typography>
            <Grid container spacing={2}>
              {hasModulePermission('Kullanıcı Yönetimi') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleQuickAction('/users')}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          margin: '0 auto 16px',
                          backgroundColor: widgetColors.users,
                        }}
                      >
                        <PeopleIcon sx={{ fontSize: 30 }} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Kullanıcı Yönetimi
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kullanıcı ekle, düzenle, rol ata
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {hasModulePermission('Checklist Yönetimi') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleQuickAction('/checklists')}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          margin: '0 auto 16px',
                          backgroundColor: widgetColors.tasks,
                        }}
                      >
                        <AssignmentIcon sx={{ fontSize: 30 }} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Checklist Şablonları
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Yeni şablon oluştur ve yönet
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {hasModulePermission('Envanter Yönetimi') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleQuickAction('/inventory')}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          margin: '0 auto 16px',
                          backgroundColor: widgetColors.inventory,
                        }}
                      >
                        <InventoryIcon sx={{ fontSize: 30 }} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Envanter Yönetimi
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Makina, kalıp ve ekipman takibi
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {hasModulePermission('Görev Yönetimi') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleQuickAction('/tasks')}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          margin: '0 auto 16px',
                          backgroundColor: widgetColors.performance,
                        }}
                      >
                        <TaskIcon sx={{ fontSize: 30 }} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Görev Yönetimi
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Görev ata ve takip et
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {hasModulePermission('Performans') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleQuickAction('/performance')}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          margin: '0 auto 16px',
                          backgroundColor: widgetColors.roles,
                        }}
                      >
                        <BarChartIcon sx={{ fontSize: 30 }} />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Performans Analizi
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Detaylı performans raporları
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {hasModulePermission('Kontrol Bekleyenler') && stats.pendingApproval > 0 && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: `2px solid ${widgetColors.pending}`,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px ${widgetColors.pending}40`,
                      },
                    }}
                    onClick={() => handleQuickAction('/control-pending')}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Badge badgeContent={stats.pendingApproval} color="error">
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            margin: '0 auto 16px',
                            backgroundColor: widgetColors.pending,
                          }}
                        >
                          <PendingActionsIcon sx={{ fontSize: 30 }} />
                        </Avatar>
                      </Badge>
                      <Typography variant="h6" gutterBottom color={widgetColors.pending}>
                        Kontrol Bekleyenler
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: widgetColors.pending, fontWeight: 'bold' }}
                      >
                        {stats.pendingApproval} görev bekliyor!
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Performance Chart */}
          {hasModulePermission('Performans') && performanceData.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Rol Bazlı Kullanıcı Dağılımı
              </Typography>
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sağ Kolon - Son Aktiviteler ve Sistem Bilgileri */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Son Aktiviteler */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Son Aktiviteler
              </Typography>
              <ScheduleIcon sx={{ color: 'text.secondary' }} />
            </Box>

            {recentActivities.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 3 }}
              >
                Henüz aktivite yok
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: `${activity.color}.main` }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={new Date(activity.time).toLocaleString('tr-TR')}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>

          {/* Sistem Bilgileri */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              Sistem Durumu
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Veritabanı Durumu
                </Typography>
                <Chip label="Aktif" color="success" size="small" icon={<CheckCircleIcon />} />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Sistem Versiyonu
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  v1.0.0
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Son Güncelleme
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {new Date().toLocaleDateString('tr-TR')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Sistem Özeti
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {stats.totalRoles} Rol Tanımlı
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {stats.totalDepartments} Departman
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {stats.checklistTemplates} Checklist Şablonu
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  MongoDB Veritabanı
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
