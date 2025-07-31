import React from 'react';
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
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, QrCode as QrCodeIcon } from '@mui/icons-material';

// Import custom components and hooks
import { useItemForm } from '../../hooks/useItemForm';
import ItemDynamicFields from './ItemDynamicFields';
import ItemMediaSection from './ItemMediaSection';

const ItemDialog = ({
  open,
  onClose,
  item,
  categories,
  fieldTemplates,
  users,
  departments,
  onCategoryChange,
  onSave,
}) => {
  const {
    formData,
    setFormData,
    error,
    setError,
    loading,
    setLoading,
    fieldTemplatesLoading,
    selectedCategory,
    categoryFieldTemplates,
    handleChange,
    handleCategoryChange,
    handleDynamicFieldChange,
    handleImageUpload,
    generateQRCode,
    removeImage,
    validateForm,
  } = useItemForm({
    item,
    open,
    categories,
    fieldTemplates,
    onCategoryChange,
  });

  // Durum ve öncelik seçenekleri
  const statusOptions = [
    { value: 'aktif', label: 'Aktif', color: 'success' },
    { value: 'bakim', label: 'Bakımda', color: 'warning' },
    { value: 'bozuk', label: 'Bozuk', color: 'error' },
    { value: 'hurda', label: 'Hurda', color: 'default' },
    { value: 'yedek', label: 'Yedek', color: 'info' },
    { value: 'kirada', label: 'Kirada', color: 'secondary' },
  ];

  const priorityOptions = [
    { value: 'dusuk', label: 'Düşük' },
    { value: 'orta', label: 'Orta' },
    { value: 'yuksek', label: 'Yüksek' },
    { value: 'kritik', label: 'Kritik' },
  ];

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData };
      if (!submitData.envanterKodu?.trim()) {
        delete submitData.envanterKodu;
      }
      await onSave(submitData);
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Envanter öğesi kaydedilirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 600,
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
          {item ? 'Envanter Öğesi Düzenle' : 'Yeni Envanter Öğesi'}
        </Box>
        <IconButton
          onClick={onClose}
          size='small'
          sx={{
            color: 'grey.500',
            '&:hover': { color: 'grey.700' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Temel Bilgiler */}
          <Grid item xs={12}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Temel Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={formData.kategoriId}
                        onChange={handleCategoryChange}
                        label='Kategori'
                      >
                        {categories.map(category => (
                          <MenuItem key={category._id} value={category._id}>
                            {category.ad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Envanter Kodu'
                      value={formData.envanterKodu}
                      onChange={handleChange('envanterKodu')}
                      placeholder='Otomatik oluşturulur'
                      variant='outlined'
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      required
                      label='Öğe Adı'
                      value={formData.ad}
                      onChange={handleChange('ad')}
                      variant='outlined'
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

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Durum</InputLabel>
                      <Select
                        value={formData.durum}
                        onChange={handleChange('durum')}
                        label='Durum'
                      >
                        {statusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Chip
                                label={option.label}
                                color={option.color}
                                size='small'
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Öncelik Seviyesi</InputLabel>
                      <Select
                        value={formData.oncelikSeviyesi}
                        onChange={handleChange('oncelikSeviyesi')}
                        label='Öncelik Seviyesi'
                      >
                        {priorityOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Lokasyon'
                      value={formData.lokasyon}
                      onChange={handleChange('lokasyon')}
                      variant='outlined'
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Departman</InputLabel>
                      <Select
                        value={formData.departman}
                        onChange={handleChange('departman')}
                        label='Departman'
                      >
                        {(departments || []).map(dept => (
                          <MenuItem key={dept._id} value={dept._id}>
                            {dept.ad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sorumlu Kişi</InputLabel>
                      <Select
                        value={formData.sorumluKisi}
                        onChange={handleChange('sorumluKisi')}
                        label='Sorumlu Kişi'
                      >
                        {(users || []).map(user => (
                          <MenuItem key={user._id} value={user._id}>
                            {user.ad} {user.soyad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Mali Bilgiler */}
          <Grid item xs={12}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Mali Bilgiler ve Tarihler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Alış Fiyatı'
                      value={formData.alisFiyati}
                      onChange={handleChange('alisFiyati')}
                      type='number'
                      variant='outlined'
                      InputProps={{
                        endAdornment: '₺',
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Güncel Değer'
                      value={formData.guncelDeger}
                      onChange={handleChange('guncelDeger')}
                      type='number'
                      variant='outlined'
                      InputProps={{
                        endAdornment: '₺',
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Tedarikçi'
                      value={formData.tedarikci}
                      onChange={handleChange('tedarikci')}
                      variant='outlined'
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label='Garanti Bitiş Tarihi'
                      value={formData.garantiBitisTarihi}
                      onChange={handleChange('garantiBitisTarihi')}
                      type='date'
                      variant='outlined'
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Bakım Sorumlusu</InputLabel>
                      <Select
                        value={formData.bakimSorumlusu}
                        onChange={handleChange('bakimSorumlusu')}
                        label='Bakım Sorumlusu'
                      >
                        {(users || []).map(user => (
                          <MenuItem key={user._id} value={user._id}>
                            {user.ad} {user.soyad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Kodlar */}
          <Grid item xs={12}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Kodlar ve Tanımlayıcılar
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Barkod'
                      value={formData.barkod}
                      onChange={handleChange('barkod')}
                      variant='outlined'
                    />
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        label='QR Kod'
                        value={formData.qrKodu}
                        onChange={handleChange('qrKodu')}
                        variant='outlined'
                      />
                      <Button
                        variant='outlined'
                        onClick={generateQRCode}
                        startIcon={<QrCodeIcon />}
                        sx={{ minWidth: 120 }}
                      >
                        Oluştur
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Dinamik Alanlar */}
          <ItemDynamicFields
            formData={formData}
            categoryFieldTemplates={categoryFieldTemplates}
            fieldTemplatesLoading={fieldTemplatesLoading}
            selectedCategory={selectedCategory}
            onDynamicFieldChange={handleDynamicFieldChange}
          />

          {/* Fotoğraf ve Dökümanlar */}
          <ItemMediaSection
            formData={formData}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            onFieldChange={handleFieldChange}
          />
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant='outlined' disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || !formData.kategoriId || !formData.ad.trim()}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  fieldTemplates: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  departments: PropTypes.array.isRequired,
  item: PropTypes.object,
};

export default ItemDialog;
