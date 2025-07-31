import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';

export const useControlPendingData = (selectedMachines = []) => {
  const [controlData, setControlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsMachineSelection, setNeedsMachineSelection] = useState(false);

  // Clear messages
  const clearError = useCallback(() => setError(''), []);
  const clearSuccess = useCallback(() => setSuccess(''), []);

  // Load control pending data - SADECE RUTIN CHECKLISTLER (Task)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log(
        '🔍 Frontend - Seçili makinalar:',
        selectedMachines?.length || 0,
      );
      console.log('🔍 Frontend - selectedMachines içeriği:', selectedMachines);

      // SADECE Task'ları yükle (rutin checklistler) - makina bilgisi ile
      const tasksResponse = await tasksAPI.getControlPending(selectedMachines);

      console.log('🔍 Frontend - API Response:', {
        needsMachineSelection: tasksResponse.data.needsMachineSelection,
        groupedTasksKeys: Object.keys(tasksResponse.data.groupedTasks || {}),
        totalGroupedTasks: Object.values(
          tasksResponse.data.groupedTasks || {},
        ).reduce((sum, group) => sum + group.tasks.length, 0),
      });

      // ATANMAMIŞ grubu özel debug
      if (tasksResponse.data.groupedTasks?.['Atanmamış']) {
        console.log('🎯 ATANMAMIŞ GRUP BULUNDU:', {
          taskCount: tasksResponse.data.groupedTasks['Atanmamış'].tasks.length,
          tasks: tasksResponse.data.groupedTasks['Atanmamış'].tasks.map(t => ({
            _id: t._id,
            checklistAdi: t.checklist?.ad,
            kullaniciAdi: t.kullanici?.kullaniciAdi,
            durum: t.durum,
            toplamPuan: t.toplamPuan,
            olusturulmaTarihi: t.olusturulmaTarihi,
            tamamlanmaTarihi: t.tamamlanmaTarihi,
          })),
        });
      } else {
        console.log('❌ ATANMAMIŞ GRUP EKSİK!');
      }

      // Makina seçimi gerekip gerekmediğini kontrol et
      if (tasksResponse.data.needsMachineSelection) {
        setNeedsMachineSelection(true);
        setControlData(null);
        return;
      }

      // Sadece Task verilerini kullan
      const tasksData = tasksResponse.data.groupedTasks || {};

      setNeedsMachineSelection(false);
      setControlData(tasksData);
    } catch (error) {
      setError(
        'Rutin checklistler yüklenirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMachines]);

  // Submit scoring - SADECE Task'lar için
  const handleScoreSubmit = useCallback(
    async (selectedTask, scoringData) => {
      try {
        // Sadece Task API'sini kullan
        await tasksAPI.scoreItems(selectedTask._id, scoringData);
        setSuccess(
          'Puanlama başarıyla kaydedildi ve görev onaylandı! 🎉 Onaylanan görevler "Onaylananlar" sekmesinde görünecektir.',
        );

        // Veriyi yeniden yükle (cache bypass ile - anında yenileme)
        setTimeout(() => {
          loadData();
        }, 100);

        return { success: true, switchToApprovedTab: true };
      } catch (error) {
        setError(
          'Puanlama kaydedilirken hata oluştu: ' +
            (error.response?.data?.message || error.message),
        );
        return { success: false, error };
      }
    },
    [loadData],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup function - component unmount olduğunda
  useEffect(() => {
    return () => {
      // State'leri temizle
      setControlData(null);
      setError('');
      setSuccess('');
      setLoading(false);
    };
  }, []);

  return {
    // State
    controlData,
    loading,
    error,
    success,
    needsMachineSelection,

    // Methods
    loadData,
    handleScoreSubmit,
    clearError,
    clearSuccess,
  };
};
