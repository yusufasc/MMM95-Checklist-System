import { useState, useRef } from 'react';
import { tasksAPI } from '../services/api';

const useTaskDialog = selectedMachines => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDialog, setTaskDialog] = useState(false);
  const [taskData, setTaskData] = useState({ maddeler: [], makina: '' });
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const fileInputRefs = useRef({});

  const handleTaskClick = task => {
    setSelectedTask(task);

    // Makina seçimi - öncelik sırası:
    // 1. Görevde zaten atanmış makina
    // 2. Üstte seçilen makina (selectedMachines[0])
    // 3. Boş
    const assignedMakina =
      task.makina?._id ||
      (selectedMachines.length > 0 ? selectedMachines[0]._id : '');

    setTaskData({
      maddeler: task.maddeler.map(madde => ({
        ...madde,
        resimUrl: madde.resimUrl || '',
        resimFile: null,
      })),
      makina: assignedMakina,
    });
    setTaskDialog(true);
  };

  const handleTaskClose = () => {
    setTaskDialog(false);
    setSelectedTask(null);
    setTaskData({ maddeler: [], makina: '' });
    setCompleting(false);
  };

  const handleMaddeChange = (index, field, value) => {
    const newMaddeler = [...taskData.maddeler];
    newMaddeler[index][field] = value;

    // Puan hesaplama
    if (field === 'cevap') {
      newMaddeler[index].puan = value ? newMaddeler[index].maxPuan : 0;
    }

    setTaskData({ ...taskData, maddeler: newMaddeler });
  };

  const handleTaskStart = async (onSuccess, onError) => {
    if (starting) {
      return;
    }

    try {
      setStarting(true);

      // Makina kontrolü - ZORUNLU
      const finalMakina =
        taskData.makina ||
        (selectedMachines.length > 0 ? selectedMachines[0]._id : '');

      if (!finalMakina) {
        onError(
          '⚠️ Makina seçimi zorunludur! Görevi başlatmak için bir makina seçin.',
        );
        setStarting(false);
        return;
      }

      console.log('🚀 Görevi başlatıyor:', {
        taskId: selectedTask._id,
        makina: finalMakina,
      });

      const startData = {
        makina: finalMakina,
      };

      await tasksAPI.start(selectedTask._id, startData);
      onSuccess(
        `Görev başarıyla başlatıldı! Makina: ${selectedMachines.find(m => m._id === finalMakina)?.makinaNo || 'Seçili makina'} 🎉`,
      );
      handleTaskClose();
    } catch (error) {
      onError(
        'Görev başlatılırken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
      setStarting(false);
    }
  };

  const handleTaskComplete = async (onSuccess, onError) => {
    if (completing) {
      return;
    }

    try {
      setCompleting(true);

      // Makina kontrolü - ZORUNLU
      const finalMakina = taskData.makina || selectedTask?.makina?._id;

      if (!finalMakina) {
        onError('⚠️ Makina seçimi zorunludur! Lütfen bir makina seçin.');
        setCompleting(false);
        return;
      }

      // Resim dosyalarını base64 olarak hazırla
      const processedMaddeler = taskData.maddeler.map(madde => ({
        ...madde,
        resimFile: undefined,
      }));

      const completeData = {
        maddeler: processedMaddeler,
        makina: finalMakina,
      };

      await tasksAPI.complete(selectedTask._id, completeData);
      onSuccess('Görev başarıyla tamamlandı! 🎉');
      handleTaskClose();
    } catch (error) {
      onError(
        'Görev tamamlanırken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
      setCompleting(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!taskData.maddeler.length) {
      return 0;
    }
    const completedCount = taskData.maddeler.filter(m => m.cevap).length;
    return Math.round((completedCount / taskData.maddeler.length) * 100);
  };

  const getTotalScore = () => {
    return taskData.maddeler.reduce(
      (total, madde) => total + (madde.puan || 0),
      0,
    );
  };

  const getMaxScore = () => {
    return taskData.maddeler.reduce((total, madde) => total + madde.maxPuan, 0);
  };

  const getCompletedItemsWithImages = () => {
    return taskData.maddeler.filter(m => m.cevap && m.resimUrl).length;
  };

  return {
    // State
    selectedTask,
    taskDialog,
    taskData,
    completing,
    starting,
    fileInputRefs,

    // Actions
    handleTaskClick,
    handleTaskClose,
    handleMaddeChange,
    handleTaskStart,
    handleTaskComplete,

    // Calculations
    getCompletionPercentage,
    getTotalScore,
    getMaxScore,
    getCompletedItemsWithImages,

    // Setters
    setTaskData,
  };
};

export default useTaskDialog;
