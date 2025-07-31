import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Typography,
} from '@mui/material';

// Role-specific dashboards
import PackagingDashboard from './PackagiingDashboard';
import OrtaDashboard from './OrtaDashboard';
import UstaDashboard from './UstaDashboard';
import KaliteKontrolDashboard from './KaliteKontrolDashboard';

// Custom hooks and utils
import { useDashboardData } from '../hooks/useDashboardData';

// Dashboard components
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import StatsWidgets from '../components/Dashboard/StatsWidgets';
import QuickAccessModules from '../components/Dashboard/QuickAccessModules';
import PerformanceChart from '../components/Dashboard/PerformanceChart';
import RecentActivities from '../components/Dashboard/RecentActivities';
import SystemInfo from '../components/Dashboard/SystemInfo';

/**
 * Main Dashboard Component
 * Role-based routing and admin dashboard rendering
 */
const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  // Debug logging removed for cleaner console

  // Authentication check
  if (!isAuthenticated || !user) {
    // Authentication debug removed
    return <AdminDashboard />;
  }

  // Role-based dashboard routing
  if (user?.roller && Array.isArray(user.roller)) {
    const userRoles = user.roller.map(role => role.ad || role);

    // Role debug removed

    // Role-specific dashboard routing
    if (userRoles.includes('Paketlemeci') && !userRoles.includes('Admin')) {
      // Routing to PackagingDashboard
      return <PackagingDashboard />;
    }

    if (userRoles.includes('Ortacı') && !userRoles.includes('Admin')) {
      // Routing to OrtaDashboard
      return <OrtaDashboard />;
    }

    if (userRoles.includes('Usta') && !userRoles.includes('Admin')) {
      // Routing to UstaDashboard
      return <UstaDashboard />;
    }

    if (userRoles.includes('Kalite Kontrol') && !userRoles.includes('Admin')) {
      // Routing to KaliteKontrolDashboard
      return <KaliteKontrolDashboard />;
    }

    if (userRoles.includes('VARDİYA AMİRİ') && !userRoles.includes('Admin')) {
      // Routing to UstaDashboard (VARDİYA AMİRİ)
      return <UstaDashboard />;
    }
  } else {
    // No roles or roles not array debug removed
  }

  // Default routing to AdminDashboard

  // Default to Admin Dashboard
  return <AdminDashboard />;
};

/**
 * Admin Dashboard Component
 * Main dashboard with all widgets and functionality
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use custom hook for data management
  const {
    stats,
    performanceData,
    recentActivities,
    loading,
    error,
    refreshData,
  } = useDashboardData();

  // Quick action handler
  const handleQuickAction = path => {
    navigate(path);
  };

  // Loading state
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
          <Typography variant='h5'>Dashboard Yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant='contained' onClick={() => navigate('/login')}>
          Giriş Sayfasına Git
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <DashboardHeader user={user} onRefresh={refreshData} />

      {/* Stats Widgets */}
      <StatsWidgets stats={stats} />

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Quick Access and Performance */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Quick Access Modules */}
          <QuickAccessModules onQuickAction={handleQuickAction} stats={stats} />

          {/* Performance Chart */}
          <PerformanceChart performanceData={performanceData} />
        </Grid>

        {/* Right Column - Recent Activities and System Info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Recent Activities */}
          <RecentActivities recentActivities={recentActivities} />

          {/* System Info */}
          <SystemInfo stats={stats} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
