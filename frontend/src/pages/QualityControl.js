import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Fab,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  Alert,
  Zoom,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import QualityControlEvaluation from '../components/Quality/QualityControlEvaluation';
import QualityControlStatistics from '../components/Quality/QualityControlStatistics';
import { qualityControlAPI } from '../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`quality-control-tabpanel-${index}`}
      aria-labelledby={`quality-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

const QualityControl = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasModulePermission, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'evaluation', 'statistics'
  const [statsData, setStatsData] = useState({
    todayEvaluations: 0,
    weeklyEvaluations: 0,
    averageScore: 0,
    topWorkers: 0,
  });
  const [loading, setLoading] = useState(false);

  const canView = hasModulePermission('Kalite Kontrol');

  useEffect(() => {
    // Load quick stats for dashboard
    if (activeView === 'dashboard') {
      loadDashboardStats();
    }
  }, [activeView]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await qualityControlAPI.getDashboardSummary();

      if (response.data && response.data.success) {
        const data = response.data.data;
        setStatsData({
          todayEvaluations: data.todayEvaluations || 0,
          weeklyEvaluations: data.monthlyEvaluations || 0,
          averageScore: data.avgScore || 0,
          topWorkers: Math.floor(data.avgScore / 20) || 0, // Simple calculation for demo
        });
      }
    } catch (error) {
      console.error('Dashboard stats loading error:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert
          severity='error'
          sx={{
            borderRadius: 3,
            fontSize: '1.1rem',
            '& .MuiAlert-icon': { fontSize: '2rem' },
          }}
        >
          <Typography variant='h6' gutterBottom>
            Erişim Engellendi
          </Typography>
          Bu sayfaya erişim yetkiniz bulunmuyor. Kalite Kontrol modülü yetkisi
          gereklidir.
        </Alert>
      </Container>
    );
  }

  const handleViewChange = view => {
    setActiveView(view);
  };

  const renderDashboard = () => (
    <Box>
      {/* Welcome Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: { xs: 'none', md: 'block' },
          }}
        />
        <Grid container spacing={3} alignItems='center'>
          <Grid item xs={12} md={8}>
            <Typography variant='h3' fontWeight='bold' gutterBottom>
              Kalite Kontrol Merkezi
              <AssessmentIcon sx={{ ml: 2, fontSize: '2.5rem' }} />
            </Typography>
            <Typography variant='h6' sx={{ opacity: 0.9, mb: 2 }}>
              Hoş geldiniz, {user?.ad} {user?.soyad}
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.8 }}>
              Kalite standartlarını yönetin, değerlendirmeler yapın ve
              performans analizlerini takip edin
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  mx: 'auto',
                  mb: 2,
                  fontSize: { xs: '2rem', md: '3rem' },
                }}
              >
                {user?.ad?.charAt(0)}
                {user?.soyad?.charAt(0)}
              </Avatar>
              <Chip
                label='Kalite Kontrol Uzmanı'
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '0.9rem',
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FF9800 0%, #FF6D00 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 140,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon sx={{ fontSize: '2rem', mr: 1 }} />
                <Typography variant='h6' fontWeight='bold'>
                  Bugün
                </Typography>
              </Box>
              <Typography variant='h3' fontWeight='bold' gutterBottom>
                {loading ? '...' : statsData.todayEvaluations}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Değerlendirme
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 140,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon sx={{ fontSize: '2rem', mr: 1 }} />
                <Typography variant='h6' fontWeight='bold'>
                  Bu Hafta
                </Typography>
              </Box>
              <Typography variant='h3' fontWeight='bold' gutterBottom>
                {loading ? '...' : statsData.weeklyEvaluations}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Değerlendirme
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 140,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon sx={{ fontSize: '2rem', mr: 1 }} />
                <Typography variant='h6' fontWeight='bold'>
                  Ortalama
                </Typography>
              </Box>
              <Typography variant='h3' fontWeight='bold' gutterBottom>
                {loading ? '...' : `${statsData.averageScore}%`}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Başarı Oranı
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 140,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StarIcon sx={{ fontSize: '2rem', mr: 1 }} />
                <Typography variant='h6' fontWeight='bold'>
                  En İyi
                </Typography>
              </Box>
              <Typography variant='h3' fontWeight='bold' gutterBottom>
                {loading ? '...' : statsData.topWorkers}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Performans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'primary.main',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(25,118,210,0.15)',
              },
              minHeight: 200,
            }}
            onClick={() => handleViewChange('evaluation')}
          >
            <CardContent sx={{ textAlign: 'center', py: { xs: 3, md: 4 } }}>
              <Avatar
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: { xs: 2, md: 3 },
                }}
              >
                <AssignmentIcon
                  sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
                />
              </Avatar>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                fontWeight='bold'
                gutterBottom
              >
                Yeni Değerlendirme
              </Typography>
              <Typography
                variant='body1'
                color='text.secondary'
                sx={{
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                Çalışan performansını değerlendirin ve kalite puanlaması yapın
              </Typography>
              <Button
                variant='contained'
                size={isMobile ? 'medium' : 'large'}
                sx={{
                  borderRadius: 3,
                  px: { xs: 3, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  background:
                    'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                Başlat
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'secondary.main',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(156,39,176,0.15)',
              },
              minHeight: 200,
            }}
            onClick={() => handleViewChange('statistics')}
          >
            <CardContent sx={{ textAlign: 'center', py: { xs: 3, md: 4 } }}>
              <Avatar
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  bgcolor: 'secondary.main',
                  mx: 'auto',
                  mb: { xs: 2, md: 3 },
                }}
              >
                <AnalyticsIcon
                  sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
                />
              </Avatar>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                fontWeight='bold'
                gutterBottom
              >
                Raporlar ve Analiz
              </Typography>
              <Typography
                variant='body1'
                color='text.secondary'
                sx={{
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                Değerlendirme geçmişi, istatistikler ve performans trendleri
              </Typography>
              <Button
                variant='contained'
                size={isMobile ? 'medium' : 'large'}
                sx={{
                  borderRadius: 3,
                  px: { xs: 3, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  background:
                    'linear-gradient(135deg, #9c27b0 0%, #e1bee7 100%)',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                Görüntüle
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'evaluation':
        return <QualityControlEvaluation />;
      case 'statistics':
        return <QualityControlStatistics />;
      default:
        return renderDashboard();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Container maxWidth='xl' sx={{ py: { xs: 2, md: 4 } }}>
        {/* Mobile Header */}
        {isMobile && activeView !== 'dashboard' && (
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => handleViewChange('dashboard')}
              sx={{ mb: 2 }}
            >
              Ana Sayfa
            </Button>
            <Typography variant='h5' fontWeight='bold'>
              {activeView === 'evaluation'
                ? 'Değerlendirme Yap'
                : 'Raporlar ve Analiz'}
            </Typography>
          </Box>
        )}

        {/* Desktop Navigation */}
        {!isMobile && activeView !== 'dashboard' && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 2,
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={() => handleViewChange('dashboard')}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant='h5' fontWeight='bold'>
                {activeView === 'evaluation'
                  ? 'Kalite Değerlendirme'
                  : 'Raporlar ve Analiz'}
              </Typography>
            </Box>
            <Stack direction='row' spacing={2}>
              <Button
                variant={activeView === 'evaluation' ? 'contained' : 'outlined'}
                startIcon={<AssignmentIcon />}
                onClick={() => handleViewChange('evaluation')}
              >
                Değerlendirme
              </Button>
              <Button
                variant={activeView === 'statistics' ? 'contained' : 'outlined'}
                startIcon={<AnalyticsIcon />}
                onClick={() => handleViewChange('statistics')}
              >
                Raporlar
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* Mobile FAB */}
        {isMobile && activeView === 'dashboard' && (
          <Zoom in={true}>
            <Fab
              color='primary'
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              }}
              onClick={() => handleViewChange('evaluation')}
            >
              <AddIcon />
            </Fab>
          </Zoom>
        )}
      </Container>
    </Box>
  );
};

export default QualityControl;
