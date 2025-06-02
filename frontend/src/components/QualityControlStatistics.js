/* eslint-disable indent, comma-dangle */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  TextField,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  ExpandLess as ExpandLessIcon,
  Build as BuildIcon,
  Category as CategoryIcon,
  Note as NoteIcon,
} from '@mui/icons-material';

import { useSnackbar } from '../contexts/SnackbarContext';
import { qualityControlAPI } from '../services/api';

const QualityControlStatistics = () => {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [statistics, setStatistics] = useState({
    toplamDegerlendirme: 0,
    ortalamaBasariYuzdesi: 0,
    rolBazliIstatistikler: [],
    enIyiPerformans: [],
  });
  const [filters, setFilters] = useState({
    kullanici: '',
    tarihBaslangic: '',
    tarihBitis: '',
    durum: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeFilter, setTimeFilter] = useState('7days');
  const [expandedRow, setExpandedRow] = useState(null);

  const loadEvaluations = useCallback(async () => {
    try {
      setLoading(true);

      // Zaman filtresine göre tarih aralığı belirle
      const endDate = new Date();
      const startDate = new Date();

      switch (timeFilter) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const params = {
        ...filters,
        tarihBaslangic: filters.tarihBaslangic || startDate.toISOString().split('T')[0],
        tarihBitis: filters.tarihBitis || endDate.toISOString().split('T')[0],
      };

      // Değerlendirmeleri ve istatistikleri paralel olarak yükle
      const [evaluationsRes, statisticsRes] = await Promise.all([
        qualityControlAPI.getEvaluations(params),
        qualityControlAPI.getStatistics(params),
      ]);

      setEvaluations(evaluationsRes.data);
      setStatistics(statisticsRes.data);

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Değerlendirmeler yüklendi:', evaluationsRes.data.length);
        console.log('📈 İstatistikler:', statisticsRes.data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Veri yükleme hatası:', error);
      }
      showSnackbar('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, timeFilter, filters]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  const getPerformanceColor = score => {
    if (score >= 90) {
      return '#4caf50';
    }
    if (score >= 75) {
      return '#2196f3';
    }
    if (score >= 60) {
      return '#ff9800';
    }
    return '#f44336';
  };

  const getPerformanceLabel = score => {
    if (score >= 90) {
      return 'Mükemmel';
    }
    if (score >= 75) {
      return 'Çok İyi';
    }
    if (score >= 60) {
      return 'İyi';
    }
    return 'Geliştirilmeli';
  };

  const handleRowExpand = evaluationId => {
    setExpandedRow(expandedRow === evaluationId ? null : evaluationId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = field => event => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      kullanici: '',
      tarihBaslangic: '',
      tarihBitis: '',
      durum: '',
    });
  };

  const paginatedEvaluations = evaluations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Başlık ve Yenile Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Değerlendirme Geçmişi
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadEvaluations}
          disabled={loading}
        >
          Yenile
        </Button>
      </Box>

      {/* Filtreler */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Filtreler</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Zaman Filtresi</InputLabel>
                <Select
                  value={timeFilter}
                  label="Zaman Filtresi"
                  onChange={e => setTimeFilter(e.target.value)}
                >
                  <MenuItem value="7days">Son 7 Gün</MenuItem>
                  <MenuItem value="30days">Son 30 Gün</MenuItem>
                  <MenuItem value="90days">Son 3 Ay</MenuItem>
                  <MenuItem value="1year">Son 1 Yıl</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Başlangıç Tarihi"
                type="date"
                value={filters.tarihBaslangic}
                onChange={handleFilterChange('tarihBaslangic')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Bitiş Tarihi"
                type="date"
                value={filters.tarihBitis}
                onChange={handleFilterChange('tarihBitis')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={loadEvaluations}
                  disabled={loading}
                  sx={{ minWidth: 100 }}
                >
                  Filtrele
                </Button>
                <Button variant="outlined" onClick={clearFilters} disabled={loading}>
                  Temizle
                </Button>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.toplamDegerlendirme || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Değerlendirme
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(statistics.ortalamaBasariYuzdesi || 0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ortalama Başarı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.enIyiPerformans?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Değerlendirilen Çalışan
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {evaluations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtrelenen Kayıt
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Değerlendirme Tablosu */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Değerlendirilen</TableCell>
                <TableCell>Değerlendiren</TableCell>
                <TableCell>Şablon</TableCell>
                <TableCell>Makina</TableCell>
                <TableCell>Puan</TableCell>
                <TableCell>Başarı %</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell align="center">Detay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Alert severity="info">
                      Seçilen kriterlere uygun değerlendirme bulunamadı.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedEvaluations.map(evaluation => (
                    <React.Fragment key={evaluation._id}>
                      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                            {formatDate(evaluation.degerlendirmeTarihi)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                            {evaluation.degerlendirilenKullanici?.ad}{' '}
                            {evaluation.degerlendirilenKullanici?.soyad}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {evaluation.degerlendirenKullanici?.ad}{' '}
                          {evaluation.degerlendirenKullanici?.soyad}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 16 }} />
                            {evaluation.sablon?.ad}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {evaluation.makina
                            ? `${evaluation.makina.kod} - ${evaluation.makina.ad}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {evaluation.toplamPuan}/{evaluation.maksimumPuan}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${evaluation.basariYuzdesi}%`}
                            size="small"
                            sx={{
                              backgroundColor: getPerformanceColor(evaluation.basariYuzdesi),
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={evaluation.durum}
                            size="small"
                            color={evaluation.durum === 'Tamamlandı' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRowExpand(evaluation._id)}
                            sx={{
                              color:
                                expandedRow === evaluation._id ? 'primary.main' : 'text.secondary',
                              backgroundColor:
                                expandedRow === evaluation._id ? 'primary.50' : 'transparent',
                              '&:hover': {
                                backgroundColor: 'primary.100',
                              },
                            }}
                          >
                            {expandedRow === evaluation._id ? (
                              <ExpandLessIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Detay Satırı - Şablonun Altında */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse
                            in={expandedRow === evaluation._id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 2 }}>
                              <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  sx={{
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 3,
                                  }}
                                >
                                  <StarIcon sx={{ mr: 1 }} />
                                  Değerlendirme Detayları
                                </Typography>

                                <Grid container spacing={3}>
                                  {/* Genel Bilgiler */}
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                      <CardContent>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="bold"
                                          gutterBottom
                                          sx={{
                                            color: 'secondary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                          }}
                                        >
                                          <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
                                          Genel Bilgiler
                                        </Typography>

                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1.5,
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <StarIcon
                                              sx={{ mr: 1, color: 'warning.main', fontSize: 16 }}
                                            />
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ minWidth: 80 }}
                                            >
                                              Vardiya:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                              {evaluation.vardiya || '-'}
                                            </Typography>
                                          </Box>

                                          {evaluation.kalip && (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                              <CategoryIcon
                                                sx={{ mr: 1, color: 'info.main', fontSize: 16 }}
                                              />
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ minWidth: 80 }}
                                              >
                                                Kalıp:
                                              </Typography>
                                              <Typography variant="body2" fontWeight="medium">
                                                {`${evaluation.kalip.kod} - ${evaluation.kalip.ad}`}
                                              </Typography>
                                            </Box>
                                          )}

                                          {evaluation.hammadde && (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                              <BuildIcon
                                                sx={{ mr: 1, color: 'success.main', fontSize: 16 }}
                                              />
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ minWidth: 80 }}
                                              >
                                                Hammadde:
                                              </Typography>
                                              <Typography variant="body2" fontWeight="medium">
                                                {evaluation.hammadde}
                                              </Typography>
                                            </Box>
                                          )}

                                          {evaluation.notlar && (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                              <NoteIcon
                                                sx={{
                                                  mr: 1,
                                                  color: 'warning.main',
                                                  fontSize: 16,
                                                  mt: 0.2,
                                                }}
                                              />
                                              <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                  Notlar:
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  fontWeight="medium"
                                                  sx={{
                                                    bgcolor: 'warning.50',
                                                    p: 1,
                                                    borderRadius: 1,
                                                    mt: 0.5,
                                                    fontStyle: 'italic',
                                                  }}
                                                >
                                                  {evaluation.notlar}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          )}
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  </Grid>

                                  {/* Puanlama Detayları */}
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                      <CardContent>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="bold"
                                          gutterBottom
                                          sx={{
                                            color: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                          }}
                                        >
                                          <StarIcon sx={{ mr: 1, fontSize: 20 }} />
                                          Puanlama Özeti
                                        </Typography>

                                        <Box sx={{ mb: 2 }}>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              mb: 1,
                                            }}
                                          >
                                            <Typography variant="body2" color="text.secondary">
                                              Toplam Başarı
                                            </Typography>
                                            <Typography
                                              variant="h6"
                                              fontWeight="bold"
                                              color="primary.main"
                                            >
                                              {evaluation.basariYuzdesi}%
                                            </Typography>
                                          </Box>
                                          <LinearProgress
                                            variant="determinate"
                                            value={evaluation.basariYuzdesi}
                                            sx={{
                                              height: 8,
                                              borderRadius: 4,
                                              '& .MuiLinearProgress-bar': {
                                                backgroundColor: getPerformanceColor(
                                                  evaluation.basariYuzdesi
                                                ),
                                                borderRadius: 4,
                                              },
                                            }}
                                          />
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              mt: 1,
                                            }}
                                          >
                                            <Typography variant="caption" color="text.secondary">
                                              {evaluation.toplamPuan} / {evaluation.maksimumPuan}{' '}
                                              puan
                                            </Typography>
                                            <Chip
                                              label={getPerformanceLabel(evaluation.basariYuzdesi)}
                                              size="small"
                                              sx={{
                                                backgroundColor: getPerformanceColor(
                                                  evaluation.basariYuzdesi
                                                ),
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '0.7rem',
                                              }}
                                            />
                                          </Box>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  </Grid>

                                  {/* Madde Bazlı Puanlamalar */}
                                  <Grid item xs={12}>
                                    <Card variant="outlined">
                                      <CardContent>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="bold"
                                          gutterBottom
                                          sx={{
                                            color: 'success.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                          }}
                                        >
                                          <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                                          Madde Bazlı Puanlamalar (
                                          {evaluation.puanlamalar?.length || 0})
                                        </Typography>

                                        {evaluation.puanlamalar &&
                                        evaluation.puanlamalar.length > 0 ? (
                                          <Grid container spacing={2}>
                                            {evaluation.puanlamalar.map((puanlama, index) => (
                                              <Grid item xs={12} sm={6} md={4} key={index}>
                                                <Paper
                                                  sx={{
                                                    p: 2,
                                                    bgcolor:
                                                      puanlama.puan === puanlama.maksimumPuan
                                                        ? 'success.50'
                                                        : 'warning.50',
                                                    border: '1px solid',
                                                    borderColor:
                                                      puanlama.puan === puanlama.maksimumPuan
                                                        ? 'success.200'
                                                        : 'warning.200',
                                                    borderRadius: 2,
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
                                                      variant="body2"
                                                      fontWeight="bold"
                                                      sx={{
                                                        color:
                                                          puanlama.puan === puanlama.maksimumPuan
                                                            ? 'success.dark'
                                                            : 'warning.dark',
                                                      }}
                                                    >
                                                      #{index + 1}
                                                    </Typography>
                                                    <Chip
                                                      label={`${puanlama.puan}/${puanlama.maksimumPuan}`}
                                                      size="small"
                                                      color={
                                                        puanlama.puan === puanlama.maksimumPuan
                                                          ? 'success'
                                                          : 'warning'
                                                      }
                                                      sx={{ fontWeight: 'bold' }}
                                                    />
                                                  </Box>
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      fontWeight: 'medium',
                                                      mb: 1,
                                                      lineHeight: 1.4,
                                                    }}
                                                  >
                                                    {puanlama.maddeBaslik}
                                                  </Typography>
                                                  {puanlama.aciklama && (
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        color: 'text.secondary',
                                                        fontStyle: 'italic',
                                                        display: 'block',
                                                        bgcolor: 'rgba(255,255,255,0.7)',
                                                        p: 0.5,
                                                        borderRadius: 1,
                                                      }}
                                                    >
                                                      {puanlama.aciklama}
                                                    </Typography>
                                                  )}
                                                </Paper>
                                              </Grid>
                                            ))}
                                          </Grid>
                                        ) : (
                                          <Alert severity="info" sx={{ mt: 1 }}>
                                            Bu değerlendirme için detaylı puanlama bilgisi
                                            bulunmuyor.
                                          </Alert>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                </Grid>
                              </Paper>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={evaluations.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Sayfa başına kayıt:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

      {/* En İyi Performans Gösteren Çalışanlar */}
      {statistics.enIyiPerformans && statistics.enIyiPerformans.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            En İyi Performans Gösteren Çalışanlar
          </Typography>
          <Grid container spacing={2}>
            {statistics.enIyiPerformans.slice(0, 3).map((worker, index) => (
              <Grid item xs={12} md={4} key={worker._id}>
                <Card
                  sx={{
                    background:
                      index === 0
                        ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                        : index === 1
                          ? 'linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%)'
                          : 'linear-gradient(135deg, #cd7f32 0%, #daa520 100%)',
                    color: index < 2 ? '#333' : 'white',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.1)',
                          color: 'inherit',
                          fontWeight: 'bold',
                          mr: 2,
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {worker.kullanici.ad} {worker.kullanici.soyad}
                        </Typography>
                        <Chip
                          label={getPerformanceLabel(worker.ortalamaBasari)}
                          size="small"
                          sx={{
                            backgroundColor: getPerformanceColor(worker.ortalamaBasari),
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={worker.ortalamaBasari}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getPerformanceColor(worker.ortalamaBasari),
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    <Typography variant="h4" fontWeight="bold" textAlign="center">
                      {Math.round(worker.ortalamaBasari)}%
                    </Typography>
                    <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8 }}>
                      {worker.sayac} değerlendirme
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default QualityControlStatistics;
