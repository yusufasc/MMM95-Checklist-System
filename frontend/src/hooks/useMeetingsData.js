import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

/**
 * 📅 Meeting Data Management Hook
 * MMM95 pattern'ine uygun meeting data yönetimi
 */
export const useMeetingsData = () => {
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [machines, setMachines] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters state
  const [filters, setFilters] = useState({
    tarih: '',
    baslangicTarih: '',
    bitisTarih: '',
    durum: '',
    kategori: '',
    departman: '',
    organizator: '',
    katilimci: '',
    limit: 20,
    page: 1,
  });

  /**
   * Load supporting data (users, departments, etc.)
   */
  const loadSupportingData = useCallback(async () => {
    try {
      const [usersRes, departmentsRes, machinesRes, checklistsRes] =
        await Promise.all([
          api.users.getAll(),
          api.departments.getAll(),
          api.machines.getAll(),
          api.checklists.getAll(),
        ]);

      setUsers(usersRes.data || []);
      setDepartments(departmentsRes.data || []);
      setMachines(machinesRes.data || []);
      setChecklists(checklistsRes.data || []);
    } catch (error) {
      console.error('Supporting data load error:', error);
      setError('Yardımcı veriler yüklenirken hata oluştu');
    }
  }, []);

  /**
   * Load meetings with filters and pagination
   */
  const loadMeetings = useCallback(
    async (customFilters = {}) => {
      try {
        setLoading(true);
        setError('');

        const finalFilters = { ...filters, ...customFilters };

        // Clean empty filters
        const cleanFilters = Object.entries(finalFilters)
          .filter(
            ([, value]) =>
              value !== '' && value !== null && value !== undefined,
          )
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

        console.log('🔍 Loading meetings with filters:', cleanFilters);

        const response = await api.meetings.getMeetings(cleanFilters);

        if (response.data) {
          setMeetings(response.data.meetings || []);
          setPagination(
            response.data.pagination || {
              current: 1,
              pages: 1,
              total: 0,
              hasNext: false,
              hasPrev: false,
            },
          );
        }
      } catch (error) {
        console.error('❌ Meetings load error:', error);
        setError(
          'Toplantılar yüklenirken hata oluştu: ' +
            (error.response?.data?.message || error.message),
        );
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  /**
   * Create new meeting
   */
  const createMeeting = useCallback(
    async meetingData => {
      try {
        setError('');
        setSuccess('');
        console.log('🚀 Creating meeting:', meetingData);

        const response = await api.meetings.createMeeting(meetingData);
        console.log('✅ Meeting created successfully:', response);

        setSuccess('Toplantı başarıyla oluşturuldu');
        await loadMeetings(); // Refresh list
        return { success: true, data: response.data };
      } catch (error) {
        console.error('❌ Meeting creation error:', error);
        const errorMessage =
          error.response?.data?.message ||
          'Toplantı oluşturulurken hata oluştu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [loadMeetings],
  );

  /**
   * Update existing meeting
   */
  const updateMeeting = useCallback(
    async (id, meetingData) => {
      try {
        setError('');
        setSuccess('');
        console.log('📝 Updating meeting:', id, meetingData);

        const response = await api.meetings.updateMeeting(id, meetingData);
        console.log('✅ Meeting updated successfully:', response);

        setSuccess('Toplantı başarıyla güncellendi');
        await loadMeetings(); // Refresh list
        return { success: true, data: response.data };
      } catch (error) {
        console.error('❌ Meeting update error:', error);
        const errorMessage =
          error.response?.data?.message ||
          'Toplantı güncellenirken hata oluştu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [loadMeetings],
  );

  /**
   * Delete meeting (soft delete)
   */
  const deleteMeeting = useCallback(
    async id => {
      try {
        setError('');
        setSuccess('');
        console.log('🗑️ Deleting meeting:', id);

        await api.meetings.deleteMeeting(id);
        console.log('✅ Meeting deleted successfully');

        setSuccess('Toplantı başarıyla silindi');
        await loadMeetings(); // Refresh list
        return { success: true };
      } catch (error) {
        console.error('❌ Meeting deletion error:', error);
        const errorMessage =
          error.response?.data?.message || 'Toplantı silinirken hata oluştu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [loadMeetings],
  );

  /**
   * Start meeting
   */
  const startMeeting = useCallback(
    async id => {
      try {
        setError('');
        setSuccess('');
        console.log('▶️ Starting meeting:', id);

        const response = await api.meetings.startMeeting(id);
        console.log('✅ Meeting started successfully:', response);

        setSuccess('Toplantı başlatıldı');
        await loadMeetings(); // Refresh to update status
        return { success: true, data: response.data };
      } catch (error) {
        console.error('❌ Meeting start error:', error);
        const errorMessage =
          error.response?.data?.message || 'Toplantı başlatılırken hata oluştu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [loadMeetings],
  );

  /**
   * Finish meeting
   */
  const finishMeeting = useCallback(
    async id => {
      try {
        setError('');
        setSuccess('');
        console.log('⏹️ Finishing meeting:', id);

        const response = await api.meetings.finishMeeting(id);
        console.log('✅ Meeting finished successfully:', response);

        setSuccess('Toplantı tamamlandı');
        await loadMeetings(); // Refresh to update status
        return { success: true, data: response.data };
      } catch (error) {
        console.error('❌ Meeting finish error:', error);
        const errorMessage =
          error.response?.data?.message || 'Toplantı bitirilirken hata oluştu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [loadMeetings],
  );

  /**
   * Apply filters and reload
   */
  const applyFilters = useCallback(newFilters => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters, page: 1 }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      tarih: '',
      baslangicTarih: '',
      bitisTarih: '',
      durum: '',
      kategori: '',
      departman: '',
      organizator: '',
      katilimci: '',
      limit: 20,
      page: 1,
    });
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback(newPage => {
    setFilters(prevFilters => ({ ...prevFilters, page: newPage }));
  }, []);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Load supporting data on mount
  useEffect(() => {
    loadSupportingData();
  }, [loadSupportingData]);

  // Load meetings when filters change
  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  return {
    // Data
    meetings,
    users,
    departments,
    machines,
    checklists,
    pagination,
    filters,

    // State
    loading,
    error,
    success,

    // Actions
    loadMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    startMeeting,
    finishMeeting,
    applyFilters,
    clearFilters,
    changePage,
    clearMessages,

    // Utils
    loadSupportingData,
  };
};
