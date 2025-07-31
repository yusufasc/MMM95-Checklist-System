import { useState, useEffect, useCallback } from 'react';

/**
 * Ortak API call hook - spageti kod çözümü
 * Tüm API çağrıları için standardize edilmiş pattern
 */
const useApiCall = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError('');
        const response = await apiFunction(...args);
        setData(response.data || response);
        return response.data || response;
      } catch (error) {
        console.error('API call error:', error);
        const errorMessage =
          error.response?.data?.message || error.message || 'Bir hata oluştu';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Auto-fetch on mount or dependencies change
  useEffect(() => {
    if (dependencies.length === 0) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    fetchData,
    refetch,
    setData, // Manual data updates için
    setError, // Manual error handling için
  };
};

/**
 * Mutation için özel hook (POST, PUT, DELETE)
 */
export const useMutation = mutationFunction => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mutate = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError('');
        const response = await mutationFunction(...args);
        return response.data || response;
      } catch (error) {
        console.error('Mutation error:', error);
        const errorMessage =
          error.response?.data?.message || error.message || 'İşlem başarısız';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFunction],
  );

  return {
    mutate,
    loading,
    error,
    setError,
  };
};

export default useApiCall;
