import { useState, useCallback } from 'react';
import { tasksAPI, workTasksAPI } from '../services/api';

export const useTaskScoring = ({
  onSuccess,
  onError,
  onDataRefresh,
  onTabSwitch,
}) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [scoreDialog, setScoreDialog] = useState(false);
  const [scoringData, setScoringData] = useState({
    maddeler: [],
    kontrolNotu: '',
  });
  const [showComments, setShowComments] = useState({});

  const openScoreDialog = useCallback(task => {
    setSelectedTask(task);
    setScoringData({
      maddeler: task.maddeler.map(madde => ({
        ...madde,
        kontrolPuani:
          madde.kontrolPuani !== null && madde.kontrolPuani !== undefined
            ? madde.kontrolPuani
            : madde.maxPuan || madde.puan,
        kontrolYorumu: madde.kontrolYorumu || '',
        kontrolResimUrl: madde.kontrolResimUrl || '',
      })),
      kontrolNotu: '',
    });
    setScoreDialog(true);
  }, []);

  const closeScoreDialog = useCallback(() => {
    setScoreDialog(false);
    setSelectedTask(null);
    setScoringData({ maddeler: [], kontrolNotu: '' });
    setShowComments({});
  }, []);

  const updateMaddeScore = useCallback((index, field, value) => {
    setScoringData(prev => {
      const newMaddeler = [...prev.maddeler];
      newMaddeler[index] = {
        ...newMaddeler[index],
        [field]: value,
      };
      return {
        ...prev,
        maddeler: newMaddeler,
      };
    });
  }, []);

  const updateKontrolNotu = useCallback(value => {
    setScoringData(prev => ({
      ...prev,
      kontrolNotu: value,
    }));
  }, []);

  const submitScore = useCallback(async () => {
    if (!selectedTask) {
      return;
    }

    try {
      console.log('🎯 Puanlama başlatılıyor:', {
        taskId: selectedTask._id,
        taskType: selectedTask.taskType,
        scoringData: scoringData,
      });

      // WorkTask mı yoksa Task mı kontrol et
      if (selectedTask.taskType === 'worktask') {
        console.log('📋 WorkTask API kullanılıyor');
        await workTasksAPI.scoreItems(selectedTask._id, scoringData);
      } else {
        console.log('📋 Task API kullanılıyor');
        await tasksAPI.scoreItems(selectedTask._id, scoringData);
      }

      if (onSuccess) {
        onSuccess(
          'Puanlama başarıyla kaydedildi ve görev onaylandı! 🎉 Onaylanan görevler "Onaylananlar" sekmesinde görünecektir.',
        );
      }
      closeScoreDialog();

      // Veriyi yeniden yükle (cache sorunlarından kaçınmak için gecikme ile)
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
        }, 500);
      }

      // Puanlama sonrası onaylananlar tab'ına geç
      if (onTabSwitch) {
        setTimeout(() => {
          onTabSwitch(1); // Tab 1: Onaylananlar
        }, 1000);
      }
    } catch (error) {
      if (onError) {
        onError(
          'Puanlama kaydedilirken hata oluştu: ' +
            (error.response?.data?.message || error.message),
        );
      }
    }
  }, [
    selectedTask,
    scoringData,
    onSuccess,
    onError,
    onDataRefresh,
    onTabSwitch,
    closeScoreDialog,
  ]);

  const toggleComments = useCallback(maddeId => {
    setShowComments(prev => ({
      ...prev,
      [maddeId]: !prev[maddeId],
    }));
  }, []);

  // Scoring calculations
  const getTotalControlScore = useCallback(() => {
    return scoringData.maddeler.reduce((total, madde) => {
      return total + (madde.kontrolPuani || 0);
    }, 0);
  }, [scoringData.maddeler]);

  const getMaxControlScore = useCallback(() => {
    return scoringData.maddeler.reduce((total, madde) => {
      return total + (madde.maxPuan || madde.puan || 0);
    }, 0);
  }, [scoringData.maddeler]);

  const getScorePercentage = useCallback(() => {
    const total = getTotalControlScore();
    const max = getMaxControlScore();
    return max > 0 ? Math.round((total / max) * 100) : 0;
  }, [getTotalControlScore, getMaxControlScore]);

  const getTaskImagesCount = useCallback(task => {
    return (
      task?.maddeler?.reduce((count, madde) => {
        return (
          count + (madde.resimUrl ? 1 : 0) + (madde.kontrolResimUrl ? 1 : 0)
        );
      }, 0) || 0
    );
  }, []);

  const canScoreTask = useCallback(task => {
    // Sadece tamamlanmış görevleri puanlayabilir
    if (task.durum !== 'tamamlandi') {
      return false;
    }

    // Eğer zaten puanlanmış ise tekrar puanlanamaz
    if (task.kontrolSkoru !== null && task.kontrolSkoru !== undefined) {
      return false;
    }

    return true;
  }, []);

  const canViewTask = useCallback(_task => {
    // Tüm durumları görüntüleyebilir, ancak puanlama yetkisi kontrolü ayrı yapılır
    return true;
  }, []);

  const getScoreColor = useCallback(percentage => {
    if (percentage >= 80) {
      return 'success';
    }
    if (percentage >= 60) {
      return 'warning';
    }
    return 'error';
  }, []);

  return {
    // State
    selectedTask,
    scoreDialog,
    scoringData,
    showComments,

    // Actions
    openScoreDialog,
    closeScoreDialog,
    updateMaddeScore,
    updateKontrolNotu,
    submitScore,
    toggleComments,

    // Calculations
    getTotalControlScore,
    getMaxControlScore,
    getScorePercentage,
    getTaskImagesCount,
    canScoreTask,
    canViewTask,
    getScoreColor,
  };
};
