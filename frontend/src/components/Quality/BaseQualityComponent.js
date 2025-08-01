import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import LoadingWrapper from '../common/LoadingWrapper';
import useApiCall from '../../hooks/useApiCall';

/**
 * Base Quality Component - spageti kod çözümü
 * Quality modülündeki tüm duplicate pattern'ları birleştir
 */
const BaseQualityComponent = ({
  title,
  apiEndpoint,
  filters = [],
  columns = [],
  renderCustomRow,
  showFilters = true,
  showExport = true,
  defaultFilters = {},
  cardView = false,
}) => {
  const [activeFilters, setActiveFilters] = useState(defaultFilters);

  const {
    data,
    loading,
    error,
    refetch: _refetch,
  } = useApiCall(() => {
    const params = new URLSearchParams(activeFilters);
    return fetch(`${apiEndpoint}?${params}`).then(res => res.json());
  }, [activeFilters]);

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const clearFilters = () => {
    setActiveFilters(defaultFilters);
  };

  const handleExport = () => {
    const params = new URLSearchParams(activeFilters);
    window.open(`${apiEndpoint}/export?${params}`, '_blank');
  };

  const renderFilters = () => {
    if (!showFilters || filters.length === 0) {
      return null;
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant='h6'
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FilterIcon />
              Filtreler
            </Typography>
            <Button
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size='small'
            >
              Temizle
            </Button>
          </Box>

          <Grid container spacing={2}>
            {filters.map(filter => (
              <Grid item xs={12} sm={6} md={3} key={filter.key}>
                {filter.type === 'select' ? (
                  <FormControl fullWidth size='small'>
                    <InputLabel>{filter.label}</InputLabel>
                    <Select
                      value={activeFilters[filter.key] || ''}
                      label={filter.label}
                      onChange={e =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                    >
                      <MenuItem value=''>
                        <em>Tümü</em>
                      </MenuItem>
                      {filter.options?.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size='small'
                    label={filter.label}
                    type={filter.type || 'text'}
                    value={activeFilters[filter.key] || ''}
                    onChange={e =>
                      handleFilterChange(filter.key, e.target.value)
                    }
                    InputLabelProps={
                      filter.type === 'date' ? { shrink: true } : undefined
                    }
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell key={column.key} align={column.align || 'left'}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map((row, index) => (
            <TableRow key={row.id || index}>
              {renderCustomRow
                ? renderCustomRow(row)
                : columns.map(column => (
                  <TableCell key={column.key} align={column.align || 'left'}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCards = () => (
    <Grid container spacing={2}>
      {data?.map((item, index) => (
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          key={`quality-item-${item._id || item.id || index}-${index}`}
        >
          <Card>
            <CardContent>
              {columns.map(column => (
                <Box key={column.key} sx={{ mb: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {column.label}:
                  </Typography>
                  <Typography variant='body2' sx={{ ml: 1 }}>
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <LoadingWrapper loading={loading} error={error}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant='h5' fontWeight='bold'>
            {title}
          </Typography>
          {showExport && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              variant='outlined'
            >
              Excel'e Aktar
            </Button>
          )}
        </Box>

        {renderFilters()}

        <Card>
          <CardContent>
            {/* Active Filters Display */}
            {Object.keys(activeFilters).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  Aktif Filtreler:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(activeFilters).map(([key, value]) => {
                    if (!value) {
                      return null;
                    }
                    const filter = filters.find(f => f.key === key);
                    return (
                      <Chip
                        key={key}
                        label={`${filter?.label}: ${value}`}
                        size='small'
                        onDelete={() => handleFilterChange(key, '')}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Data Display */}
            {cardView ? renderCards() : renderTable()}

            {/* No Data Message */}
            {data?.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='body1' color='text.secondary'>
                  Gösterilecek veri bulunamadı.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </LoadingWrapper>
  );
};

export default BaseQualityComponent;
