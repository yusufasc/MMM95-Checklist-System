import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  PlaylistAddCheck as PlaylistIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { qualityControlAPI } from '../services/api';

const KaliteKontrolDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasModulePermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    summary: {
      activeTemplates: 0,
      monthlyEvaluations: 0,
      todayEvaluations: 0,
      avgScore: 0,
    },
    recentEvaluations: [],
    performanceTrend: [],
    departmentPerformance: [],
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, recentRes, trendRes, deptRes] = await Promise.all([
        qualityControlAPI.getDashboardSummary(),
        qualityControlAPI.getRecentEvaluations(),
        qualityControlAPI.getPerformanceTrend(),
        qualityControlAPI.getDepartmentPerformance(),
      ]);

      setDashboardData({
        summary: summaryRes.data.data,
        recentEvaluations: recentRes.data.data,
        performanceTrend: trendRes.data.data,
        departmentPerformance: deptRes.data.data,
      });
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getScoreColor = score => {
    if (score >= 90) {
      return 'success';
    }
    if (score >= 70) {
      return 'warning';
    }
    return 'error';
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const quickAccessButtons = [
    {
      title: 'Değerlendirme Yap',
      icon: <AssessmentIcon />,
      path: '/quality-control',
      permission: 'Kalite Kontrol',
    },
    {
      title: 'Şablon Yönetimi',
      icon: <PlaylistIcon />,
      path: '/quality-control-templates',
      permission: 'Kalite Kontrol Yönetimi',
    },
    {
      title: 'İstatistikler',
      icon: <BarChartIcon />,
      path: '/quality-control-statistics',
      permission: 'Kalite Kontrol',
    },
    {
      title: 'Performans',
      icon: <TimelineIcon />,
      path: '/my-activity',
      permission: 'Performans',
    },
    {
      title: 'Kontrol Bekleyenler',
      icon: <PeopleIcon />,
      path: '/control-pending',
      permission: 'Kontrol Bekleyenler',
    },
    {
      title: 'Envanter',
      icon: <BusinessIcon />,
      path: '/inventory',
      permission: 'Envanter Yönetimi',
    },
  ];

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        <span role='img' aria-label='target'>
          🎯
        </span>{' '}
        Kalite Kontrol Dashboard
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <CardContent sx={{ color: 'white' }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {dashboardData.summary.activeTemplates}
                  </Typography>
                  <Typography variant='body2'>Aktif Şablonlar</Typography>
                </Box>
                <PlaylistIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            }}
          >
            <CardContent sx={{ color: 'white' }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {dashboardData.summary.monthlyEvaluations}
                  </Typography>
                  <Typography variant='body2'>Bu Ay Değerlendirme</Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            }}
          >
            <CardContent sx={{ color: 'white' }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {dashboardData.summary.todayEvaluations}
                  </Typography>
                  <Typography variant='body2'>Bugün Değerlendirme</Typography>
                </Box>
                <TodayIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            }}
          >
            <CardContent sx={{ color: 'white' }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {dashboardData.summary.avgScore.toFixed(1)}
                  </Typography>
                  <Typography variant='body2'>Ortalama Puan</Typography>
                </Box>
                <StarIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hızlı Erişim Butonları */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography
            variant='h6'
            gutterBottom
            sx={{ mb: 2, fontWeight: 'bold' }}
          >
            <span role='img' aria-label='rocket'>
              🚀
            </span>{' '}
            Hızlı Erişim
          </Typography>
          <Grid container spacing={2}>
            {quickAccessButtons.map(
              (button, index) =>
                hasModulePermission(button.permission) && (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Button
                      fullWidth
                      variant='outlined'
                      startIcon={button.icon}
                      onClick={() => navigate(button.path)}
                      sx={{
                        py: 1.5,
                        justifyContent: 'flex-start',
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                          borderColor: theme.palette.primary.dark,
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {button.title}
                    </Button>
                  </Grid>
                ),
            )}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Son Değerlendirmeler */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ mb: 2, fontWeight: 'bold' }}
              >
                <span role='img' aria-label='clipboard'>
                  📋
                </span>{' '}
                Son Değerlendirmeler
              </Typography>
              {dashboardData.recentEvaluations.length > 0 ? (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Değerlendirilen</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Şablon</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Puan</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Tarih</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recentEvaluations.map(
                        (evaluation, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              {evaluation.degerlendirilenKullanici?.ad}{' '}
                              {evaluation.degerlendirilenKullanici?.soyad}
                            </TableCell>
                            <TableCell>{evaluation.sablon?.ad}</TableCell>
                            <TableCell>
                              <Chip
                                label={evaluation.toplamPuan?.toFixed(1)}
                                color={getScoreColor(evaluation.toplamPuan)}
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              {formatDate(evaluation.createdAt)}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color='textSecondary' textAlign='center' py={3}>
                  Henüz değerlendirme bulunmuyor
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Departman Performansı */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ mb: 2, fontWeight: 'bold' }}
              >
                <span role='img' aria-label='office'>
                  🏢
                </span>{' '}
                Departman Performansı
              </Typography>
              {dashboardData.departmentPerformance.length > 0 ? (
                <Box>
                  {dashboardData.departmentPerformance.map((dept, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                        mb={1}
                      >
                        <Typography variant='body2' fontWeight='medium'>
                          {dept._id}
                        </Typography>
                        <Chip
                          label={`${dept.avgScore.toFixed(1)} (${dept.count})`}
                          color={getScoreColor(dept.avgScore)}
                          size='small'
                        />
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          backgroundColor: theme.palette.grey[200],
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${Math.min(dept.avgScore, 100)}%`,
                            backgroundColor:
                              dept.avgScore >= 90
                                ? theme.palette.success.main
                                : dept.avgScore >= 70
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color='textSecondary' textAlign='center' py={3}>
                  Departman verisi bulunmuyor
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KaliteKontrolDashboard;
