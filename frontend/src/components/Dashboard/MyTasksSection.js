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
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  MESSAGES,
  BUTTON_LABELS,
  ROUTES,
  getTaskStatusConfig,
} from '../../utils/dashboardConfig';

const MyTasksSection = ({ tasks }) => {
  const navigate = useNavigate();

  const handleTaskStart = taskId => {
    navigate(`/tasks/${taskId}`);
  };

  const handleViewAllTasks = () => {
    navigate(ROUTES.TASKS);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AssignmentIcon sx={{ fontSize: 30, color: '#1976d2', mr: 2 }} />
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Bekleyen Görevlerim ({tasks.length})
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
          <Typography variant='h6' color='text.secondary'>
            {MESSAGES.NO_TASKS}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {tasks.map(task => {
            const statusConfig = getTaskStatusConfig(task.durum);

            return (
              <Grid size={{ xs: 12, md: 6 }} key={task._id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PendingIcon sx={{ color: '#ff9800', mr: 1 }} />
                      <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                        {task.checklist?.ad || 'Görev'}
                      </Typography>
                    </Box>

                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      {task.checklist?.aciklama || 'Görev açıklaması'}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Chip
                        label={statusConfig.label}
                        color={statusConfig.chipColor}
                        size='small'
                      />
                      <Button
                        variant='contained'
                        size='small'
                        onClick={() => handleTaskStart(task._id)}
                      >
                        {BUTTON_LABELS.START_TASK}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button
          variant='outlined'
          size='large'
          onClick={handleViewAllTasks}
          startIcon={<AssignmentIcon />}
        >
          {BUTTON_LABELS.ALL_TASKS}
        </Button>
      </Box>
    </Paper>
  );
};

export default MyTasksSection;
