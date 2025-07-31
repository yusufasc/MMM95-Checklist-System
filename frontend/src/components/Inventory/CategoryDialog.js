import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';

const CategoryDialog = ({ open, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    ad: '',
    aciklama: '',
    ikon: 'BuildIcon',
    renk: '#1976d2',
    siraNo: 1,
    aktif: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mevcut ikonlar
  const availableIcons = [
    { value: 'BuildIcon', label: 'Yapı/İnşaat' },
    { value: 'PrecisionManufacturingIcon', label: 'Üretim' },
    { value: 'MemoryIcon', label: 'Elektronik' },
    { value: 'LocalShippingIcon', label: 'Taşıma' },
    { value: 'SettingsIcon', label: 'Ayarlar' },
    { value: 'CategoryIcon', label: 'Kategori' },
    { value: 'InventoryIcon', label: 'Envanter' },
    { value: 'HandymanIcon', label: 'Araçlar' },
  ];

  // Renk seçenekleri
  const colorOptions = [
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#d32f2f',
    '#7b1fa2',
    '#303f9f',
    '#0288d1',
    '#00796b',
    '#689f38',
    '#fbc02d',
    '#f57c00',
    '#e64a19',
  ];

  useEffect(() => {
    if (category) {
      setFormData({
        ad: category.ad || '',
        aciklama: category.aciklama || '',
        ikon: category.ikon || 'BuildIcon',
        renk: category.renk || '#1976d2',
        siraNo: category.siraNo || 1,
        aktif: category.aktif !== undefined ? category.aktif : true,
      });
    } else {
      setFormData({
        ad: '',
        aciklama: '',
        ikon: 'BuildIcon',
        renk: '#1976d2',
        siraNo: 1,
        aktif: true,
      });
    }
    setError('');
  }, [category, open]);

  const handleChange = field => event => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.ad.trim()) {
      setError('Kategori adı gereklidir');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message || 'Kategori kaydedilirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box component='span' sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          {category ? 'Kategori Düzenle' : 'Yeni Kategori'}
        </Box>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Kategori Adı'
              value={formData.ad}
              onChange={handleChange('ad')}
              required
              variant='outlined'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Sıra No'
              type='number'
              value={formData.siraNo}
              onChange={handleChange('siraNo')}
              variant='outlined'
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Açıklama'
              value={formData.aciklama}
              onChange={handleChange('aciklama')}
              multiline
              rows={3}
              variant='outlined'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>İkon</InputLabel>
              <Select
                value={formData.ikon}
                onChange={handleChange('ikon')}
                label='İkon'
              >
                {availableIcons.map(icon => (
                  <MenuItem key={icon.value} value={icon.value}>
                    {icon.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Renk Seçimi
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {colorOptions.map(color => (
                  <Tooltip key={color} title={color}>
                    <IconButton
                      onClick={() =>
                        setFormData(prev => ({ ...prev, renk: color }))
                      }
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: color,
                        border:
                          formData.renk === color
                            ? '3px solid #000'
                            : '1px solid #ccc',
                        '&:hover': {
                          bgcolor: color,
                          opacity: 0.8,
                        },
                      }}
                    >
                      {formData.renk === color && (
                        <PaletteIcon sx={{ fontSize: 16, color: 'white' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={formData.aktif}
                onChange={handleChange('aktif')}
                label='Durum'
              >
                <MenuItem value={true}>Aktif</MenuItem>
                <MenuItem value={false}>Pasif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant='outlined' disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || !formData.ad.trim()}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CategoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  category: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default CategoryDialog;
