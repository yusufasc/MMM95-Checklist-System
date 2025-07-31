import { useCallback } from 'react';
import { tasksAPI, workTasksAPI } from '../services/api';

export const useTaskActions = ({
  controlData,
  onSuccess,
  onError,
  onDataRefresh,
}) => {
  const approveTask = useCallback(
    async taskId => {
      try {
        // Task tipini bul
        const task = Object.values(controlData || {})
          .flatMap(machineData => machineData.tasks)
          .find(t => t._id === taskId);

        if (task?.taskType === 'worktask') {
          await workTasksAPI.approve(taskId, { onayNotu: 'Onaylandı' });
        } else {
          await tasksAPI.approve(taskId, { onayNotu: 'Onaylandı' });
        }

        if (onSuccess) {
          onSuccess('Görev başarıyla onaylandı! ✅');
        }
        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        if (onError) {
          onError(
            'Onaylama sırasında hata oluştu: ' +
              (error.response?.data?.message || error.message),
          );
        }
      }
    },
    [controlData, onSuccess, onError, onDataRefresh],
  );

  const rejectTask = useCallback(
    async (taskId, rejectionNote = '') => {
      try {
        // Task tipini bul
        const task = Object.values(controlData || {})
          .flatMap(machineData => machineData.tasks)
          .find(t => t._id === taskId);

        if (task?.taskType === 'worktask') {
          await workTasksAPI.reject(taskId, { redNotu: rejectionNote });
        } else {
          await tasksAPI.reject(taskId, { redNotu: rejectionNote });
        }

        if (onSuccess) {
          onSuccess('Görev başarıyla reddedildi! ❌');
        }
        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        if (onError) {
          onError(
            'Red işlemi sırasında hata oluştu: ' +
              (error.response?.data?.message || error.message),
          );
        }
      }
    },
    [controlData, onSuccess, onError, onDataRefresh],
  );

  const returnTask = useCallback(
    async (taskId, returnNote = '') => {
      try {
        // Task tipini bul
        const task = Object.values(controlData || {})
          .flatMap(machineData => machineData.tasks)
          .find(t => t._id === taskId);

        if (task?.taskType === 'worktask') {
          await workTasksAPI.return(taskId, { iadeNotu: returnNote });
        } else {
          await tasksAPI.return(taskId, { iadeNotu: returnNote });
        }

        if (onSuccess) {
          onSuccess('Görev başarıyla iade edildi! 🔄');
        }
        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        if (onError) {
          onError(
            'İade işlemi sırasında hata oluştu: ' +
              (error.response?.data?.message || error.message),
          );
        }
      }
    },
    [controlData, onSuccess, onError, onDataRefresh],
  );

  const bulkApprove = useCallback(
    async taskIds => {
      try {
        const approvePromises = taskIds.map(taskId => approveTask(taskId));
        await Promise.all(approvePromises);
        if (onSuccess) {
          onSuccess(`${taskIds.length} görev başarıyla onaylandı! ✅`);
        }
      } catch (error) {
        if (onError) {
          onError(
            'Toplu onaylama sırasında hata oluştu: ' +
              (error.response?.data?.message || error.message),
          );
        }
      }
    },
    [approveTask, onSuccess, onError],
  );

  const canApprove = useCallback(task => {
    // Sadece tamamlanmış ve puanlanmış görevler onaylanabilir
    return (
      task.durum === 'tamamlandi' &&
      task.kontrolSkoru !== null &&
      task.kontrolSkoru !== undefined
    );
  }, []);

  const canReject = useCallback(task => {
    // Tamamlanmış görevler reddedilebilir
    return task.durum === 'tamamlandi';
  }, []);

  const canReturn = useCallback(task => {
    // Tamamlanmış görevler iade edilebilir
    return task.durum === 'tamamlandi';
  }, []);

  const getTaskStats = useCallback(() => {
    if (!controlData) {
      return {
        total: 0,
        completed: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    }

    const allTasks = Object.values(controlData).flatMap(
      machineData => machineData.tasks,
    );

    return {
      total: allTasks.length,
      completed: allTasks.filter(task => task.durum === 'tamamlandi').length,
      approved: allTasks.filter(task => task.durum === 'onaylandi').length,
      pending: allTasks.filter(
        task => task.durum === 'tamamlandi' && !task.kontrolSkoru,
      ).length,
      rejected: allTasks.filter(
        task => task.durum === 'reddedildi' || task.durum === 'iadeEdildi',
      ).length,
    };
  }, [controlData]);

  const getTasksByStatus = useCallback(
    status => {
      if (!controlData) {
        return [];
      }

      return Object.values(controlData)
        .flatMap(machineData => machineData.tasks)
        .filter(task => task.durum === status);
    },
    [controlData],
  );

  return {
    // Actions
    approveTask,
    rejectTask,
    returnTask,
    bulkApprove,

    // Permissions
    canApprove,
    canReject,
    canReturn,

    // Statistics
    getTaskStats,
    getTasksByStatus,
  };
};
