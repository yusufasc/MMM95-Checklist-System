import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/myActivityHelpers';
import { myActivityAPI } from '../../services/api';

const QualityScores = ({ qualityScores, loading, error }) => {
  const navigate = useNavigate();
  const [criteriaBreakdown, setCriteriaBreakdown] = useState(null);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

  // Kalite kontrol madde bazlı analizi yükle
  useEffect(() => {
    const loadCriteriaBreakdown = async () => {
      try {
        setCriteriaLoading(true);
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        console.log('🔍 Quality criteria breakdown API çağrılıyor...', {
          month,
          year,
        });
        const response = await myActivityAPI.getQualityCriteriaBreakdown(
          month,
          year,
        );
        console.log('✅ Quality criteria breakdown response:', response);
        setCriteriaBreakdown(response.data);
        console.log('🔬 Kalite kontrol madde analizi data:', response.data);
      } catch (error) {
        console.error('❌ Kalite kontrol madde analizi hatası:', error);
      } finally {
        setCriteriaLoading(false);
      }
    };

    loadCriteriaBreakdown();
  }, []);

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' p={3}>
        <Typography>Kalite kontrol puanları yükleniyor...</Typography>
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

  if (!qualityScores || qualityScores.length === 0) {
    return (
      <Box p={3} textAlign='center'>
        <Typography variant='h6' color='text.secondary' gutterBottom>
          Kalite kontrol puanı bulunamadı.
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          Henüz kalite kontrol değerlendirmeniz bulunmuyor.
        </Typography>
        <Button
          variant='contained'
          onClick={() => navigate('/quality-control')}
          sx={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #7B1FA2 0%, #512DA8 100%)',
            },
          }}
        >
          Kalite Kontrol Sayfasına Git
        </Button>
      </Box>
    );
  }

  const getScoreColor = (score, maxScore) => {
    if (!maxScore) {
      return '#757575';
    }
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) {
      return '#4caf50';
    }
    if (percentage >= 70) {
      return '#ff9800';
    }
    return '#f44336';
  };

  const handleViewQualityControl = () => {
    navigate('/quality-control');
  };

  return (
    <Box>
      {/* Kalite Kontrol Sayfasına Git Butonu */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
          Kalite Kontrol Puanlarım
        </Typography>
        <Button
          variant='contained'
          startIcon={<VisibilityIcon />}
          onClick={handleViewQualityControl}
          sx={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #7B1FA2 0%, #512DA8 100%)',
            },
          }}
        >
          Kalite Kontrol Sayfasını Görüntüle
        </Button>
      </Box>

      {/* Madde Bazlı Puan Analizi */}
      {criteriaBreakdown && (
        <Card sx={{ mb: 3, border: '2px solid #9C27B0' }}>
          <CardContent>
            <Typography
              variant='h6'
              sx={{ mb: 2, color: '#9C27B0', fontWeight: 'bold' }}
            >
              <span role='img' aria-label='grafik'>
                📊
              </span>{' '}
              Bu Ay Madde Bazlı Puan Analizi
            </Typography>

            {criteriaLoading ? (
              <Box display='flex' justifyContent='center' p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {/* Özet Bilgiler */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={3}>
                    <Paper
                      sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}
                    >
                      <Typography variant='h4' color='#9C27B0'>
                        {criteriaBreakdown.summary.totalCriteria}
                      </Typography>
                      <Typography variant='caption'>Toplam Kriter</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper
                      sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}
                    >
                      <Typography variant='h4' color='#4caf50'>
                        {criteriaBreakdown.summary.totalEvaluations}
                      </Typography>
                      <Typography variant='caption'>
                        Toplam Değerlendirme
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper
                      sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}
                    >
                      <Typography variant='h4' color='#ff9800'>
                        {criteriaBreakdown.summary.totalScore}
                      </Typography>
                      <Typography variant='caption'>Toplam Puan</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper
                      sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}
                    >
                      <Typography variant='h4' color='#2196f3'>
                        {criteriaBreakdown.summary.overallSuccessPercentage}%
                      </Typography>
                      <Typography variant='caption'>Genel Başarı</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Madde Detayları */}
                <Typography
                  variant='subtitle1'
                  sx={{ mb: 2, fontWeight: 'bold' }}
                >
                  Kriter Detayları:
                </Typography>

                {criteriaBreakdown.criteria.map((criteria, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 2,
                      border: `1px solid ${getScoreColor(criteria.totalScore, criteria.totalMaxScore)}`,
                      bgcolor: 'rgba(156, 39, 176, 0.02)',
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2} alignItems='center'>
                        <Grid item xs={12} md={6}>
                          <Typography variant='h6' sx={{ color: '#9C27B0' }}>
                            {index + 1}. {criteria.criteriaName}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {criteria.evaluationCount} değerlendirme yapılmış
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box display='flex' gap={2} flexWrap='wrap'>
                            <Chip
                              label={`Toplam: ${criteria.totalScore} / ${criteria.totalMaxScore}`}
                              sx={{
                                bgcolor: getScoreColor(
                                  criteria.totalScore,
                                  criteria.totalMaxScore,
                                ),
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                            <Chip
                              label={`%${criteria.successPercentage} Başarı`}
                              variant='outlined'
                              sx={{
                                borderColor: getScoreColor(
                                  criteria.totalScore,
                                  criteria.totalMaxScore,
                                ),
                                color: getScoreColor(
                                  criteria.totalScore,
                                  criteria.totalMaxScore,
                                ),
                              }}
                            />
                            <Chip
                              label={`Ort: ${criteria.averageScore}`}
                              variant='outlined'
                            />
                          </Box>

                          {/* Bu maddenin tüm puanları */}
                          <Typography
                            variant='caption'
                            display='block'
                            sx={{ mt: 1, color: '#666' }}
                          >
                            Bu ay alınan puanlar:{' '}
                            {criteria.scores.map(s => s.score).join(' + ')} ={' '}
                            {criteria.totalScore}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

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
              <Typography variant='h4'>{qualityScores.length}</Typography>
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
                {qualityScores.reduce(
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
                {qualityScores.length > 0
                  ? Math.round(
                      qualityScores.reduce(
                        (sum, item) => sum + (item.puanlar?.toplam || 0),
                        0,
                      ) / qualityScores.length,
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
              <Typography variant='h6'>Yüksek Puan (%90+)</Typography>
              <Typography variant='h4'>
                {
                  qualityScores.filter(item => {
                    const score = item.puanlar?.toplam || 0;
                    const maxScore = item.puanlar?.maksimum || 100;
                    return (score / maxScore) * 100 >= 90;
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detaylı Liste */}
      {qualityScores.map((item, index) => (
        <Accordion
          key={`quality-score-${item._id || item.id || index}-${index}`}
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
                label='Kalite Kontrol'
                size='small'
                sx={{ backgroundColor: '#9C27B0', color: 'white' }}
              />
              <Typography
                variant='body2'
                sx={{
                  color: getScoreColor(
                    item.puanlar?.toplam,
                    item.puanlar?.maksimum,
                  ),
                  fontWeight: 'bold',
                }}
              >
                {item.puanlar?.toplam || 0}/{item.puanlar?.maksimum || 0}
              </Typography>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  handleViewQualityControl();
                }}
                sx={{ color: '#9C27B0' }}
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
                    <strong>Şablon:</strong> {item.checklistAdi}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Değerlendirme Tarihi:</strong>{' '}
                    {formatDate(item.tamamlanmaTarihi)}
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
                      sx={{ backgroundColor: '#9C27B0', color: 'white' }}
                    />
                  </Box>
                  {item.vardiya && (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>Vardiya:</strong> {item.vardiya}
                    </Typography>
                  )}
                  {item.makina && item.makina !== 'Kalite Kontrol' && (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>Makina:</strong> {item.makina}
                    </Typography>
                  )}
                  {item.kalip && (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>Kalıp:</strong> {item.kalip}
                    </Typography>
                  )}
                  {item.hammadde && (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>Hammadde:</strong> {item.hammadde}
                    </Typography>
                  )}
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
                          item.puanlar?.toplam,
                          item.puanlar?.maksimum,
                        ),
                        fontWeight: 'bold',
                        mb: 1,
                      }}
                    >
                      {item.puanlar?.toplam || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      / {item.puanlar?.maksimum || 0} Maksimum Puan
                    </Typography>
                    <Typography
                      variant='h6'
                      sx={{
                        mt: 1,
                        color: getScoreColor(
                          item.puanlar?.toplam,
                          item.puanlar?.maksimum,
                        ),
                        fontWeight: 'bold',
                      }}
                    >
                      %
                      {item.puanlar?.maksimum
                        ? Math.round(
                            (item.puanlar?.toplam / item.puanlar?.maksimum) *
                              100,
                          )
                        : 0}{' '}
                      Başarı
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
                        Puanlama Tarihi:
                      </strong>{' '}
                      {formatDate(item.puanlamaTarihi)}
                    </Typography>
                  )}
                  {item.notlar && (
                    <Typography
                      variant='body2'
                      sx={{ mb: 1, fontStyle: 'italic' }}
                    >
                      <strong>
                        <span role='img' aria-label='note'>
                          📝
                        </span>{' '}
                        Notlar:
                      </strong>{' '}
                      {item.notlar}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              {item.aciklama && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant='subtitle2' gutterBottom>
                      Açıklama
                    </Typography>
                    <Typography variant='body2'>{item.aciklama}</Typography>
                  </Paper>
                </Grid>
              )}
              {item.sablonDetaylari && item.sablonDetaylari.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant='subtitle2' gutterBottom>
                      <span role='img' aria-label='checklist'>
                        📋
                      </span>{' '}
                      Detaylı Puanlama Kriterleri
                    </Typography>
                    {item.sablonDetaylari.map((detay, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 2,
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant='body1'
                            sx={{ fontWeight: 'medium' }}
                          >
                            {detay.maddeBaslik || `Kriter ${idx + 1}`}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant='h6'
                              sx={{
                                color: getScoreColor(
                                  detay.puan,
                                  detay.maksimumPuan,
                                ),
                                fontWeight: 'bold',
                              }}
                            >
                              {detay.puan || 0}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              / {detay.maksimumPuan || 0}
                            </Typography>
                            <Typography
                              variant='caption'
                              sx={{
                                ml: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: detay.maksimumPuan
                                  ? (detay.puan / detay.maksimumPuan) * 100 >=
                                    90
                                    ? '#e8f5e8'
                                    : (detay.puan / detay.maksimumPuan) * 100 >=
                                        70
                                      ? '#fff3e0'
                                      : '#ffebee'
                                  : '#f5f5f5',
                                color: detay.maksimumPuan
                                  ? (detay.puan / detay.maksimumPuan) * 100 >=
                                    90
                                    ? '#2e7d32'
                                    : (detay.puan / detay.maksimumPuan) * 100 >=
                                        70
                                      ? '#f57c00'
                                      : '#d32f2f'
                                  : '#757575',
                              }}
                            >
                              %
                              {detay.maksimumPuan
                                ? Math.round(
                                    (detay.puan / detay.maksimumPuan) * 100,
                                  )
                                : 0}
                            </Typography>
                          </Box>
                        </Box>
                        {detay.aciklama && (
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontStyle: 'italic' }}
                          >
                            <span role='img' aria-label='note'>
                              📝
                            </span>{' '}
                            {detay.aciklama}
                          </Typography>
                        )}
                        {detay.fotograflar && detay.fotograflar.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              <span role='img' aria-label='camera'>
                                📷
                              </span>{' '}
                              {detay.fotograflar.length} fotoğraf eklendi
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
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

export default QualityScores;
