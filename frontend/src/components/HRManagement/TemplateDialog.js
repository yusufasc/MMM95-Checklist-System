import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const TemplateDialog = ({
  open,
  onClose,
  template,
  templateForm,
  roles,
  onFormChange,
  onMaddelerChange,
  onAddMadde,
  onRemoveMadde,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleFormChange = (field, value) => {
    onFormChange(field, value);
  };

  const handleMaddeChange = (index, field, value) => {
    onMaddelerChange(index, field, value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
          minHeight: isMobile ? '100vh' : '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentIcon sx={{ fontSize: 32 }} />
          <Box component='span' sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {template ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography
            variant='h6'
            color='primary'
            fontWeight='bold'
            sx={{ mb: 3 }}
          >
            Temel Bilgiler
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                fullWidth
                label='Şablon Adı *'
                value={templateForm?.ad || ''}
                onChange={e => handleFormChange('ad', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                placeholder='örn: Aylık Performans Değerlendirmesi'
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama'
                multiline
                rows={2}
                value={templateForm?.aciklama || ''}
                onChange={e => handleFormChange('aciklama', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                placeholder='Şablon hakkında kısa açıklama'
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Hedef Roller *</InputLabel>
                <Select
                  multiple
                  value={templateForm?.hedefRoller || []}
                  onChange={e =>
                    handleFormChange('hedefRoller', e.target.value)
                  }
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => {
                        const role = roles?.find(r => r._id === value);
                        return (
                          <Chip
                            key={value}
                            label={role?.ad || value}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{ borderRadius: 2 }}
                >
                  {(roles || []).map(role => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant='h6' color='primary' fontWeight='bold'>
              Değerlendirme Maddeleri ({templateForm?.maddeler?.length || 0})
            </Typography>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={onAddMadde}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Madde Ekle
            </Button>
          </Box>

          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {(templateForm?.maddeler || []).map((madde, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{
                  p: 3,
                  mb: 2,
                  borderRadius: 3,
                  border: '2px solid #e3f2fd',
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Chip
                    label={`Madde ${index + 1}`}
                    color='primary'
                    size='small'
                    sx={{ fontWeight: 'bold' }}
                  />
                  <IconButton
                    size='small'
                    onClick={() => onRemoveMadde(index)}
                    disabled={templateForm?.maddeler?.length === 1}
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
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Başlık *'
                      value={madde.baslik || ''}
                      onChange={e =>
                        handleMaddeChange(index, 'baslik', e.target.value)
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      placeholder='örn: İş Kalitesi'
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Puan *'
                      value={madde.puan || 0}
                      onChange={e =>
                        handleMaddeChange(
                          index,
                          'puan',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      inputProps={{ min: -100, max: 100 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Periyot</InputLabel>
                      <Select
                        value={madde.periyot || 'aylik'}
                        onChange={e =>
                          handleMaddeChange(index, 'periyot', e.target.value)
                        }
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value='gunluk'>Günlük</MenuItem>
                        <MenuItem value='haftalik'>Haftalık</MenuItem>
                        <MenuItem value='aylik'>Aylık</MenuItem>
                        <MenuItem value='yillik'>Yıllık</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Açıklama'
                      multiline
                      rows={2}
                      value={madde.aciklama || ''}
                      onChange={e =>
                        handleMaddeChange(index, 'aciklama', e.target.value)
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      placeholder='Bu madde için değerlendirme kriterleri'
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {(!templateForm?.maddeler ||
              templateForm.maddeler.length === 0) && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  color: 'text.secondary',
                }}
              >
                <AssignmentIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                <Typography variant='h6' gutterBottom>
                  Henüz madde eklenmemiş
                </Typography>
                <Typography variant='body2'>
                  "Madde Ekle" butonuna tıklayarak değerlendirme maddesi ekleyin
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
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
          {template ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateDialog;
