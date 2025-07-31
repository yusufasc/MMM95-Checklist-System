import React from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const FilterControls = ({
  filters,
  onFiltersChange,
  totalTasks = 0,
  filteredTasks = 0,
  activeTab = 0,
}) => {
  // const theme = useTheme(); // Şu an kullanılmıyor
  // const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Şu an kullanılmıyor

  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'tamamlanmaTarihi',
      sortOrder: 'desc',
      durum: 'all',
      dateFrom: '',
      dateTo: '',
      searchText: '',
    });
  };

  const hasActiveFilters =
    filters.durum !== 'all' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.searchText;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color='primary' />
          <Typography variant='h6' fontWeight='bold'>
            Filtreleme ve Sıralama
          </Typography>
          {hasActiveFilters && (
            <Chip
              label={`${filteredTasks}/${totalTasks}`}
              color='primary'
              size='small'
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>

        {hasActiveFilters && (
          <Tooltip title='Filtreleri Temizle'>
            <IconButton onClick={clearFilters} color='error' size='small'>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Filter Controls */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        {/* Sıralama */}
        <FormControl size='small' sx={{ minWidth: { xs: '100%', md: 200 } }}>
          <InputLabel>Sıralama</InputLabel>
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            label='Sıralama'
            onChange={e => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value='tamamlanmaTarihi-desc'>
              <span role='img' aria-label='takvim'>
                📅
              </span>{' '}
              Yeniden Eskiye (Tarih)
            </MenuItem>
            <MenuItem value='tamamlanmaTarihi-asc'>
              <span role='img' aria-label='takvim'>
                📅
              </span>{' '}
              Eskiden Yeniye (Tarih)
            </MenuItem>
            <MenuItem value='olusturulmaTarihi-desc'>
              <span role='img' aria-label='yeni'>
                🆕
              </span>{' '}
              Yeniden Eskiye (Oluşturma)
            </MenuItem>
            <MenuItem value='olusturulmaTarihi-asc'>
              <span role='img' aria-label='yeni'>
                🆕
              </span>{' '}
              Eskiden Yeniye (Oluşturma)
            </MenuItem>
            <MenuItem value='toplamPuan-desc'>
              <span role='img' aria-label='yıldız'>
                ⭐
              </span>{' '}
              Yüksek Puan → Düşük Puan
            </MenuItem>
            <MenuItem value='toplamPuan-asc'>
              <span role='img' aria-label='yıldız'>
                ⭐
              </span>{' '}
              Düşük Puan → Yüksek Puan
            </MenuItem>
          </Select>
        </FormControl>

        {/* Durum Filtresi - Tab'a göre değişir */}
        {activeTab === 1 && (
          <FormControl size='small' sx={{ minWidth: { xs: '100%', md: 150 } }}>
            <InputLabel>Durum</InputLabel>
            <Select
              value={filters.durum}
              label='Durum'
              onChange={e => handleFilterChange('durum', e.target.value)}
            >
              <MenuItem value='all'>
                <span role='img' aria-label='döngü'>
                  🔄
                </span>{' '}
                Tümü
              </MenuItem>
              <MenuItem value='onaylandi'>
                <span role='img' aria-label='onay'>
                  ✅
                </span>{' '}
                Onaylandı
              </MenuItem>
              <MenuItem value='reddedildi'>
                <span role='img' aria-label='red'>
                  ❌
                </span>{' '}
                Reddedildi
              </MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Tarih Aralığı */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <CalendarIcon
            sx={{
              color: 'action.active',
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <TextField
            size='small'
            type='date'
            label='Başlangıç'
            value={filters.dateFrom}
            onChange={e => handleFilterChange('dateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 140 } }}
          />
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            -
          </Typography>
          <TextField
            size='small'
            type='date'
            label='Bitiş'
            value={filters.dateTo}
            onChange={e => handleFilterChange('dateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 140 } }}
          />
        </Box>

        {/* Arama */}
        <TextField
          size='small'
          label='Arama (Kullanıcı, Checklist)'
          value={filters.searchText}
          onChange={e => handleFilterChange('searchText', e.target.value)}
          placeholder='Kullanıcı adı veya checklist adı...'
          sx={{
            minWidth: { xs: '100%', md: 250 },
            flex: { md: 1 },
          }}
        />
      </Stack>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box
          sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}
        >
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            Aktif Filtreler:
          </Typography>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {filters.durum !== 'all' && (
              <Chip
                label={`Durum: ${
                  filters.durum === 'tamamlandi'
                    ? 'Bekliyor'
                    : filters.durum === 'onaylandi'
                      ? 'Onaylandı'
                      : 'Reddedildi'
                }`}
                size='small'
                onDelete={() => handleFilterChange('durum', 'all')}
                color='primary'
                variant='outlined'
              />
            )}
            {filters.dateFrom && (
              <Chip
                label={`Başlangıç: ${filters.dateFrom}`}
                size='small'
                onDelete={() => handleFilterChange('dateFrom', '')}
                color='primary'
                variant='outlined'
              />
            )}
            {filters.dateTo && (
              <Chip
                label={`Bitiş: ${filters.dateTo}`}
                size='small'
                onDelete={() => handleFilterChange('dateTo', '')}
                color='primary'
                variant='outlined'
              />
            )}
            {filters.searchText && (
              <Chip
                label={`Arama: "${filters.searchText}"`}
                size='small'
                onDelete={() => handleFilterChange('searchText', '')}
                color='primary'
                variant='outlined'
              />
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default FilterControls;
