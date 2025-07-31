import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Grid,
  TextField,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Slider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  SCORE_SLIDER_CONFIG,
  ALERT_MESSAGES,
} from '../../../utils/templatesConfig';

const TemplateItemsManager = ({
  items,
  itemFormData,
  totalScore,
  onItemFormChange,
  onAddItem,
  onRemoveItem,
}) => {
  return (
    <>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Değerlendirme Maddeleri
      </Typography>

      {/* Yeni Madde Ekleme Formu */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant='subtitle2' sx={{ mb: 2 }}>
          Yeni Madde Ekle
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size='small'
              label='Madde Başlığı'
              value={itemFormData.baslik}
              onChange={e => onItemFormChange('baslik', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 2 }}>
              <Typography gutterBottom>
                Maksimum Puan: {itemFormData.maksimumPuan}
              </Typography>
              <Slider
                value={itemFormData.maksimumPuan}
                onChange={(e, value) => onItemFormChange('maksimumPuan', value)}
                min={SCORE_SLIDER_CONFIG.min}
                max={SCORE_SLIDER_CONFIG.max}
                marks={SCORE_SLIDER_CONFIG.marks}
                step={SCORE_SLIDER_CONFIG.step}
                valueLabelDisplay='auto'
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size='small'
              label='Açıklama (İsteğe Bağlı)'
              value={itemFormData.aciklama}
              onChange={e => onItemFormChange('aciklama', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                {ALERT_MESSAGES.TOTAL_SCORE_INFO}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={onAddItem}
              size='small'
              disabled={!itemFormData.baslik.trim()}
            >
              Madde Ekle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Eklenen Maddeler Listesi */}
      {items.length > 0 && (
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            Eklenen Maddeler ({items.length})
          </Typography>
          <List>
            {items.map((madde, index) => (
              <ListItem key={madde.id || index} divider>
                <ListItemText
                  primary={
                    <Box
                      sx={{ display: 'flex', alignItems: 'center' }}
                      component='span'
                    >
                      <Typography
                        variant='body1'
                        sx={{ flex: 1 }}
                        component='span'
                      >
                        {index + 1}. {madde.baslik}
                      </Typography>
                      <Chip
                        label={`${madde.maksimumPuan} puan`}
                        size='small'
                        color='primary'
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box component='span'>
                      {madde.aciklama && (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          component='span'
                        >
                          {madde.aciklama}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge='end'
                    onClick={() => onRemoveItem(index)}
                    color='error'
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Alert severity='info' sx={{ mt: 2 }}>
            <strong>Toplam Puan:</strong> {totalScore} puan
          </Alert>
        </Box>
      )}

      {/* Boş Durum Mesajı */}
      {items.length === 0 && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          <Typography variant='body2'>
            Henüz değerlendirme maddesi eklenmemiş. En az bir madde
            eklenmelidir.
          </Typography>
        </Alert>
      )}
    </>
  );
};

TemplateItemsManager.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      baslik: PropTypes.string.isRequired,
      aciklama: PropTypes.string,
      maksimumPuan: PropTypes.number.isRequired,
    }),
  ).isRequired,
  itemFormData: PropTypes.shape({
    baslik: PropTypes.string.isRequired,
    aciklama: PropTypes.string.isRequired,
    maksimumPuan: PropTypes.number.isRequired,
  }).isRequired,
  totalScore: PropTypes.number.isRequired,
  onItemFormChange: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
};

export default TemplateItemsManager;
