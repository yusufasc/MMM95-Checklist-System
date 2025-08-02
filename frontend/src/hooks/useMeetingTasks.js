import { useState, useEffect, useCallback } from 'react';
import MeetingTaskAPI from '../services/meetingTaskAPI';
import { useSnackbar } from '../contexts/SnackbarContext';

/**
 * Meeting Tasks için custom hook
 * Görevlerin yönetimi ve state management
 */
const useMeetingTasks = (initialParams = {}) => {
  const { showSnackbar } = useSnackbar();

  // State
  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState({
    toplam: 0,
    atandi: 0,
    devamEdiyor: 0,
    kismenTamamlandi: 0,
    tamamlandi: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    durum: '',
    page: 1,
    limit: 10,
    meetingId: '',
    ...initialParams,
  });

  /**
   * Görevleri yükle
   */
  const loadTasks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const finalParams = { ...filters, ...params };
      const result = await MeetingTaskAPI.getMyTasks(finalParams);

      if (result.success) {
        setTasks(result.data.tasks || []);
        setStatistics(result.data.statistics || {});
        setPagination(result.data.pagination || {});
      } else {
        setError(result.error);
        showSnackbar(result.error, 'error');
      }
    } catch (err) {
      const errorMessage = 'Görevler yüklenirken beklenmeyen hata oluştu';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showSnackbar]);

  /**
   * Filtreleri uygula
   */
  const applyFilters = useCallback((newFilters) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // Yeni filtre uygulandığında ilk sayfaya dön
    };
    setFilters(updatedFilters);
  }, [filters]);

  /**
   * Sayfa değiştir
   */
  const changePage = useCallback((newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  /**
   * Filtreleri temizle
   */
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      durum: '',
      page: 1,
      limit: 10,
      meetingId: '',
    };
    setFilters(clearedFilters);
  }, []);

  /**
   * Görev progress güncelle
   */
  const updateTaskProgress = useCallback(async (taskId, percentage, note = '') => {
    try {
      const result = await MeetingTaskAPI.updateTaskProgress(taskId, percentage, note);

      if (result.success) {
        // Listeyi yenile
        await loadTasks();
        showSnackbar('Görev progress başarıyla güncellendi', 'success');
        return { success: true };
      } else {
        showSnackbar(result.error, 'error');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Progress güncellenirken hata oluştu';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [loadTasks, showSnackbar]);

  /**
   * Görev durumu güncelle
   */
  const updateTaskStatus = useCallback(async (taskId, status, note = '') => {
    try {
      const result = await MeetingTaskAPI.updateTaskStatus(taskId, status, note);

      if (result.success) {
        // Listeyi yenile
        await loadTasks();
        showSnackbar('Görev durumu başarıyla güncellendi', 'success');
        return { success: true };
      } else {
        showSnackbar(result.error, 'error');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Durum güncellenirken hata oluştu';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [loadTasks, showSnackbar]);

  /**
   * Göreve yorum ekle
   */
  const addTaskComment = useCallback(async (taskId, comment, type = 'yorum') => {
    try {
      const result = await MeetingTaskAPI.addTaskComment(taskId, comment, type);

      if (result.success) {
        showSnackbar('Yorum başarıyla eklendi', 'success');
        return { success: true, data: result.data };
      } else {
        showSnackbar(result.error, 'error');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Yorum eklenirken hata oluştu';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [showSnackbar]);

  /**
   * Meeting'i bitir ve görevleri oluştur
   */
  const finishMeetingAndCreateTasks = useCallback(async (meetingId) => {
    try {
      const result = await MeetingTaskAPI.finishMeeting(meetingId);

      if (result.success) {
        showSnackbar(
          `Toplantı tamamlandı. ${result.data.createdTasks} görev oluşturuldu.`,
          'success',
        );
        // Görevleri yenile
        await loadTasks();
        return { success: true, data: result.data };
      } else {
        showSnackbar(result.error, 'error');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Toplantı bitirme sırasında hata oluştu';
      showSnackbar(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }, [loadTasks, showSnackbar]);

  /**
   * Error'ları temizle
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // İlk yükleme
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    // Data
    tasks,
    statistics,
    pagination,

    // State
    loading,
    error,
    filters,

    // Actions
    loadTasks,
    applyFilters,
    changePage,
    clearFilters,
    updateTaskProgress,
    updateTaskStatus,
    addTaskComment,
    finishMeetingAndCreateTasks,
    clearError,
  };
};

export default useMeetingTasks;