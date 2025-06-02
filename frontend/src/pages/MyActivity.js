import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  LinearProgress,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  Avatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Assessment as AssessmentIcon,
  WorkOutline as WorkOutlineIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { myActivityAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CountUp from 'react-countup';

const MyActivity = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Summary data
  const [summary, setSummary] = useState(null);
  const [dailyPerformance, setDailyPerformance] = useState([]);

  // Detailed activity data
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    durum: '',
    tarih: '',
  });

  // Score details data
  const [scoreDetails, setScoreDetails] = useState([]);
  const [scorePagination, setScorePagination] = useState({});
  const [scoreFilters, setScoreFilters] = useState({
    page: 1,
    limit: 10,
    days: 30,
  });

  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      loadDetailedActivities();
    } else if (activeTab === 2) {
      loadScoreDetails();
    }
  }, [activeTab, filters, scoreFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Önce test endpoint'ini deneyelim
      console.log('🔍 Test endpoint çağırılıyor...');
      try {
        const testRes = await myActivityAPI.test();
        console.log('✅ Test başarılı:', testRes.data);
      } catch (testError) {
        console.error('❌ Test endpoint hatası:', testError);
        setError('Test endpoint hatası: ' + testError.message);
        return;
      }

      // Şimdi summary endpoint'ini deneyelim
      console.log('📊 Summary endpoint çağırılıyor...');
      try {
        const summaryRes = await myActivityAPI.getSummary(30);
        console.log('✅ Summary başarılı:', summaryRes.data);
        setSummary(summaryRes.data);
      } catch (summaryError) {
        console.error('❌ Summary endpoint hatası:', summaryError);
        setError('Summary endpoint hatası: ' + summaryError.message);
        return;
      }

      // Son olarak daily performance
      console.log('📈 Daily performance endpoint çağırılıyor...');
      try {
        const dailyRes = await myActivityAPI.getDailyPerformance(30);
        console.log('✅ Daily performance başarılı:', dailyRes.data);
        setDailyPerformance(dailyRes.data.performansVerileri || []);
      } catch (dailyError) {
        console.error('❌ Daily performance endpoint hatası:', dailyError);
        setError('Daily performance endpoint hatası: ' + dailyError.message);
        return;
      }

      console.log('📊 Kişisel aktivite verileri yüklendi');
    } catch (error) {
      console.error('❌ Aktivite verisi yükleme hatası:', error);
      setError('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedActivities = async () => {
    try {
      const response = await myActivityAPI.getDetailed(filters);
      setActivities(response.data.activities || []);
      setPagination(response.data.sayfalama || {});
    } catch (error) {
      console.error('❌ Detaylı aktivite yükleme hatası:', error);
    }
  };

  const loadScoreDetails = async () => {
    try {
      const response = await myActivityAPI.getScoresDetail(scoreFilters);
      setScoreDetails(response.data.scoreDetails || []);
      setScorePagination(response.data.sayfalama || {});
    } catch (error) {
      console.error('❌ Puanlama detayları yükleme hatası:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Filtre değiştiğinde ilk sayfaya dön
    }));
  };

  const handlePageChange = (event, page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Puan kategorileri için renkler ve etiketler
  const scoreColors = {
    ik_sablon: '#FF6B6B',
    ik_devamsizlik: '#4ECDC4',
    kalite_kontrol: '#45B7D1',
    checklist: '#96CEB4',
    is_bagli: '#FECA57',
    kalip_degisim: '#9B59B6',
  };

  const scoreLabels = {
    ik_sablon: 'İK Şablon',
    ik_devamsizlik: 'Devamsızlık',
    kalite_kontrol: 'Kalite Kontrol',
    checklist: 'Checklist',
    is_bagli: 'İşe Bağlı',
    kalip_degisim: 'Kalıp Değişimi',
  };

  // Durum renkleri
  const getDurumColor = durum => {
    switch (durum) {
      case 'tamamlandi':
        return 'success';
      case 'onaylandi':
        return 'primary';
      case 'bekliyor':
        return 'warning';
      case 'reddedildi':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDurumText = durum => {
    switch (durum) {
      case 'tamamlandi':
        return 'Tamamlandı';
      case 'onaylandi':
        return 'Onaylandı';
      case 'bekliyor':
        return 'Bekliyor';
      case 'reddedildi':
        return 'Reddedildi';
      default:
        return durum;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          m: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <CircularProgress sx={{ color: 'white', mb: 2 }} size={60} />
          <Typography variant="h5">Kişisel Performans Yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }} variant="outlined">
          Yenile
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              Kişisel Performansım 📊
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {user?.ad} {user?.soyad} - Son 30 Günlük Performans
            </Typography>
          </Box>
          <AssessmentIcon sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<TrendingUpIcon />} label="Özet & Grafikler" />
          <Tab icon={<TimelineIcon />} label="Detaylı Aktiviteler" />
          <Tab icon={<TrophyIcon />} label="Aldığım Puanlar" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && summary && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Toplam Görevler */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      <CountUp end={summary.genelIstatistikler.toplamGorevSayisi} duration={1} />
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Toplam Görevler
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Son 30 günde yapılan
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Tamamlanan Görevler */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <WorkOutlineIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      <CountUp
                        end={summary.genelIstatistikler.tamamlananGorevSayisi}
                        duration={1}
                      />
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Tamamlanan
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Başarı oranı: %
                    {Math.round(
                      (summary.genelIstatistikler.tamamlananGorevSayisi /
                        summary.genelIstatistikler.toplamGorevSayisi) *
                        100,
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Toplam Puan */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <StarIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      <CountUp end={summary.genelIstatistikler.toplamPuan} duration={1} />
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Toplam Puan
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Günlük ort: {summary.genelIstatistikler.gunlukOrtalama}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* İşe Bağlı Görevler */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <BuildIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      <CountUp end={summary.iseBagliGorevleri} duration={1} />
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    İşe Bağlı
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    WorkTask görevleri
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Score Categories */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center' }}
            >
              <TrophyIcon sx={{ mr: 2, color: '#ffa726' }} />
              Kategorilere Göre Puanlarım
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(summary.kategorilerePuanlar).map(([key, data]) => (
                <Grid item xs={6} md={4} key={key}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${scoreColors[key]}20, ${scoreColors[key]}10)`,
                      border: `2px solid ${scoreColors[key]}40`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: scoreColors[key] }}>
                      <CountUp end={data.puan} duration={1.5} />
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {scoreLabels[key]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {data.gorevSayisi} görev
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((data.puan / 100) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${scoreColors[key]}30`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: scoreColors[key],
                        },
                      }}
                    />
                    {data.ortalama > 0 && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Ortalama: {data.ortalama}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Daily Performance Chart */}
          {dailyPerformance.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                📈 Son 30 Günlük Performans Grafiği
              </Typography>

              <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={dailyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tarihFormatli" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [value, scoreLabels[name] || name]}
                      labelFormatter={label => `Tarih: ${label}`}
                    />
                    <Legend />
                    {Object.entries(scoreColors).map(([key, color]) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={`scores.${key}`}
                        stroke={color}
                        strokeWidth={2}
                        name={scoreLabels[key]}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* Detailed Activities Tab */}
      {activeTab === 1 && (
        <>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              Filtreler
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.durum}
                    label="Durum"
                    onChange={e => handleFilterChange('durum', e.target.value)}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                    <MenuItem value="onaylandi">Onaylandı</MenuItem>
                    <MenuItem value="bekliyor">Bekliyor</MenuItem>
                    <MenuItem value="reddedildi">Reddedildi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tarih"
                  value={filters.tarih}
                  onChange={e => handleFilterChange('tarih', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sayfa Boyutu</InputLabel>
                  <Select
                    value={filters.limit}
                    label="Sayfa Boyutu"
                    onChange={e => handleFilterChange('limit', e.target.value)}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ height: 56 }}
                  onClick={() => setFilters({ page: 1, limit: 10, durum: '', tarih: '' })}
                >
                  Sıfırla
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Activities List */}
          <Paper sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6">Aktivitelerim ({pagination.toplamKayit || 0})</Typography>
            </Box>

            {activities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Seçilen kriterlere göre aktivite bulunamadı.
                </Typography>
              </Box>
            ) : (
              <>
                {activities.map((activity, index) => (
                  <Box key={activity._id}>
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        {/* Icon & Type */}
                        <Grid item xs={12} sm={1}>
                          <Avatar
                            sx={{
                              bgcolor: activity.kategoriRengi,
                              width: 50,
                              height: 50,
                            }}
                          >
                            {activity.tip === 'checklist' ? <AssignmentIcon /> : <BuildIcon />}
                          </Avatar>
                        </Grid>

                        {/* Main Info */}
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {activity.checklist?.ad || 'Görev'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {activity.tip === 'checklist' ? 'Checklist Görevi' : 'İşe Bağlı Görev'}
                          </Typography>
                          {activity.makina && (
                            <Typography variant="body2">
                              Makina: {activity.makina.ad || activity.makina.envanterKodu}
                            </Typography>
                          )}
                        </Grid>

                        {/* Status & Score */}
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Chip
                              label={getDurumText(activity.durum)}
                              color={getDurumColor(activity.durum)}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {activity.toplamPuan || activity.kontrolToplamPuani || 0} puan
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Date */}
                        <Grid item xs={12} sm={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <CalendarIcon sx={{ color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body2">
                              {new Date(activity.tamamlanmaTarihi).toLocaleDateString('tr-TR')}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                    {index < activities.length - 1 && <Divider />}
                  </Box>
                ))}

                {/* Pagination */}
                {pagination.toplamSayfa > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Pagination
                      count={pagination.toplamSayfa}
                      page={pagination.mevcutSayfa}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </>
      )}

      {/* Scores Detail Tab */}
      {activeTab === 2 && (
        <>
          {/* Score Filters */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrophyIcon sx={{ mr: 1 }} />
              Puanlama Filtresi
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Gün Sayısı</InputLabel>
                  <Select
                    value={scoreFilters.days}
                    label="Gün Sayısı"
                    onChange={e =>
                      setScoreFilters(prev => ({ ...prev, days: e.target.value, page: 1 }))
                    }
                  >
                    <MenuItem value={7}>Son 7 Gün</MenuItem>
                    <MenuItem value={15}>Son 15 Gün</MenuItem>
                    <MenuItem value={30}>Son 30 Gün</MenuItem>
                    <MenuItem value={60}>Son 60 Gün</MenuItem>
                    <MenuItem value={90}>Son 90 Gün</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sayfa Boyutu</InputLabel>
                  <Select
                    value={scoreFilters.limit}
                    label="Sayfa Boyutu"
                    onChange={e =>
                      setScoreFilters(prev => ({ ...prev, limit: e.target.value, page: 1 }))
                    }
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ height: 56 }}
                  onClick={() => setScoreFilters({ page: 1, limit: 10, days: 30 })}
                >
                  Sıfırla
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Scores List */}
          <Paper sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6">
                Aldığım Puanlar ({scorePagination.toplamKayit || 0})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Son {scoreFilters.days} günde aldığınız puanlar
              </Typography>
            </Box>

            {scoreDetails.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TrophyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Seçilen dönemde puanlanmış görev bulunamadı.
                </Typography>
              </Box>
            ) : (
              <>
                {scoreDetails.map((score, index) => (
                  <Box key={score.id}>
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={3} alignItems="center">
                        {/* Icon & Category */}
                        <Grid item xs={12} sm={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: score.kategoriRengi,
                                width: 60,
                                height: 60,
                                mx: 'auto',
                                mb: 1,
                              }}
                            >
                              {score.tip === 'checklist' ? (
                                <AssignmentIcon sx={{ fontSize: 30 }} />
                              ) : (
                                <BuildIcon sx={{ fontSize: 30 }} />
                              )}
                            </Avatar>
                            <Chip
                              label={score.kategori}
                              size="small"
                              sx={{
                                bgcolor: score.kategoriRengi + '20',
                                color: score.kategoriRengi,
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                        </Grid>

                        {/* Main Info */}
                        <Grid item xs={12} sm={5}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {score.checklistAdi}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {score.makina}
                          </Typography>
                          {score.kalip && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Kalıp:</strong> {score.kalip}
                            </Typography>
                          )}
                          {score.hamade && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Hammadde:</strong> {score.hamade}
                            </Typography>
                          )}
                          {score.aciklama && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              {score.aciklama}
                            </Typography>
                          )}
                        </Grid>

                        {/* Scores Detail */}
                        <Grid item xs={12} sm={3}>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                              Puanlama Detayı
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Kendi Puanım:</Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold', color: 'primary.main' }}
                              >
                                {score.puanlar.kendi}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Kontrol Puanı:</Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold', color: 'success.main' }}
                              >
                                {score.puanlar.kontrol}
                              </Typography>
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                Toplam:
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 'bold',
                                  color: 'warning.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <StarIcon sx={{ fontSize: 20, mr: 0.5 }} />
                                {score.puanlar.toplam}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Who Scored & Date */}
                        <Grid item xs={12} sm={2}>
                          <Box sx={{ textAlign: 'center' }}>
                            {/* Date */}
                            <Box sx={{ mb: 2 }}>
                              <CalendarIcon sx={{ color: 'text.secondary', mb: 1 }} />
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {new Date(score.tamamlanmaTarihi).toLocaleDateString('tr-TR')}
                              </Typography>
                            </Box>

                            {/* Status */}
                            <Chip
                              label={getDurumText(score.durum)}
                              color={getDurumColor(score.durum)}
                              size="small"
                              sx={{ mb: 2 }}
                            />

                            {/* Who scored */}
                            {score.puanlayanKullanici && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Puanlayan:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {score.puanlayanKullanici.ad} {score.puanlayanKullanici.soyad}
                                </Typography>
                              </Box>
                            )}

                            {/* Who approved */}
                            {score.onaylayan && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Onaylayan:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {score.onaylayan.ad} {score.onaylayan.soyad}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                    {index < scoreDetails.length - 1 && <Divider />}
                  </Box>
                ))}

                {/* Pagination */}
                {scorePagination.toplamSayfa > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Pagination
                      count={scorePagination.toplamSayfa}
                      page={scorePagination.mevcutSayfa}
                      onChange={(event, page) => setScoreFilters(prev => ({ ...prev, page }))}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MyActivity;
