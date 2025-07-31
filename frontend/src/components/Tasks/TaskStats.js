import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getTaskStats } from '../../utils/taskHelpers';

const TaskStats = ({ tasks, isMobile }) => {
  if (isMobile) {
    return null;
  }

  const stats = getTaskStats(tasks);

  const statCards = [
    {
      title: 'Bekleyen',
      value: stats.bekleyen,
      icon: ScheduleIcon,
      gradient: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
    },
    {
      title: 'Tamamlanan',
      value: stats.tamamlanan,
      icon: CheckCircleIcon,
      gradient: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
    },
    {
      title: 'Geciken',
      value: stats.geciken,
      icon: WarningIcon,
      gradient: 'linear-gradient(135deg, #EF5350 0%, #F44336 100%)',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Grid item xs={12} sm={4} key={index}>
            <Card
              sx={{
                background: stat.gradient,
                color: 'white',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <IconComponent sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant='h4' fontWeight='bold'>
                  {stat.value}
                </Typography>
                <Typography variant='body2'>{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TaskStats;
