import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Paper,
  Button,
  IconButton,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/myActivityHelpers';

const HRScores = ({ hrScores, loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' p={3}>
        <Typography>İK puanları yükleniyor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color='error'>Hata: {error}</Typography>
      </Box>
    );
  }

  if (!hrScores || hrScores.length === 0) {
    return (
      <Box p={3}>
        {/* Başlık */}
        <Typography
          variant='h5'
          sx={{ fontWeight: 'bold', color: '#E91E63', mb: 3 }}
        >
          İK Puanlarım
        </Typography>

        {/* Bilgilendirme Mesajı */}
        <Alert severity='info' icon={<InfoIcon />} sx={{ mb: 3 }}>
          <Typography variant='h6' gutterBottom>
            İK Puanları Hakkında
          </Typography>
          <Typography variant='body2' sx={{ mb: 2 }}>
            İnsan Kaynakları departmanı tarafından verilen puanlarınız burada
            görüntülenir. Bu puanlar şunları içerebilir:
          </Typography>
          <Box component='ul' sx={{ pl: 2, mb: 2 }}>
            <li>İK Şablon Değerlendirmeleri</li>
            <li>Fazla Mesai Puanları</li>
            <li>Devamsızlık Kayıtları</li>
            <li>Performans Değerlendirmeleri</li>
          </Box>
          <Typography variant='body2'>
            Henüz İK puanınız bulunmuyor. Detaylı bilgi için İnsan Kaynakları
            departmanına başvurabilirsiniz.
          </Typography>
        </Alert>

        {/* İletişim Kartı */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)',
            color: 'white',
            mb: 3,
          }}
        >
          <CardContent>
            <Typography variant='h6' gutterBottom>
              <span role='img' aria-label='phone'>
                📞
              </span>{' '}
              İletişim
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
              İK puanlarınız hakkında detaylı bilgi almak için:
            </Typography>
            <Typography variant='body2'>
              • İnsan Kaynakları departmanına başvurun
              <br />
              • Performans değerlendirme süreçlerinizi takip edin
              <br />• Mesai ve devamsızlık kayıtlarınızı kontrol edin
            </Typography>
          </CardContent>
        </Card>

        {/* Yönlendirme Butonu */}
        <Box textAlign='center'>
          <Button
            variant='outlined'
            startIcon={<VisibilityIcon />}
            onClick={() => navigate('/hr')}
            sx={{
              borderColor: '#E91E63',
              color: '#E91E63',
              '&:hover': {
                borderColor: '#AD1457',
                backgroundColor: 'rgba(233, 30, 99, 0.04)',
              },
            }}
          >
            İK Modülünü Görüntüle
          </Button>
        </Box>
      </Box>
    );
  }

  const getScoreColor = score => {
    if (score >= 90) {
      return '#4caf50';
    }
    if (score >= 70) {
      return '#ff9800';
    }
    return '#f44336';
  };

  const getTypeColor = tip => {
    switch (tip) {
      case 'hr_checklist':
        return '#2196f3';
      case 'hr_mesai':
        return '#4caf50';
      case 'hr_devamsizlik':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getTypeLabel = tip => {
    switch (tip) {
      case 'hr_checklist':
        return 'İK Şablon';
      case 'hr_mesai':
        return 'Mesai';
      case 'hr_devamsizlik':
        return 'Devamsızlık';
      default:
        return 'İK Değerlendirmesi';
    }
  };

  const handleViewHR = () => {
    navigate('/hr');
  };

  return (
    <Box>
      {/* İK Sayfasına Git Butonu */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#E91E63' }}>
          İK Puanlarım
        </Typography>
        <Button
          variant='contained'
          startIcon={<VisibilityIcon />}
          onClick={handleViewHR}
          sx={{
            background: 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #C2185B 0%, #880E4F 100%)',
            },
          }}
        >
          İK Sayfasını Görüntüle
        </Button>
      </Box>

      {/* Özet Kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Toplam Değerlendirme</Typography>
              <Typography variant='h4'>{hrScores.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Toplam Puan</Typography>
              <Typography variant='h4'>
                {hrScores.reduce(
                  (sum, item) => sum + (item.puanlar?.toplam || 0),
                  0,
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Ortalama Puan</Typography>
              <Typography variant='h4'>
                {hrScores.length > 0
                  ? Math.round(
                    hrScores.reduce(
                      (sum, item) => sum + (item.puanlar?.toplam || 0),
                      0,
                    ) / hrScores.length,
                  )
                  : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Pozitif Puan</Typography>
              <Typography variant='h4'>
                {
                  hrScores.filter(item => (item.puanlar?.toplam || 0) > 0)
                    .length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detaylı Liste */}
      {hrScores.map((item, index) => (
        <Accordion
          key={`hr-score-${item._id || item.id || index}-${index}`}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 2,
              }}
            >
              <Typography variant='h6' sx={{ flexGrow: 1 }}>
                {item.checklistAdi}
              </Typography>
              <Chip
                label={getTypeLabel(item.tip)}
                size='small'
                sx={{ backgroundColor: getTypeColor(item.tip), color: 'white' }}
              />
              <Typography
                variant='body2'
                sx={{
                  color: getScoreColor(Math.abs(item.puanlar?.toplam || 0)),
                  fontWeight: 'bold',
                }}
              >
                {item.puanlar?.toplam || 0} puan
              </Typography>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  handleViewHR();
                }}
                sx={{ color: '#E91E63' }}
              >
                <VisibilityIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    <span role='img' aria-label='info'>
                      ℹ️
                    </span>{' '}
                    Değerlendirme Bilgileri
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Tip:</strong> {getTypeLabel(item.tip)}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Tarih:</strong> {formatDate(item.tamamlanmaTarihi)}
                  </Typography>
                  <Box
                    sx={{
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant='body2' component='span'>
                      <strong>Kategori:</strong>
                    </Typography>
                    <Chip
                      label={item.kategori}
                      size='small'
                      sx={{
                        backgroundColor: getTypeColor(item.tip),
                        color: 'white',
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    <span role='img' aria-label='score'>
                      🏆
                    </span>{' '}
                    Puan Bilgileri
                  </Typography>
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: '#f8f9fa',
                      borderRadius: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant='h4'
                      sx={{
                        color: getScoreColor(
                          Math.abs(item.puanlar?.toplam || 0),
                        ),
                        fontWeight: 'bold',
                        mb: 1,
                      }}
                    >
                      {item.puanlar?.toplam || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Alınan Puan
                    </Typography>
                    <Typography
                      variant='h6'
                      sx={{
                        mt: 1,
                        color:
                          item.puanlar?.toplam > 0
                            ? '#4caf50'
                            : item.puanlar?.toplam < 0
                              ? '#f44336'
                              : '#757575',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.puanlar?.toplam > 0
                        ? 'Pozitif'
                        : item.puanlar?.toplam < 0
                          ? 'Negatif'
                          : 'Nötr'}
                    </Typography>
                  </Box>
                  {item.puanlayanKullanici && (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>
                        <span role='img' aria-label='person'>
                          👤
                        </span>{' '}
                        Değerlendiren:
                      </strong>{' '}
                      {item.puanlayanKullanici.ad}{' '}
                      {item.puanlayanKullanici.soyad}
                    </Typography>
                  )}
                  {item.puanlamaTarihi && (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>
                        <span role='img' aria-label='calendar'>
                          📅
                        </span>{' '}
                        Değerlendirme Tarihi:
                      </strong>{' '}
                      {formatDate(item.puanlamaTarihi)}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              {item.aciklama && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant='subtitle2' gutterBottom>
                      <span role='img' aria-label='note'>
                        📝
                      </span>{' '}
                      Açıklama
                    </Typography>
                    <Typography variant='body2'>
                      {/* Mesai/devamsızlık saat detaylarını gizle */}
                      {item.tip === 'hr_mesai' || item.tip === 'hr_devamsizlik'
                        ? item.aciklama
                          .replace(/\d+\s*(saat|gün|gun)/gi, '')
                          .replace(/(\s*-\s*){2,}/g, ' - ')
                          .trim()
                        : item.aciklama}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Şablon Detayları */}
              {item.sablonDetaylari && item.sablonDetaylari.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      sx={{
                        color: '#1976d2',
                        fontWeight: 'bold',
                        mb: 2,
                      }}
                    >
                      <span role='img' aria-label='details'>
                        📋
                      </span>{' '}
                      Madde Detayları ({item.sablonDetaylari.length} madde)
                    </Typography>

                    {/* Grid Layout - 2 Sütun */}
                    <Grid container spacing={1.5}>
                      {item.sablonDetaylari.map((detay, index) => {
                        const basariYuzdesi =
                          detay.maksimumPuan > 0
                            ? Math.round(
                              (detay.puan / detay.maksimumPuan) * 100,
                            )
                            : 0;
                        const durum =
                          basariYuzdesi >= 90
                            ? 'excellent'
                            : basariYuzdesi >= 70
                              ? 'good'
                              : basariYuzdesi >= 50
                                ? 'average'
                                : 'poor';

                        const colors = {
                          excellent: { bg: '#e8f5e8', border: '#4caf50' },
                          good: { bg: '#fff3e0', border: '#ff9800' },
                          average: { bg: '#fff8e1', border: '#ffc107' },
                          poor: { bg: '#ffebee', border: '#f44336' },
                        };

                        return (
                          <Grid item xs={12} sm={6} key={index}>
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: colors[durum].bg,
                                border: `1px solid ${colors[durum].border}`,
                                borderRadius: 1,
                                height: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              }}
                            >
                              {/* Üst Kısım: Başlık ve Yüzde */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant='body2'
                                  sx={{
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    flexGrow: 1,
                                    pr: 1,
                                  }}
                                >
                                  {index + 1}. {detay.baslik}
                                </Typography>
                                <Chip
                                  label={`${basariYuzdesi}%`}
                                  size='small'
                                  sx={{
                                    backgroundColor: colors[durum].border,
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                    height: '24px',
                                    minWidth: '50px',
                                  }}
                                />
                              </Box>

                              {/* Orta Kısım: Puan */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant='h6'
                                  sx={{
                                    color: colors[durum].border,
                                    fontWeight: 'bold',
                                    fontSize: '1.125rem',
                                  }}
                                >
                                  {detay.puan || 0}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  sx={{ mx: 0.5, color: '#666' }}
                                >
                                  /
                                </Typography>
                                <Typography
                                  variant='body2'
                                  sx={{ color: '#666' }}
                                >
                                  {detay.maksimumPuan || 0}
                                </Typography>
                              </Box>

                              {/* Alt Kısım: Progress Bar */}
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 6,
                                  bgcolor: 'rgba(0,0,0,0.1)',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${basariYuzdesi}%`,
                                    height: '100%',
                                    bgcolor: colors[durum].border,
                                    transition: 'width 0.3s ease-in-out',
                                  }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>

                    {/* Özet İstatistik */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        <span role='img' aria-label='summary'>
                          📊
                        </span>{' '}
                        Toplam Değerlendirme
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: '#1976d2',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.sablonDetaylari.reduce(
                          (sum, detay) => sum + (detay.puan || 0),
                          0,
                        )}{' '}
                        /{' '}
                        {item.sablonDetaylari.reduce(
                          (sum, detay) => sum + (detay.maksimumPuan || 0),
                          0,
                        )}{' '}
                        puan
                        <span style={{ marginLeft: '8px', color: '#666' }}>
                          (
                          {item.sablonDetaylari.reduce(
                            (sum, detay) => sum + (detay.maksimumPuan || 0),
                            0,
                          ) > 0
                            ? Math.round(
                              (item.sablonDetaylari.reduce(
                                (sum, detay) => sum + (detay.puan || 0),
                                0,
                              ) /
                                  item.sablonDetaylari.reduce(
                                    (sum, detay) =>
                                      sum + (detay.maksimumPuan || 0),
                                    0,
                                  )) *
                                  100,
                            )
                            : 0}
                          %)
                        </span>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default HRScores;
