import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Typography,
  Slider,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import TemplateScheduleManager from './TemplateScheduleManager';
import TemplateItemsManager from './TemplateItemsManager';
import {
  EVALUATION_FREQUENCY_OPTIONS,
  EVALUATION_PERIOD_MARKS,
  DIALOG_CONFIG,
  BUTTON_STYLES,
} from '../../../utils/templatesConfig';

const TemplateFormDialog = ({
  open,
  selectedTemplate,
  formData,
  itemFormData,
  roles,
  totalScore,
  isFormValid,
  onClose,
  onSave,
  onFormChange,
  onItemFormChange,
  onAddItem,
  onRemoveItem,
  onAddSchedule,
  onRemoveSchedule,
}) => {
  const dialogTitle = selectedTemplate
    ? 'Şablon Düzenle'
    : 'Yeni Şablon Oluştur';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={DIALOG_CONFIG.maxWidth}
      fullWidth={DIALOG_CONFIG.fullWidth}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Şablon Adı */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Şablon Adı'
                value={formData.ad}
                onChange={e => onFormChange('ad', e.target.value)}
                margin='normal'
                required
              />
            </Grid>

            {/* Hedef Rol */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin='normal' required>
                <InputLabel>Hedef Rol</InputLabel>
                <Select
                  value={formData.rol}
                  label='Hedef Rol'
                  onChange={e => onFormChange('rol', e.target.value)}
                >
                  {roles.map(role => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Değerlendirme Saatleri */}
            <Grid item xs={12}>
              <TemplateScheduleManager
                schedules={formData.degerlendirmeSaatleri}
                newTime={formData.newSaat}
                newDescription={formData.newSaatAciklama}
                onTimeChange={value => onFormChange('newSaat', value)}
                onDescriptionChange={value =>
                  onFormChange('newSaatAciklama', value)
                }
                onAddSchedule={onAddSchedule}
                onRemoveSchedule={onRemoveSchedule}
              />
            </Grid>

            {/* Değerlendirme Sıklığı */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin='normal'>
                <InputLabel>Değerlendirme Sıklığı</InputLabel>
                <Select
                  value={formData.degerlendirmeSikligi || 'Günlük'}
                  label='Değerlendirme Sıklığı'
                  onChange={e =>
                    onFormChange('degerlendirmeSikligi', e.target.value)
                  }
                >
                  {EVALUATION_FREQUENCY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Değerlendirme Periyodu */}
            <Grid item xs={12} md={6}>
              <Box sx={{ px: 2, mt: 2 }}>
                <Typography gutterBottom variant='subtitle2' fontWeight='bold'>
                  Değerlendirme Periyodu: {formData.degerlendirmePeriyodu} saat
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                  sx={{ mb: 1 }}
                >
                  Belirlenen saatten sonra kaç saat boyunca değerlendirme
                  yapılabilir
                </Typography>
                <Slider
                  value={formData.degerlendirmePeriyodu || 2}
                  onChange={(e, value) =>
                    onFormChange('degerlendirmePeriyodu', value)
                  }
                  min={1}
                  max={8}
                  marks={EVALUATION_PERIOD_MARKS}
                  step={1}
                  valueLabelDisplay='auto'
                  sx={{
                    '& .MuiSlider-mark': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Açıklama */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama'
                multiline
                rows={2}
                value={formData.aciklama || ''}
                onChange={e => onFormChange('aciklama', e.target.value)}
                margin='normal'
              />
            </Grid>

            {/* Aktif Durumu */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.aktif}
                    onChange={e => onFormChange('aktif', e.target.checked)}
                  />
                }
                label='Aktif'
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Değerlendirme Maddeleri */}
          <TemplateItemsManager
            items={formData.maddeler}
            itemFormData={itemFormData}
            totalScore={totalScore}
            onItemFormChange={onItemFormChange}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          İptal
        </Button>
        <Button
          onClick={onSave}
          variant='contained'
          startIcon={<SaveIcon />}
          disabled={!isFormValid}
          sx={BUTTON_STYLES.primary}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

TemplateFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  selectedTemplate: PropTypes.object,
  formData: PropTypes.shape({
    ad: PropTypes.string.isRequired,
    aciklama: PropTypes.string,
    rol: PropTypes.string.isRequired,
    aktif: PropTypes.bool.isRequired,
    maddeler: PropTypes.array.isRequired,
    degerlendirmeSaatleri: PropTypes.array.isRequired,
    degerlendirmeSikligi: PropTypes.string.isRequired,
    degerlendirmePeriyodu: PropTypes.number.isRequired,
    newSaat: PropTypes.string,
    newSaatAciklama: PropTypes.string,
  }).isRequired,
  itemFormData: PropTypes.shape({
    baslik: PropTypes.string.isRequired,
    aciklama: PropTypes.string.isRequired,
    maksimumPuan: PropTypes.number.isRequired,
  }).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  totalScore: PropTypes.number.isRequired,
  isFormValid: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onItemFormChange: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onAddSchedule: PropTypes.func.isRequired,
  onRemoveSchedule: PropTypes.func.isRequired,
};

export default TemplateFormDialog;
