import { useState, useCallback } from 'react';
import { checklistsAPI, rolesAPI, departmentsAPI } from '../services/api';

export const useChecklistsData = () => {
  const [checklists, setChecklists] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [checklistsRes, rolesRes, departmentsRes] = await Promise.all([
        checklistsAPI.getAll(),
        rolesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);

      setChecklists(checklistsRes.data);
      setRoles(rolesRes.data);
      setDepartments(departmentsRes.data);
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createChecklist = useCallback(
    async formData => {
      try {
        setError('');
        console.log('🚀 Frontend: Checklist oluşturuluyor...', formData);
        const response = await checklistsAPI.create(formData);
        console.log('✅ Frontend: Checklist başarıyla oluşturuldu', response);
        setSuccess('Checklist şablonu başarıyla eklendi');
        await loadData();
        return true;
      } catch (error) {
        console.error('❌ Frontend: Checklist oluşturma hatası:', error);
        setError(
          error.response?.data?.message || 'İşlem sırasında hata oluştu',
        );
        return false;
      }
    },
    [loadData],
  );

  const updateChecklist = useCallback(
    async (id, formData) => {
      try {
        setError('');
        await checklistsAPI.update(id, formData);
        setSuccess('Checklist şablonu başarıyla güncellendi');
        await loadData();
        return true;
      } catch (error) {
        setError(
          error.response?.data?.message || 'İşlem sırasında hata oluştu',
        );
        return false;
      }
    },
    [loadData],
  );

  const deleteChecklist = useCallback(
    async checklistId => {
      try {
        setError('');
        await checklistsAPI.delete(checklistId);
        await loadData();
        return { success: true };
      } catch (error) {
        const errorData = error.response?.data;
        if (errorData?.canForceDelete && errorData?.activeTasksCount > 0) {
          return {
            success: false,
            error: {
              message: errorData.message,
              activeTasksCount: errorData.activeTasksCount,
              canForceDelete: true,
            },
          };
        } else {
          setError(errorData?.message || 'Silme işlemi sırasında hata oluştu');
          return { success: false };
        }
      }
    },
    [loadData],
  );

  const forceDeleteChecklist = useCallback(
    async checklistId => {
      try {
        setError('');
        const response = await checklistsAPI.forceDelete(checklistId);
        const result = response.data;
        setSuccess(
          `Checklist şablonu ve ${result.cancelledTasksCount} aktif görev başarıyla silindi`,
        );
        await loadData();
        return true;
      } catch (error) {
        setError(
          error.response?.data?.message ||
            'Zorla silme işlemi sırasında hata oluştu',
        );
        return false;
      }
    },
    [loadData],
  );

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return {
    checklists,
    roles,
    departments,
    loading,
    error,
    success,
    loadData,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    forceDeleteChecklist,
    clearMessages,
  };
};
