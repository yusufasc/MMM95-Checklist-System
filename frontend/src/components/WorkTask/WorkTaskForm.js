// Görev ekleme/düzenleme formu
// Otomatik oluşturuldu: 2025-06-10T12:05:48.984Z
// Orijinal: WorkTasks.js

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const WorkTaskForm = ({
  open,
  onClose,
  selectedChecklist,
  makinalar = [],
  kaliplar = [],
  users = [], // Buddy seçimi için kullanıcılar
  onSubmit,
  submitting = false,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    makina: '',
    inenKalip: '',
    yazilanKalip: '',
    makinaDurmaSaati: new Date().toISOString().slice(0, 16), // datetime-local format
    makinaBaslatmaSaati: '',
    kalipDegisimBuddy: '',
    aciklama: '',
    checklistItems: [],
  });

  const steps = [
    'Makina & Kalıp Seçimi',
    'Checklist Doldurma',
    'Özet & Gönderim',
  ];

  // 👥 Buddy selection for Kalıp Değişim - Usta ve VARDİYA AMİRİ rolleri
  const buddyUsers = users.filter(
    user =>
      user.roller &&
      user.roller.some(
        role => role.ad === 'Usta' || role.ad === 'VARDİYA AMİRİ',
      ),
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && selectedChecklist) {
      setActiveStep(0);
      setFormData({
        makina: '',
        inenKalip: '',
        yazilanKalip: '',
        makinaDurmaSaati: new Date().toISOString().slice(0, 16),
        makinaBaslatmaSaati: '',
        kalipDegisimBuddy: '',
        aciklama: '',
        checklistItems:
          selectedChecklist.maddeler?.map(madde => ({
            ...madde,
            tamamlandi: false,
            aciklama: '',
          })) || [],
      });
    }
  }, [open, selectedChecklist]);

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChecklistItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const canGoNext = () => {
    if (activeStep === 0) {
      return (
        formData.makina &&
        formData.inenKalip &&
        formData.yazilanKalip &&
        formData.makinaDurmaSaati &&
        formData.kalipDegisimBuddy
      );
    }
    if (activeStep === 1) {
      return formData.checklistItems.every(
        item => item.tamamlandi !== undefined,
      );
    }
    return true;
  };

  const handleSubmit = () => {
    const submitData = {
      checklistId: selectedChecklist._id,
      makinaId: formData.makina, // Backend expects 'makinaId'
      indirilenKalip: formData.inenKalip, // Backend expects 'indirilenKalip'
      baglananHamade: formData.yazilanKalip, // Backend expects 'baglananHamade'
      makinaDurmaSaati: new Date(formData.makinaDurmaSaati).toISOString(),
      yeniKalipAktifSaati: formData.makinaBaslatmaSaati
        ? new Date(formData.makinaBaslatmaSaati).toISOString()
        : new Date().toISOString(),
      kalipDegisimBuddy: formData.kalipDegisimBuddy, // Yeni alan
      bakimaGitsinMi: false,
      bakimSebebi: formData.aciklama || '',
      checklistItems: formData.checklistItems,
    };

    console.log('🔧 WorkTaskForm submitting (backend format):', submitData);
    onSubmit(submitData);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Makina</InputLabel>
                <Select
                  value={formData.makina}
                  onChange={e => handleInputChange('makina', e.target.value)}
                  label='Makina'
                >
                  {makinalar.map(makina => {
                    // Model Kodu / Tipi bilgisini al
                    const modelKodu =
                      makina.dinamikAlanlar?.['Model Kodu / Tipi'] ||
                      makina.dinamikAlanlar?.['model kodu / tipi'] ||
                      makina.dinamikAlanlar?.modelKodu;

                    return (
                      <MenuItem key={makina._id} value={makina._id}>
                        <Box>
                          <Typography variant='body2'>
                            {makina.kod} - {makina.ad}
                          </Typography>
                          {modelKodu && (
                            <Typography
                              variant='caption'
                              color='primary'
                              sx={{ fontWeight: 500 }}
                            >
                              <span role='img' aria-label='tool'>
                                🔧
                              </span>{' '}
                              {modelKodu}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>İnen Kalıp</InputLabel>
                <Select
                  value={formData.inenKalip}
                  onChange={e => handleInputChange('inenKalip', e.target.value)}
                  label='İnen Kalıp'
                >
                  {kaliplar.map(kalip => (
                    <MenuItem key={kalip._id} value={kalip._id}>
                      {kalip.kod} - {kalip.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Yazılan Kalıp</InputLabel>
                <Select
                  value={formData.yazilanKalip}
                  onChange={e =>
                    handleInputChange('yazilanKalip', e.target.value)
                  }
                  label='Yazılan Kalıp'
                >
                  {kaliplar.map(kalip => (
                    <MenuItem key={kalip._id} value={kalip._id}>
                      {kalip.kod} - {kalip.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Makina Durma Saati'
                type='datetime-local'
                value={formData.makinaDurmaSaati}
                onChange={e =>
                  handleInputChange('makinaDurmaSaati', e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Makina Başlatma Saati'
                type='datetime-local'
                value={formData.makinaBaslatmaSaati}
                onChange={e =>
                  handleInputChange('makinaBaslatmaSaati', e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Kalıp Değişim Buddy</InputLabel>
                <Select
                  value={formData.kalipDegisimBuddy}
                  onChange={e =>
                    handleInputChange('kalipDegisimBuddy', e.target.value)
                  }
                  label='Kalıp Değişim Buddy'
                >
                  {buddyUsers.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.ad} {user.soyad} (
                      {user.roller.map(r => r.ad).join(', ')})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama (Opsiyonel)'
                multiline
                rows={3}
                value={formData.aciklama}
                onChange={e => handleInputChange('aciklama', e.target.value)}
                placeholder='Kalıp değişimi hakkında notlar...'
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant='h6' gutterBottom>
              <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {selectedChecklist?.ad} - Kontrol Maddeleri
            </Typography>

            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant='determinate'
                value={
                  (formData.checklistItems.filter(item => item.tamamlandi)
                    .length /
                    formData.checklistItems.length) *
                  100
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 1, display: 'block' }}
              >
                {formData.checklistItems.filter(item => item.tamamlandi).length}{' '}
                / {formData.checklistItems.length} madde tamamlandı
              </Typography>
            </Box>

            {formData.checklistItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  mb: 3,
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.tamamlandi || false}
                      onChange={e =>
                        handleChecklistItemChange(
                          index,
                          'tamamlandi',
                          e.target.checked,
                        )
                      }
                      color='primary'
                    />
                  }
                  label={
                    <Box>
                      <Typography variant='body1' fontWeight='medium'>
                        {item.soru || item.baslik}
                      </Typography>
                      <Chip
                        label={`${item.puan} Puan`}
                        size='small'
                        color='primary'
                        variant='outlined'
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                />

                <TextField
                  fullWidth
                  size='small'
                  label='Not/Açıklama'
                  value={item.aciklama || ''}
                  onChange={e =>
                    handleChecklistItemChange(index, 'aciklama', e.target.value)
                  }
                  sx={{ mt: 1 }}
                  placeholder='Bu madde hakkında notlar...'
                />
              </Box>
            ))}
          </Box>
        );

      case 2: {
        const selectedMakina = makinalar.find(m => m._id === formData.makina);
        const selectedInenKalip = kaliplar.find(
          k => k._id === formData.inenKalip,
        );
        const selectedYazilanKalip = kaliplar.find(
          k => k._id === formData.yazilanKalip,
        );
        const selectedBuddy = buddyUsers.find(
          u => u._id === formData.kalipDegisimBuddy,
        );
        const completedItems = formData.checklistItems.filter(
          item => item.tamamlandi,
        );

        return (
          <Box>
            <Alert severity='info' sx={{ mb: 3 }}>
              <Typography variant='body2'>
                Kalıp değişim işlemi tamamlanmak üzere. Bilgileri kontrol edin
                ve onaylayın.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Makina
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedMakina?.kod} - {selectedMakina?.ad}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Kalıp Değişim Buddy
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedBuddy
                    ? `${selectedBuddy.ad} ${selectedBuddy.soyad} (${selectedBuddy.roller.map(r => r.ad).join(', ')})`
                    : 'Seçilmemiş'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Makina Durma Saati
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {new Date(formData.makinaDurmaSaati).toLocaleString('tr-TR')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Makina Başlatma Saati
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {formData.makinaBaslatmaSaati
                    ? new Date(formData.makinaBaslatmaSaati).toLocaleString(
                      'tr-TR',
                    )
                    : 'Belirlenmemiş'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  İnen Kalıp
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedInenKalip?.kod} - {selectedInenKalip?.ad}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Yazılan Kalıp
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedYazilanKalip?.kod} - {selectedYazilanKalip?.ad}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Tamamlanan Maddeler
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {completedItems.length} / {formData.checklistItems.length}{' '}
                  madde
                  {completedItems.length === formData.checklistItems.length && (
                    <CheckCircleIcon
                      sx={{
                        ml: 1,
                        color: 'success.main',
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </Typography>
              </Grid>

              {formData.aciklama && (
                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Açıklama
                  </Typography>
                  <Typography variant='body1' gutterBottom>
                    {formData.aciklama}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      }

      default:
        return null;
    }
  };

  if (!selectedChecklist) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant='h6' component='div'>
              Kalıp Değişim - {selectedChecklist.ad}
            </Typography>
          </Box>
          <Tooltip title='Kapat'>
            <IconButton onClick={onClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {submitting && <LinearProgress sx={{ mb: 2 }} />}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>
          İptal
        </Button>

        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={submitting}>
            Geri
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            variant='contained'
            onClick={handleNext}
            disabled={!canGoNext() || submitting}
          >
            İleri
          </Button>
        ) : (
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={submitting}
            color='success'
          >
            {submitting ? 'Gönderiliyor...' : 'Kalıp Değişimini Tamamla'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WorkTaskForm;
