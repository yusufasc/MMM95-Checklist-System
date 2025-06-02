import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Fab,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Add as AddIcon,
  RateReview as ReviewIcon,
  Engineering as EngineeringIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, performanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CountUp from 'react-countup';

const OrtaDashboard = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [controlTasks, setControlTasks] = useState([]);
  const [dailyScores, setDailyScores] = useState({});
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Paralel API çağrıları
      const promises = [];
      const results = {};

      // Görevlerim
      promises.push(
        tasksAPI
          .getMy()
          .then(res => {
            const pendingTasks = res.data.filter(
              task => task.durum === 'bekliyor' || task.durum === 'devamEdiyor',
            );
            results.myTasks = pendingTasks.slice(0, 6);
          })
          .catch(() => {
            results.myTasks = [];
          }),
      );

      // Kontrol bekleyenler
      promises.push(
        tasksAPI
          .getControlPending()
          .then(res => {
            const controlPending = [];
            if (res.data && res.data.groupedTasks && typeof res.data.groupedTasks === 'object') {
              Object.values(res.data.groupedTasks).forEach(machineData => {
                if (machineData.tasks) {
                  const pendingControl = machineData.tasks.filter(
                    task => task.durum === 'tamamlandi' && !task.toplamPuan,
                  );
                  controlPending.push(...pendingControl);
                }
              });
            }
            results.controlTasks = controlPending.slice(0, 6);
          })
          .catch(() => {
            results.controlTasks = [];
          }),
      );

      // Performance sıralaması
      promises.push(
        performanceAPI
          .getScores()
          .then(res => {
            if (res.data.Ortacı) {
              results.ranking = res.data.Ortacı.slice(0, 5);
            } else {
              results.ranking = [];
            }
          })
          .catch(() => {
            results.ranking = [];
          }),
      );

      // Günlük puanlar
      if (user?._id) {
        promises.push(
          performanceAPI
            .getUserPerformance(user._id)
            .then(res => {
              const todayScore = res.data[0] || {};
              results.dailyScores = todayScore;
            })
            .catch(() => {
              results.dailyScores = {};
            }),
        );
      }

      // Tüm API çağrılarını bekle
      await Promise.all(promises);

      // State'leri güncelle
      setMyTasks(results.myTasks || []);
      setControlTasks(results.controlTasks || []);
      setRanking(results.ranking || []);
      setDailyScores(results.dailyScores || {});

      // Debug için
      if (process.env.NODE_ENV === 'development') {
        console.log('Ortacı Dashboard Verileri:', {
          myTasks: results.myTasks?.length || 0,
          controlTasks: results.controlTasks?.length || 0,
          ranking: results.ranking?.length || 0,
          dailyScores: results.dailyScores,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Dashboard yükleme hatası:', error);
      }
      setError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Puan kategorileri
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: 2,
          m: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <CircularProgress sx={{ color: 'white', mb: 2 }} size={60} />
          <Typography variant="h5">Orta Dashboard Yükleniyor...</Typography>
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
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: 3,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              Hoş Geldiniz, {user?.ad} {user?.soyad}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Ortacı Dashboard
            </Typography>
          </Box>
          <EngineeringIcon sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Sol Kolon */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Bekleyen Görevlerim */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AssignmentIcon sx={{ fontSize: 30, color: '#1976d2', mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Bekleyen Görevlerim ({myTasks.length})
              </Typography>
            </Box>

            {myTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Tebrikler! Tüm görevleriniz tamamlandı.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {myTasks.map(task => (
                  <Grid size={{ xs: 12, md: 6 }} key={task._id}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PendingIcon sx={{ color: '#ff9800', mr: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {task.checklist?.ad || 'Görev'}
                          </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {task.checklist?.aciklama || 'Görev açıklaması'}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Chip
                            label={task.durum === 'beklemede' ? 'Beklemede' : 'Devam Ediyor'}
                            color={task.durum === 'beklemede' ? 'warning' : 'info'}
                            size="small"
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate(`/tasks/${task._id}`)}
                          >
                            Başla
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/tasks')}
                startIcon={<AssignmentIcon />}
              >
                Tüm Görevlerim
              </Button>
            </Box>
          </Paper>

          {/* Kontrol Bekleyenler */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Badge badgeContent={controlTasks.length} color="error">
                <ReviewIcon sx={{ fontSize: 30, color: '#f57c00', mr: 2 }} />
              </Badge>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Kontrol Bekleyen Görevler ({controlTasks.length})
              </Typography>
            </Box>

            {controlTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Kontrol bekleyen görev bulunmuyor.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {controlTasks.map(task => (
                  <Grid size={{ xs: 12, md: 6 }} key={task._id}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        border: '2px solid #ff9800',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(255,152,0,0.3)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <ScheduleIcon sx={{ color: '#ff9800', mr: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {task.checklist?.ad || 'Kontrol Görevi'}
                          </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Kullanıcı: {task.kullanici?.ad} {task.kullanici?.soyad}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Makina: {task.makina?.makinaNo || task.makina?.ad}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Chip
                            label="Puanlama Bekliyor"
                            color="warning"
                            size="small"
                            icon={<AssessmentIcon />}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            color="warning"
                            onClick={() => navigate('/control-pending')}
                          >
                            Puanla
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                size="large"
                color="warning"
                onClick={() => navigate('/control-pending')}
                startIcon={<ReviewIcon />}
              >
                Tüm Kontroller
              </Button>
            </Box>
          </Paper>

          {/* Günlük Puanlarım */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <StarIcon sx={{ fontSize: 30, color: '#ffa726', mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Bugünkü Puanlarım
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(scoreColors).map(([key, color]) => {
                // Gerçek API verilerini kullan, yoksa 0 göster
                const score = dailyScores.scores?.[key] || 0;
                const maxScore = 100;
                const percentage = Math.min((score / maxScore) * 100, 100);

                return (
                  <Grid size={{ xs: 6, md: 4 }} key={key}>
                    <Card
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                        border: `2px solid ${color}40`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${color}40`,
                        },
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
                        <CountUp end={score} duration={1.5} />
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {scoreLabels[key]}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: `${color}30`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                            borderRadius: 4,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
                      >
                        {percentage.toFixed(0)}% / 100
                      </Typography>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Sağ Kolon - Sıralama */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrophyIcon sx={{ fontSize: 30, color: '#f57c00', mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Ortacı Sıralaması
              </Typography>
            </Box>

            {ranking.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Sıralama bilgisi yükleniyor...
              </Typography>
            ) : (
              <Box>
                {ranking.map((person, index) => {
                  const isMe = person.user._id === user?._id;
                  return (
                    <Card
                      key={person.user._id}
                      sx={{
                        mb: 2,
                        p: 2,
                        background: isMe
                          ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                          : index === 0
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                            : index === 1
                              ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
                              : index === 2
                                ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
                                : 'white',
                        color: isMe || index <= 2 ? 'white' : 'inherit',
                        border: isMe ? '2px solid #4caf50' : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor:
                              isMe || index <= 2 ? 'rgba(255,255,255,0.2)' : '#f5f5f5',
                            mr: 2,
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            #{index + 1}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {person.user.ad} {person.user.soyad}
                            {isMe && ' (Sen)'}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {person.totalScore} puan
                          </Typography>
                        </Box>

                        {index <= 2 && (
                          <TrophyIcon
                            sx={{
                              fontSize: index === 0 ? 30 : 25,
                              color: 'rgba(255,255,255,0.9)',
                            }}
                          />
                        )}
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/performance')}
              startIcon={<SpeedIcon />}
            >
              Detaylı Performans
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Buttons */}
      <Tooltip title="Yeni Görev">
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 94,
            right: 24,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
          onClick={() => navigate('/tasks')}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <Tooltip title="Kontrol Bekleyenler">
        <Fab
          color="warning"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => navigate('/control-pending')}
        >
          <Badge badgeContent={controlTasks.length} color="error">
            <ReviewIcon />
          </Badge>
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default OrtaDashboard;
