import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
  Button,
  Pagination,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  EmojiEvents as TrophyIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import controlScoresAPI from '../../services/controlScoresAPI';

const ControlScores = ({ filters = {}, onRefresh }) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Filtreleri summary için hazırla
  const summaryParams = useMemo(
    () => ({
      year: filters.year || new Date().getFullYear(),
      month: filters.month || new Date().getMonth() + 1,
    }),
    [filters.year, filters.month],
  );

  // Verileri yükle
  const loadData = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        // Tarih filtrelerini hesapla
        const params = { page, limit: 10 };
        if (filters.year && filters.month) {
          const startDate = new Date(filters.year, filters.month - 1, 1);
          const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }

        const [scoresRes, summaryRes] = await Promise.all([
          controlScoresAPI.getMyScores(params),
          controlScoresAPI.getSummary(summaryParams),
        ]);

        setData(scoresRes.scores || []);
        setPagination(prevPagination => scoresRes.pagination || prevPagination);
        setSummary(summaryRes);
      } catch (err) {
        console.error('❌ Kontrol puanları yüklenirken hata:', err);
        setError(
          err.response?.data?.message ||
            'Kontrol puanları yüklenirken hata oluştu',
        );
      } finally {
        setLoading(false);
      }
    },
    [filters.year, filters.month, summaryParams],
  );

  // Sayfa değişimi
  const handlePageChange = (event, newPage) => {
    loadData(newPage);
  };

  // Filtreleme ve ilk yükleme
  useEffect(() => {
    loadData(1);
  }, [loadData]);

  // Refresh fonksiyonu (optional)
  useEffect(() => {
    if (onRefresh && typeof onRefresh === 'function') {
      loadData(pagination.currentPage || 1);
    }
  }, [onRefresh, loadData, pagination.currentPage]);

  // Puan renklendirme
  const getScoreColor = score => {
    if (score >= 15) {
      return 'success';
    }
    if (score >= 10) {
      return 'warning';
    }
    if (score >= 5) {
      return 'info';
    }
    return 'default';
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Kontrol puanlarınız yükleniyor...</Typography>
      </Paper>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          bgcolor: 'error.light',
          color: 'error.contrastText',
        }}
      >
        <Typography variant='h6' gutterBottom>
          Hata Oluştu
        </Typography>
        <Typography variant='body2'>{error}</Typography>
        <Button variant='contained' onClick={() => loadData(1)} sx={{ mt: 2 }}>
          Yeniden Dene
        </Button>
      </Paper>
    );
  }

  // Boş durum
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
        <AssignmentIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
        <Typography variant='h6' color='text.secondary' gutterBottom>
          Kontrol Puanı Bulunmuyor
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Henüz başka kullanıcıların görevlerini puanlayarak kontrol puanı
          kazanmamışsınız.
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Alt rollerdeki kullanıcıların tamamladığı görevleri control-pending
          sayfasından puanlayarak kontrol puanı kazanabilirsiniz.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Özet Kartları */}
      {summary && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant='h6'
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TrophyIcon color='primary' />
            Kontrol Puanları Özeti
          </Typography>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            {/* Bu Ay */}
            <Card
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant='subtitle2' sx={{ opacity: 0.9 }}>
                  Bu Ay ({summaryParams.month}/{summaryParams.year})
                </Typography>
                <Typography variant='h4' fontWeight='bold'>
                  {summary.buAy.toplamPuan}
                </Typography>
                <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                  <Typography variant='body2'>
                    {summary.buAy.kontrolSayisi} kontrol
                  </Typography>
                  <Typography variant='body2'>
                    Ort: {summary.buAy.ortalamaPuan.toFixed(1)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Genel Toplam */}
            <Card
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant='subtitle2' sx={{ opacity: 0.9 }}>
                  Genel Toplam
                </Typography>
                <Typography variant='h4' fontWeight='bold'>
                  {summary.genel.toplamPuan}
                </Typography>
                <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
                  <Typography variant='body2'>
                    {summary.genel.kontrolSayisi} kontrol
                  </Typography>
                  <Typography variant='body2'>
                    Ort: {summary.genel.ortalamaPuan.toFixed(1)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          {/* Şablon Bazlı Özet */}
          {summary.sablonBazliOzet && summary.sablonBazliOzet.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography
                  variant='subtitle1'
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TimelineIcon color='primary' />
                  Bu Aydaki Şablon Bazlı Performans
                </Typography>
                <Stack spacing={1}>
                  {summary.sablonBazliOzet.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        {item._id.sablonAdi} ({item._id.sablonTipi})
                      </Typography>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <Chip
                          label={`${item.sayisi} kontrol`}
                          size='small'
                          variant='outlined'
                        />
                        <Chip
                          label={`${item.toplam} puan`}
                          size='small'
                          color={getScoreColor(item.toplam)}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Kontrol Listesi */}
      <Typography
        variant='h6'
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <AssignmentIcon color='primary' />
        Kontrol Geçmişi ({pagination.totalItems} kayıt)
      </Typography>

      <Stack spacing={2}>
        {data.map((score, index) => (
          <Accordion
            key={`control-score-${score._id || score.id || index}-${score.sablonAdi || 'unknown'}-${score.puanlamaTarihi || Date.now()}-${index}`}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  pr: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Badge
                    badgeContent={score.kontrolPuani}
                    color={getScoreColor(score.kontrolPuani)}
                    showZero
                  >
                    <TrophyIcon color='primary' />
                  </Badge>
                  <Box>
                    <Typography variant='subtitle1' fontWeight='bold'>
                      {score.sablonAdi}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {score.sablonTipi} şablonu kontrolü
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={`+${score.kontrolPuani} puan`}
                    color={getScoreColor(score.kontrolPuani)}
                    size='small'
                  />
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {new Date(score.puanlamaTarihi).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Divider />

                {/* Detay Bilgiler */}
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      <PersonIcon
                        sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }}
                      />
                      Puanlanan Kullanıcı
                    </Typography>
                    <Typography variant='body2' fontWeight='bold'>
                      {score.puanlananKullanici
                        ? `${score.puanlananKullanici.ad} ${score.puanlananKullanici.soyad} (${score.puanlananKullanici.kullaniciAdi})`
                        : 'Bilinmeyen kullanıcı'}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      <CalendarIcon
                        sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }}
                      />
                      Puanlama Tarihi
                    </Typography>
                    <Typography variant='body2' fontWeight='bold'>
                      {new Date(score.puanlamaTarihi).toLocaleString('tr-TR')}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      Görev Tipi
                    </Typography>
                    <Chip
                      label={
                        score.gorevTipi === 'Task'
                          ? 'Rutin Görev'
                          : 'İşe Bağlı Görev'
                      }
                      size='small'
                      variant='outlined'
                      color={
                        score.gorevTipi === 'Task' ? 'primary' : 'secondary'
                      }
                    />
                  </Box>

                  {score.aciklama && (
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Açıklama
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          bgcolor: 'grey.100',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                        }}
                      >
                        {score.aciklama}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default ControlScores;
