import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { TIME_FILTER_OPTIONS } from '../../../utils/qualityStatsConfig';

const QualityStatsFilters = ({
  filters,
  timeFilter,
  loading,
  onFilterChange,
  onTimeFilterChange,
  onClearFilters,
  onApplyFilters,
}) => {
  return (
    <Accordion sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant='h6'>Filtreler</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {/* Zaman Filtresi */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size='small'>
              <InputLabel>Zaman Filtresi</InputLabel>
              <Select
                value={timeFilter}
                label='Zaman Filtresi'
                onChange={e => onTimeFilterChange(e.target.value)}
                disabled={loading}
              >
                {TIME_FILTER_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Başlangıç Tarihi */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size='small'
              label='Başlangıç Tarihi'
              type='date'
              value={filters.tarihBaslangic}
              onChange={onFilterChange('tarihBaslangic')}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>

          {/* Bitiş Tarihi */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size='small'
              label='Bitiş Tarihi'
              type='date'
              value={filters.tarihBitis}
              onChange={onFilterChange('tarihBitis')}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                height: '100%',
                alignItems: 'center',
              }}
            >
              <Button
                variant='contained'
                onClick={onApplyFilters}
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                Filtrele
              </Button>
              <Button
                variant='outlined'
                onClick={onClearFilters}
                disabled={loading}
              >
                Temizle
              </Button>
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

QualityStatsFilters.propTypes = {
  filters: PropTypes.shape({
    kullanici: PropTypes.string.isRequired,
    tarihBaslangic: PropTypes.string.isRequired,
    tarihBitis: PropTypes.string.isRequired,
    durum: PropTypes.string.isRequired,
  }).isRequired,
  timeFilter: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onTimeFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
};

export default QualityStatsFilters;
