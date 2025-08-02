import React, { memo, useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  CheckCircle as CompleteIcon,
  Work as InProgressIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as ProgressIcon,
} from '@mui/icons-material';

import { TASK_STATUS_CONFIG, PRIORITY_CONFIG } from '../../services/meetingTaskAPI';
import { formatDateToTurkish } from '../../utils/dateHelpers';
import EmojiWrapper from '../EmojiWrapper';

/**
 * ResponsibilityTaskCard Component
 * Görev kartı bileşeni - görev özeti ve hızlı eylemler
 */
const ResponsibilityTaskCard = memo(({
  task,
  onViewTask,
  onProgressUpdate,
  onStatusUpdate,
  canEdit = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Task status config
  const statusConfig = TASK_STATUS_CONFIG[task.durum] || TASK_STATUS_CONFIG.atandi;
  const priorityConfig = PRIORITY_CONFIG[task.oncelik] || PRIORITY_CONFIG.normal;

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Quick actions
  const handleQuickComplete = () => {
    if (canEdit && task.durum !== 'tamamlandi') {
      onStatusUpdate(task._id, 'tamamlandi', 'Görev hızlı tamamlama ile bitirildi');
    }
    handleMenuClose();
  };

  const handleQuickProgress = (percentage) => {
    if (canEdit) {
      onProgressUpdate(task._id, percentage, `Progress %${percentage} olarak güncellendi`);
    }
    handleMenuClose();
  };

  // Colors based on priority and status
  const getCardColor = () => {
    if (task.durum === 'tamamlandi') {
      return 'success.light';
    }
    if (task.oncelik === 'kritik') {
      return 'error.light';
    }
    if (task.oncelik === 'yüksek') {
      return 'warning.light';
    }
    return 'primary.light';
  };

  // Due date status
  const getDueDateStatus = () => {
    if (!task.teslimTarihi) {
      return null;
    }

    const dueDate = new Date(task.teslimTarihi);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', color: 'error', text: `${Math.abs(diffDays)} gün gecikme` };
    }
    if (diffDays === 0) {
      return { status: 'today', color: 'warning', text: 'Bugün teslim' };
    }
    if (diffDays <= 3) {
      return { status: 'soon', color: 'warning', text: `${diffDays} gün kaldı` };
    }
    return { status: 'ontime', color: 'success', text: `${diffDays} gün kaldı` };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderLeft: 4,
        borderLeftColor: getCardColor(),
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
        }}
      >
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        >
          <MoreIcon />
        </IconButton>
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Priority & Status Chips */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
            icon={React.createElement(
              statusConfig.icon === 'assignment' ? AssignmentIcon :
                statusConfig.icon === 'work' ? InProgressIcon :
                  statusConfig.icon === 'check_circle' ? CompleteIcon :
                    ScheduleIcon,
            )}
          />

          <Chip
            label={priorityConfig.label}
            color={priorityConfig.color}
            size="small"
            variant="outlined"
          />

          {dueDateStatus && (
            <Chip
              label={dueDateStatus.text}
              color={dueDateStatus.color}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* Task Title */}
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            lineHeight: 1.3,
            mb: 1,
            pr: 4, // Space for menu button
          }}
        >
          {task.baslik}
        </Typography>

        {/* Task Description */}
        {task.aciklama && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
          >
            {task.aciklama}
          </Typography>
        )}

        {/* Meeting Info */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: '0.75rem',
              bgcolor: 'primary.main',
            }}
          >
            <EmojiWrapper emoji="📋" label="Toplantı" />
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {task.meeting?.baslik || 'Toplantı'}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              İlerleme
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              %{task.tamamlanmaYuzdesi || 0}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={task.tamamlanmaYuzdesi || 0}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Dates */}
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Atanma: {formatDateToTurkish(task.atanmaTarihi)}
          </Typography>
          {task.teslimTarihi && (
            <Typography variant="caption" color="text.secondary" display="block">
              Teslim: {formatDateToTurkish(task.teslimTarihi)}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => onViewTask(task)}
          fullWidth
        >
          Detayları Görüntüle
        </Button>
      </CardActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => onViewTask(task)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          Detayları Görüntüle
        </MenuItem>

        {canEdit && task.durum !== 'tamamlandi' && [
          <Divider key="divider" />,
          <MenuItem key="25" onClick={() => handleQuickProgress(25)}>
            <ProgressIcon fontSize="small" sx={{ mr: 1 }} />
            %25 İlerleme
          </MenuItem>,
          <MenuItem key="50" onClick={() => handleQuickProgress(50)}>
            <ProgressIcon fontSize="small" sx={{ mr: 1 }} />
            %50 İlerleme
          </MenuItem>,
          <MenuItem key="75" onClick={() => handleQuickProgress(75)}>
            <ProgressIcon fontSize="small" sx={{ mr: 1 }} />
            %75 İlerleme
          </MenuItem>,
          <MenuItem key="complete" onClick={handleQuickComplete}>
            <CompleteIcon fontSize="small" sx={{ mr: 1 }} />
            Tamamla
          </MenuItem>,
        ]}
      </Menu>
    </Card>
  );
});

ResponsibilityTaskCard.displayName = 'ResponsibilityTaskCard';

export default ResponsibilityTaskCard;