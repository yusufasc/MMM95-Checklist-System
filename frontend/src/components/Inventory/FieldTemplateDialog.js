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
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const FieldTemplateDialog = ({
  open,
  onClose,
  fieldTemplate,
  categories,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    kategoriId: '',
    ad: '',
    tip: 'text',
    gerekli: false,
    varsayilanDeger: '',
    secenekler: [],
    validasyon: {
      minLength: '',
      maxLength: '',
      min: '',
      max: '',
      pattern: '',
    },
    aciklama: '',
    siraNo: 1,
    grup: 'Genel Bilgiler',
    aktif: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState('');

  // Alan tipleri
  const fieldTypes = [
    { value: 'text', label: 'Metin' },
    { value: 'number', label: 'Sayı' },
    { value: 'date', label: 'Tarih' },
    { value: 'select', label: 'Seçim Listesi' },
    { value: 'multiselect', label: 'Çoklu Seçim' },
    { value: 'boolean', label: 'Evet/Hayır' },
    { value: 'textarea', label: 'Uzun Metin' },
    { value: 'email', label: 'E-posta' },
    { value: 'url', label: 'Web Adresi' },
    { value: 'tel', label: 'Telefon' },
  ];

  // Önceden tanımlı gruplar
  const predefinedGroups = [
    'Genel Bilgiler',
    'Genel Tanımlayıcı Bilgiler',
    'Teknik Özellikler',
    'Bakım ve Kalite Takibi',
    'Dijital ve Takip Sistemleri',
    'Mali Bilgiler',
    'Garanti ve Belgeler',
  ];

  useEffect(() => {
    if (fieldTemplate) {
      setFormData({
        kategoriId: fieldTemplate.kategoriId || '',
        ad: fieldTemplate.ad || '',
        tip: fieldTemplate.tip || 'text',
        gerekli: fieldTemplate.gerekli || false,
        varsayilanDeger: fieldTemplate.varsayilanDeger || '',
        secenekler: fieldTemplate.secenekler || [],
        validasyon: fieldTemplate.validasyon || {
          minLength: '',
          maxLength: '',
          min: '',
          max: '',
          pattern: '',
        },
        aciklama: fieldTemplate.aciklama || '',
        siraNo: fieldTemplate.siraNo || 1,
        grup: fieldTemplate.grup || 'Genel Bilgiler',
        aktif: fieldTemplate.aktif !== undefined ? fieldTemplate.aktif : true,
      });
    } else {
      setFormData({
        kategoriId: '',
        ad: '',
        tip: 'text',
        gerekli: false,
        varsayilanDeger: '',
        secenekler: [],
        validasyon: {
          minLength: '',
          maxLength: '',
          min: '',
          max: '',
          pattern: '',
        },
        aciklama: '',
        siraNo: 1,
        grup: 'Genel Bilgiler',
        aktif: true,
      });
    }
    setError('');
  }, [fieldTemplate, open]);

  const handleChange = field => event => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleValidationChange = field => event => {
    setFormData(prev => ({
      ...prev,
      validasyon: {
        ...prev.validasyon,
        [field]: event.target.value,
      },
    }));
  };

  const handleAddOption = () => {
    if (newOption.trim() && !formData.secenekler.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        secenekler: [...prev.secenekler, newOption.trim()],
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = optionToRemove => {
    setFormData(prev => ({
      ...prev,
      secenekler: prev.secenekler.filter(option => option !== optionToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.kategoriId) {
      setError('Kategori seçimi gereklidir');
      return;
    }
    if (!formData.ad.trim()) {
      setError('Alan adı gereklidir');
      return;
    }
    if (
      ['select', 'multiselect'].includes(formData.tip) &&
      formData.secenekler.length === 0
    ) {
      setError('Seçim listesi için en az bir seçenek gereklidir');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Alan şablonu kaydedilirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  };

  const needsOptions = ['select', 'multiselect'].includes(formData.tip);
  const needsNumberValidation = ['number'].includes(formData.tip);
  const needsTextValidation = [
    'text',
    'textarea',
    'email',
    'url',
    'tel',
  ].includes(formData.tip);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 500,
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
          {fieldTemplate ? 'Alan Şablonu Düzenle' : 'Yeni Alan Şablonu'}
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

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={formData.kategoriId}
                onChange={handleChange('kategoriId')}
                label='Kategori'
              >
                {(categories || []).map(category => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.ad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Alan Adı'
              value={formData.ad}
              onChange={handleChange('ad')}
              required
              variant='outlined'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Alan Tipi</InputLabel>
              <Select
                value={formData.tip}
                onChange={handleChange('tip')}
                label='Alan Tipi'
              >
                {fieldTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <Autocomplete
              freeSolo
              options={predefinedGroups}
              value={formData.grup}
              onChange={(event, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  grup: newValue || 'Genel Bilgiler',
                }));
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Grup'
                  variant='outlined'
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Açıklama'
              value={formData.aciklama}
              onChange={handleChange('aciklama')}
              multiline
              rows={2}
              variant='outlined'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Varsayılan Değer'
              value={formData.varsayilanDeger}
              onChange={handleChange('varsayilanDeger')}
              variant='outlined'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                height: '100%',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.gerekli}
                    onChange={handleChange('gerekli')}
                  />
                }
                label='Zorunlu Alan'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.aktif}
                    onChange={handleChange('aktif')}
                  />
                }
                label='Aktif'
              />
            </Box>
          </Grid>

          {needsOptions && (
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Seçenekler
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label='Yeni Seçenek'
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddOption()}
                  variant='outlined'
                  size='small'
                />
                <Button
                  variant='contained'
                  onClick={handleAddOption}
                  startIcon={<AddIcon />}
                  disabled={!newOption.trim()}
                >
                  Ekle
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.secenekler.map((option, index) => (
                  <Chip
                    key={index}
                    label={option}
                    onDelete={() => handleRemoveOption(option)}
                    deleteIcon={<DeleteIcon />}
                    variant='outlined'
                  />
                ))}
              </Box>
            </Grid>
          )}

          {(needsTextValidation || needsNumberValidation) && (
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2 }}>
                Validasyon Kuralları
              </Typography>
              <Grid container spacing={2}>
                {needsTextValidation && (
                  <>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label='Min. Karakter'
                        type='number'
                        value={formData.validasyon.minLength}
                        onChange={handleValidationChange('minLength')}
                        variant='outlined'
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label='Max. Karakter'
                        type='number'
                        value={formData.validasyon.maxLength}
                        onChange={handleValidationChange('maxLength')}
                        variant='outlined'
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Regex Pattern'
                        value={formData.validasyon.pattern}
                        onChange={handleValidationChange('pattern')}
                        variant='outlined'
                        size='small'
                        placeholder='Örn: ^[A-Z0-9]+$'
                      />
                    </Grid>
                  </>
                )}
                {needsNumberValidation && (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label='Min. Değer'
                        type='number'
                        value={formData.validasyon.min}
                        onChange={handleValidationChange('min')}
                        variant='outlined'
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label='Max. Değer'
                        type='number'
                        value={formData.validasyon.max}
                        onChange={handleValidationChange('max')}
                        variant='outlined'
                        size='small'
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          )}
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

FieldTemplateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  fieldTemplate: PropTypes.shape({
    _id: PropTypes.string,
    kategoriId: PropTypes.string,
    ad: PropTypes.string,
    tip: PropTypes.string,
    gerekli: PropTypes.bool,
    varsayilanDeger: PropTypes.string,
    secenekler: PropTypes.arrayOf(PropTypes.string),
    validasyon: PropTypes.shape({
      minLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      maxLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pattern: PropTypes.string,
    }),
    aciklama: PropTypes.string,
    siraNo: PropTypes.number,
    grup: PropTypes.string,
    aktif: PropTypes.bool,
  }),
};

export default FieldTemplateDialog;
