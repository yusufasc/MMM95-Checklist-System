import React, { memo } from 'react';
import { Box } from '@mui/material';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';

/**
 * 📊 Analytics Page
 * Main analytics page with dashboard overview
 */
const Analytics = memo(() => {
  return (
    <Box>
      <AnalyticsDashboard />
    </Box>
  );
});

Analytics.displayName = 'Analytics';

export default Analytics;
