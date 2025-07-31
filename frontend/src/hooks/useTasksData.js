import { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';

const useTasksData = selectedMachines => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMachines]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tasksResponse = await tasksAPI.getMy();
      setTasks(tasksResponse.data);
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError('');
  const clearSuccess = () => setSuccess('');
  const showError = message => setError(message);
  const showSuccess = message => setSuccess(message);

  return {
    tasks,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    showError,
    showSuccess,
    loadData,
  };
};

export default useTasksData;
