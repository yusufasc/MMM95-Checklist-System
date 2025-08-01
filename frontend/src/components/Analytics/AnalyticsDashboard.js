import React, { memo, useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Analytics as AnalyticsIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

/**
 * 📊 Analytics Dashboard Component
 * Main analytics overview with KPIs and charts
 */
const AnalyticsDashboard = memo(() => {
  const { user } = useAuth();
  const {
    loading,
    error,
    filters,
    updateFilters,
    loadMeetingAnalytics,
    loadTaskAnalytics,
    refreshAll,
    getChartData,
    getKPIs,
  } = useAnalytics();

  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [exportingPDF, setExportingPDF] = useState(false);

  // Chart colors
  const COLORS = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
  };

  const PIE_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
    COLORS.error,
    COLORS.info,
  ];

  // Handle period change
  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
      updateFilters({ period: newPeriod });
    }
  };

  // Load analytics data when period changes
  useEffect(() => {
    if (selectedPeriod) {
      loadMeetingAnalytics({ period: selectedPeriod });
      loadTaskAnalytics({ period: selectedPeriod });
    }
  }, [selectedPeriod, loadMeetingAnalytics, loadTaskAnalytics]);

  // Get KPI data
  const kpis = getKPIs();

  // Chart data
  const meetingStatusData = getChartData('meetings', 'status');
  const taskStatusData = getChartData('tasks', 'status');
  const monthlyTrendData = getChartData('meetings', 'monthly');
  const taskPriorityData = getChartData('tasks', 'priority');

  const handleRefresh = () => {
    refreshAll();
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);

      // Create query parameters
      const params = new URLSearchParams({
        period: selectedPeriod,
        personal: user?.personal || false,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      // Call PDF export API
      const response = await api.get(`/pdf/analytics?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename
      const filename = `MMM95_Analytics_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', filename);

      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Analytics PDF exported successfully');
    } catch (error) {
      console.error('❌ PDF export error:', error);
      alert('PDF export sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setExportingPDF(false);
    }
  };

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant='h4' component='h1' fontWeight='bold'>
              Analytics Dashboard
            </Typography>
            <Typography variant='subtitle1' color='textSecondary'>
              Meeting ve görev performans analitikleri
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Period Toggle */}
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={handlePeriodChange}
            size='small'
          >
            <ToggleButton value='7d'>7 Gün</ToggleButton>
            <ToggleButton value='30d'>30 Gün</ToggleButton>
            <ToggleButton value='90d'>90 Gün</ToggleButton>
          </ToggleButtonGroup>

          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            variant='outlined'
          >
            Yenile
          </Button>

          <Tooltip title='Analytics raporunu PDF olarak indir'>
            <Button
              startIcon={<PdfIcon />}
              onClick={handleExportPDF}
              disabled={loading || exportingPDF}
              variant='contained'
              color='success'
              sx={{ minWidth: 120 }}
            >
              {exportingPDF ? (
                <CircularProgress size={16} color='inherit' />
              ) : (
                'PDF İndir'
              )}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Meeting KPIs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {kpis.meetings.total}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Toplam Toplantı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    %{kpis.meetings.completed}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Tamamlanma Oranı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    {kpis.tasks.total}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Toplam Görev
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant='h4' fontWeight='bold'>
                    %{kpis.meetings.participation}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Katılım Oranı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Meeting Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Toplantı Durumları
              </Typography>
              {meetingStatusData.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={meetingStatusData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ label, percent }) =>
                        `${label} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {meetingStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography
                  variant='body2'
                  color='textSecondary'
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  Veri bulunamadı
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Task Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Görev Durumları
              </Typography>
              {taskStatusData.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={taskStatusData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='label' />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey='value' fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography
                  variant='body2'
                  color='textSecondary'
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  Veri bulunamadı
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Aylık Toplantı Trendi
              </Typography>
              {monthlyTrendData.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='meetings'
                      stroke={COLORS.primary}
                      name='Toplam Toplantı'
                      strokeWidth={2}
                    />
                    <Line
                      type='monotone'
                      dataKey='completed'
                      stroke={COLORS.success}
                      name='Tamamlanan'
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography
                  variant='body2'
                  color='textSecondary'
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  Veri bulunamadı
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Task Priority */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Görev Öncelikleri
              </Typography>
              {taskPriorityData.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={taskPriorityData}
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                      label={({ label, value }) => `${label}: ${value}`}
                    >
                      {taskPriorityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography
                  variant='body2'
                  color='textSecondary'
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  Veri bulunamadı
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Özet İstatistikler
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant='h5'
                      fontWeight='bold'
                      color='primary.main'
                    >
                      {kpis.meetings.avgDuration} dk
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Ortalama Toplantı Süresi
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant='h5'
                      fontWeight='bold'
                      color='warning.main'
                    >
                      {kpis.tasks.overdue}
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Süresi Geçen Görev
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant='h5'
                      fontWeight='bold'
                      color='success.main'
                    >
                      {kpis.tasks.avgTime} gün
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Ortalama Tamamlama Süresi
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant='h5'
                      fontWeight='bold'
                      color='info.main'
                    >
                      %{kpis.tasks.completion}
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Görev Tamamlama Oranı
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
