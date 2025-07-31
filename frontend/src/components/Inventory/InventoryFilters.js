import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { STATUS_OPTIONS } from '../../utils/inventoryConfig';

const InventoryFilters = ({
  filters,
  categories,
  users,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems='center'>
          {/* Arama */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size='small'
              placeholder='Ara...'
              value={filters.arama}
              onChange={e => onFilterChange('arama', e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
            />
          </Grid>

          {/* Kategori */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size='small'>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={filters.kategori}
                onChange={e => onFilterChange('kategori', e.target.value)}
                label='Kategori'
              >
                <MenuItem value=''>Tümü</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.ad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Durum */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size='small'>
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.durum}
                onChange={e => onFilterChange('durum', e.target.value)}
                label='Durum'
              >
                {STATUS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Lokasyon */}
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size='small'
              placeholder='Lokasyon'
              value={filters.lokasyon}
              onChange={e => onFilterChange('lokasyon', e.target.value)}
            />
          </Grid>

          {/* Sorumlu Kişi */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size='small'>
              <InputLabel>Sorumlu</InputLabel>
              <Select
                value={filters.sorumluKisi}
                onChange={e => onFilterChange('sorumluKisi', e.target.value)}
                label='Sorumlu'
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

          {/* Temizle Butonu */}
          <Grid item xs={12} md={1}>
            <Button
              variant='outlined'
              startIcon={<FilterIcon />}
              onClick={onClearFilters}
              size='small'
              fullWidth
            >
              Temizle
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

InventoryFilters.propTypes = {
  filters: PropTypes.shape({
    arama: PropTypes.string.isRequired,
    kategori: PropTypes.string.isRequired,
    durum: PropTypes.string.isRequired,
    lokasyon: PropTypes.string.isRequired,
    sorumluKisi: PropTypes.string.isRequired,
  }).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      soyad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

export default InventoryFilters;
