import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';

export const useControlData = ({ selectedMachines }) => {
  const [controlData, setControlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsMachineSelection, setNeedsMachineSelection] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const controlResponse = await tasksAPI.getControlPending();

      if (controlResponse.data.needsMachineSelection) {
        setNeedsMachineSelection(true);
        setControlData(null);
      } else {
        setNeedsMachineSelection(false);
        setControlData(controlResponse.data.groupedTasks || {});
      }
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const showSuccess = useCallback(message => {
    setSuccess(message);
    // Auto-clear success message after 5 seconds
    setTimeout(() => setSuccess(''), 5000);
  }, []);

  const showError = useCallback(message => {
    setError(message);
    // Auto-clear error message after 10 seconds
    setTimeout(() => setError(''), 10000);
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Utility functions
  const getTasksCount = useCallback(() => {
    if (!controlData) {
      return 0;
    }
    return Object.values(controlData).reduce(
      (total, machineData) => total + machineData.tasks.length,
      0,
    );
  }, [controlData]);

  const getTaskByMachine = useCallback(
    makinaId => {
      if (!controlData) {
        return [];
      }
      return controlData[makinaId]?.tasks || [];
    },
    [controlData],
  );

  const findTask = useCallback(
    taskId => {
      if (!controlData) {
        return null;
      }
      return Object.values(controlData)
        .flatMap(machineData => machineData.tasks)
        .find(task => task._id === taskId);
    },
    [controlData],
  );

  const getStatusColor = useCallback(status => {
    switch (status) {
      case 'tamamlandi':
        return 'warning';
      case 'onaylandi':
        return 'success';
      case 'iadeEdildi':
      case 'reddedildi':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const getStatusText = useCallback(status => {
    switch (status) {
      case 'tamamlandi':
        return 'Kontrol Bekliyor';
      case 'onaylandi':
        return 'Onaylandı';
      case 'iadeEdildi':
        return 'İade Edildi';
      case 'reddedildi':
        return 'Reddedildi';
      default:
        return status;
    }
  }, []);

  const getStatusIcon = useCallback(status => {
    switch (status) {
      case 'tamamlandi':
        return 'PendingActionsIcon';
      case 'onaylandi':
        return 'CheckCircleIcon';
      case 'iadeEdildi':
      case 'reddedildi':
        return 'CancelIcon';
      default:
        return 'InfoIcon';
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, selectedMachines]);

  return {
    // Data
    controlData,
    loading,
    error,
    success,
    needsMachineSelection,

    // Actions
    loadData,
    showSuccess,
    showError,
    clearMessages,

    // Utilities
    getTasksCount,
    getTaskByMachine,
    findTask,
    getStatusColor,
    getStatusText,
    getStatusIcon,
  };
};
