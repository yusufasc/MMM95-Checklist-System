import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

import { useQualityStats } from '../../hooks/useQualityStats';
import QualityStatsCards from './QualityStats/QualityStatsCards';
import QualityStatsFilters from './QualityStats/QualityStatsFilters';
import QualityStatsTable from './QualityStats/QualityStatsTable';
import QualityTopPerformers from './QualityStats/QualityTopPerformers';

const QualityControlStatistics = () => {
  const {
    loading,
    evaluations,
    statistics,
    filters,
    page,
    rowsPerPage,
    timeFilter,
    expandedRow,
    paginatedEvaluations,
    handleFilterChange,
    clearFilters,
    handleChangePage,
    handleChangeRowsPerPage,
    handleRowExpand,
    refreshData,
    setTimeFilter,
    loadEvaluations,
  } = useQualityStats();

  if (loading && evaluations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Başlık ve Yenile Butonu */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h5' fontWeight='bold'>
          Değerlendirme Geçmişi
        </Typography>
        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={refreshData}
          disabled={loading}
        >
          Yenile
        </Button>
      </Box>

      {/* Filtreler */}
      <QualityStatsFilters
        filters={filters}
        timeFilter={timeFilter}
        loading={loading}
        onFilterChange={handleFilterChange}
        onTimeFilterChange={setTimeFilter}
        onClearFilters={clearFilters}
        onApplyFilters={loadEvaluations}
      />

      {/* İstatistik Kartları */}
      <QualityStatsCards
        statistics={statistics}
        evaluations={evaluations}
        loading={loading}
      />

      {/* Değerlendirme Tablosu */}
      <QualityStatsTable
        loading={loading}
        evaluations={evaluations}
        paginatedEvaluations={paginatedEvaluations}
        page={page}
        rowsPerPage={rowsPerPage}
        expandedRow={expandedRow}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        onRowExpand={handleRowExpand}
      />

      {/* En İyi Performans Gösteren Çalışanlar */}
      {statistics.enIyiPerformans && statistics.enIyiPerformans.length > 0 && (
        <QualityTopPerformers statistics={statistics} />
      )}
    </Box>
  );
};

export default QualityControlStatistics;
