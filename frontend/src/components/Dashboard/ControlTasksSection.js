import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Badge,
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  MESSAGES,
  BUTTON_LABELS,
  ROUTES,
  formatUserName,
  getMachineDisplayName,
} from '../../utils/dashboardConfig';

const ControlTasksSection = ({ tasks }) => {
  const navigate = useNavigate();

  const handleScoreTask = () => {
    navigate(ROUTES.CONTROL_PENDING);
  };

  const handleViewAllControls = () => {
    navigate(ROUTES.CONTROL_PENDING);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Badge badgeContent={tasks.length} color='error'>
          <ReviewIcon sx={{ fontSize: 30, color: '#f57c00', mr: 2 }} />
        </Badge>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Kontrol Bekleyen Görevler ({tasks.length})
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
          <Typography variant='h6' color='text.secondary'>
            {MESSAGES.NO_CONTROL_TASKS}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {tasks.map(task => (
            <Grid size={{ xs: 12, md: 6 }} key={task._id}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '2px solid #ff9800',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(255,152,0,0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ScheduleIcon sx={{ color: '#ff9800', mr: 1 }} />
                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                      {task.checklist?.ad || 'Kontrol Görevi'}
                    </Typography>
                  </Box>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    Kullanıcı: {formatUserName(task.kullanici)}
                  </Typography>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    Makina: {getMachineDisplayName(task.makina)}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Chip
                      label='Puanlama Bekliyor'
                      color='warning'
                      size='small'
                      icon={<AssessmentIcon />}
                    />
                    <Button
                      variant='contained'
                      size='small'
                      color='warning'
                      onClick={handleScoreTask}
                    >
                      {BUTTON_LABELS.SCORE_TASK}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button
          variant='outlined'
          size='large'
          color='warning'
          onClick={handleViewAllControls}
          startIcon={<ReviewIcon />}
        >
          {BUTTON_LABELS.ALL_CONTROLS}
        </Button>
      </Box>
    </Paper>
  );
};

export default ControlTasksSection;
