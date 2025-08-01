import React, { memo, useState } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';

/**
 * 🔍 Meeting Filters Component
 * MMM95 pattern: Advanced filtering with collapsible sections
 */
const MeetingFilters = memo(
  ({
    filters = {},
    onFiltersChange,
    onClearFilters,
    users = [],
    departments = [],
    _loading = false,
  }) => {
    const [expanded, setExpanded] = useState(false);

    /**
     * Handle filter change
     */
    const handleFilterChange = (field, value) => {
      onFiltersChange({
        ...filters,
        [field]: value,
      });
    };

    /**
     * Get quick date filters
     */
    const getQuickDateFilters = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());

      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

      const nextWeekStart = new Date(thisWeekEnd);
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1);

      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      return [
        {
          label: 'Bugün',
          icon: <TodayIcon />,
          action: () => {
            const dateStr = today.toISOString().split('T')[0];
            handleFilterChange('tarih', dateStr);
            handleFilterChange('baslangicTarih', '');
            handleFilterChange('bitisTarih', '');
          },
        },
        {
          label: 'Yarın',
          icon: <TodayIcon />,
          action: () => {
            const dateStr = tomorrow.toISOString().split('T')[0];
            handleFilterChange('tarih', dateStr);
            handleFilterChange('baslangicTarih', '');
            handleFilterChange('bitisTarih', '');
          },
        },
        {
          label: 'Bu Hafta',
          icon: <DateRangeIcon />,
          action: () => {
            handleFilterChange(
              'baslangicTarih',
              thisWeekStart.toISOString().split('T')[0],
            );
            handleFilterChange(
              'bitisTarih',
              thisWeekEnd.toISOString().split('T')[0],
            );
            handleFilterChange('tarih', '');
          },
        },
        {
          label: 'Gelecek Hafta',
          icon: <DateRangeIcon />,
          action: () => {
            handleFilterChange(
              'baslangicTarih',
              nextWeekStart.toISOString().split('T')[0],
            );
            handleFilterChange(
              'bitisTarih',
              nextWeekEnd.toISOString().split('T')[0],
            );
            handleFilterChange('tarih', '');
          },
        },
      ];
    };

    /**
     * Get active filter count
     */
    const getActiveFilterCount = () => {
      const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (key === 'limit' || key === 'page') {
          return false;
        }
        return value !== '' && value !== null && value !== undefined;
      });
      return activeFilters.length;
    };

    /**
     * Check if any date filter is active
     */
    const hasActiveDateFilter = () => {
      return filters.tarih || filters.baslangicTarih || filters.bitisTarih;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Header with quick actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color='primary' />
            <Typography variant='h6'>Filtreler</Typography>
            {activeFilterCount > 0 && (
              <Chip
                size='small'
                label={`${activeFilterCount} aktif`}
                color='primary'
                variant='outlined'
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeFilterCount > 0 && (
              <Button
                size='small'
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                color='secondary'
              >
                Temizle
              </Button>
            )}
            <Tooltip
              title={expanded ? 'Filtreleri Gizle' : 'Tüm Filtreleri Göster'}
            >
              <IconButton onClick={() => setExpanded(!expanded)} size='small'>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Quick date filters */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='subtitle2' gutterBottom color='textSecondary'>
            Hızlı Tarih Filtreleri
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {getQuickDateFilters().map((filter, index) => (
              <Chip
                key={index}
                icon={filter.icon}
                label={filter.label}
                onClick={filter.action}
                variant='outlined'
                size='small'
                color='primary'
                clickable
              />
            ))}
            {hasActiveDateFilter() && (
              <Chip
                icon={<ClearIcon />}
                label='Tarih Temizle'
                onClick={() => {
                  handleFilterChange('tarih', '');
                  handleFilterChange('baslangicTarih', '');
                  handleFilterChange('bitisTarih', '');
                }}
                variant='outlined'
                size='small'
                color='secondary'
                clickable
              />
            )}
          </Box>
        </Box>

        {/* Basic filters - always visible */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size='small'>
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.durum || ''}
                onChange={e => handleFilterChange('durum', e.target.value)}
                label='Durum'
              >
                <MenuItem value=''>Tümü</MenuItem>
                <MenuItem value='planlanıyor'>Planlanıyor</MenuItem>
                <MenuItem value='bekliyor'>Bekliyor</MenuItem>
                <MenuItem value='devam-ediyor'>Devam Ediyor</MenuItem>
                <MenuItem value='tamamlandı'>Tamamlandı</MenuItem>
                <MenuItem value='iptal'>İptal</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size='small'>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={filters.kategori || ''}
                onChange={e => handleFilterChange('kategori', e.target.value)}
                label='Kategori'
              >
                <MenuItem value=''>Tümü</MenuItem>
                <MenuItem value='rutin'>Rutin</MenuItem>
                <MenuItem value='proje'>Proje</MenuItem>
                <MenuItem value='acil'>Acil</MenuItem>
                <MenuItem value='kalite'>Kalite</MenuItem>
                <MenuItem value='güvenlik'>Güvenlik</MenuItem>
                <MenuItem value='performans'>Performans</MenuItem>
                <MenuItem value='vardiya'>Vardiya</MenuItem>
                <MenuItem value='kalip-degisim'>Kalıp Değişim</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size='small'>
              <InputLabel>Departman</InputLabel>
              <Select
                value={filters.departman || ''}
                onChange={e => handleFilterChange('departman', e.target.value)}
                label='Departman'
              >
                <MenuItem value=''>Tümü</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.ad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size='small'
              label='Sayfa Başına'
              type='number'
              value={filters.limit || 20}
              onChange={e =>
                handleFilterChange('limit', parseInt(e.target.value) || 20)
              }
              inputProps={{ min: 10, max: 100 }}
            />
          </Grid>
        </Grid>

        {/* Advanced filters - collapsible */}
        <Collapse in={expanded}>
          <Typography variant='subtitle2' gutterBottom color='textSecondary'>
            Gelişmiş Filtreler
          </Typography>

          <Grid container spacing={2}>
            {/* Date filters */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='Belirli Tarih'
                type='date'
                value={filters.tarih || ''}
                onChange={e => handleFilterChange('tarih', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText='Belirli bir tarih seçin'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='Başlangıç Tarihi'
                type='date'
                value={filters.baslangicTarih || ''}
                onChange={e =>
                  handleFilterChange('baslangicTarih', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
                helperText='Tarih aralığı başı'
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size='small'
                label='Bitiş Tarihi'
                type='date'
                value={filters.bitisTarih || ''}
                onChange={e => handleFilterChange('bitisTarih', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText='Tarih aralığı sonu'
              />
            </Grid>

            {/* User filters */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Organizatör</InputLabel>
                <Select
                  value={filters.organizator || ''}
                  onChange={e =>
                    handleFilterChange('organizator', e.target.value)
                  }
                  label='Organizatör'
                >
                  <MenuItem value=''>Tümü</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.ad} {user.soyad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Katılımcı</InputLabel>
                <Select
                  value={filters.katilimci || ''}
                  onChange={e =>
                    handleFilterChange('katilimci', e.target.value)
                  }
                  label='Katılımcı'
                >
                  <MenuItem value=''>Tümü</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.ad} {user.soyad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Collapse>

        {/* Filter summary */}
        {activeFilterCount > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant='caption' color='textSecondary'>
              <strong>{activeFilterCount}</strong> filtre aktif
              {filters.durum && ` • Durum: ${filters.durum}`}
              {filters.kategori && ` • Kategori: ${filters.kategori}`}
              {filters.departman && ' • Departman seçili'}
              {filters.tarih && ` • Tarih: ${filters.tarih}`}
              {(filters.baslangicTarih || filters.bitisTarih) &&
                ' • Tarih aralığı seçili'}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  },
);

MeetingFilters.displayName = 'MeetingFilters';

export default MeetingFilters;
