import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
  Container,
  Alert,
  Paper,
  Chip,
  Avatar,
  Fab,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Rating,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  CardGiftcard as BonusIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MoneyIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { bonusEvaluationAPI } from '../services/api';

const BonusEvaluation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasModulePermission, user } = useAuth();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openEvaluationDialog, setOpenEvaluationDialog] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState({
    degerlendirmeDonemi: '',
    notlar: '',
    yoneticiYorumu: '',
    puanlamalar: [],
  });
  const [statsData, setStatsData] = useState({
    monthlyEvaluations: 0,
    pendingApprovals: 0,
    avgScore: 0,
    totalBonus: 0,
  });
  const [workerSearch, setWorkerSearch] = useState('');

  const canEvaluate = hasModulePermission('Bonus Değerlendirme');
  const canView = hasModulePermission('Bonus Değerlendirme');

  const steps = ['Şablon Seç', 'Çalışan Seç', 'Değerlendirme Yap'];

  useEffect(() => {
    if (canView) {
      loadInitialData();
    }
  }, [canView]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [templatesRes, evaluationsRes, dashboardRes] = await Promise.all([
        bonusEvaluationAPI.getActiveTemplates(),
        bonusEvaluationAPI.getEvaluations({ page: 1, limit: 10 }),
        bonusEvaluationAPI.getDashboard().catch(() => ({ data: { data: {} } })),
      ]);

      if (templatesRes.data?.success) {
        setTemplates(templatesRes.data.data || []);
      }
      if (evaluationsRes.data?.success) {
        setEvaluations(evaluationsRes.data.data || []);
      }
      if (dashboardRes.data?.success) {
        const data = dashboardRes.data.data;
        setStatsData({
          monthlyEvaluations: data.monthlyEvaluations || 0,
          pendingApprovals: 0, // Onay bekleyen özelliği yok, 0 olarak ayarlıyoruz
          avgScore: data.averageScore || 0,
          totalBonus: data.evaluatedUsersCount || 0, // Toplam değerlendirilen kişi sayısı
        });
      }
    } catch (error) {
      console.error('Initial data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // loadWorkers fonksiyonu kaldırıldı - artık loadInitialData içinde bu iş yapılıyor

  const handleTemplateSelect = async template => {
    setSelectedTemplate(template);
    setSelectedWorker(null);
    setActiveStep(1);

    // Template seçilince worker'ları yükle
    try {
      setLoading(true);
      const workersRes = await bonusEvaluationAPI.getTemplateWorkers(
        template._id,
      );
      if (workersRes.data?.success) {
        const data = workersRes.data.data;
        setWorkers(data.workers || []);
      }
    } catch (error) {
      console.error('Workers loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelect = async worker => {
    if (!worker.canEvaluate) {
      alert(worker.periodMessage || 'Bu personel henüz değerlendirilemez.');
      return;
    }

    setSelectedWorker(worker);

    const puanlamalar = selectedTemplate.maddeler.map((madde, index) => ({
      maddeId: `madde_${index}`,
      maddeBaslik: madde.baslik,
      puan: 0,
      maksimumPuan: madde.maksimumPuan,
      aciklama: madde.aciklama || '',
    }));

    setCurrentEvaluation({
      degerlendirmeDonemi: new Date().toISOString().slice(0, 7),
      notlar: '',
      yoneticiYorumu: '',
      puanlamalar,
    });

    setActiveStep(2);
    setOpenEvaluationDialog(true);
  };

  const handleScoreChange = (maddeIndex, score) => {
    const newPuanlamalar = [...currentEvaluation.puanlamalar];
    newPuanlamalar[maddeIndex].puan = score;
    setCurrentEvaluation({
      ...currentEvaluation,
      puanlamalar: newPuanlamalar,
    });
  };

  const handleSubmitEvaluation = async () => {
    try {
      setLoading(true);

      const evaluationData = {
        sablon: selectedTemplate._id,
        degerlendirilenKullanici: selectedWorker._id,
        departman: selectedWorker.departman?._id,
        degerlendirmeDonemi: currentEvaluation.degerlendirmeDonemi,
        puanlamalar: currentEvaluation.puanlamalar,
        notlar: currentEvaluation.notlar,
        yoneticiYorumu: currentEvaluation.yoneticiYorumu,
      };

      await bonusEvaluationAPI.createEvaluation(evaluationData);

      setOpenEvaluationDialog(false);
      setActiveStep(0);
      setSelectedTemplate(null);
      setSelectedWorker(null);
      loadInitialData();
    } catch (error) {
      console.error('Evaluation submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setSelectedTemplate(null);
    setSelectedWorker(null);
    setOpenEvaluationDialog(false);
  };

  const getTotalScore = () => {
    return currentEvaluation.puanlamalar.reduce(
      (sum, p) => sum + (p.puan || 0),
      0,
    );
  };

  const getMaxScore = () => {
    return currentEvaluation.puanlamalar.reduce(
      (sum, p) => sum + (p.maksimumPuan || 10),
      0,
    );
  };

  const getSuccessPercentage = () => {
    const max = getMaxScore();
    return max > 0 ? Math.round((getTotalScore() / max) * 100) : 0;
  };

  // Worker arama filtreleme
  const filteredWorkers = workers.filter(worker => {
    const searchTerm = workerSearch.toLowerCase();
    return (
      worker.ad?.toLowerCase().includes(searchTerm) ||
      worker.soyad?.toLowerCase().includes(searchTerm) ||
      worker.departman?.ad?.toLowerCase().includes(searchTerm) ||
      worker.roller?.some(role => role.ad?.toLowerCase().includes(searchTerm))
    );
  });

  if (!canView) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ borderRadius: 3 }}>
          <Typography variant='h6' gutterBottom>
            Erişim Engellendi
          </Typography>
          Bu sayfaya erişim yetkiniz bulunmuyor. Bonus Değerlendirme modülü
          yetkisi gereklidir.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Container maxWidth='xl' sx={{ py: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
          }}
        >
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Typography variant='h3' fontWeight='bold' gutterBottom>
                Bonus Değerlendirme Sistemi
                <BonusIcon sx={{ ml: 2, fontSize: '2.5rem' }} />
              </Typography>
              <Typography variant='h6' sx={{ opacity: 0.9, mb: 2 }}>
                Hoş geldiniz, {user?.ad} {user?.soyad}
              </Typography>
              <Typography variant='body1' sx={{ opacity: 0.8 }}>
                Personel bonus değerlendirmelerini gerçekleştirin
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: { xs: 80, md: 120 },
                    height: { xs: 80, md: 120 },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mx: 'auto',
                    mb: 2,
                    fontSize: { xs: '2rem', md: '3rem' },
                  }}
                >
                  {user?.ad?.charAt(0)}
                  {user?.soyad?.charAt(0)}
                </Avatar>
                <Chip
                  label='Üretim Müdürü'
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.9rem',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Bu Ay
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : statsData.monthlyEvaluations}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Değerlendirme
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Ortalama
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : Math.round(statsData.avgScore)}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Puan
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Toplam
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : statsData.totalBonus}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Kişi Sayısı
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Başarı
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : `${Math.round(statsData.avgScore)}%`}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Ortalama
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Yeni Bonus Değerlendirme
              </Typography>

              <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
                {steps.map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <Grid container spacing={3}>
                  {templates.map(template => (
                    <Grid item xs={12} sm={6} key={template._id}>
                      <Card
                        elevation={2}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6,
                          },
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 2,
                            }}
                          >
                            <BonusIcon color='primary' sx={{ mr: 1 }} />
                            <Typography variant='h6' fontWeight='bold'>
                              {template.ad}
                            </Typography>
                          </Box>
                          <Typography color='text.secondary' gutterBottom>
                            Rol: {template.rol?.ad}
                          </Typography>
                          <Chip
                            label={template.bonusKategorisi}
                            color='primary'
                            size='small'
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`x${template.bonusCarpani} çarpan`}
                            color='secondary'
                            size='small'
                          />
                          <Typography variant='body2' sx={{ mt: 2 }}>
                            {template.maddeler?.length || 0} değerlendirme
                            maddesi
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {activeStep === 1 && selectedTemplate && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    {selectedTemplate.ad} - Çalışan Seçimi
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Değerlendirme Periyodu:{' '}
                    {selectedTemplate.degerlendirmePeriyodu} gün
                  </Typography>

                  {workers.length === 0 ? (
                    <Alert severity='info' sx={{ my: 2 }}>
                      Bu şablon için uygun personel bulunamadı.
                    </Alert>
                  ) : (
                    <>
                      {/* Arama ve İstatistik */}
                      <Box sx={{ mb: 3 }}>
                        <TextField
                          fullWidth
                          variant='outlined'
                          placeholder='Personel ara... (ad, soyad, departman, rol)'
                          value={workerSearch}
                          onChange={e => setWorkerSearch(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position='start'>
                                <SearchIcon />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 2 }}
                        />

                        <Alert severity='info'>
                          Toplam {workers.length} personel | Filtrelenen:{' '}
                          {filteredWorkers.length} | Değerlendirilebilir:{' '}
                          {filteredWorkers.filter(w => w.canEvaluate).length}
                        </Alert>
                      </Box>

                      {/* Personel Listesi - Table Format */}
                      <TableContainer component={Paper} variant='outlined'>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell>Personel</TableCell>
                              <TableCell>Departman</TableCell>
                              <TableCell>Roller</TableCell>
                              <TableCell>Durum</TableCell>
                              <TableCell>Son Değerlendirme</TableCell>
                              <TableCell align='center'>İşlem</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredWorkers.map(worker => (
                              <TableRow
                                key={worker._id}
                                hover
                                sx={{
                                  cursor: worker.canEvaluate
                                    ? 'pointer'
                                    : 'not-allowed',
                                  opacity: worker.canEvaluate ? 1 : 0.6,
                                  bgcolor: worker.canEvaluate
                                    ? 'transparent'
                                    : 'grey.100',
                                  '&:hover': {
                                    bgcolor: worker.canEvaluate
                                      ? 'primary.50'
                                      : 'grey.100',
                                  },
                                }}
                                onClick={() => handleWorkerSelect(worker)}
                              >
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        mr: 2,
                                        bgcolor: worker.canEvaluate
                                          ? 'success.main'
                                          : 'error.main',
                                      }}
                                    >
                                      <PersonIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography
                                        variant='body2'
                                        fontWeight='bold'
                                      >
                                        {worker.ad} {worker.soyad}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2'>
                                    {worker.departman?.ad || 'Departman yok'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2'>
                                    {worker.roller
                                      ?.map(role => role.ad)
                                      .join(', ') || 'Rol yok'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      worker.canEvaluate
                                        ? 'Değerlendirilebilir'
                                        : 'Beklemede'
                                    }
                                    color={
                                      worker.canEvaluate ? 'success' : 'error'
                                    }
                                    size='small'
                                  />
                                </TableCell>
                                <TableCell>
                                  {worker.lastEvaluation ? (
                                    <Box>
                                      <Typography variant='body2'>
                                        {new Date(
                                          worker.lastEvaluation.tarih,
                                        ).toLocaleDateString('tr-TR')}
                                      </Typography>
                                      {!worker.canEvaluate &&
                                        worker.nextEvaluationDate && (
                                        <Typography
                                          variant='caption'
                                          color='error.main'
                                        >
                                            Sonraki:{' '}
                                          {new Date(
                                            worker.nextEvaluationDate,
                                          ).toLocaleDateString('tr-TR')}
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    <Typography
                                      variant='body2'
                                      color='text.secondary'
                                    >
                                      İlk değerlendirme
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align='center'>
                                  <Button
                                    variant={
                                      worker.canEvaluate
                                        ? 'contained'
                                        : 'outlined'
                                    }
                                    color={
                                      worker.canEvaluate ? 'primary' : 'inherit'
                                    }
                                    size='small'
                                    disabled={!worker.canEvaluate}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleWorkerSelect(worker);
                                    }}
                                  >
                                    {worker.canEvaluate
                                      ? 'Değerlendir'
                                      : 'Beklemede'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {filteredWorkers.length === 0 && workerSearch && (
                        <Alert severity='warning' sx={{ mt: 2 }}>
                          "{workerSearch}" araması için sonuç bulunamadı.
                        </Alert>
                      )}
                    </>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Button onClick={() => setActiveStep(0)}>Geri</Button>
                  </Box>
                </Box>
              )}

              {activeStep === 0 && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography color='text.secondary'>
                    Değerlendirme yapmak için bir şablon seçin
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant='h6' fontWeight='bold' gutterBottom>
                Son Değerlendirmeler
              </Typography>
              <Stack spacing={2}>
                {evaluations.slice(0, 5).map(evaluation => (
                  <Card key={evaluation._id} variant='outlined' sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant='subtitle2' fontWeight='bold'>
                          {evaluation.degerlendirilenKullanici?.ad}{' '}
                          {evaluation.degerlendirilenKullanici?.soyad}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {evaluation.sablon?.ad}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(
                            evaluation.degerlendirmeTarihi,
                          ).toLocaleDateString('tr-TR')}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                          color='primary'
                        >
                          {evaluation.basariYuzdesi}%
                        </Typography>
                        <Chip
                          label={evaluation.bonusOnayi}
                          color={
                            evaluation.bonusOnayi === 'Onaylandı'
                              ? 'success'
                              : evaluation.bonusOnayi === 'Reddedildi'
                                ? 'error'
                                : 'warning'
                          }
                          size='small'
                        />
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Evaluation Dialog */}
        <Dialog
          open={openEvaluationDialog}
          onClose={() => setOpenEvaluationDialog(false)}
          maxWidth='md'
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant='h6'>
                {selectedWorker?.ad} {selectedWorker?.soyad} - Bonus
                Değerlendirme
              </Typography>
              <Chip label={selectedTemplate?.bonusKategorisi} color='primary' />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='month'
                  label='Değerlendirme Dönemi'
                  value={currentEvaluation.degerlendirmeDonemi}
                  onChange={e =>
                    setCurrentEvaluation({
                      ...currentEvaluation,
                      degerlendirmeDonemi: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant='h4' fontWeight='bold' color='primary'>
                    {getSuccessPercentage()}%
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {getTotalScore()} / {getMaxScore()} puan
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='h6' gutterBottom>
                  Değerlendirme Maddeleri
                </Typography>
                {currentEvaluation.puanlamalar.map((puanlama, index) => (
                  <Paper key={index} elevation={1} sx={{ p: 3, mb: 2 }}>
                    <Typography
                      variant='subtitle1'
                      fontWeight='bold'
                      gutterBottom
                    >
                      {puanlama.maddeBaslik}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography component='legend' sx={{ mr: 2 }}>
                        Puan:
                      </Typography>
                      <Rating
                        value={puanlama.puan || 0}
                        max={puanlama.maksimumPuan || 10}
                        onChange={(event, newValue) =>
                          handleScoreChange(index, newValue || 0)
                        }
                        sx={{ mr: 2 }}
                      />
                      <Typography variant='body2'>
                        {puanlama.puan || 0} / {puanlama.maksimumPuan || 10}
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label='Açıklama'
                      value={puanlama.aciklama}
                      onChange={e => {
                        const newPuanlamalar = [
                          ...currentEvaluation.puanlamalar,
                        ];
                        newPuanlamalar[index].aciklama = e.target.value;
                        setCurrentEvaluation({
                          ...currentEvaluation,
                          puanlamalar: newPuanlamalar,
                        });
                      }}
                    />
                  </Paper>
                ))}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Genel Notlar'
                  value={currentEvaluation.notlar}
                  onChange={e =>
                    setCurrentEvaluation({
                      ...currentEvaluation,
                      notlar: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Yönetici Yorumu'
                  value={currentEvaluation.yoneticiYorumu}
                  onChange={e =>
                    setCurrentEvaluation({
                      ...currentEvaluation,
                      yoneticiYorumu: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenEvaluationDialog(false)}
              startIcon={<CancelIcon />}
            >
              İptal
            </Button>
            <Button onClick={resetForm}>Baştan Başla</Button>
            <Button
              onClick={handleSubmitEvaluation}
              variant='contained'
              startIcon={<SaveIcon />}
              disabled={loading || !currentEvaluation.degerlendirmeDonemi}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {isMobile && canEvaluate && (
          <Zoom in={true}>
            <Fab
              color='primary'
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              }}
              onClick={() => setActiveStep(0)}
            >
              <AddIcon />
            </Fab>
          </Zoom>
        )}
      </Container>
    </Box>
  );
};

export default BonusEvaluation;
