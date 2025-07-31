import { useState, useEffect, useCallback } from 'react';
import { qualityControlAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

export const useQualityStats = () => {
  const { showSnackbar } = useSnackbar();

  // Main state
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [statistics, setStatistics] = useState({
    toplamDegerlendirme: 0,
    ortalamaBasariYuzdesi: 0,
    rolBazliIstatistikler: [],
    enIyiPerformans: [],
  });

  // Filter state
  const [filters, setFilters] = useState({
    kullanici: '',
    tarihBaslangic: '',
    tarihBitis: '',
    durum: '',
  });

  // UI state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeFilter, setTimeFilter] = useState('7days');
  const [expandedRow, setExpandedRow] = useState(null);

  // Data loading
  const loadEvaluations = useCallback(async () => {
    try {
      setLoading(true);

      // Zaman filtresine göre tarih aralığı belirle
      const endDate = new Date();
      const startDate = new Date();

      switch (timeFilter) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const params = {
        ...filters,
        tarihBaslangic:
          filters.tarihBaslangic || startDate.toISOString().split('T')[0],
        tarihBitis: filters.tarihBitis || endDate.toISOString().split('T')[0],
      };

      // Değerlendirmeleri ve istatistikleri paralel olarak yükle
      const [evaluationsRes, statisticsRes] = await Promise.all([
        qualityControlAPI.getEvaluations(params),
        qualityControlAPI.getStatistics(params),
      ]);

      setEvaluations(evaluationsRes.data);
      setStatistics(statisticsRes.data);

      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.log(
          '📊 Değerlendirmeler yüklendi:',
          evaluationsRes.data.length,
        );
        console.log('📈 İstatistikler:', statisticsRes.data);
      }
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Veri yükleme hatası:', error);
      }
      showSnackbar('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, timeFilter, filters]);

  // Effects
  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  // Filter handlers
  const handleFilterChange = field => event => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      kullanici: '',
      tarihBaslangic: '',
      tarihBitis: '',
      durum: '',
    });
  };

  const handleTimeFilterChange = newTimeFilter => {
    setTimeFilter(newTimeFilter);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Table handlers
  const handleRowExpand = evaluationId => {
    setExpandedRow(expandedRow === evaluationId ? null : evaluationId);
  };

  // Computed values
  const paginatedEvaluations = evaluations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const refreshData = () => {
    loadEvaluations();
  };

  return {
    // State
    loading,
    evaluations,
    statistics,
    filters,
    page,
    rowsPerPage,
    timeFilter,
    expandedRow,
    paginatedEvaluations,

    // Setters
    setTimeFilter: handleTimeFilterChange,

    // Handlers
    handleFilterChange,
    clearFilters,
    handleChangePage,
    handleChangeRowsPerPage,
    handleRowExpand,
    refreshData,

    // Actions
    loadEvaluations,
  };
};
