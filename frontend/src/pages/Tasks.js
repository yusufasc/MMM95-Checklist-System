import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  Grid,
  Paper,
  LinearProgress,
  Avatar,
  Stack,
  IconButton,
  CardMedia,
  useMediaQuery,
  useTheme,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import { tasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Tasks = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDialog, setTaskDialog] = useState(false);
  const [taskData, setTaskData] = useState({ maddeler: [], makina: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDialog, setImageDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  const fileInputRefs = useRef({});

  const { selectedMachines } = useAuth();

  useEffect(() => {
    loadData();
  }, [selectedMachines]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tasksResponse = await tasksAPI.getMy();
      setTasks(tasksResponse.data);
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTaskClick = task => {
    setSelectedTask(task);
    setTaskData({
      maddeler: task.maddeler.map(madde => ({
        ...madde,
        resimUrl: madde.resimUrl || '',
        resimFile: null,
      })),
      makina: task.makina?._id || '',
    });
    setTaskDialog(true);
  };

  const handleTaskClose = () => {
    setTaskDialog(false);
    setSelectedTask(null);
    setTaskData({ maddeler: [], makina: '' });
    setImagePreview(null);
    setImageDialog(false);
  };

  const handleMaddeChange = (index, field, value) => {
    const newMaddeler = [...taskData.maddeler];
    newMaddeler[index][field] = value;

    // Puan hesaplama
    if (field === 'cevap') {
      newMaddeler[index].puan = value ? newMaddeler[index].maxPuan : 0;
    }

    setTaskData({ ...taskData, maddeler: newMaddeler });
  };

  const handleImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        setError('Sadece resim dosyaları yüklenebilir');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const newMaddeler = [...taskData.maddeler];
        newMaddeler[index].resimUrl = e.target.result;
        newMaddeler[index].resimFile = file;
        setTaskData({ ...taskData, maddeler: newMaddeler });
        setSuccess('Resim başarıyla yüklendi! 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = index => {
    const newMaddeler = [...taskData.maddeler];
    newMaddeler[index].resimUrl = '';
    newMaddeler[index].resimFile = null;
    setTaskData({ ...taskData, maddeler: newMaddeler });

    // File input'u temizle
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
  };

  const handleImagePreview = imageUrl => {
    setImagePreview(imageUrl);
    setImageDialog(true);
  };

  const handleTaskComplete = async () => {
    if (completing) {
      return;
    } // Prevent double submission

    try {
      setCompleting(true);
      setError('');
      setSuccess('');

      // Makina kontrolü - daha esnek
      const finalMakina =
        taskData.makina ||
        selectedTask?.makina?._id ||
        (selectedMachines.length > 0 ? selectedMachines[0]._id : null);

      if (!finalMakina) {
        setError('Makina seçimi yapılmalıdır!');
        setCompleting(false);
        return;
      }

      // Resim dosyalarını base64 olarak gönder
      const taskDataToSend = {
        ...taskData,
        makina: finalMakina,
        maddeler: taskData.maddeler.map(madde => ({
          ...madde,
          resimFile: undefined, // File objesini kaldır, sadece base64 string'i gönder
        })),
      };

      await tasksAPI.complete(selectedTask._id, taskDataToSend);
      setSuccess('Görev başarıyla tamamlandı! 🎉');
      setTimeout(() => {
        handleTaskClose();
        loadData();
      }, 1500);
    } catch (error) {
      setError(
        'Görev tamamlanırken hata oluştu: ' + (error.response?.data?.message || error.message),
      );
    } finally {
      setCompleting(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'bekliyor':
        return 'warning';
      case 'tamamlandi':
        return 'info';
      case 'onaylandi':
        return 'success';
      case 'iadeEdildi':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'bekliyor':
        return 'Bekliyor';
      case 'tamamlandi':
        return 'Tamamlandı';
      case 'onaylandi':
        return 'Onaylandı';
      case 'iadeEdildi':
        return 'İade Edildi';
      default:
        return status;
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'bekliyor':
        return <ScheduleIcon />;
      case 'tamamlandi':
        return <InfoIcon />;
      case 'onaylandi':
        return <CheckCircleIcon />;
      case 'iadeEdildi':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const isTaskOverdue = hedefTarih => {
    return new Date(hedefTarih) < new Date();
  };

  const getCompletionPercentage = () => {
    if (!taskData.maddeler.length) {
      return 0;
    }
    const completedItems = taskData.maddeler.filter(madde => madde.cevap).length;
    return Math.round((completedItems / taskData.maddeler.length) * 100);
  };

  const getTotalScore = () => {
    return taskData.maddeler.reduce((total, madde) => total + (madde.cevap ? madde.maxPuan : 0), 0);
  };

  const getMaxScore = () => {
    return taskData.maddeler.reduce((total, madde) => total + madde.maxPuan, 0);
  };

  const getCompletedItemsWithImages = () => {
    return taskData.maddeler.filter(madde => madde.cevap && madde.resimUrl).length;
  };

  const filteredTasks = tasks.filter(task => {
    switch (tabValue) {
      case 0: // Bekleyen Görevler
        return task.durum === 'bekliyor';
      case 1: // Tamamlanan Görevler
        return ['tamamlandi', 'onaylandi'].includes(task.durum);
      case 2: // Geciken Görevler
        return task.durum === 'bekliyor' && isTaskOverdue(task.hedefTarih);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Görevler yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header - Kompakt */}
      <Box sx={{ mb: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              mr: 1.5,
              width: { xs: 32, md: 56 },
              height: { xs: 32, md: 56 },
            }}
          >
            <AssignmentIcon fontSize={isMobile ? 'small' : 'large'} />
          </Avatar>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h4'} component="h1" fontWeight="bold">
              Görevlerim
            </Typography>
            {!isMobile && (
              <Typography variant="subtitle1" color="text.secondary">
                Günlük görevlerinizi takip edin ve tamamlayın
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, py: 1 }} onClose={() => setError('')}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2, py: 1 }} onClose={() => setSuccess('')}>
          <Typography variant="body2">{success}</Typography>
        </Alert>
      )}

      {/* Makina Seçimi Uyarısı - Kompakt */}
      {selectedMachines.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2, py: 1 }} icon={<BuildIcon />}>
          <Typography variant="body2" fontWeight="bold">
            🔧 Makina Seçimi Gerekli
          </Typography>
          <Typography variant="caption">Sağ üstteki "Makina Seçimi" butonunu kullanın.</Typography>
        </Alert>
      )}

      {/* Seçili Makinalar - Kompakt */}
      {selectedMachines.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            <BuildIcon sx={{ mr: 1, fontSize: 16 }} />
            Çalıştığınız Makinalar
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selectedMachines.map(machine => (
              <Chip
                key={machine._id}
                label={`${machine.makinaNo} - ${machine.ad}`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mb: 0.5, fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* İstatistikler - Sadece Mobile'da Kaldırıldı, Desktop'ta Kompakt */}
      {!isMobile && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
                color: 'white',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <ScheduleIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {tasks.filter(t => t.durum === 'bekliyor').length}
                </Typography>
                <Typography variant="body2">Bekleyen</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
                color: 'white',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {tasks.filter(t => ['tamamlandi', 'onaylandi'].includes(t.durum)).length}
                </Typography>
                <Typography variant="body2">Tamamlanan</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #EF5350 0%, #F44336 100%)',
                color: 'white',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <WarningIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {tasks.filter(t => t.durum === 'bekliyor' && isTaskOverdue(t.hedefTarih)).length}
                </Typography>
                <Typography variant="body2">Geciken</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs - Kompakt */}
      <Paper sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: { xs: 40, md: 48 },
            '& .MuiTab-root': {
              py: { xs: 1, md: 2 },
              fontSize: { xs: '0.75rem', md: '1rem' },
              fontWeight: 'bold',
              minHeight: { xs: 40, md: 48 },
            },
          }}
        >
          <Tab
            label={isMobile ? 'Bekleyen' : 'Bekleyen Görevler'}
            icon={<ScheduleIcon />}
            iconPosition="start"
          />
          <Tab
            label={isMobile ? 'Tamamlanan' : 'Tamamlanan Görevler'}
            icon={<CheckCircleIcon />}
            iconPosition="start"
          />
          <Tab
            label={isMobile ? 'Geciken' : 'Geciken Görevler'}
            icon={<WarningIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Görev Kartları - Mobil için Liste Formatı */}
      {filteredTasks.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 2 }}>
          <AssignmentIcon sx={{ fontSize: { xs: 48, md: 80 }, color: 'text.secondary', mb: 1 }} />
          <Typography variant={isMobile ? 'body1' : 'h5'} color="text.secondary" gutterBottom>
            {selectedMachines.length === 0
              ? 'Önce makina seçimi yapın'
              : tabValue === 0
                ? 'Bekleyen görev bulunmuyor'
                : tabValue === 1
                  ? 'Tamamlanan görev bulunmuyor'
                  : 'Geciken görev bulunmuyor'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedMachines.length === 0
              ? 'Görevlerinizi görmek için makina seçimi yapmanız gerekiyor.'
              : 'Yeni görevler eklendiğinde burada görünecek.'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={isMobile ? 1 : 2}>
          {filteredTasks.map(task => (
            <Card
              key={task._id}
              sx={{
                borderRadius: 2,
                boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.1)',
                border:
                  isTaskOverdue(task.hedefTarih) && task.durum === 'bekliyor'
                    ? '2px solid #f44336'
                    : '1px solid #e0e0e0',
                '&:hover': {
                  transform: isMobile ? 'none' : 'translateY(-2px)',
                  boxShadow: isMobile
                    ? '0 2px 8px rgba(0,0,0,0.15)'
                    : '0 8px 30px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, pb: { xs: 1, md: 1 } }}>
                {/* Başlık ve Durum - Kompakt */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: { xs: 1, md: 2 },
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 0.5 : 0,
                  }}
                >
                  <Typography
                    variant={isMobile ? 'subtitle1' : 'h6'}
                    fontWeight="bold"
                    sx={{
                      flex: 1,
                      mr: { xs: 0, md: 1 },
                      fontSize: { xs: '1rem', md: '1.25rem' },
                    }}
                  >
                    {task.checklist?.ad || 'Bilinmeyen Checklist'}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(task.durum)}
                    label={getStatusText(task.durum)}
                    color={getStatusColor(task.durum)}
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                      height: { xs: 24, md: 32 },
                    }}
                  />
                </Box>

                {/* Detaylar - Kompakt Layout */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: { xs: 0.5, md: 1 },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Makina */}
                  {task.makina ? (
                    <Chip
                      icon={<BuildIcon />}
                      label={`${task.makina.makinaNo} - ${task.makina.ad}`}
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  ) : (
                    <Chip
                      icon={<WarningIcon />}
                      label="Makina Seçilmemiş"
                      variant="outlined"
                      color="warning"
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  )}

                  {/* Tarih */}
                  <Typography variant="caption" color="text.secondary">
                    📅 {new Date(task.hedefTarih).toLocaleDateString('tr-TR')}
                  </Typography>

                  {/* Puan */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" fontWeight="bold">
                      {task.toplamPuan || 0} Puan
                    </Typography>
                  </Box>
                </Box>

                {/* Gecikme Uyarısı */}
                {isTaskOverdue(task.hedefTarih) && task.durum === 'bekliyor' && (
                  <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                    <Typography variant="caption">⚠️ Bu görev gecikmiş!</Typography>
                  </Alert>
                )}
              </CardContent>

              <CardActions sx={{ px: { xs: 1.5, md: 2 }, pb: { xs: 1.5, md: 2 }, pt: 0 }}>
                <Button
                  fullWidth
                  variant={task.durum === 'bekliyor' ? 'contained' : 'outlined'}
                  size={isMobile ? 'medium' : 'large'}
                  startIcon={task.durum === 'bekliyor' ? <PlayArrowIcon /> : <InfoIcon />}
                  onClick={() => handleTaskClick(task)}
                  disabled={
                    task.durum !== 'bekliyor' &&
                    task.durum !== 'tamamlandi' &&
                    task.durum !== 'onaylandi'
                  }
                  sx={{
                    borderRadius: 2,
                    py: { xs: 1, md: 1.5 },
                    fontWeight: 'bold',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    minHeight: { xs: 40, md: 48 },
                  }}
                >
                  {task.durum === 'bekliyor' ? 'Görevi Başlat' : 'Detayları Görüntüle'}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* Görev Tamamlama Dialog - Mobile Optimized */}
      <Dialog
        open={taskDialog}
        onClose={handleTaskClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            height: isMobile ? '100vh' : 'auto',
            maxHeight: '100vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            py: { xs: 1, md: 3 },
            px: { xs: 1.5, md: 3 },
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: { xs: 0.5, md: 0 } }}
          >
            <AssignmentIcon sx={{ mr: 1, fontSize: { xs: 20, md: 32 } }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant={isMobile ? 'body1' : 'h5'} fontWeight="bold">
                {selectedTask?.checklist?.ad}
              </Typography>
              {selectedTask?.makina && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9, fontSize: { xs: '0.7rem', md: '0.875rem' } }}
                >
                  📍 {selectedTask.makina.makinaNo} - {selectedTask.makina.ad}
                </Typography>
              )}
            </Box>
          </Box>
          {selectedTask?.durum === 'bekliyor' && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                width: '100%',
                mt: { xs: 0.5, md: 0 },
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  İlerleme
                </Typography>
                <Typography
                  variant={isMobile ? 'caption' : 'h6'}
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                >
                  %{getCompletionPercentage()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  Puan
                </Typography>
                <Typography
                  variant={isMobile ? 'caption' : 'h6'}
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                >
                  {getTotalScore()} / {getMaxScore()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  Fotoğraf
                </Typography>
                <Typography
                  variant={isMobile ? 'caption' : 'h6'}
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                >
                  📸 {getCompletedItemsWithImages()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            overflowY: 'auto',
            height: isMobile ? 'calc(100vh - 120px)' : 'auto',
          }}
        >
          {selectedTask && (
            <Box>
              {/* İlerleme Çubuğu - Kompakt */}
              {selectedTask.durum === 'bekliyor' && (
                <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: 'grey.50' }}>
                  <LinearProgress
                    variant="determinate"
                    value={getCompletionPercentage()}
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      mb: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {taskData.maddeler.filter(m => m.cevap).length} / {taskData.maddeler.length}{' '}
                    madde • 📸 {getCompletedItemsWithImages()} fotoğraf
                  </Typography>
                </Box>
              )}

              {/* Checklist Maddeleri - Liste Formatı */}
              <Box sx={{ p: { xs: 1, md: 3 } }}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: { xs: 1, md: 2 },
                    px: { xs: 1, md: 0 },
                    fontWeight: 'bold',
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
                  Checklist Maddeleri ({taskData.maddeler.length})
                </Typography>

                <Stack spacing={isMobile ? 0.5 : 2}>
                  {taskData.maddeler.map((madde, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        borderRadius: 1,
                        border: madde.cevap ? '1px solid #4CAF50' : '1px solid #e0e0e0',
                        bgcolor: madde.cevap ? 'success.50' : 'white',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Mobile: Ultra Kompakt Single Row */}
                      {isMobile ? (
                        <Box sx={{ p: 1 }}>
                          {/* Üst Satır: Checkbox + Soru + Puan */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 0.5,
                            }}
                          >
                            <Checkbox
                              checked={madde.cevap}
                              onChange={e => handleMaddeChange(index, 'cevap', e.target.checked)}
                              disabled={selectedTask.durum !== 'bekliyor'}
                              size="small"
                              sx={{
                                p: 0.5,
                                mr: 1,
                                '& .MuiSvgIcon-root': { fontSize: 20 },
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                flex: 1,
                                fontSize: '0.875rem',
                                lineHeight: 1.2,
                                textDecoration: madde.cevap ? 'line-through' : 'none',
                                color: madde.cevap ? 'success.main' : 'text.primary',
                                mr: 1,
                              }}
                            >
                              {madde.soru}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                              }}
                            >
                              <StarIcon sx={{ color: 'gold', fontSize: 14, mr: 0.25 }} />
                              <Typography variant="caption" fontWeight="bold">
                                {madde.cevap ? madde.maxPuan : 0}/{madde.maxPuan}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Alt Satır: Foto + Yorum */}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              alignItems: 'center',
                            }}
                          >
                            {/* Fotoğraf */}
                            <Box sx={{ flexShrink: 0 }}>
                              {madde.resimUrl ? (
                                <Box sx={{ position: 'relative' }}>
                                  <CardMedia
                                    component="img"
                                    sx={{
                                      width: 40,
                                      height: 30,
                                      borderRadius: 0.5,
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                      border: '1px solid #4CAF50',
                                    }}
                                    image={madde.resimUrl}
                                    alt="📸"
                                    onClick={() => handleImagePreview(madde.resimUrl)}
                                  />
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: -2,
                                      right: -2,
                                    }}
                                  >
                                    {selectedTask.durum === 'bekliyor' && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleImageDelete(index)}
                                        sx={{
                                          bgcolor: 'rgba(244,67,54,0.9)',
                                          color: 'white',
                                          width: 16,
                                          height: 16,
                                          '&:hover': { bgcolor: 'rgba(244,67,54,1)' },
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 10 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                </Box>
                              ) : (
                                <Box>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    ref={el => (fileInputRefs.current[index] = el)}
                                    onChange={e => handleImageUpload(index, e)}
                                    disabled={selectedTask.durum !== 'bekliyor'}
                                  />
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => fileInputRefs.current[index]?.click()}
                                    disabled={selectedTask.durum !== 'bekliyor'}
                                    sx={{
                                      minWidth: 40,
                                      minHeight: 30,
                                      fontSize: '0.6rem',
                                      px: 0.5,
                                      py: 0.25,
                                      borderStyle: 'dashed',
                                    }}
                                  >
                                    📷
                                  </Button>
                                </Box>
                              )}
                            </Box>

                            {/* Yorum */}
                            <TextField
                              fullWidth
                              placeholder="Yorum..."
                              value={madde.yorum || ''}
                              onChange={e => handleMaddeChange(index, 'yorum', e.target.value)}
                              disabled={selectedTask.durum !== 'bekliyor'}
                              variant="outlined"
                              size="small"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: 32,
                                  fontSize: '0.75rem',
                                  borderRadius: 0.5,
                                },
                                '& .MuiOutlinedInput-input': {
                                  py: 0.5,
                                  px: 1,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      ) : (
                        /* Desktop: Orijinal Tasarım */
                        <Box sx={{ p: 2 }}>
                          {/* Madde Başlığı - Kompakt */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              mb: 1,
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={madde.cevap}
                                  onChange={e =>
                                    handleMaddeChange(index, 'cevap', e.target.checked)
                                  }
                                  disabled={selectedTask.durum !== 'bekliyor'}
                                  sx={{
                                    '& .MuiSvgIcon-root': { fontSize: 28 },
                                    mr: 1,
                                    mt: -0.5,
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                  sx={{
                                    textDecoration: madde.cevap ? 'line-through' : 'none',
                                    color: madde.cevap ? 'success.main' : 'text.primary',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {madde.soru}
                                </Typography>
                              }
                              sx={{ alignItems: 'flex-start', m: 0, flex: 1, mr: 1 }}
                            />
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption" fontWeight="bold">
                                {madde.cevap ? madde.maxPuan : 0}/{madde.maxPuan}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Fotoğraf ve Yorum - Desktop Grid */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'auto 1fr',
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            {/* Fotoğraf */}
                            <Box>
                              {madde.resimUrl ? (
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                  <CardMedia
                                    component="img"
                                    sx={{
                                      width: 120,
                                      height: 80,
                                      borderRadius: 1,
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                      border: '1px solid #e0e0e0',
                                    }}
                                    image={madde.resimUrl}
                                    alt="Fotoğraf"
                                    onClick={() => handleImagePreview(madde.resimUrl)}
                                  />
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 2,
                                      right: 2,
                                      display: 'flex',
                                      gap: 0.5,
                                    }}
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() => handleImagePreview(madde.resimUrl)}
                                      sx={{
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        width: 20,
                                        height: 20,
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                      }}
                                    >
                                      <ZoomInIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                    {selectedTask.durum === 'bekliyor' && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleImageDelete(index)}
                                        sx={{
                                          bgcolor: 'rgba(244,67,54,0.8)',
                                          color: 'white',
                                          width: 20,
                                          height: 20,
                                          '&:hover': { bgcolor: 'rgba(244,67,54,1)' },
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 12 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                </Box>
                              ) : (
                                <Box>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    ref={el => (fileInputRefs.current[index] = el)}
                                    onChange={e => handleImageUpload(index, e)}
                                    disabled={selectedTask.durum !== 'bekliyor'}
                                  />
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PhotoCameraIcon />}
                                    onClick={() => fileInputRefs.current[index]?.click()}
                                    disabled={selectedTask.durum !== 'bekliyor'}
                                    sx={{
                                      borderRadius: 1,
                                      borderStyle: 'dashed',
                                      minHeight: 40,
                                      fontSize: '0.75rem',
                                      px: 1,
                                    }}
                                  >
                                    Fotoğraf
                                  </Button>
                                </Box>
                              )}
                            </Box>

                            {/* Yorum */}
                            <Box>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Yorum ekleyin..."
                                value={madde.yorum || ''}
                                onChange={e => handleMaddeChange(index, 'yorum', e.target.value)}
                                disabled={selectedTask.durum !== 'bekliyor'}
                                variant="outlined"
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.5, md: 3 },
            bgcolor: 'grey.50',
            flexDirection: 'row',
            gap: 1,
            position: 'sticky',
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <Button
            onClick={handleTaskClose}
            size={isMobile ? 'medium' : 'large'}
            startIcon={<CancelIcon />}
            sx={{
              borderRadius: 2,
              minHeight: { xs: 44, md: 48 },
              flex: 1,
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {selectedTask?.durum === 'bekliyor' ? 'İptal' : 'Kapat'}
          </Button>
          {selectedTask?.durum === 'bekliyor' && (
            <Button
              variant="contained"
              onClick={handleTaskComplete}
              disabled={completing}
              size={isMobile ? 'medium' : 'large'}
              startIcon={completing ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{
                borderRadius: 2,
                minHeight: { xs: 44, md: 48 },
                flex: 2,
                fontSize: { xs: '0.875rem', md: '1rem' },
                background: completing
                  ? 'grey.400'
                  : 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  background: completing
                    ? 'grey.400'
                    : 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                },
                '&:disabled': {
                  background: 'grey.400',
                  color: 'white',
                },
              }}
            >
              {completing ? 'Tamamlanıyor...' : 'GÖREVİ TAMAMLA'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Resim Önizleme Dialog */}
      <Dialog
        open={imageDialog}
        onClose={() => setImageDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: { xs: 1, md: 2 },
          }}
        >
          <ImageIcon sx={{ mr: 1 }} />
          Fotoğraf Önizleme
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Önizleme"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: isMobile ? '100vh' : '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setImageDialog(false)}
            size={isMobile ? 'medium' : 'large'}
            sx={{ minHeight: { xs: 40, md: 48 } }}
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
