import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Alert, Box, Chip, TextField, Button } from '@mui/material';
import { ALERT_MESSAGES } from '../../../utils/templatesConfig';

const TemplateScheduleManager = ({
  schedules,
  newTime,
  newDescription,
  onTimeChange,
  onDescriptionChange,
  onAddSchedule,
  onRemoveSchedule,
}) => {
  return (
    <>
      <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
        Değerlendirme Saatleri
      </Typography>

      <Alert severity='info' sx={{ mb: 2 }}>
        <Typography variant='body2'>
          <strong>ÖNEMLİ:</strong> {ALERT_MESSAGES.SCHEDULE_INFO}
        </Typography>
      </Alert>

      {/* Mevcut Saatler */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {(schedules || []).map((saat, index) => (
          <Chip
            key={index}
            label={`${saat.saat} - ${saat.aciklama || 'Değerlendirme'}`}
            onDelete={() => onRemoveSchedule(index)}
            color='primary'
            variant='outlined'
          />
        ))}
      </Box>

      {/* Yeni Saat Ekleme */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          size='small'
          label='Saat'
          type='time'
          value={newTime || ''}
          onChange={e => onTimeChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 130 }}
        />
        <TextField
          size='small'
          label='Açıklama'
          value={newDescription || ''}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder='Sabah Vardiyası'
          sx={{ flexGrow: 1 }}
        />
        <Button variant='outlined' onClick={onAddSchedule} disabled={!newTime}>
          Ekle
        </Button>
      </Box>
    </>
  );
};

TemplateScheduleManager.propTypes = {
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      saat: PropTypes.string.isRequired,
      aciklama: PropTypes.string,
    }),
  ).isRequired,
  newTime: PropTypes.string,
  newDescription: PropTypes.string,
  onTimeChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onAddSchedule: PropTypes.func.isRequired,
  onRemoveSchedule: PropTypes.func.isRequired,
};

export default TemplateScheduleManager;
