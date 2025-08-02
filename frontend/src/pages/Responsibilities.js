import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Fab,
  Zoom,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Import components
import ResponsibilityStats from '../components/Responsibilities/ResponsibilityStats';
import ResponsibilityFilters from '../components/Responsibilities/ResponsibilityFilters';
import ResponsibilityTaskCard from '../components/Responsibilities/ResponsibilityTaskCard';
import TaskDetailDialog from '../components/Responsibilities/TaskDetailDialog';

// Import hooks
import useMeetingTasks from '../hooks/useMeetingTasks';
import { useAuth } from '../contexts/AuthContext';

// Import components
import EmojiWrapper from '../components/EmojiWrapper';

/**
 * Responsibilities Page
 * Kullanıcının meeting görevlerini listeleyen ana sayfa
 */
const Responsibilities = () => {
  const { user } = useAuth();

  // Meeting tasks hook
  const {
    tasks,
    statistics,
    pagination,
    loading,
    error,
    filters,
    loadTasks,
    applyFilters,
    clearFilters,
    updateTaskProgress,
    updateTaskStatus,
    addTaskComment,
    clearError,
  } = useMeetingTasks();

  // Local state
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Handlers
  const handleViewTask = useCallback((task) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailDialogOpen(false);
    setSelectedTask(null);
  }, []);

  const handleProgressUpdate = useCallback(async (taskId, percentage, note) => {
    const result = await updateTaskProgress(taskId, percentage, note);
    if (result.success && selectedTask?._id === taskId) {
      // Update selected task in dialog
      setSelectedTask(prev => ({
        ...prev,
        tamamlanmaYuzdesi: percentage,
      }));
    }
    return result;
  }, [updateTaskProgress, selectedTask]);

  const handleStatusUpdate = useCallback(async (taskId, status, note) => {
    const result = await updateTaskStatus(taskId, status, note);
    if (result.success && selectedTask?._id === taskId) {
      // Update selected task in dialog
      setSelectedTask(prev => ({
        ...prev,
        durum: status,
      }));
    }
    return result;
  }, [updateTaskStatus, selectedTask]);

  const handleAddComment = useCallback(async (taskId, comment, type) => {
    const result = await addTaskComment(taskId, comment, type);
    if (result.success && selectedTask?._id === taskId) {
      // Add comment to selected task in dialog
      setSelectedTask(prev => ({
        ...prev,
        yorumlar: [
          ...(prev.yorumlar || []),
          {
            yorum: comment,
            tip: type,
            yazan: user,
            tarih: new Date(),
          },
        ],
      }));
    }
    return result;
  }, [addTaskComment, selectedTask, user]);

  const handleRefresh = useCallback(() => {
    clearError();
    loadTasks();
  }, [clearError, loadTasks]);

  // Compute values
  const hasData = useMemo(() => {
    return !loading && !error && tasks.length > 0;
  }, [loading, error, tasks]);

  const hasFilters = useMemo(() => {
    return Object.values(filters).some(value =>
      value !== null && value !== undefined && value !== '',
    );
  }, [filters]);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <EmojiWrapper emoji="📋" label="Sorumluluklarım" /> Sorumluluklarım
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Size atanan toplantı görevlerini takip edin ve güncelleyin
        </Typography>
      </Box>

      {/* Statistics */}
      {hasData && (
        <ResponsibilityStats statistics={statistics} />
      )}

      {/* Filters */}
      <Box mb={3}>
        <ResponsibilityFilters
          filters={filters}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* No Data */}
      {!loading && !error && tasks.length === 0 && (
        <Box textAlign="center" py={6}>
          {hasFilters ? (
            <Alert severity="info">
              Filtrelere uygun görev bulunamadı.
              <Box component="span" sx={{ cursor: 'pointer', textDecoration: 'underline', ml: 1 }} onClick={clearFilters}>
                Filtreleri temizle
              </Box>
            </Alert>
          ) : (
            <Alert severity="info">
              Henüz size atanmış görev bulunmuyor.
              Toplantılara katılarak görev alabilirsiniz.
            </Alert>
          )}
        </Box>
      )}

      {/* Tasks Grid */}
      {hasData && (
        <Grid container spacing={3}>
          {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={task._id}>
              <ResponsibilityTaskCard
                task={task}
                onViewTask={handleViewTask}
                onProgressUpdate={handleProgressUpdate}
                onStatusUpdate={handleStatusUpdate}
                canEdit={task.sorumlu._id === user?._id}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {hasData && pagination.total > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          {/* Pagination component would go here */}
        </Box>
      )}

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        open={detailDialogOpen}
        task={selectedTask}
        onClose={handleCloseDetail}
        onProgressUpdate={handleProgressUpdate}
        onStatusUpdate={handleStatusUpdate}
        onAddComment={handleAddComment}
        canEdit={selectedTask?.sorumlu._id === user?._id}
      />

      {/* Floating Action Button */}
      <Zoom in={hasData}>
        <Fab
          color="primary"
          aria-label="refresh"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={handleRefresh}
        >
          <RefreshIcon />
        </Fab>
      </Zoom>
    </Container>
  );
};

export default Responsibilities;