import React, { memo, useState } from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { TASK_STATUS, PRIORITY_LEVELS } from '../../services/meetingTaskAPI';

/**
 * ResponsibilityFilters Component
 * Görev filtreleme bileşeni
 */
const ResponsibilityFilters = memo(({
  filters,
  onApplyFilters,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] = useState({
    durum: filters.durum || '',
    oncelik: filters.oncelik || '',
    baslangicTarihi: filters.baslangicTarihi || '',
    bitisTarihi: filters.bitisTarihi || '',
    aramaTerimi: filters.aramaTerimi || '',
  });

  // Local filter değişimi
  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filtreleri uygula
  const handleApplyFilters = () => {
    const cleanFilters = Object.fromEntries(
      Object.entries(localFilters).filter(([key, value]) =>
        value !== null && value !== undefined && value !== '',
      ),
    );
    onApplyFilters(cleanFilters);
  };

  // Filtreleri temizle
  const handleClearFilters = () => {
    const clearedFilters = {
      durum: '',
      oncelik: '',
      baslangicTarihi: '',
      bitisTarihi: '',
      aramaTerimi: '',
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  // Aktif filter sayısı
  const activeFilterCount = Object.values(localFilters).filter(
    value => value !== null && value !== undefined && value !== '',
  ).length;

  // Durum seçenekleri
  const statusOptions = [
    { value: '', label: 'Tüm Durumlar' },
    { value: TASK_STATUS.ATANDI, label: 'Atandı' },
    { value: TASK_STATUS.DEVAM_EDIYOR, label: 'Devam Ediyor' },
    { value: TASK_STATUS.KISMEN_TAMAMLANDI, label: 'Kısmen Tamamlandı' },
    { value: TASK_STATUS.TAMAMLANDI, label: 'Tamamlandı' },
    { value: TASK_STATUS.ERTELENDI, label: 'Ertelendi' },
    { value: TASK_STATUS.IPTAL, label: 'İptal' },
  ];

  // Öncelik seçenekleri
  const priorityOptions = [
    { value: '', label: 'Tüm Öncelikler' },
    { value: PRIORITY_LEVELS.DUSUK, label: 'Düşük' },
    { value: PRIORITY_LEVELS.NORMAL, label: 'Normal' },
    { value: PRIORITY_LEVELS.YUKSEK, label: 'Yüksek' },
    { value: PRIORITY_LEVELS.KRITIK, label: 'Kritik' },
  ];

  return (
    <Box>
      {/* Filter Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon color="primary" />
          <Typography variant="h6">Filtreler</Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} aktif`}
              size="small"
              color="primary"
            />
          )}
        </Box>

        <Button
          startIcon={<ClearIcon />}
          onClick={handleClearFilters}
          disabled={activeFilterCount === 0}
          size="small"
        >
          Temizle
        </Button>
      </Box>

      {/* Filter Controls */}
      <Grid container spacing={2} alignItems="end">
        {/* Arama */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Arama"
            placeholder="Görev başlığı veya açıklamasında ara..."
            value={localFilters.aramaTerimi}
            onChange={(e) => handleFilterChange('aramaTerimi', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Grid>

        {/* Durum */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Durum</InputLabel>
            <Select
              value={localFilters.durum}
              label="Durum"
              onChange={(e) => handleFilterChange('durum', e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Öncelik */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Öncelik</InputLabel>
            <Select
              value={localFilters.oncelik}
              label="Öncelik"
              onChange={(e) => handleFilterChange('oncelik', e.target.value)}
            >
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Başlangıç Tarihi */}
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Başlangıç Tarihi"
            type="date"
            value={localFilters.baslangicTarihi || ''}
            onChange={(e) => handleFilterChange('baslangicTarihi', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Bitiş Tarihi */}
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Bitiş Tarihi"
            type="date"
            value={localFilters.bitisTarihi || ''}
            onChange={(e) => handleFilterChange('bitisTarihi', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Apply Button */}
        <Grid item xs={12} md={12}>
          <Box display="flex" gap={1} mt={1}>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={handleApplyFilters}
              disabled={activeFilterCount === 0}
            >
              Filtreleri Uygula
            </Button>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
            >
              Temizle
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Aktif Filtreler:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {localFilters.durum && (
              <Chip
                label={`Durum: ${statusOptions.find(s => s.value === localFilters.durum)?.label}`}
                onDelete={() => handleFilterChange('durum', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {localFilters.oncelik && (
              <Chip
                label={`Öncelik: ${priorityOptions.find(p => p.value === localFilters.oncelik)?.label}`}
                onDelete={() => handleFilterChange('oncelik', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {localFilters.aramaTerimi && (
              <Chip
                label={`Arama: ${localFilters.aramaTerimi}`}
                onDelete={() => handleFilterChange('aramaTerimi', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {localFilters.baslangicTarihi && (
              <Chip
                label={`Başlangıç: ${new Date(localFilters.baslangicTarihi).toLocaleDateString('tr-TR')}`}
                onDelete={() => handleFilterChange('baslangicTarihi', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {localFilters.bitisTarihi && (
              <Chip
                label={`Bitiş: ${new Date(localFilters.bitisTarihi).toLocaleDateString('tr-TR')}`}
                onDelete={() => handleFilterChange('bitisTarihi', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
});

ResponsibilityFilters.displayName = 'ResponsibilityFilters';

export default ResponsibilityFilters;