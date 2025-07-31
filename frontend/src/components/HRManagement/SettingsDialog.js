import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const SettingsDialog = ({
  open,
  onClose,
  settingsForm,
  onSettingsChange,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSectionChange = (section, field, value) => {
    onSettingsChange(section, field, value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3,
        }}
      >
        <SettingsIcon sx={{ fontSize: 32 }} />
        <Box component='span' sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Puanlama Ayarları
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: 'grey.50' }}>
        {/* Fazla Mesai Accordion */}
        <Accordion
          defaultExpanded
          sx={{
            mb: 2,
            borderRadius: 3,
            '&:before': { display: 'none' },
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              borderRadius: '12px 12px 0 0',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUpIcon color='success' />
              <Typography variant='h6' fontWeight='bold' color='success.dark'>
                Fazla Mesai Puanlama
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settingsForm.mesaiPuanlama?.aktif || false}
                  onChange={e =>
                    handleSectionChange(
                      'mesaiPuanlama',
                      'aktif',
                      e.target.checked,
                    )
                  }
                  color='success'
                />
              }
              label={
                <Typography variant='body1' fontWeight='medium'>
                  Fazla mesai puanlamasını aktif et
                </Typography>
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label='Saat Başına Puan'
              type='number'
              value={settingsForm.mesaiPuanlama?.saatBasinaPuan || 0}
              onChange={e =>
                handleSectionChange(
                  'mesaiPuanlama',
                  'saatBasinaPuan',
                  parseInt(e.target.value) || 0,
                )
              }
              inputProps={{ min: 0, max: 100 }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              helperText='Her fazla mesai saati için verilecek puan'
            />

            <TextField
              fullWidth
              label='Günlük Maksimum Saat'
              type='number'
              value={settingsForm.mesaiPuanlama?.gunlukMaksimumSaat || 0}
              onChange={e =>
                handleSectionChange(
                  'mesaiPuanlama',
                  'gunlukMaksimumSaat',
                  parseInt(e.target.value) || 0,
                )
              }
              inputProps={{ min: 0, max: 24 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              helperText='Bir günde puanlanabilecek maksimum fazla mesai saati'
            />

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'success.light',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'success.main',
              }}
            >
              <Typography variant='body2' color='success.dark'>
                <span role='img' aria-label='fikir'>
                  💡
                </span>{' '}
                <strong>Örnek:</strong> 3 puan/saat, max 4 saat/gün = günlük max
                12 puan
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Devamsızlık Accordion */}
        <Accordion
          defaultExpanded
          sx={{
            borderRadius: 3,
            '&:before': { display: 'none' },
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              borderRadius: '12px 12px 0 0',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingDownIcon color='error' />
              <Typography variant='h6' fontWeight='bold' color='error.dark'>
                Devamsızlık Puanlama
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settingsForm.devamsizlikPuanlama?.aktif || false}
                  onChange={e =>
                    handleSectionChange(
                      'devamsizlikPuanlama',
                      'aktif',
                      e.target.checked,
                    )
                  }
                  color='error'
                />
              }
              label={
                <Typography variant='body1' fontWeight='medium'>
                  Devamsızlık puanlamasını aktif et
                </Typography>
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label='Gün Başına Puan'
              type='number'
              value={settingsForm.devamsizlikPuanlama?.gunBasinaPuan || 0}
              onChange={e =>
                handleSectionChange(
                  'devamsizlikPuanlama',
                  'gunBasinaPuan',
                  parseInt(e.target.value) || 0,
                )
              }
              inputProps={{ min: -100, max: 0 }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              helperText='Her devamsızlık günü için kesilen puan (negatif değer)'
            />

            <TextField
              fullWidth
              label='Saat Başına Puan'
              type='number'
              value={settingsForm.devamsizlikPuanlama?.saatBasinaPuan || 0}
              onChange={e =>
                handleSectionChange(
                  'devamsizlikPuanlama',
                  'saatBasinaPuan',
                  parseInt(e.target.value) || 0,
                )
              }
              inputProps={{ min: -100, max: 0 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              helperText='Her devamsızlık saati için kesilen puan (negatif değer)'
            />

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'error.light',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.main',
              }}
            >
              <Typography variant='body2' color='error.dark'>
                <span role='img' aria-label='uyarı'>
                  ⚠️
                </span>{' '}
                <strong>Örnek:</strong> -5 puan/gün, -1 puan/saat = 1 gün
                devamsızlık = -5 puan
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Summary Box */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            border: '2px solid #9c27b0',
          }}
        >
          <Typography
            variant='h6'
            fontWeight='bold'
            color='purple'
            gutterBottom
          >
            <span role='img' aria-label='grafik'>
              📊
            </span>{' '}
            Ayar Özeti
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant='body2' color='text.secondary'>
                <strong>Fazla Mesai:</strong>{' '}
                {settingsForm.mesaiPuanlama?.aktif ? 'Aktif' : 'Pasif'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Max: {settingsForm.mesaiPuanlama?.gunlukMaksimumSaat || 0}h/gün
              </Typography>
            </Box>
            <Box>
              <Typography variant='body2' color='text.secondary'>
                <strong>Devamsızlık:</strong>{' '}
                {settingsForm.devamsizlikPuanlama?.aktif ? 'Aktif' : 'Pasif'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Penalty: {settingsForm.devamsizlikPuanlama?.gunBasinaPuan || 0}
                p/gün
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          gap: 2,
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          variant='outlined'
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          İptal
        </Button>
        <Button
          onClick={onSubmit}
          variant='contained'
          sx={{
            borderRadius: 2,
            minWidth: 120,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          }}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
