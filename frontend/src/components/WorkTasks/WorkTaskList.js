import React, { memo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Utility function to calculate task progress
 * AI Guide Pattern: Pure functions for reusability with safe guards
 */
const calculateTaskProgress = task => {
  if (
    !task ||
    !Array.isArray(task.checklistMaddeler) ||
    task.checklistMaddeler.length === 0
  ) {
    return 0;
  }

  const completedItems = task.checklistMaddeler.filter(
    item => item && item.tamamlandi === true,
  ).length;

  return Math.round((completedItems / task.checklistMaddeler.length) * 100);
};

/**
 * Get status color and label
 * AI Guide Pattern: Configuration-driven approach with safe guards
 */
const getTaskStatus = (task, showCompleted) => {
  if (showCompleted) {
    return {
      color: 'success',
      label: 'Tamamlandı',
      icon: <CheckCircleIcon />,
    };
  }

  if (!task) {
    return {
      color: 'info',
      label: 'Bilinmiyor',
      icon: <ScheduleIcon />,
    };
  }

  const progress = calculateTaskProgress(task);

  if (progress === 0) {
    return {
      color: 'info',
      label: 'Başlanmadı',
      icon: <ScheduleIcon />,
    };
  } else if (progress < 100) {
    return {
      color: 'warning',
      label: 'Devam Ediyor',
      icon: <PlayArrowIcon />,
    };
  } else {
    return {
      color: 'success',
      label: 'Tamamlandı',
      icon: <CheckCircleIcon />,
    };
  }
};

/**
 * Individual Task Card Component
 * AI Guide Pattern: Memoized for performance
 */
const TaskCard = memo(
  ({ task, onContinueTask, onCompletedTaskClick, showCompleted }) => {
    const progress = calculateTaskProgress(task);
    const status = getTaskStatus(task, showCompleted);

    // Format dates with proper localization and error handling
    const createdDate = task.createdAt
      ? (() => {
          try {
            return formatDistanceToNow(new Date(task.createdAt), {
              addSuffix: true,
              locale: tr,
            });
          } catch (error) {
            return 'Geçersiz tarih';
          }
        })()
      : 'Bilinmiyor';

    const completedDate = task.tamamlanmaZamani
      ? (() => {
          try {
            return formatDistanceToNow(new Date(task.tamamlanmaZamani), {
              addSuffix: true,
              locale: tr,
            });
          } catch (error) {
            return 'Geçersiz tarih';
          }
        })()
      : null;

    return (
      <Grid item xs={12} sm={6} md={4}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3, // AI Guide: Modern rounded corners
            border: '1px solid',
            borderColor: 'grey.200',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              transform: 'translateY(-2px)',
              borderColor: `${status.color}.main`,
            },
          }}
        >
          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: `${status.color}.main`,
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <BuildIcon />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant='h6'
                  component='div'
                  noWrap
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {typeof task.checklist === 'object' && task.checklist?.ad
                    ? task.checklist.ad
                    : typeof task.checklist === 'string'
                      ? task.checklist
                      : 'Görev'}
                </Typography>

                <Chip
                  icon={status.icon}
                  label={status.label}
                  color={status.color}
                  size='small'
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            </Box>

            {/* Task Details */}
            {task.makina && (
              <Typography variant='body2' color='text.secondary' gutterBottom>
                <strong>Makina:</strong>{' '}
                {typeof task.makina === 'object'
                  ? task.makina.ad || task.makina.envanterKodu || 'Makina'
                  : task.makina}
              </Typography>
            )}

            {task.checklist?.aciklama && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  mb: 2,
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  lineHeight: 1.4,
                }}
              >
                {task.checklist.aciklama}
              </Typography>
            )}

            {/* Progress Section */}
            {!showCompleted && task.checklistMaddeler && (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    İlerleme
                  </Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={progress}
                  color={status.color}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ mt: 0.5 }}
                >
                  {
                    (task.checklistMaddeler || []).filter(
                      item => item.tamamlandi,
                    ).length
                  }{' '}
                  / {(task.checklistMaddeler || []).length} madde
                </Typography>
              </Box>
            )}

            {/* Date Information */}
            <Box sx={{ mt: 'auto' }}>
              <Typography variant='caption' color='text.secondary'>
                {showCompleted && completedDate
                  ? `Tamamlandı: ${completedDate}`
                  : `Başladı: ${createdDate}`}
              </Typography>
            </Box>
          </CardContent>

          {/* Action Buttons */}
          <CardActions sx={{ p: 2, pt: 0 }}>
            {showCompleted ? (
              <Button
                fullWidth
                variant='outlined'
                startIcon={<VisibilityIcon />}
                onClick={() => onCompletedTaskClick(task)}
                sx={{ minHeight: 44 }} // AI Guide: Touch-friendly
              >
                Detayları Gör
              </Button>
            ) : (
              <Button
                fullWidth
                variant='contained'
                color={progress === 100 ? 'success' : 'primary'}
                startIcon={
                  progress === 100 ? <CheckCircleIcon /> : <PlayArrowIcon />
                }
                onClick={() => onContinueTask(task)}
                sx={{ minHeight: 44 }} // AI Guide: Touch-friendly
              >
                {progress === 100 ? 'Tamamlandı' : 'Devam Et'}
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  },
);

TaskCard.displayName = 'TaskCard';

/**
 * Main WorkTaskList Component
 * AI Guide Pattern: Clean component structure with proper states
 */
const WorkTaskList = ({
  tasks,
  loading,
  onContinueTask,
  onCompletedTaskClick,
  showCompleted,
}) => {
  // Loading State
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          minHeight: 200,
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Empty State
  if (!tasks || tasks.length === 0) {
    return (
      <Alert severity='info' sx={{ borderRadius: 3 }}>
        <Typography variant='h6' gutterBottom>
          {showCompleted
            ? 'Henüz tamamlanmış görev bulunmuyor'
            : 'Henüz devam eden görev bulunmuyor'}
        </Typography>
        <Typography variant='body2'>
          {showCompleted
            ? 'Görevlerinizi tamamladığınızda burada görünecekler'
            : "Yeni görev başlatmak için aşağıdaki checklist'lerden birini seçin"}
        </Typography>
      </Alert>
    );
  }

  // Main Grid
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
      {tasks.map(task => (
        <TaskCard
          key={task._id}
          task={task}
          onContinueTask={onContinueTask}
          onCompletedTaskClick={onCompletedTaskClick}
          showCompleted={showCompleted}
        />
      ))}
    </Grid>
  );
};

export default memo(WorkTaskList);
