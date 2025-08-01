import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Paper,
  TextField,
  Rating,
  Avatar,
  Divider,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Save as SaveIcon,
  Star as StarIcon,
  Image as ImageIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';
import { getTaskTypeText } from '../../utils/controlPendingHelpers';

const ScoreDialog = ({
  open,
  selectedTask,
  scoringData,
  onClose,
  onScoreChange,
  onImagePreview,
  onScoringDataChange,
  onSubmit,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!selectedTask) {
    return null;
  }

  // Toplam puanı hesapla (dinamik yıldız sistemi)
  const getTotalScore = () => {
    if (!scoringData.maddeler) {
      return 0;
    }
    return scoringData.maddeler.reduce(
      (total, madde) => total + (madde.kontrolPuani || 0),
      0,
    );
  };

  const getMaxScore = () => {
    if (!scoringData.maddeler) {
      return 0;
    }
    // ✅ DÜZELTME: Her maddenin kendi maksimum puanını topla
    return scoringData.maddeler.reduce(
      (total, madde) => total + (madde.maksimumPuan || madde.puan || 10),
      0,
    );
  };

  // ✅ YENİ: Her madde için maksimum puan değerini hesapla
  const getMaddeMaxPuan = madde => {
    return madde.maksimumPuan || madde.puan || 10;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarRating = (index, value) => {
    onScoreChange(index, 'kontrolPuani', value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        },
      }}
    >
      {/* Modern Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 3,
          px: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 56,
              height: 56,
              backdropFilter: 'blur(10px)',
            }}
          >
            {selectedTask.taskType === 'worktask' ? (
              <BuildIcon sx={{ fontSize: 28 }} />
            ) : (
              <CheckCircleIcon sx={{ fontSize: 28 }} />
            )}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {selectedTask.kullanici?.ad} {selectedTask.kullanici?.soyad} -
              Bonus Değerlendirme
            </Typography>
            <Typography
              variant='body1'
              sx={{
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PersonIcon sx={{ fontSize: 18 }} />
              {selectedTask.checklist?.ad || 'Görev Detayı'} •{' '}
              {getTaskTypeText(selectedTask.taskType)}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: 'transparent' }}>
        <Box sx={{ p: 4 }}>
          {/* Score Summary Card */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
                  Toplam Puan
                </Typography>
                <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                  {getTotalScore()} / {getMaxScore()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 64, opacity: 0.7 }} />
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {scoringData.maddeler?.length || 0} Değerlendirme Maddesi
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* ✅ YENİ: WorkTask Bilgileri */}
          {selectedTask.taskType === 'worktask' && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  mb: 3,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <EngineeringIcon />
                Kalıp Değişim Bilgileri
              </Typography>

              <Grid container spacing={3}>
                {/* Buddy Bilgisi */}
                {selectedTask.kalipDegisimBuddy && (
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <GroupIcon />
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ opacity: 0.8, mb: 0.5 }}
                        >
                          Kalıp Değişim Buddy
                        </Typography>
                        <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                          {selectedTask.kalipDegisimBuddy.ad}{' '}
                          {selectedTask.kalipDegisimBuddy.soyad}
                        </Typography>
                        <Typography variant='caption' sx={{ opacity: 0.7 }}>
                          {selectedTask.kalipDegisimBuddy.roller
                            ?.map(r => r.ad)
                            .join(', ')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* Makina Durdurma Saati */}
                {selectedTask.makinaDurmaSaati && (
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'warning.main',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <StopIcon />
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ opacity: 0.8, mb: 0.5 }}
                        >
                          Makina Durdurma
                        </Typography>
                        <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                          {new Date(
                            selectedTask.makinaDurmaSaati,
                          ).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* Makina Başlatma Saati */}
                {selectedTask.yeniKalipAktifSaati && (
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'success.main',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <PlayArrowIcon />
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ opacity: 0.8, mb: 0.5 }}
                        >
                          Makina Başlatma
                        </Typography>
                        <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                          {new Date(
                            selectedTask.yeniKalipAktifSaati,
                          ).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* Değişim Süresi */}
                {selectedTask.makinaDurmaSaati &&
                  selectedTask.yeniKalipAktifSaati && (
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <ScheduleIcon />
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ opacity: 0.8, mb: 0.5 }}
                        >
                            Değişim Süresi
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{ fontWeight: 'bold' }}
                        >
                          {(() => {
                            const durma = new Date(
                              selectedTask.makinaDurmaSaati,
                            );
                            const baslama = new Date(
                              selectedTask.yeniKalipAktifSaati,
                            );
                            const farkMs = baslama - durma;
                            const farkDakika = Math.round(
                              farkMs / (1000 * 60),
                            );

                            if (farkDakika < 60) {
                              return `${farkDakika} dakika`;
                            } else {
                              const saat = Math.floor(farkDakika / 60);
                              const dakika = farkDakika % 60;
                              return `${saat}s ${dakika}dk`;
                            }
                          })()}
                        </Typography>
                        <Chip
                          size='small'
                          label={(() => {
                            const durma = new Date(
                              selectedTask.makinaDurmaSaati,
                            );
                            const baslama = new Date(
                              selectedTask.yeniKalipAktifSaati,
                            );
                            const farkDakika = Math.round(
                              (baslama - durma) / (1000 * 60),
                            );

                            if (farkDakika <= 60) {
                              return 'Hızlı';
                            }
                            if (farkDakika <= 120) {
                              return 'Normal';
                            }
                            return 'Yavaş';
                          })()}
                          color={(() => {
                            const durma = new Date(
                              selectedTask.makinaDurmaSaati,
                            );
                            const baslama = new Date(
                              selectedTask.yeniKalipAktifSaati,
                            );
                            const farkDakika = Math.round(
                              (baslama - durma) / (1000 * 60),
                            );

                            if (farkDakika <= 60) {
                              return 'success';
                            }
                            if (farkDakika <= 120) {
                              return 'warning';
                            }
                            return 'error';
                          })()}
                          sx={{ mt: 0.5, color: 'white' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* Kalıp Bilgileri */}
                {(selectedTask.indirilenKalip ||
                  selectedTask.baglananHamade) && (
                  <Grid item xs={12}>
                    <Divider
                      sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                    <Grid container spacing={2}>
                      {selectedTask.indirilenKalip && (
                        <Grid item xs={12} md={6}>
                          <Typography
                            variant='subtitle2'
                            sx={{ opacity: 0.8, mb: 1 }}
                          >
                            İndirilen Kalıp
                          </Typography>
                          <Typography
                            variant='body1'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {selectedTask.indirilenKalip.ad}
                          </Typography>
                          <Typography variant='caption' sx={{ opacity: 0.7 }}>
                            {selectedTask.indirilenKalip.envanterKodu}
                          </Typography>
                        </Grid>
                      )}
                      {selectedTask.baglananHamade && (
                        <Grid item xs={12} md={6}>
                          <Typography
                            variant='subtitle2'
                            sx={{ opacity: 0.8, mb: 1 }}
                          >
                            Bağlanan Kalıp
                          </Typography>
                          <Typography
                            variant='body1'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {selectedTask.baglananHamade.ad}
                          </Typography>
                          <Typography variant='caption' sx={{ opacity: 0.7 }}>
                            {selectedTask.baglananHamade.envanterKodu}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Performance Warning */}
          {selectedTask.durum !== 'tamamlandi' && (
            <Alert severity='warning' sx={{ mb: 3, borderRadius: 2 }}>
              Bu görev henüz tamamlanmamış. Sadece görüntüleme modunda.
            </Alert>
          )}

          {/* Değerlendirme Maddeleri */}
          <Typography
            variant='h5'
            sx={{
              mb: 3,
              fontWeight: 'bold',
              textAlign: 'center',
              color: 'primary.main',
            }}
          >
            Değerlendirme Maddeleri
          </Typography>

          <Stack spacing={3}>
            {scoringData.maddeler?.map((madde, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Madde Başlığı */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 'bold',
                      mb: 1,
                      color: 'text.primary',
                    }}
                  >
                    {madde.soru || madde.baslik || `Madde ${index + 1}`}
                  </Typography>

                  {madde.aciklama && (
                    <Typography variant='body2' color='text.secondary'>
                      {madde.aciklama}
                    </Typography>
                  )}
                </Box>

                {/* Puanlama Bölümü */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    py: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                    Puan:
                  </Typography>

                  {/* 10 Yıldız Rating */}
                  <Rating
                    name={`rating-${index}`}
                    value={madde.kontrolPuani || 0}
                    onChange={(event, newValue) =>
                      handleStarRating(index, newValue)
                    }
                    max={getMaddeMaxPuan(madde)}
                    disabled={selectedTask.durum !== 'tamamlandi'}
                    size='large'
                    sx={{
                      fontSize: '2rem',
                      '& .MuiRating-iconFilled': {
                        color: '#ffd700',
                      },
                      '& .MuiRating-iconHover': {
                        color: '#ffb400',
                      },
                    }}
                  />

                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 'bold',
                      color: madde.kontrolPuani
                        ? 'primary.main'
                        : 'text.secondary',
                    }}
                  >
                    {madde.kontrolPuani || 0} / {getMaddeMaxPuan(madde)}
                  </Typography>
                </Box>

                {/* Kullanıcı Yorumu */}
                {madde.yorum && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mb: 1, display: 'block' }}
                    >
                      Kullanıcı açıklaması:
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'info.50',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'info.200',
                      }}
                    >
                      <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
                        "{madde.yorum}"
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Resim Önizleme */}
                {madde.resimUrl && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      startIcon={<ImageIcon />}
                      onClick={() => onImagePreview(madde.resimUrl)}
                      variant='outlined'
                      size='small'
                      sx={{ borderRadius: 2 }}
                    >
                      Fotoğrafı Görüntüle
                    </Button>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Değerlendirici Yorumu */}
                <Box>
                  <Typography
                    variant='subtitle2'
                    sx={{ mb: 1, fontWeight: 'bold' }}
                  >
                    Açıklama
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder='Bu madde hakkında açıklama yazın...'
                    value={madde.kontrolYorumu || ''}
                    onChange={e =>
                      onScoreChange(index, 'kontrolYorumu', e.target.value)
                    }
                    disabled={selectedTask.durum !== 'tamamlandi'}
                    variant='outlined'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Box>
              </Paper>
            ))}
          </Stack>

          {/* Genel Değerlendirme */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mt: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            }}
          >
            <Typography
              variant='h6'
              sx={{
                mb: 2,
                fontWeight: 'bold',
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              Genel Değerlendirme
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder='Bu performans değerlendirmesi hakkında genel yorumunuzu yazın...'
              value={scoringData.kontrolNotu || ''}
              onChange={e =>
                onScoringDataChange({
                  ...scoringData,
                  kontrolNotu: e.target.value,
                })
              }
              disabled={selectedTask.durum !== 'tamamlandi'}
              variant='outlined'
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white',
                },
              }}
            />
          </Paper>
        </Box>
      </DialogContent>

      {/* Modern Footer */}
      <DialogActions
        sx={{
          p: 3,
          bgcolor: 'white',
          borderTop: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Button
          onClick={onClose}
          size='large'
          startIcon={<CancelIcon />}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            color: 'text.secondary',
          }}
        >
          İptal
        </Button>

        {selectedTask.durum === 'tamamlandi' && (
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={submitting}
            size='large'
            startIcon={submitting ? <StarIcon /> : <SaveIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            {submitting ? 'Kaydediliyor...' : 'KAYDET'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ScoreDialog;
