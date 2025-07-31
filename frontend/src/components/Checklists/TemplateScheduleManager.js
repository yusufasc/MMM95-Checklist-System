import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  Grid,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

const TemplateScheduleManager = ({
  schedules = [],
  onAddSchedule,
  onRemoveSchedule,
}) => {
  const [newTime, setNewTime] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAddSchedule = () => {
    if (!newTime) {
      return;
    }

    onAddSchedule(newTime, newDescription);
    setNewTime('');
    setNewDescription('');
  };

  return (
    <Box>
      <Typography variant='subtitle1' fontWeight='bold' sx={{ mb: 2 }}>
        Değerlendirme Saatleri
      </Typography>

      <Alert severity='info' sx={{ mb: 2 }}>
        <strong>ÖNEMLİ:</strong> Değerlendirme saati eklemezseniz, şablon 24
        saat boyunca kullanılabilir olacaktır. Saat eklerseniz, sadece
        belirlenen saatlerden sonraki periyot süresince değerlendirme
        yapılabilir.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type='time'
            label='Saat'
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label='Açıklama (Opsiyonel)'
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder='örn: Sabah Vardiyası'
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleAddSchedule}
            disabled={!newTime}
            sx={{
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Ekle
          </Button>
        </Grid>
      </Grid>

      {schedules.length > 0 && (
        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
          <List dense>
            {schedules.map((schedule, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom:
                    index < schedules.length - 1 ? '1px solid #e0e0e0' : 'none',
                  py: 1,
                }}
              >
                <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={schedule.saat}
                        size='small'
                        color='primary'
                        sx={{ fontWeight: 'bold' }}
                      />
                      {schedule.aciklama && (
                        <Typography variant='body2' color='text.secondary'>
                          {schedule.aciklama}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge='end'
                    onClick={() => onRemoveSchedule(index)}
                    size='small'
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white',
                      },
                    }}
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

TemplateScheduleManager.propTypes = {
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      saat: PropTypes.string.isRequired,
      aciklama: PropTypes.string,
    }),
  ),
  onAddSchedule: PropTypes.func.isRequired,
  onRemoveSchedule: PropTypes.func.isRequired,
};

export default TemplateScheduleManager;
