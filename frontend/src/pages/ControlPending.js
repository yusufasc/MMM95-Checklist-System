import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Paper,
  Avatar,
  Stack,
  LinearProgress,
  IconButton,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Build as BuildIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ThumbUp as ThumbUpIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { tasksAPI, workTasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ControlPending = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [controlData, setControlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [scoreDialog, setScoreDialog] = useState(false);
  const [needsMachineSelection, setNeedsMachineSelection] = useState(false);
  const [scoringData, setScoringData] = useState({ maddeler: [], kontrolNotu: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDialog, setImageDialog] = useState(false);
  const [showComments, setShowComments] = useState({});

  const { selectedMachines, hasChecklistPermission, refreshUserData } = useAuth();

  useEffect(() => {
    loadData();
  }, [selectedMachines]);

  const loadData = async () => {
    try {
      setLoading(true);

      const controlResponse = await tasksAPI.getControlPending();

      if (controlResponse.data.needsMachineSelection) {
        setNeedsMachineSelection(true);
        setControlData(null);
      } else {
        setNeedsMachineSelection(false);
        setControlData(controlResponse.data.groupedTasks || {});
      }
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScoreTask = task => {
    setSelectedTask(task);
    setScoringData({
      maddeler: task.maddeler.map(madde => ({
        ...madde,
        kontrolPuani:
          madde.kontrolPuani !== null && madde.kontrolPuani !== undefined
            ? madde.kontrolPuani
            : madde.maxPuan || madde.puan,
        kontrolYorumu: madde.kontrolYorumu || '',
        kontrolResimUrl: madde.kontrolResimUrl || '',
      })),
      kontrolNotu: '',
    });
    setScoreDialog(true);
  };

  const handleScoreClose = () => {
    setScoreDialog(false);
    setSelectedTask(null);
    setScoringData({ maddeler: [], kontrolNotu: '' });
    setImagePreview(null);
    setImageDialog(false);
    setShowComments({});
  };

  const handleMaddeScoreChange = (index, field, value) => {
    const newMaddeler = [...scoringData.maddeler];
    newMaddeler[index][field] = value;
    setScoringData({ ...scoringData, maddeler: newMaddeler });
  };

  const handleImagePreview = imageUrl => {
    setImagePreview(imageUrl);
    setImageDialog(true);
  };

  const handleScoreSubmit = async () => {
    try {
      // WorkTask mı yoksa Task mı kontrol et
      if (selectedTask.taskType === 'worktask') {
        await workTasksAPI.scoreItems(selectedTask._id, scoringData);
      } else {
        await tasksAPI.scoreItems(selectedTask._id, scoringData);
      }
      setSuccess('Puanlama başarıyla kaydedildi! 🎉');
      handleScoreClose();
      loadData();
    } catch (error) {
      setError(
        'Puanlama kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleApprove = async taskId => {
    try {
      // Task tipini bul
      const task = Object.values(controlData || {})
        .flatMap(machineData => machineData.tasks)
        .find(t => t._id === taskId);

      if (task?.taskType === 'worktask') {
        await workTasksAPI.approve(taskId, { onayNotu: 'Onaylandı' });
      } else {
        await tasksAPI.approve(taskId, { onayNotu: 'Onaylandı' });
      }
      setSuccess('Görev başarıyla onaylandı! ✅');
      loadData();
    } catch (error) {
      setError(
        'Onaylama sırasında hata oluştu: ' + (error.response?.data?.message || error.message),
      );
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'tamamlandi':
        return 'warning';
      case 'onaylandi':
        return 'success';
      case 'iadeEdildi':
      case 'reddedildi':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'tamamlandi':
        return 'Kontrol Bekliyor';
      case 'onaylandi':
        return 'Onaylandı';
      case 'iadeEdildi':
        return 'İade Edildi';
      case 'reddedildi':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'tamamlandi':
        return <ScheduleIcon />;
      case 'onaylandi':
        return <CheckCircleIcon />;
      case 'iadeEdildi':
      case 'reddedildi':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getTotalControlScore = () => {
    return scoringData.maddeler.reduce((total, madde) => total + (madde.kontrolPuani || 0), 0);
  };

  const getMaxControlScore = () => {
    return scoringData.maddeler.reduce((total, madde) => total + madde.maxPuan, 0);
  };

  const getScorePercentage = () => {
    const maxScore = getMaxControlScore();
    if (maxScore === 0) {
      return 0;
    }
    return Math.round((getTotalControlScore() / maxScore) * 100);
  };

  const getTaskImagesCount = task => {
    return task.maddeler.filter(madde => madde.resimUrl).length;
  };

  // Görevin sahibinin rolüne göre puanlama yetkisi kontrolü
  const canScoreTask = task => {
    if (!task?.kullanici?.roller || task.kullanici.roller.length === 0) {
      return false;
    }

    // Task sahibinin rollerinden herhangi birine puanlama yetkisi var mı?
    const result = task.kullanici.roller.some(role => {
      const hasPermission = hasChecklistPermission(role.ad, 'puanlayabilir');
      return hasPermission;
    });

    return result;
  };

  // Görevin sahibinin rolüne göre görme yetkisi kontrolü
  const canViewTask = task => {
    if (!task?.kullanici?.roller || task.kullanici.roller.length === 0) {
      return false;
    }

    // Task sahibinin rollerinden herhangi birine görme yetkisi var mı?
    return task.kullanici.roller.some(role => hasChecklistPermission(role.ad, 'gorebilir'));
  };

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
          Kontrol bekleyen görevler yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header - Kompakt */}
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 2 } }}>
          <Avatar
            sx={{
              bgcolor: 'warning.main',
              mr: { xs: 1.5, md: 2 },
              width: { xs: 40, md: 56 },
              height: { xs: 40, md: 56 },
            }}
          >
            <PendingActionsIcon fontSize={isMobile ? 'medium' : 'large'} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight="bold">
              Kontrol Bekleyenler
            </Typography>
            {!isMobile && (
              <Typography variant="subtitle1" color="text.secondary">
                Tamamlanan görevleri kontrol edin ve puanlayın
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={async () => {
              const result = await refreshUserData();
              if (result.success) {
                setSuccess('Kullanıcı verileri yenilendi! Sayfa yeniden yükleniyor...');
                setTimeout(() => window.location.reload(), 1000);
              } else {
                setError('Veriler yenilenemedi: ' + result.error);
              }
            }}
            sx={{
              borderRadius: 2,
              minHeight: 44,
            }}
          >
            🔄 Yetkileri Yenile
          </Button>
        </Box>
      </Box>

      {/* Alerts - Kompakt */}
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

      {/* Makina Seçimi Gerekli Uyarısı - Geliştirilmiş */}
      {selectedMachines.length === 0 && (
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            textAlign: 'center',
            mb: 2,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'warning.main',
            bgcolor: 'warning.50',
          }}
        >
          <BuildIcon sx={{ fontSize: { xs: 60, md: 100 }, color: 'warning.main', mb: 2 }} />
          <Typography
            variant={isMobile ? 'h6' : 'h4'}
            color="warning.dark"
            gutterBottom
            fontWeight="bold"
          >
            ⚠️ Makina Seçimi Gerekli
          </Typography>
          <Typography variant="body1" color="text.primary" sx={{ mb: 3, fontWeight: 'medium' }}>
            Usta'ların tamamladığı işe bağlı checklistleri görmek için önce kontrol ettiğiniz
            makinaları seçmeniz gerekiyor.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            • Sağ üstteki <strong>"Makina Seçimi"</strong> butonuna tıklayın
            <br />
            • Kontrol ettiğiniz makinaları seçin
            <br />• Seçtiğiniz makinalardaki tamamlanan görevler burada görünecektir
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<BuildIcon />}
            sx={{
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 3,
            }}
            onClick={() => {
              // Makina seçimi modal'ını açmak için event dispatch edebiliriz
              // Şimdilik kullanıcıyı yönlendirelim
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Makina Seçimi Yap
          </Button>
        </Paper>
      )}

      {/* Seçili Makinalar Bilgisi - Kompakt */}
      {selectedMachines.length > 0 && !needsMachineSelection && (
        <Paper sx={{ p: { xs: 1.5, md: 3 }, mb: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
          >
            <BuildIcon sx={{ mr: 1, fontSize: { xs: 16, md: 20 } }} />
            Kontrol Ettiğiniz Makinalar
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selectedMachines.map(machine => (
              <Chip
                key={machine._id}
                label={`${machine.makinaNo} - ${machine.ad}`}
                color="warning"
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                sx={{ mb: 0.5, fontWeight: 'bold', fontSize: { xs: '0.7rem', md: '0.875rem' } }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Debug Bilgileri - Geliştirme için */}
      {process.env.NODE_ENV === 'development' && controlData && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔍 Debug Bilgileri
          </Typography>
          <Typography variant="body2">Toplam makina: {Object.keys(controlData).length}</Typography>
          {Object.entries(controlData).map(([machineKey, machineData]) => (
            <Typography key={machineKey} variant="body2">
              {machineKey}: {machineData.tasks.length} görev (
              {machineData.tasks.filter(t => t.taskType === 'worktask').length} WorkTask)
            </Typography>
          ))}
        </Paper>
      )}

      {/* Makina Bazlı Görevler - Mobile Optimized */}
      {controlData && Object.keys(controlData).length > 0
        ? Object.entries(controlData).map(([machineKey, machineData]) => (
          <Accordion
            key={machineKey}
            sx={{
              mb: { xs: 1.5, md: 3 },
              borderRadius: { xs: 1, md: 3 },
              boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.1)',
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: { xs: '0 0 12px 0', md: '0 0 24px 0' },
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'primary.50',
                borderRadius: { xs: '4px 4px 0 0', md: '12px 12px 0 0' },
                minHeight: { xs: 56, md: 80 },
                px: { xs: 1.5, md: 2 },
                '&.Mui-expanded': {
                  minHeight: { xs: 56, md: 80 },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: { xs: 1.5, md: 3 },
                    width: { xs: 32, md: 56 },
                    height: { xs: 32, md: 56 },
                  }}
                >
                  <BuildIcon fontSize={isMobile ? 'small' : 'large'} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant={isMobile ? 'subtitle1' : 'h5'}
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1rem', md: '1.5rem' } }}
                  >
                    {machineData.machine
                      ? `${machineData.machine.makinaNo} - ${machineData.machine.ad}`
                      : machineKey}
                  </Typography>
                  <Stack
                    direction={isMobile ? 'column' : 'row'}
                    spacing={isMobile ? 0.5 : 1}
                    sx={{ mt: 0.5 }}
                  >
                    <Badge
                      badgeContent={
                        machineData.tasks.filter(t => t.durum === 'tamamlandi').length
                      }
                      color="warning"
                    >
                      <Chip
                        label={isMobile ? 'Bekliyor' : 'Kontrol Bekliyor'}
                        color="warning"
                        size="small"
                        icon={<ScheduleIcon />}
                        sx={{ fontSize: '0.7rem', height: 24 }}
                      />
                    </Badge>
                    <Badge
                      badgeContent={machineData.tasks.filter(t => t.durum === 'onaylandi').length}
                      color="success"
                    >
                      <Chip
                        label="Onaylandı"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                        sx={{ fontSize: '0.7rem', height: 24 }}
                      />
                    </Badge>
                    <Badge
                      badgeContent={
                        machineData.tasks.filter(t => t.durum === 'iadeEdildi').length
                      }
                      color="error"
                    >
                      <Chip
                        label={isMobile ? 'İade' : 'İade Edildi'}
                        color="error"
                        size="small"
                        icon={<WarningIcon />}
                        sx={{ fontSize: '0.7rem', height: 24 }}
                      />
                    </Badge>
                  </Stack>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 1, md: 3 } }}>
              {isMobile ? (
              /* Mobile: Stack Layout */
                <Stack spacing={1}>
                  {machineData.tasks.map(task => (
                    <Card
                      key={task._id}
                      sx={{
                        borderRadius: 1,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 1.5, pb: 1 }}>
                        {/* Başlık ve Durum - Mobile */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            sx={{ flex: 1, mr: 1, fontSize: '0.875rem', lineHeight: 1.2 }}
                          >
                            {task.checklist?.ad} {task.taskType === 'worktask' && '(İşe Bağlı)'}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(task.durum)}
                            label={getStatusText(task.durum)}
                            color={getStatusColor(task.durum)}
                            size="small"
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>

                        {/* Kullanıcı ve Tarih - Kompakt */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{ bgcolor: 'secondary.main', mr: 1, width: 20, height: 20 }}
                            >
                              <PersonIcon sx={{ fontSize: 12 }} />
                            </Avatar>
                            <Typography variant="caption" fontWeight="bold">
                              {task.kullanici?.ad} {task.kullanici?.soyad}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(task.tamamlanmaTarihi).toLocaleDateString('tr-TR')}
                          </Typography>
                        </Box>

                        {/* Puan ve Fotoğraf Bilgisi - Kompakt */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StarIcon sx={{ color: 'gold', fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" fontWeight="bold">
                              {task.toplamPuan || 0} Puan
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            📸 {getTaskImagesCount(task)} Fotoğraf
                          </Typography>
                        </Box>

                        {/* Progress Bar - Kompakt */}
                        {task.durum === 'tamamlandi' && (
                          <Box sx={{ mb: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.round(
                                (task.toplamPuan /
                                    (task.maddeler.reduce((total, m) => total + m.maxPuan, 0) ||
                                      1)) *
                                    100,
                              )}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              %
                              {Math.round(
                                (task.toplamPuan /
                                    (task.maddeler.reduce((total, m) => total + m.maxPuan, 0) ||
                                      1)) *
                                    100,
                              )}{' '}
                              Başarı
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                        {task.durum === 'tamamlandi' ? (
                          <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                            {canScoreTask(task) && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleScoreTask(task)}
                                sx={{
                                  flex: 1,
                                  fontSize: '0.75rem',
                                  minHeight: 32,
                                  borderRadius: 1,
                                }}
                              >
                                Puanla
                              </Button>
                            )}
                            {canScoreTask(task) && (
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                startIcon={<ThumbUpIcon />}
                                onClick={() => handleApprove(task._id)}
                                sx={{
                                  flex: 1,
                                  fontSize: '0.75rem',
                                  minHeight: 32,
                                  borderRadius: 1,
                                }}
                              >
                                Onayla
                              </Button>
                            )}
                            {!canScoreTask(task) && canViewTask(task) && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleScoreTask(task)}
                                fullWidth
                                sx={{
                                  fontSize: '0.75rem',
                                  minHeight: 32,
                                  borderRadius: 1,
                                }}
                              >
                                Detayları Gör
                              </Button>
                            )}
                          </Box>
                        ) : (
                          canViewTask(task) && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleScoreTask(task)}
                              fullWidth
                              sx={{
                                fontSize: '0.75rem',
                                minHeight: 32,
                                borderRadius: 1,
                              }}
                            >
                              Detayları Gör
                            </Button>
                          )
                        )}
                      </CardActions>
                    </Card>
                  ))}
                </Stack>
              ) : (
              /* Desktop: Grid Layout */
                <Grid container spacing={3}>
                  {machineData.tasks.map(task => (
                    <Grid item xs={12} md={6} lg={4} key={task._id}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          {/* Desktop içeriği burada kalacak - mevcut tasarım */}
                          {/* Başlık ve Durum */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 2,
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, mr: 1 }}>
                              {task.checklist?.ad} {task.taskType === 'worktask' && '(İşe Bağlı)'}
                            </Typography>
                            <Chip
                              icon={getStatusIcon(task.durum)}
                              label={getStatusText(task.durum)}
                              color={getStatusColor(task.durum)}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>

                          {/* Kullanıcı Bilgisi */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              sx={{ bgcolor: 'secondary.main', mr: 1, width: 32, height: 32 }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold">
                              {task.kullanici?.ad} {task.kullanici?.soyad}
                            </Typography>
                          </Box>

                          {/* Tarih Bilgisi */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Tamamlanma Tarihi
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {new Date(task.tamamlanmaTarihi).toLocaleDateString('tr-TR')} -{' '}
                              {new Date(task.tamamlanmaTarihi).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </CardContent>
                        {/* Desktop card actions burada devam edecek */}
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          {task.durum === 'tamamlandi' ? (
                            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                              {canScoreTask(task) && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleScoreTask(task)}
                                  sx={{
                                    flex: 1,
                                    borderRadius: 2,
                                  }}
                                >
                                  Puanla
                                </Button>
                              )}
                              {canScoreTask(task) && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="success"
                                  startIcon={<ThumbUpIcon />}
                                  onClick={() => handleApprove(task._id)}
                                  sx={{
                                    flex: 1,
                                    borderRadius: 2,
                                  }}
                                >
                                  Onayla
                                </Button>
                              )}
                              {!canScoreTask(task) && canViewTask(task) && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handleScoreTask(task)}
                                  fullWidth
                                  sx={{ borderRadius: 2 }}
                                >
                                  Detayları Gör
                                </Button>
                              )}
                            </Box>
                          ) : (
                            canViewTask(task) && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleScoreTask(task)}
                                fullWidth
                                sx={{ borderRadius: 2 }}
                              >
                                Detayları Gör
                              </Button>
                            )
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        ))
        : controlData && (
          <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 2 }}>
            <PendingActionsIcon
              sx={{ fontSize: { xs: 48, md: 80 }, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant={isMobile ? 'body1' : 'h5'} color="text.secondary" gutterBottom>
              Kontrol bekleyen görev bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tüm görevler kontrol edilmiş durumda.
            </Typography>
          </Paper>
        )}

      {/* Puanlama Dialog */}
      <Dialog
        open={scoreDialog}
        onClose={handleScoreClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, minHeight: '80vh' },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'warning.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            py: 3,
          }}
        >
          <StarIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              Görev Puanlama - {selectedTask?.checklist?.ad}
            </Typography>
            {selectedTask?.makina && (
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                📍 Makina: {selectedTask.makina.makinaNo} - {selectedTask.makina.ad}
              </Typography>
            )}
            {selectedTask && (
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                👤 Kullanıcı: {selectedTask.kullanici?.ad} {selectedTask.kullanici?.soyad}
              </Typography>
            )}
          </Box>
          {selectedTask?.durum === 'tamamlandi' && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" fontWeight="bold">
                %{getScorePercentage()} Performans
              </Typography>
              <Typography variant="body2">
                {getTotalControlScore()} / {getMaxControlScore()} Puan
              </Typography>
              <Typography variant="caption" display="block">
                📸 {getTaskImagesCount(selectedTask)} Fotoğraf
              </Typography>
            </Box>
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedTask && (
            <Box>
              {/* Kalıp Değişim Bilgileri - Kompakt Header */}
              {selectedTask.taskType === 'worktask' && (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: 'primary.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                  >
                    🔧 Kalıp Değişim Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                          Makina:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTask.makina?.envanterKodu} - {selectedTask.makina?.ad}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                          İndirilen Kalıp:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTask.indirilenKalip
                            ? typeof selectedTask.indirilenKalip === 'object'
                              ? `${selectedTask.indirilenKalip.envanterKodu} - ${selectedTask.indirilenKalip.ad}`
                              : selectedTask.indirilenKalip
                            : 'Belirtilmemiş'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                          Bağlanan Hamade:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTask.baglananHamade
                            ? typeof selectedTask.baglananHamade === 'object'
                              ? `${selectedTask.baglananHamade.envanterKodu} - ${selectedTask.baglananHamade.ad}`
                              : selectedTask.baglananHamade
                            : 'Belirtilmemiş'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
                          Durdurma Saati:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTask.makinaDurmaSaati
                            ? new Date(selectedTask.makinaDurmaSaati).toLocaleString('tr-TR')
                            : 'Belirtilmemiş'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
                          Aktif Etme Saati:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTask.yeniKalipAktifSaati
                            ? new Date(selectedTask.yeniKalipAktifSaati).toLocaleString('tr-TR')
                            : 'Belirtilmemiş'}
                        </Typography>
                      </Box>
                      {selectedTask.bakimaGitsinMi && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
                            Bakım Durumu:
                          </Typography>
                          <Chip label="Bakıma Gidecek" color="warning" size="small" />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                  {selectedTask.bakimSebebi && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bakım Sebebi:
                      </Typography>
                      <Typography variant="body1">{selectedTask.bakimSebebi}</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Performans Özeti - Kompakt */}
              <Box
                sx={{ p: 3, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {selectedTask.toplamPuan || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kullanıcı Puanı
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {getTotalControlScore()} / {getMaxControlScore()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kontrol Puanı
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        %{getScorePercentage()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Performans
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Checklist Maddeleri - Liste Formatında */}
              <Box sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
                >
                  📋 Checklist Maddeleri ({scoringData.maddeler.length})
                </Typography>

                <Stack spacing={1}>
                  {scoringData.maddeler.map((madde, index) => {
                    const isPuanlandi =
                      madde.kontrolPuani !== undefined &&
                      madde.kontrolPuani !== null &&
                      madde.kontrolPuani >= 0;
                    const showComment = showComments[index] || false;

                    return (
                      <Paper
                        key={index}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: isPuanlandi ? 'success.300' : 'divider',
                          bgcolor: isPuanlandi ? 'success.50' : 'background.paper',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* Kompakt Yatay Düzen */}
                        <Box sx={{ p: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            {/* Madde Numarası */}
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              color={isPuanlandi ? 'success' : 'primary'}
                              sx={{ fontWeight: 'bold', minWidth: 45 }}
                            />

                            {/* Soru Metni */}
                            <Typography
                              variant="body1"
                              fontWeight="medium"
                              sx={{
                                flex: 1,
                                mr: 2,
                                color: isPuanlandi ? 'success.dark' : 'text.primary',
                              }}
                            >
                              {madde.soru}
                            </Typography>

                            {/* Kullanıcı Cevabı */}
                            <Chip
                              label={madde.cevap ? 'Evet' : 'Hayır'}
                              color={madde.cevap ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 'bold', minWidth: 60 }}
                            />

                            {/* Kullanıcı Puanı */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ minWidth: 60 }}
                            >
                              {madde.cevap ? madde.maxPuan || madde.puan : 0}/
                              {madde.maxPuan || madde.puan}
                            </Typography>

                            {/* Kontrol Puanı Input */}
                            <TextField
                              type="number"
                              size="small"
                              label={`Puan (/${madde.maxPuan || madde.puan})`}
                              value={
                                madde.kontrolPuani !== null && madde.kontrolPuani !== undefined
                                  ? madde.kontrolPuani
                                  : ''
                              }
                              onChange={e => {
                                const inputValue = e.target.value;
                                if (inputValue === '') {
                                  handleMaddeScoreChange(index, 'kontrolPuani', null);
                                } else {
                                  const value = Math.min(
                                    Math.max(0, parseInt(inputValue) || 0),
                                    madde.maxPuan || madde.puan,
                                  );
                                  handleMaddeScoreChange(index, 'kontrolPuani', value);
                                }
                              }}
                              inputProps={{
                                min: 0,
                                max: madde.maxPuan || madde.puan,
                                style: { textAlign: 'center' },
                              }}
                              disabled={selectedTask.durum !== 'tamamlandi'}
                              sx={{
                                width: 100,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1,
                                },
                              }}
                            />

                            {/* Onay Butonu */}
                            <IconButton
                              color={isPuanlandi ? 'success' : 'primary'}
                              size="small"
                              disabled={
                                selectedTask.durum !== 'tamamlandi' ||
                                madde.kontrolPuani === null ||
                                madde.kontrolPuani === undefined
                              }
                              sx={{
                                bgcolor: isPuanlandi ? 'success.100' : 'primary.50',
                                '&:hover': {
                                  bgcolor: isPuanlandi ? 'success.200' : 'primary.100',
                                },
                                minWidth: 40,
                                minHeight: 40,
                              }}
                            >
                              {isPuanlandi ? '✅' : '⭐'}
                            </IconButton>

                            {/* Fotoğraf Gösterge */}
                            {madde.resimUrl && (
                              <IconButton
                                size="small"
                                onClick={() => handleImagePreview(madde.resimUrl)}
                                sx={{
                                  color: 'info.main',
                                  bgcolor: 'info.50',
                                  '&:hover': { bgcolor: 'info.100' },
                                }}
                              >
                                📸
                              </IconButton>
                            )}

                            {/* Yorum Butonu */}
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowComments(prev => ({ ...prev, [index]: !showComment }))
                              }
                              sx={{
                                color:
                                  showComment || madde.kontrolYorumu
                                    ? 'warning.main'
                                    : 'text.secondary',
                                bgcolor:
                                  showComment || madde.kontrolYorumu ? 'warning.50' : 'transparent',
                                '&:hover': { bgcolor: 'warning.100' },
                              }}
                            >
                              💬
                            </IconButton>
                          </Stack>

                          {/* Kullanıcı Yorumu (varsa) */}
                          {madde.yorum && (
                            <Box sx={{ mt: 1, ml: 7 }}>
                              <Typography variant="caption" color="text.secondary">
                                Kullanıcı yorumu:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  bgcolor: 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  fontStyle: 'italic',
                                  fontSize: '0.875rem',
                                }}
                              >
                                "{madde.yorum}"
                              </Typography>
                            </Box>
                          )}

                          {/* Kontrol Yorumu (açılır) */}
                          {showComment && (
                            <Box sx={{ mt: 1, ml: 7 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Kontrol Yorumu (opsiyonel)"
                                placeholder="Değerlendirme yorumu yazın..."
                                value={madde.kontrolYorumu || ''}
                                onChange={e =>
                                  handleMaddeScoreChange(index, 'kontrolYorumu', e.target.value)
                                }
                                disabled={selectedTask.durum !== 'tamamlandi'}
                                variant="outlined"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                    bgcolor: 'white',
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>

                {/* Genel Kontrol Notu - Kompakt */}
                <Paper
                  sx={{
                    p: 2,
                    mt: 3,
                    borderRadius: 2,
                    bgcolor: 'success.50',
                    border: '1px solid',
                    borderColor: 'success.200',
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                  >
                    📝 Genel Değerlendirme
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Genel Kontrol Notu"
                    placeholder="Bu görev hakkında genel değerlendirmenizi yazın..."
                    value={scoringData.kontrolNotu}
                    onChange={e => setScoringData({ ...scoringData, kontrolNotu: e.target.value })}
                    disabled={selectedTask.durum !== 'tamamlandi'}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            onClick={handleScoreClose}
            size="large"
            startIcon={<CancelIcon />}
            sx={{ borderRadius: 2 }}
          >
            {selectedTask?.durum === 'tamamlandi' ? 'İptal' : 'Kapat'}
          </Button>
          {selectedTask?.durum === 'tamamlandi' && (
            <Button
              variant="contained"
              onClick={handleScoreSubmit}
              size="large"
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                background: 'linear-gradient(45deg, #FF9800 30%, #FFA726 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                },
              }}
            >
              Puanlamayı Kaydet
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Resim Önizleme Dialog */}
      <Dialog open={imageDialog} onClose={() => setImageDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
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
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlPending;
