import React from 'react';
import { Paper, Tabs, Tab } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const TaskTabs = ({ tabValue, onTabChange, isMobile }) => {
  return (
    <Paper sx={{ mb: 2, borderRadius: 2 }}>
      <Tabs
        value={tabValue}
        onChange={onTabChange}
        variant='fullWidth'
        sx={{
          minHeight: { xs: 40, md: 48 },
          '& .MuiTab-root': {
            py: { xs: 1, md: 2 },
            fontSize: { xs: '0.75rem', md: '1rem' },
            fontWeight: 'bold',
            minHeight: { xs: 40, md: 48 },
          },
        }}
      >
        <Tab
          label={isMobile ? 'Bekleyen' : 'Bekleyen Görevler'}
          icon={<ScheduleIcon />}
          iconPosition='start'
        />
        <Tab
          label={isMobile ? 'Tamamlanan' : 'Tamamlanan Görevler'}
          icon={<CheckCircleIcon />}
          iconPosition='start'
        />
        <Tab
          label={isMobile ? 'Geciken' : 'Geciken Görevler'}
          icon={<WarningIcon />}
          iconPosition='start'
        />
      </Tabs>
    </Paper>
  );
};

export default TaskTabs;
