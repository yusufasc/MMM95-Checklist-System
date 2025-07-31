import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  Chip,
  Grow,
  useTheme,
  useMediaQuery,
  Slider,
  FormControlLabel,
  Switch,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  AddCircle as AddCircleIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import TemplateScheduleManager from './TemplateScheduleManager';

const ChecklistDialog = ({
  open,
  onClose,
  editMode,
  formData,
  onFormChange,
  handleFormChange,
  onMaddelerChange,
  onAddMadde,
  onRemoveMadde,
  onAddSchedule,
  onRemoveSchedule,
  roles,
  departments,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant='h5' fontWeight='bold'>
          {editMode ? 'Checklist Düzenle' : 'Yeni Checklist Oluştur'}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

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

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin='dense'
                name='ad'
                label='Checklist Adı *'
                fullWidth
                variant='outlined'
                value={
                  formData.tur === 'makina_ayarlari_1'
                    ? 'MAKİNA AYARLARI 1'
                    : formData.tur === 'makina_ayarlari_2'
                      ? 'MAKİNA AYARLARI 2'
                      : formData.ad
                }
                onChange={onFormChange}
                disabled={
                  formData.tur === 'makina_ayarlari_1' ||
                  formData.tur === 'makina_ayarlari_2'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                placeholder='örn: Kalıp Değişimi Kontrol Listesi'
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Checklist Türü *</InputLabel>
                <Select
                  name='tur'
                  value={formData.tur}
                  onChange={onFormChange}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value='rutin'>Rutin</MenuItem>
                  <MenuItem value='iseBagli'>İş Bağlı</MenuItem>
                  <MenuItem value='makina_ayarlari_1'>
                    MAKİNA AYARLARI 1
                  </MenuItem>
                  <MenuItem value='makina_ayarlari_2'>
                    MAKİNA AYARLARI 2
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Periyot *</InputLabel>
                <Select
                  name='periyot'
                  value={formData.periyot}
                  onChange={onFormChange}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value='gunluk'>Günlük</MenuItem>
                  <MenuItem value='haftalik'>Haftalık</MenuItem>
                  <MenuItem value='aylik'>Aylık</MenuItem>
                  <MenuItem value='olayBazli'>Olay Bazlı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Hedef Rol *</InputLabel>
                <Select
                  name='hedefRol'
                  value={formData.hedefRol}
                  onChange={onFormChange}
                  sx={{ borderRadius: 2 }}
                >
                  {roles.map(role => (
                    <MenuItem key={role._id} value={role._id}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <GroupIcon fontSize='small' />
                        {role.ad}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Hedef Departman *</InputLabel>
                <Select
                  name='hedefDepartman'
                  value={formData.hedefDepartman}
                  onChange={onFormChange}
                  sx={{ borderRadius: 2 }}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <WorkIcon fontSize='small' />
                        {dept.ad}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Değerlendirme Rolleri Seçimi - MAKİNA AYARLARI şablonları için */}
          {(formData.tur === 'makina_ayarlari_1' ||
            formData.tur === 'makina_ayarlari_2') && (
            <Grow
              in={
                formData.tur === 'makina_ayarlari_1' ||
                formData.tur === 'makina_ayarlari_2'
              }
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'warning.light',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant='subtitle2'
                  fontWeight='bold'
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <SecurityIcon color='warning' fontSize='small' />
                  Değerlendirme Yetkileri
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Değerlendirme Yapabilecek Roller</InputLabel>
                  <Select
                    name='degerlendirmeRolleri'
                    multiple
                    value={formData.degerlendirmeRolleri || []}
                    onChange={e =>
                      handleFormChange('degerlendirmeRolleri', e.target.value)
                    }
                    sx={{ borderRadius: 2 }}
                    renderValue={selected => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map(roleId => {
                          const role = roles.find(r => r._id === roleId);
                          return role ? (
                            <Chip
                              key={roleId}
                              label={role.ad}
                              size='small'
                              color='primary'
                              variant='outlined'
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {roles.map(role => (
                      <MenuItem key={role._id} value={role._id}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <GroupIcon fontSize='small' />
                          {role.ad}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ mt: 1, display: 'block' }}
                >
                  Bu şablonu kullanarak Personnel Tracking sayfasında
                  değerlendirme yapabilecek rolleri seçin
                </Typography>
              </Paper>
            </Grow>
          )}

          {formData.tur === 'iseBagli' && (
            <Grow in={formData.tur === 'iseBagli'}>
              <TextField
                margin='dense'
                name='isTuru'
                label='İş Türü *'
                fullWidth
                variant='outlined'
                value={formData.isTuru}
                onChange={onFormChange}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                placeholder='örn: Kalıp Değişim, Makine Arızası'
                helperText='Bu iş türü için geçerli olan kontrol listesi'
              />
            </Grow>
          )}
        </Paper>

        {/* Değerlendirme Ayarları */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography
            variant='h6'
            color='primary'
            fontWeight='bold'
            sx={{ mb: 3 }}
          >
            Değerlendirme Ayarları
          </Typography>

          {/* Değerlendirme Saatleri */}
          <TemplateScheduleManager
            schedules={formData.degerlendirmeSaatleri || []}
            onAddSchedule={onAddSchedule}
            onRemoveSchedule={onRemoveSchedule}
          />

          <Divider sx={{ my: 3 }} />

          {/* Kontrol Puanı */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name='kontrolPuani'
                label='Kontrol Puanı'
                type='number'
                fullWidth
                variant='outlined'
                value={formData.kontrolPuani || 0}
                onChange={e => {
                  const value = Math.max(
                    0,
                    Math.min(100, Number(e.target.value) || 0),
                  );
                  handleFormChange('kontrolPuani', value);
                }}
                inputProps={{ min: 0, max: 100 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                helperText='Bu şablonu puanlayan kişiye verilecek puan (0-100)'
                InputProps={{
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <SecurityIcon color='primary' fontSize='small' />
                    </Box>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}
              >
                <Typography variant='caption' fontWeight='bold' display='block'>
                  <span role='img' aria-label='İpucu ikonu'>
                    💡
                  </span>{' '}
                  Kontrol Puanı Sistemi
                </Typography>
                <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                  Üst roller bu şablonu puanladıklarında belirtilen puanı
                  kazanırlar. 0 puan = kontrol puanı verilmez.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Değerlendirme Sıklığı ve Periyodu */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Değerlendirme Sıklığı</InputLabel>
                <Select
                  value={formData.degerlendirmeSikligi || 'Günlük'}
                  label='Değerlendirme Sıklığı'
                  onChange={e =>
                    handleFormChange('degerlendirmeSikligi', e.target.value)
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value='Günlük'>Günlük</MenuItem>
                  <MenuItem value='Haftalık'>Haftalık</MenuItem>
                  <MenuItem value='Aylık'>Aylık</MenuItem>
                  <MenuItem value='Özel'>Özel</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ px: 2 }}>
                <Typography gutterBottom variant='subtitle2' fontWeight='bold'>
                  Değerlendirme Periyodu: {formData.degerlendirmePeriyodu || 2}{' '}
                  saat
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
                    handleFormChange('degerlendirmePeriyodu', value)
                  }
                  min={1}
                  max={8}
                  marks={[
                    { value: 1, label: '1h' },
                    { value: 2, label: '2h' },
                    { value: 4, label: '4h' },
                    { value: 6, label: '6h' },
                    { value: 8, label: '8h' },
                  ]}
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

            {/* Aktif Durumu */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      formData.aktif !== undefined ? formData.aktif : true
                    }
                    onChange={e => handleFormChange('aktif', e.target.checked)}
                  />
                }
                label='Aktif'
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant='h6' color='primary' fontWeight='bold'>
              Checklist Maddeleri ({formData.maddeler.length})
            </Typography>
            <Button
              variant='contained'
              startIcon={<AddCircleIcon />}
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

          <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {formData.maddeler.map((madde, index) => (
              <Grow in key={index} timeout={300 + index * 100}>
                <ListItem
                  sx={{
                    border: '2px solid #e3f2fd',
                    mb: 2,
                    borderRadius: 3,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    position: 'relative',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
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
                        disabled={formData.maddeler.length === 1}
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

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          label='Kontrol Sorusu *'
                          value={madde.soru}
                          onChange={e =>
                            onMaddelerChange(index, 'soru', e.target.value)
                          }
                          fullWidth
                          multiline
                          rows={2}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                          placeholder='örn: Eski kalıp çıkarıldı mı?'
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label='Puan *'
                          type='number'
                          value={madde.puan}
                          onChange={e =>
                            onMaddelerChange(
                              index,
                              'puan',
                              parseInt(e.target.value) || 0,
                            )
                          }
                          fullWidth
                          inputProps={{ min: 1, max: 100 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label='Resim URL (Opsiyonel)'
                          value={madde.resimUrl}
                          onChange={e =>
                            onMaddelerChange(index, 'resimUrl', e.target.value)
                          }
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                          placeholder='https://example.com/image.jpg'
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label='Açıklama (Opsiyonel)'
                          value={madde.aciklama}
                          onChange={e =>
                            onMaddelerChange(index, 'aciklama', e.target.value)
                          }
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                          placeholder='Ek açıklama veya not'
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={madde.fotografGereklimi || false}
                              onChange={e =>
                                onMaddelerChange(
                                  index,
                                  'fotografGereklimi',
                                  e.target.checked,
                                )
                              }
                            />
                          }
                          label='Fotoğraf Gerekli'
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={
                                madde.zorunlu !== undefined
                                  ? madde.zorunlu
                                  : true
                              }
                              onChange={e =>
                                onMaddelerChange(
                                  index,
                                  'zorunlu',
                                  e.target.checked,
                                )
                              }
                            />
                          }
                          label='Zorunlu Madde'
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </ListItem>
              </Grow>
            ))}
          </List>
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
          {editMode ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChecklistDialog;
