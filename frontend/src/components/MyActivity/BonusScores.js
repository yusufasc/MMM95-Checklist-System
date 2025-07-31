import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  Button,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Grade as GradeIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as BonusIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BonusScores = ({ bonusScores = [], loading = false }) => {
  const navigate = useNavigate();

  const getSuccessColor = percentage => {
    if (percentage >= 90) {
      return '#4CAF50';
    } // Yeşil
    if (percentage >= 70) {
      return '#FF9800';
    } // Turuncu
    return '#F44336'; // Kırmızı
  };

  const getBonusCategoryColor = category => {
    switch (category) {
      case 'Günlük Bonus':
        return '#2196F3';
      case 'Performans Bonusu':
        return '#4CAF50';
      case 'Verimlilik Bonusu':
        return '#FF9800';
      default:
        return '#9C27B0';
    }
  };

  // Özet istatistikleri hesapla
  const toplamBonusPuani = bonusScores.reduce(
    (sum, bonus) => sum + (bonus.toplamPuan || 0),
    0,
  );
  const ortalamaPuan =
    bonusScores.length > 0
      ? (toplamBonusPuani / bonusScores.length).toFixed(1)
      : 0;

  const basariliDegerlendirme = bonusScores.filter(
    b => (b.basariYuzdesi || 0) >= 70,
  ).length;

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant='h6'>Bonus puanları yükleniyor...</Typography>
      </Box>
    );
  }

  if (bonusScores.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <BonusIcon sx={{ fontSize: 80, color: '#E91E63', mb: 2 }} />
        <Typography variant='h5' gutterBottom color='text.secondary'>
          Henüz bonus değerlendirmesi bulunamadı
        </Typography>
        <Typography variant='body1' sx={{ mb: 3, color: 'text.secondary' }}>
          VARDİYA AMİRİ tarafından değerlendirme yapıldığında burada
          görünecektir.
        </Typography>
        <Alert severity='info' sx={{ mb: 2, textAlign: 'left' }}>
          <Typography variant='body2'>
            <strong>Bonus Değerlendirme Sistemi:</strong>
            <br />
            • VARDİYA AMİRİ'niz sizi değerlendirdiğinde bonus puanlarınız burada
            görünür
            <br />
            • Günlük, haftalık ve aylık bonus kategorileri mevcut
            <br />• Başarı yüzdeniz %70'in üstündeyse bonus hak ediyorsunuz
          </Typography>
        </Alert>
        <Button
          variant='contained'
          onClick={() => navigate('/bonus-evaluation')}
          sx={{
            background: 'linear-gradient(45deg, #E91E63 30%, #F06292 90%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #C2185B 30%, #E91E63 90%)',
            },
          }}
        >
          Bonus Değerlendirme Sayfasını Görüntüle
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Yönlendirme Butonu */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant='h6'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <BonusIcon sx={{ color: '#E91E63' }} />
            Bonus Puanlarım
          </Typography>
          <Button
            variant='contained'
            onClick={() => navigate('/bonus-evaluation')}
            sx={{
              background: 'linear-gradient(45deg, #E91E63 30%, #F06292 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #C2185B 30%, #E91E63 90%)',
              },
            }}
          >
            Bonus Değerlendirme Sayfasını Görüntüle
          </Button>
        </Box>
      </Paper>

      {/* Özet İstatistikleri */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {bonusScores.length}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Toplam Değerlendirme
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {toplamBonusPuani}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Toplam Bonus Puanı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {ortalamaPuan}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Ortalama Puan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {basariliDegerlendirme}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Başarılı Değerlendirme
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bonus Değerlendirme Detayları */}
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography
            variant='h6'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <GradeIcon sx={{ color: '#FF9800' }} />
            Bonus Değerlendirme Geçmişi ({bonusScores.length} kayıt)
          </Typography>
        </Box>

        {bonusScores.map((bonus, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <GradeIcon
                    sx={{
                      color: getBonusCategoryColor(
                        bonus.sablon?.bonusKategorisi,
                      ),
                    }}
                  />
                  <Box>
                    <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                      {bonus.sablon?.ad || 'Bonus Değerlendirmesi'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {new Date(bonus.degerlendirmeTarihi).toLocaleDateString(
                        'tr-TR',
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={bonus.sablon?.bonusKategorisi || 'Genel'}
                    size='small'
                    sx={{
                      backgroundColor: getBonusCategoryColor(
                        bonus.sablon?.bonusKategorisi,
                      ),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography
                      variant='h6'
                      sx={{
                        fontWeight: 'bold',
                        color: getSuccessColor(bonus.basariYuzdesi || 0),
                      }}
                    >
                      {bonus.toplamPuan || 0}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {bonus.basariYuzdesi || 0}% başarı
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container spacing={2}>
                {/* Değerlendirme Bilgileri */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      <span role='img' aria-label='clipboard'>
                        📋
                      </span>{' '}
                      Değerlendirme Bilgileri
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant='body2'>
                        <strong>Değerlendiren:</strong>{' '}
                        {/* KalipDegisimEvaluation ve BonusEvaluation uyumluluğu */}
                        {bonus.degerlendirenKullanici?.ad ||
                          bonus.degerlendirmeTarafindan?.ad ||
                          bonus.puanlayanKullanici?.ad}{' '}
                        {bonus.degerlendirenKullanici?.soyad ||
                          bonus.degerlendirmeTarafindan?.soyad ||
                          bonus.puanlayanKullanici?.soyad}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant='body2'>
                        <strong>Kategori:</strong>{' '}
                        {/* KalipDegisimEvaluation için kategori gösterimi */}
                        {bonus.kategori ||
                          bonus.sablon?.bonusKategorisi ||
                          bonus.departman?.ad ||
                          'Belirtilmemiş'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <CalendarIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant='body2'>
                        <strong>Tarih:</strong>{' '}
                        {new Date(
                          bonus.degerlendirmeTarihi || bonus.tamamlanmaTarihi,
                        ).toLocaleDateString('tr-TR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    {/* KalipDegisimEvaluation için ek bilgiler */}
                    {bonus.rol && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 18, color: '#666' }} />
                        <Typography variant='body2'>
                          <strong>Rol:</strong> {bonus.rol}
                        </Typography>
                      </Box>
                    )}
                    {bonus.makina &&
                      bonus.makina !== 'Bonus Değerlendirmesi' && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 18, color: '#666' }} />
                          <Typography variant='body2'>
                            <strong>Makina:</strong> {bonus.makina}
                          </Typography>
                        </Box>
                      )}
                  </Paper>
                </Grid>

                {/* Puan Bilgileri */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: '#f0f8ff' }}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      <span role='img' aria-label='trophy'>
                        🏆
                      </span>{' '}
                      Puan Detayları
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant='body2'>
                        <strong>Toplam Puan:</strong> {bonus.toplamPuan || 0} /{' '}
                        {bonus.maksimumPuan || 100}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant='body2'>
                        <strong>Başarı Yüzdesi:</strong>
                        <span
                          style={{
                            color: getSuccessColor(bonus.basariYuzdesi || 0),
                            fontWeight: 'bold',
                          }}
                        >
                          {' '}
                          {bonus.basariYuzdesi || 0}%
                        </span>
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Typography variant='body2' component='span'>
                          <strong>Bonus Durumu:</strong>
                        </Typography>
                        <Chip
                          label={
                            (bonus.basariYuzdesi || 0) >= 70
                              ? 'HAK EDİLDİ'
                              : 'HAK EDİLMEDİ'
                          }
                          size='small'
                          sx={{
                            backgroundColor:
                              (bonus.basariYuzdesi || 0) >= 70
                                ? '#4CAF50'
                                : '#F44336',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Değerlendirme Maddeleri */}
                {bonus.puanlamalar && bonus.puanlamalar.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'bold', mb: 2 }}
                      >
                        <span role='img' aria-label='list'>
                          📋
                        </span>{' '}
                        Değerlendirme Maddeleri
                      </Typography>
                      <Grid container spacing={2}>
                        {bonus.puanlamalar.map((madde, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Paper
                              sx={{
                                p: 2,
                                height: '100%',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <Box sx={{ mb: 1 }}>
                                <Typography
                                  variant='subtitle2'
                                  sx={{
                                    fontWeight: 'bold',
                                    color: '#1976d2',
                                    mb: 0.5,
                                  }}
                                >
                                  {madde.maddeBaslik}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  sx={{ display: 'block', mb: 1 }}
                                >
                                  {madde.aciklama}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 'auto',
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant='h6'
                                    sx={{
                                      fontWeight: 'bold',
                                      color: getSuccessColor(
                                        (madde.puan / madde.maksimumPuan) * 100,
                                      ),
                                    }}
                                  >
                                    {madde.puan}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    / {madde.maksimumPuan}
                                  </Typography>
                                </Box>

                                <Chip
                                  size='small'
                                  label={`%${Math.round((madde.puan / madde.maksimumPuan) * 100)}`}
                                  sx={{
                                    backgroundColor: getSuccessColor(
                                      (madde.puan / madde.maksimumPuan) * 100,
                                    ),
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Notlar */}
                {bonus.notlar && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, backgroundColor: '#fff3e0' }}>
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        <span role='img' aria-label='notes'>
                          📝
                        </span>{' '}
                        Değerlendirme Notları
                      </Typography>
                      <Typography variant='body2'>{bonus.notlar}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
};

export default BonusScores;
