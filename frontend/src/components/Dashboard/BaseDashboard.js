import React from 'react';
import { Box, Grid } from '@mui/material';
import LoadingWrapper from '../common/LoadingWrapper';
import DashboardHeader from './DashboardHeader';
import MyTasksSection from './MyTasksSection';
import ControlTasksSection from './ControlTasksSection';
import DailyScoresSection from './DailyScoresSection';
import RankingSection from './RankingSection';
import SummaryCards from '../MyActivity/SummaryCards';
import { useAuth } from '../../contexts/AuthContext';
import useApiCall from '../../hooks/useApiCall';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Unified Base Dashboard Component - spageti kod çözümü + güvenlik
 * Tüm dashboard variant'larını tek component'te birleştir
 * API endpoints artık configurable ve güvenli
 */
const BaseDashboard = ({
  dashboardType = 'default',
  apiConfig = API_ENDPOINTS.dashboard, // Override edilebilir API config
}) => {
  const { user, selectedMachines } = useAuth();

  // Unified data fetching with configurable endpoints
  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useApiCall(() => api.get(apiConfig.tasks));

  const {
    data: controlData,
    loading: controlLoading,
    error: controlError,
    refetch: refetchControl,
  } = useApiCall(() => api.get(apiConfig.controlTasks));

  const {
    data: scoresData,
    loading: scoresLoading,
    error: scoresError,
  } = useApiCall(() => api.get(apiConfig.scores));

  const {
    data: rankingsData,
    loading: rankingsLoading,
    error: rankingsError,
  } = useApiCall(() => api.get(apiConfig.rankings));

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
  } = useApiCall(() => api.get(apiConfig.summary));

  // Dashboard type configurations
  const getDashboardConfig = () => {
    const baseConfig = {
      showTasks: true,
      showControl: false,
      showScores: true,
      showRankings: true,
      showSummary: true,
    };

    switch (dashboardType) {
      case 'usta':
        return {
          ...baseConfig,
          showControl: true,
          title: 'Usta Dashboard',
        };
      case 'orta':
        return {
          ...baseConfig,
          showControl: true,
          title: 'Orta Seviye Dashboard',
        };
      case 'packaging':
        return {
          ...baseConfig,
          showControl: false,
          title: 'Paketleme Dashboard',
        };
      default:
        return {
          ...baseConfig,
          title: 'Dashboard',
        };
    }
  };

  const config = getDashboardConfig();
  const isLoading =
    tasksLoading ||
    controlLoading ||
    scoresLoading ||
    rankingsLoading ||
    summaryLoading;
  const hasError =
    tasksError || controlError || scoresError || rankingsError || summaryError;

  // Render sections based on config
  const renderSections = () => {
    const sections = [];

    // Summary Cards
    if (config.showSummary && summaryData) {
      sections.push(
        <Grid item xs={12} key='summary'>
          <SummaryCards data={summaryData} />
        </Grid>,
      );
    }

    // Tasks Section
    if (config.showTasks) {
      sections.push(
        <Grid item xs={12} md={6} key='tasks'>
          <MyTasksSection
            tasks={tasksData || []}
            loading={tasksLoading}
            error={tasksError}
            onRefresh={refetchTasks}
          />
        </Grid>,
      );
    }

    // Control Tasks (Role-based)
    if (
      config.showControl &&
      (user?.roller?.[0]?.ad?.includes('Usta') ||
        user?.roller?.[0]?.ad?.includes('Orta'))
    ) {
      sections.push(
        <Grid item xs={12} md={6} key='control'>
          <ControlTasksSection
            tasks={controlData || []}
            loading={controlLoading}
            error={controlError}
            onRefresh={refetchControl}
            selectedMachines={selectedMachines}
          />
        </Grid>,
      );
    }

    // Daily Scores
    if (config.showScores) {
      sections.push(
        <Grid item xs={12} md={6} key='scores'>
          <DailyScoresSection
            scores={scoresData || []}
            loading={scoresLoading}
            error={scoresError}
          />
        </Grid>,
      );
    }

    // Rankings
    if (config.showRankings) {
      sections.push(
        <Grid item xs={12} md={6} key='rankings'>
          <RankingSection
            rankings={rankingsData || []}
            loading={rankingsLoading}
            error={rankingsError}
          />
        </Grid>,
      );
    }

    return sections;
  };

  return (
    <LoadingWrapper loading={isLoading} error={hasError}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <DashboardHeader title={config.title} user={user} />

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {renderSections()}
        </Grid>
      </Box>
    </LoadingWrapper>
  );
};

export default BaseDashboard;
