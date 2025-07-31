import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import useTasksData from '../hooks/useTasksData';
import useTaskDialog from '../hooks/useTaskDialog';
import useImageHandler from '../hooks/useImageHandler';
import TaskStats from '../components/Tasks/TaskStats';
import MachineAlert from '../components/Tasks/MachineAlert';
import TaskTabs from '../components/Tasks/TaskTabs';
import TaskCard from '../components/Tasks/TaskCard';
import TaskDialog from '../components/Tasks/TaskDialog';
import { filterTasks } from '../utils/taskHelpers';

const Tasks = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);

  const { selectedMachines } = useAuth();

  // Custom hooks
  const {
    tasks,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    showError,
    showSuccess,
    loadData,
  } = useTasksData(selectedMachines);

  const {
    selectedTask,
    taskDialog,
    taskData,
    completing,
    starting,
    fileInputRefs,
    handleTaskClick,
    handleTaskClose,
    handleMaddeChange,
    handleTaskStart,
    handleTaskComplete,
    getCompletionPercentage,
    getTotalScore,
    getMaxScore,
    getCompletedItemsWithImages,
    setTaskData,
  } = useTaskDialog(selectedMachines);

  const {
    imagePreview,
    imageDialog,
    handleImageUpload,
    handleImageDelete,
    handleImagePreview,
    closeImageDialog,
  } = useImageHandler();

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const onTaskStart = () => {
    handleTaskStart(message => {
      showSuccess(message);
      loadData();
    }, showError);
  };

  const onTaskComplete = () => {
    handleTaskComplete(message => {
      showSuccess(message);
      loadData();
    }, showError);
  };

  const onImageUpload = (index, event) => {
    handleImageUpload(
      index,
      event,
      taskData,
      setTaskData,
      showSuccess,
      showError,
    );
  };

  const onImageDelete = index => {
    handleImageDelete(index, taskData, setTaskData, fileInputRefs);
  };

  // Filtered tasks
  const filteredTasks = filterTasks(tasks, tabValue);

  if (loading) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress size={60} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Görevler yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              mr: 1.5,
              width: { xs: 32, md: 56 },
              height: { xs: 32, md: 56 },
            }}
          >
            <AssignmentIcon fontSize={isMobile ? 'small' : 'large'} />
          </Avatar>
          <Box>
            <Typography
              variant={isMobile ? 'h6' : 'h4'}
              component='h1'
              fontWeight='bold'
            >
              Görevlerim
            </Typography>
            {!isMobile && (
              <Typography variant='subtitle1' color='text.secondary'>
                Günlük görevlerinizi takip edin ve tamamlayın
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity='error' sx={{ mb: 2, py: 1 }} onClose={clearError}>
          <Typography variant='body2'>{error}</Typography>
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 2, py: 1 }} onClose={clearSuccess}>
          <Typography variant='body2'>{success}</Typography>
        </Alert>
      )}

      {/* Machine Alert */}
      <MachineAlert selectedMachines={selectedMachines} />

      {/* Statistics */}
      <TaskStats tasks={tasks} isMobile={isMobile} />

      {/* Tabs */}
      <TaskTabs
        tabValue={tabValue}
        onTabChange={handleTabChange}
        isMobile={isMobile}
      />

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Paper
          sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 2 }}
        >
          <AssignmentIcon
            sx={{
              fontSize: { xs: 48, md: 80 },
              color: 'text.secondary',
              mb: 1,
            }}
          />
          <Typography
            variant={isMobile ? 'body1' : 'h5'}
            color='text.secondary'
            gutterBottom
          >
            {selectedMachines.length === 0
              ? 'Önce makina seçimi yapın'
              : tabValue === 0
                ? 'Bekleyen görev bulunmuyor'
                : tabValue === 1
                  ? 'Tamamlanan görev bulunmuyor'
                  : 'Geciken görev bulunmuyor'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {selectedMachines.length === 0
              ? 'Görevlerinizi görmek için makina seçimi yapmanız gerekiyor.'
              : 'Yeni görevler eklendiğinde burada görünecek.'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={isMobile ? 1 : 2}>
          {filteredTasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onTaskClick={handleTaskClick}
              isMobile={isMobile}
            />
          ))}
        </Stack>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialog}
        onClose={handleTaskClose}
        selectedTask={selectedTask}
        taskData={taskData}
        completing={completing}
        starting={starting}
        selectedMachines={selectedMachines}
        fileInputRefs={fileInputRefs}
        isMobile={isMobile}
        onMaddeChange={handleMaddeChange}
        onImageUpload={onImageUpload}
        onImageDelete={onImageDelete}
        onImagePreview={handleImagePreview}
        onTaskStart={onTaskStart}
        onTaskComplete={onTaskComplete}
        imageDialog={imageDialog}
        imagePreview={imagePreview}
        onImageDialogClose={closeImageDialog}
        getCompletionPercentage={getCompletionPercentage}
        getTotalScore={getTotalScore}
        getMaxScore={getMaxScore}
        getCompletedItemsWithImages={getCompletedItemsWithImages}
        setTaskData={setTaskData}
      />
    </Box>
  );
};

export default Tasks;
