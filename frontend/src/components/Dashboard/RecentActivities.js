import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const RecentActivities = ({ recentActivities = [] }) => {
  // Default activities if none provided
  const defaultActivities = [
    {
      id: 1,
      type: 'task_completed',
      title: 'Görev Tamamlandı',
      description: 'Makina kontrolü başarıyla tamamlandı',
      user: 'Ahmet Yılmaz',
      time: '2 saat önce',
      status: 'success',
    },
    {
      id: 2,
      type: 'task_assigned',
      title: 'Yeni Görev Atandı',
      description: 'Kalıp değişimi görevi atandı',
      user: 'Mehmet Kaya',
      time: '4 saat önce',
      status: 'info',
    },
    {
      id: 3,
      type: 'task_pending',
      title: 'Görev Beklemede',
      description: 'Kontrol işlemi onay bekliyor',
      user: 'Ayşe Demir',
      time: '6 saat önce',
      status: 'warning',
    },
  ];

  const activities =
    recentActivities.length > 0 ? recentActivities : defaultActivities;

  const getActivityIcon = type => {
    switch (type) {
      case 'task_completed':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'task_assigned':
        return <AssignmentIcon sx={{ color: '#2196f3' }} />;
      case 'task_pending':
        return <ScheduleIcon sx={{ color: '#ff9800' }} />;
      default:
        return <PersonIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getStatusChip = status => {
    const configs = {
      success: { label: 'Tamamlandı', color: 'success' },
      info: { label: 'Atandı', color: 'info' },
      warning: { label: 'Beklemede', color: 'warning' },
      error: { label: 'Hata', color: 'error' },
    };

    const config = configs[status] || configs.info;
    return <Chip label={config.label} color={config.color} size='small' />;
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 3 }}>
        Son Aktiviteler
      </Typography>

      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {activities.map((activity, index) => (
          <ListItem
            key={activity.id || `activity-${index}`}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              mb: 2,
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'transparent' }}>
                {getActivityIcon(activity.type)}
              </Avatar>
            </ListItemIcon>

            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                    {activity.title}
                  </Typography>
                  {getStatusChip(activity.status)}
                </Box>
              }
              secondary={
                <Box component='span'>
                  <Typography
                    component='span'
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {activity.description}
                  </Typography>
                  <Box
                    component='span'
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant='caption' color='text.secondary'>
                      <span role='img' aria-label='user'>
                        👤
                      </span>{' '}
                      {activity.user}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      <span role='img' aria-label='time'>
                        🕒
                      </span>{' '}
                      {activity.time}
                    </Typography>
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {activities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='body2' color='text.secondary'>
            Henüz aktivite bulunmuyor.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RecentActivities;
