// useWorkTaskData - WorkTask Veri Yönetimi Custom Hook
// Refactored from: WorkTasks.js (1037 satır → modüler yapı)
// 🎯 Amaç: Checklist, makina ve kalıp verilerinin yönetimi

import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI, workTasksAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const useWorkTaskData = () => {
  const { hasModulePermission } = useAuth();

  // Data States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklists, setChecklists] = useState([]);
  const [makinalar, setMakinalar] = useState([]);
  const [kaliplar, setKaliplar] = useState([]);

  // 📖 Ana veri yükleme fonksiyonu - Promise.all optimization
  const loadData = useCallback(async showSnackbar => {
    try {
      setLoading(true);

      const [checklistsRes, makinalarRes, kaliplarRes] = await Promise.all([
        workTasksAPI.getChecklists(),
        inventoryAPI.getMachines('all'),
        inventoryAPI.getKalipsForTasks(),
      ]);

      // Kullanıcının rolüne göre checklistleri filtrele
      setChecklists(checklistsRes.data || []);

      // Direkt olarak formatlanmış makinalar ve kalıpları al
      setMakinalar(makinalarRes.data || []);
      setKaliplar(kaliplarRes.data || []);

      console.log('✅ WorkTask data loaded:', {
        checklists: checklistsRes.data?.length || 0,
        makinalar: makinalarRes.data?.length || 0,
        kaliplar: kaliplarRes.data?.length || 0,
      });
    } catch (error) {
      console.error('❌ WorkTask data loading error:', error);
      if (showSnackbar) {
        showSnackbar('Veriler yüklenirken hata oluştu', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Auto-load data on mount - Sadece bir kez çalışır
  useEffect(() => {
    if (hasModulePermission('Yaptım')) {
      loadData();
    }
  }, [hasModulePermission, loadData]);

  // 📤 WorkTask oluşturma ve tamamlama
  const createWorkTask = useCallback(async (submitData, showSnackbar) => {
    try {
      setSubmitting(true);

      console.log('📤 WorkTask submit data:', submitData);

      // 1. Görevi oluştur
      const response = await workTasksAPI.create(submitData);
      console.log('✅ WorkTask API Response:', response);

      const createdTask = response.data?.data || response.data;

      // 2. Checklist maddelerini güncelle
      const completedItems = submitData.checklistItems.map(item => ({
        maddeId: item._id,
        yapildi: item.tamamlandi,
      }));

      console.log('📝 Updating checklist items:', completedItems);
      await workTasksAPI.updateItems(createdTask._id, {
        maddeler: completedItems,
      });

      // 3. Görevi tamamla
      console.log('✅ Completing task:', createdTask._id);
      await workTasksAPI.complete(createdTask._id);

      if (showSnackbar) {
        showSnackbar(
          'Kalıp değişim görevi başarıyla oluşturuldu ve tamamlandı!',
          'success',
        );
      }

      return { success: true, task: createdTask };
    } catch (error) {
      console.error('❌ WorkTask creation error:', error);
      console.error('❌ Error response:', error.response?.data);

      let errorMessage = 'Görev oluşturulurken hata oluştu';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors
            .map(err => `${err.field}: ${err.message}`)
            .join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (showSnackbar) {
        showSnackbar(errorMessage, 'error');
      }
      return { success: false, error, errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    // States
    loading,
    submitting,
    checklists,
    makinalar,
    kaliplar,

    // Actions
    loadData,
    createWorkTask,

    // Computed values
    hasData: checklists.length > 0,
    isReady: !loading && hasModulePermission('Yaptım'),
  };
};
