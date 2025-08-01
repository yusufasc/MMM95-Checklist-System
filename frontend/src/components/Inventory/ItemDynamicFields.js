import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Box,
  CircularProgress,
  Skeleton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

const ItemDynamicFields = ({
  formData,
  categoryFieldTemplates,
  fieldTemplatesLoading,
  selectedCategory,
  onDynamicFieldChange,
}) => {
  const renderDynamicField = template => {
    // Map field names from backend to frontend - backend uses 'ad' field
    const fieldName = template.ad || template.alanAdi || template.alan;
    const fieldType = template.tip || template.alanTipi;
    const isRequired =
      template.gerekli !== undefined ? template.gerekli : template.zorunlu;
    const description = template.aciklama;
    const options = template.secenekler;
    const validation = template.validasyon;
    const placeholder = template.placeholder;

    const value = formData.dinamikAlanlar[fieldName] || '';

    console.log('🔧 Rendering field:', {
      fieldName,
      fieldType,
      isRequired,
      template,
    });

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={value}
            onChange={e => onDynamicFieldChange(fieldName, e.target.value)}
            required={isRequired}
            type={fieldType === 'text' ? 'text' : fieldType}
            helperText={description}
            placeholder={placeholder}
            variant='outlined'
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={value}
            onChange={e => onDynamicFieldChange(fieldName, e.target.value)}
            required={isRequired}
            type='number'
            helperText={description}
            placeholder={placeholder}
            variant='outlined'
            inputProps={{
              min: validation?.min || undefined,
              max: validation?.max || undefined,
            }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={value}
            onChange={e => onDynamicFieldChange(fieldName, e.target.value)}
            required={isRequired}
            type='date'
            helperText={description}
            variant='outlined'
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={value}
            onChange={e => onDynamicFieldChange(fieldName, e.target.value)}
            required={isRequired}
            multiline
            rows={3}
            helperText={description}
            placeholder={placeholder}
            variant='outlined'
          />
        );

      case 'select':
        return (
          <FormControl fullWidth required={isRequired}>
            <InputLabel>{fieldName}</InputLabel>
            <Select
              value={value}
              onChange={e => onDynamicFieldChange(fieldName, e.target.value)}
              label={fieldName}
            >
              {options?.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            options={options || []}
            value={value ? value.split(',').filter(Boolean) : []}
            onChange={(event, newValue) => {
              onDynamicFieldChange(fieldName, newValue.join(','));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={index}
                  variant='outlined'
                  label={option}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label={fieldName}
                helperText={description}
                required={isRequired}
              />
            )}
          />
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value === 'true' || value === true}
                onChange={e =>
                  onDynamicFieldChange(fieldName, e.target.checked)
                }
              />
            }
            label={fieldName}
          />
        );

      default:
        return null;
    }
  };

  if (!formData.kategoriId) {
    return null;
  }

  // Debug log
  console.log('🔍 ItemDynamicFields Debug:');
  console.log(
    '   categoryFieldTemplates:',
    categoryFieldTemplates?.length || 0,
  );
  console.log('   fieldTemplatesLoading:', fieldTemplatesLoading);
  console.log('   selectedCategory:', selectedCategory);
  if (categoryFieldTemplates?.length > 0) {
    console.log('   İlk template:', categoryFieldTemplates[0]);
  }

  if (fieldTemplatesLoading) {
    return (
      <Grid item xs={12}>
        <Card variant='outlined'>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <CircularProgress size={24} />
              <Typography variant='h6'>
                Kategori alanları yükleniyor...
              </Typography>
            </Box>
            {[...Array(3)].map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant='text' width='30%' height={20} />
                <Skeleton variant='rectangular' width='100%' height={56} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    );
  }

  if (categoryFieldTemplates.length === 0) {
    return (
      <Grid item xs={12}>
        <Card variant='outlined'>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <SettingsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant='h6' gutterBottom>
                Bu kategori için özel alan bulunamadı
              </Typography>
              <Typography variant='body2' textAlign='center'>
                {selectedCategory?.ad} kategorisi için henüz özel alanlar
                tanımlanmamış. Yönetici ile iletişime geçin.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  }

  // Group fields by category
  const groupedFields = {};
  categoryFieldTemplates.forEach(template => {
    const grupAdi = template.grup || template.group || 'Genel Bilgiler';
    if (!groupedFields[grupAdi]) {
      groupedFields[grupAdi] = [];
    }
    groupedFields[grupAdi].push(template);
  });

  return (
    <Grid item xs={12}>
      {Object.entries(groupedFields).map(([grupAdi, templates]) => (
        <Card key={grupAdi} variant='outlined' sx={{ mb: 2 }}>
          <CardContent>
            <Typography
              variant='h6'
              gutterBottom
              sx={{
                color: 'primary.main',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                pb: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                }}
              />
              {grupAdi}
              <Chip
                label={`${templates.length} alan`}
                size='small'
                color='primary'
                variant='outlined'
              />
            </Typography>
            <Grid container spacing={2}>
              {templates.map(template => (
                <Grid item xs={12} md={6} key={template._id}>
                  {renderDynamicField(template)}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Grid>
  );
};

ItemDynamicFields.propTypes = {
  formData: PropTypes.shape({
    kategoriId: PropTypes.string,
    dinamikAlanlar: PropTypes.object,
  }).isRequired,
  categoryFieldTemplates: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      alan: PropTypes.string, // Backend gönderdiği field name
      ad: PropTypes.string, // Alternative field name
      alanAdi: PropTypes.string, // Frontend expected field name
      tip: PropTypes.string, // Backend gönderdiği field type
      alanTipi: PropTypes.string, // Frontend expected field type
      gerekli: PropTypes.bool, // Backend gönderdiği required flag
      zorunlu: PropTypes.bool, // Frontend expected required flag
      grup: PropTypes.string,
      aciklama: PropTypes.string,
      placeholder: PropTypes.string,
      secenekler: PropTypes.arrayOf(PropTypes.string),
      validasyon: PropTypes.object,
    }),
  ).isRequired,
  fieldTemplatesLoading: PropTypes.bool.isRequired,
  selectedCategory: PropTypes.shape({
    ad: PropTypes.string,
  }),
  onDynamicFieldChange: PropTypes.func.isRequired,
};

export default ItemDynamicFields;
