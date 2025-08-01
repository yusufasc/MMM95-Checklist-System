import React, { memo, useEffect } from 'react';
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
  Typography,
  Box,
  IconButton,
  Autocomplete,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';

import { useMeetingForm } from '../../hooks/useMeetingForm';
import EmojiWrapper from '../EmojiWrapper';

/**
 * 📝 Meeting Dialog Component
 * MMM95 pattern: Form dialog with comprehensive validation
 */
const MeetingDialog = memo(
  ({
    open = false,
    onClose,
    onSubmit,
    meeting = null, // For editing
    users = [],
    departments = [],
    machines = [],
    checklists = [],
    _loading = false,
  }) => {
    const isEditing = Boolean(meeting);

    // Use meeting form hook
    const {
      formData,
      errors,
      touched,
      isSubmitting,
      handleChange,
      handleNestedChange,
      handleSubmit,
      resetForm,
      getFieldProps,
      addParticipant,
      removeParticipant,
      updateParticipantRole,
      addAgendaItem,
      removeAgendaItem,
      updateAgendaItem,
      isValid,
    } = useMeetingForm(meeting, users, departments, machines, checklists);

    // Reset form when dialog opens/closes
    useEffect(() => {
      if (!open) {
        resetForm();
      }
    }, [open, resetForm]);

    /**
     * Handle form submission
     */
    const handleFormSubmit = async () => {
      const result = await handleSubmit(async data => {
        if (isEditing) {
          return await onSubmit(meeting._id, data);
        } else {
          return await onSubmit(data);
        }
      });

      if (result.success) {
        onClose();
      }
    };

    /**
     * Handle participant selection
     */
    const handleParticipantAdd = (event, user) => {
      if (user) {
        addParticipant(user._id, 'katılımcı');
      }
    };

    /**
     * Get available users for participant selection
     */
    const getAvailableUsers = () => {
      const selectedUserIds = formData.katilimcilar.map(k => k.kullanici);
      return users.filter(user => !selectedUserIds.includes(user._id));
    };

    /**
     * Render participant list
     */
    const renderParticipants = () => {
      if (formData.katilimcilar.length === 0) {
        return (
          <Alert severity='info' sx={{ mt: 1 }}>
            Henüz katılımcı eklenmedi. Lütfen en az bir katılımcı ekleyin.
          </Alert>
        );
      }

      return (
        <Box sx={{ mt: 1 }}>
          {formData.katilimcilar.map((participant, _index) => {
            const user = users.find(u => u._id === participant.kullanici);
            if (!user) {
              return null;
            }

            return (
              <Box
                key={participant.kullanici}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color='action' />
                  <Typography variant='body2'>
                    {user.ad} {user.soyad}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControl size='small' sx={{ minWidth: 120 }}>
                    <Select
                      value={participant.rol}
                      onChange={e =>
                        updateParticipantRole(
                          participant.kullanici,
                          e.target.value,
                        )
                      }
                    >
                      <MenuItem value='katılımcı'>Katılımcı</MenuItem>
                      <MenuItem value='sunucu'>Sunucu</MenuItem>
                      <MenuItem value='karar-verici'>Karar Verici</MenuItem>
                      <MenuItem value='gözlemci'>Gözlemci</MenuItem>
                    </Select>
                  </FormControl>

                  <IconButton
                    size='small'
                    onClick={() => removeParticipant(participant.kullanici)}
                    color='error'
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      );
    };

    /**
     * Render agenda items
     */
    const renderAgenda = () => {
      return (
        <Box sx={{ mt: 2 }}>
          {formData.gundem.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Typography variant='body2' sx={{ minWidth: 30 }}>
                {item.siraNo}.
              </Typography>
              <TextField
                size='small'
                placeholder='Gündem maddesi'
                value={item.baslik}
                onChange={e =>
                  updateAgendaItem(index, { baslik: e.target.value })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size='small'
                type='number'
                placeholder='Süre (dk)'
                value={item.sure}
                onChange={e =>
                  updateAgendaItem(index, {
                    sure: parseInt(e.target.value) || 10,
                  })
                }
                sx={{ width: 80 }}
                InputProps={{ inputProps: { min: 1, max: 180 } }}
              />
              <IconButton
                size='small'
                onClick={() => removeAgendaItem(index)}
                color='error'
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() => addAgendaItem({ baslik: '', sure: 10 })}
            variant='outlined'
            size='small'
            sx={{ mt: 1 }}
          >
            Gündem Maddesi Ekle
          </Button>
        </Box>
      );
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { height: '90vh' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupsIcon />
            <Typography variant='h6'>
              {isEditing ? 'Toplantı Düzenle' : 'Yeni Toplantı Oluştur'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ height: '100%', overflow: 'auto' }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                <EmojiWrapper emoji='📋' label='dosya' /> Temel Bilgiler
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Toplantı Başlığı'
                placeholder='Örn: Haftalık Üretim Toplantısı'
                {...getFieldProps('baslik')}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama'
                placeholder='Toplantı hakkında kısa açıklama...'
                multiline
                rows={2}
                {...getFieldProps('aciklama')}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.kategori}
                  onChange={e => handleChange('kategori', e.target.value)}
                  label='Kategori'
                >
                  <MenuItem value='rutin'>Rutin</MenuItem>
                  <MenuItem value='proje'>Proje</MenuItem>
                  <MenuItem value='acil'>Acil</MenuItem>
                  <MenuItem value='kalite'>Kalite</MenuItem>
                  <MenuItem value='güvenlik'>Güvenlik</MenuItem>
                  <MenuItem value='performans'>Performans</MenuItem>
                  <MenuItem value='vardiya'>Vardiya</MenuItem>
                  <MenuItem value='kalip-degisim'>Kalıp Değişim</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Öncelik</InputLabel>
                <Select
                  value={formData.oncelik}
                  onChange={e => handleChange('oncelik', e.target.value)}
                  label='Öncelik'
                >
                  <MenuItem value='düşük'>Düşük</MenuItem>
                  <MenuItem value='normal'>Normal</MenuItem>
                  <MenuItem value='yüksek'>Yüksek</MenuItem>
                  <MenuItem value='kritik'>Kritik</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date & Time */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                <EmojiWrapper emoji='🕐' label='saat' /> Tarih ve Saat
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <TextField
                fullWidth
                label='Tarih'
                type='date'
                value={formData.tarih}
                onChange={e => handleChange('tarih', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={touched.tarih && !!errors.tarih}
                helperText={touched.tarih && errors.tarih}
                required
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                fullWidth
                label='Başlangıç Saati'
                type='time'
                value={formData.baslangicSaati}
                onChange={e => handleChange('baslangicSaati', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={touched.baslangicSaati && !!errors.baslangicSaati}
                helperText={touched.baslangicSaati && errors.baslangicSaati}
                required
              />
            </Grid>

            <Grid item xs={4}>
              <TextField
                fullWidth
                label='Bitiş Saati'
                type='time'
                value={formData.bitisSaati}
                onChange={e => handleChange('bitisSaati', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={touched.bitisSaati && !!errors.bitisSaati}
                helperText={touched.bitisSaati && errors.bitisSaati}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Lokasyon'
                placeholder='Örn: Toplantı Salonu A, Teams, Üretim Alanı'
                {...getFieldProps('lokasyon')}
              />
            </Grid>

            {/* Related Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                <EmojiWrapper emoji='🔗' label='bağlantı' /> İlişkili Bilgiler
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Departman</InputLabel>
                <Select
                  value={formData.departman}
                  onChange={e => handleChange('departman', e.target.value)}
                  label='Departman'
                >
                  <MenuItem value=''>Seçiniz</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Makina</InputLabel>
                <Select
                  value={formData.makina}
                  onChange={e => handleChange('makina', e.target.value)}
                  label='Makina'
                >
                  <MenuItem value=''>Seçiniz</MenuItem>
                  {machines.map(machine => (
                    <MenuItem key={machine._id} value={machine._id}>
                      {machine.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>İlgili Checklist</InputLabel>
                <Select
                  value={formData.ilgiliChecklist}
                  onChange={e =>
                    handleChange('ilgiliChecklist', e.target.value)
                  }
                  label='İlgili Checklist'
                >
                  <MenuItem value=''>Seçiniz</MenuItem>
                  {checklists.map(checklist => (
                    <MenuItem key={checklist._id} value={checklist._id}>
                      {checklist.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Participants */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                <EmojiWrapper emoji='👥' label='grup' /> Katılımcılar
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={getAvailableUsers()}
                getOptionLabel={option =>
                  `${option.ad} ${option.soyad} (${option.kullaniciAdi})`
                }
                onChange={handleParticipantAdd}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Katılımcı Ekle'
                    placeholder='Kullanıcı seçin...'
                  />
                )}
                value={null}
              />
              {touched.katilimcilar && errors.katilimcilar && (
                <Typography color='error' variant='caption'>
                  {errors.katilimcilar}
                </Typography>
              )}
              {renderParticipants()}
            </Grid>

            {/* Agenda */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                <EmojiWrapper emoji='📝' label='not' /> Gündem
              </Typography>
              {renderAgenda()}
            </Grid>

            {/* Recurring Settings */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='h6' gutterBottom>
                <EmojiWrapper emoji='🔄' label='tekrar' /> Tekrarlama Ayarları
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Tekrarlama Tipi</InputLabel>
                <Select
                  value={formData.tekrarlamaAyarlari.tip}
                  onChange={e =>
                    handleNestedChange(
                      'tekrarlamaAyarlari',
                      'tip',
                      e.target.value,
                    )
                  }
                  label='Tekrarlama Tipi'
                >
                  <MenuItem value='yok'>Tekrarlanmayacak</MenuItem>
                  <MenuItem value='günlük'>Günlük</MenuItem>
                  <MenuItem value='haftalık'>Haftalık</MenuItem>
                  <MenuItem value='aylık'>Aylık</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tekrarlamaAyarlari.tip !== 'yok' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label='Aralık'
                    type='number'
                    value={formData.tekrarlamaAyarlari.aralik}
                    onChange={e =>
                      handleNestedChange(
                        'tekrarlamaAyarlari',
                        'aralik',
                        parseInt(e.target.value) || 1,
                      )
                    }
                    inputProps={{ min: 1, max: 30 }}
                    helperText={`Her ${formData.tekrarlamaAyarlari.aralik} ${
                      formData.tekrarlamaAyarlari.tip === 'günlük'
                        ? 'gün'
                        : formData.tekrarlamaAyarlari.tip === 'haftalık'
                          ? 'hafta'
                          : 'ay'
                    }da bir`}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label='Bitiş Tarihi'
                    type='date'
                    value={formData.tekrarlamaAyarlari.bitisTarihi}
                    onChange={e =>
                      handleNestedChange(
                        'tekrarlamaAyarlari',
                        'bitisTarihi',
                        e.target.value,
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label='Tekrar Sayısı'
                    type='number'
                    value={formData.tekrarlamaAyarlari.tekrarSayisi || ''}
                    onChange={e =>
                      handleNestedChange(
                        'tekrarlamaAyarlari',
                        'tekrarSayisi',
                        parseInt(e.target.value) || null,
                      )
                    }
                    inputProps={{ min: 1, max: 100 }}
                    helperText='Boş bırakılırsa bitiş tarihine kadar devam eder'
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant='contained'
            disabled={isSubmitting || !isValid}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting
              ? 'Kaydediliyor...'
              : isEditing
                ? 'Güncelle'
                : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);

MeetingDialog.displayName = 'MeetingDialog';

export default MeetingDialog;
