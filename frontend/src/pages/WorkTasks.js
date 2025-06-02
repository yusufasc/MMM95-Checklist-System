import React, { useState, useEffect, useCallback, useReducer } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
  Avatar,
  Chip,
  Dialog,
  DialogContent,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Slide,
  useTheme,
  useMediaQuery,
  Stack,
  Badge,
  IconButton,
  AppBar,
  Toolbar,
  Autocomplete,
} from '@mui/material';
import {
  Build as BuildIcon,
  Done as DoneIcon,
  Assignment as AssignmentIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
  Engineering as EngineeringIcon,
  Camera as CameraIcon,
  CheckBox as CheckBoxIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  TaskAlt as TaskAltIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { workTasksAPI, inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { tr } from 'date-fns/locale';

const WorkTasks = () => {
  const { hasModulePermission } = useAuth();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [kalips, setKalips] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState(null); // Devam eden görev ID'si
  const [showCompleted, setShowCompleted] = useState(false); // Tamamlanan görevleri göster
  const [completedTasks, setCompletedTasks] = useState([]); // Tamamlanan görevler
  const [selectedCompletedTask, setSelectedCompletedTask] = useState(null); // Seçilen tamamlanan görev
  const [openCompletedDialog, setOpenCompletedDialog] = useState(false); // Tamamlanan görev detay dialog'u

  // Form state
  const [formData, setFormData] = useState({
    makinaId: '',
    indirilenKalip: '',
    baglananHamade: '',
    makinaDurmaSaati: new Date(),
    yeniKalipAktifSaati: new Date(),
    bakimaGitsinMi: false,
    bakimSebebi: '',
    bakimResimUrl: '',
  });
  // Checklist items reducer
  const checklistItemsReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ITEMS':
        return action.payload;
      case 'TOGGLE_ITEM':
        return state.map((item, index) =>
          index === action.index ? { ...item, yapildi: !item.yapildi } : item,
        );
      case 'RESET':
        return [];
      default:
        return state;
    }
  };

  const [checklistItems, dispatchChecklistItems] = useReducer(checklistItemsReducer, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [checklistsRes, tasksRes, machinesRes, kalipsRes] = await Promise.all([
        workTasksAPI.getChecklists(),
        workTasksAPI.getMyTasks(),
        inventoryAPI.getMachinesForTasks(),
        inventoryAPI.getKalipsForTasks(),
      ]);

      setChecklists(checklistsRes.data);
      setMyTasks(tasksRes.data);
      setMachines(machinesRes.data);
      setKalips(kalipsRes.data);
    } catch (error) {
      showSnackbar(
        `Veriler yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const loadCompletedTasks = useCallback(async () => {
    try {
      setLoading(true);
      const completedRes = await workTasksAPI.getMyCompletedTasks();
      setCompletedTasks(completedRes.data);
    } catch (error) {
      showSnackbar(
        `Tamamlanan görevler yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (hasModulePermission('Yaptım')) {
      if (showCompleted) {
        loadCompletedTasks();
      } else {
        loadData();
      }
    }
  }, [hasModulePermission, loadData, loadCompletedTasks, showCompleted]);

  const handleChecklistClick = checklist => {
    setSelectedChecklist(checklist);
    setCurrentTaskId(null); // Yeni görev
    dispatchChecklistItems({
      type: 'SET_ITEMS',
      payload: checklist.maddeler.map(madde => ({
        maddeId: madde._id,
        soru: madde.soru,
        puan: madde.puan,
        yapildi: false,
      })),
    });
    setOpenDialog(true);
    setActiveStep(0);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Form validasyonu
      if (!formData.makinaId || !formData.indirilenKalip || !formData.baglananHamade) {
        showSnackbar('Lütfen makina ve kalıp seçimlerini yapın', 'warning');
        return;
      }
      if (formData.bakimaGitsinMi && !formData.bakimSebebi) {
        showSnackbar('Bakım sebebi girmelisiniz', 'warning');
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleItemCheck = index => {
    dispatchChecklistItems({
      type: 'TOGGLE_ITEM',
      index: index,
    });
  };

  const handleImageUpload = async event => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showSnackbar('Sadece resim dosyaları kabul edilir', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Dosya boyutu çok büyük (Max: 5MB)', 'error');
      return;
    }

    // Base64'e çevir
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        bakimResimUrl: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      // Tüm maddeler yapıldı mı kontrol et
      const incompleteTasks = checklistItems.filter(item => !item.yapildi);
      if (incompleteTasks.length > 0) {
        showSnackbar('Lütfen tüm maddeleri tamamlayın', 'warning');
        return;
      }

      let taskId;

      if (currentTaskId) {
        // Devam eden görev - sadece maddeleri güncelle
        taskId = currentTaskId;
      } else {
        // Yeni görev oluştur
        const workTaskData = {
          checklistId: selectedChecklist._id,
          ...formData,
        };

        const createRes = await workTasksAPI.create(workTaskData);
        taskId = createRes.data._id;
      }

      // Maddeleri güncelle
      await workTasksAPI.updateItems(taskId, checklistItems);

      // Görevi tamamla
      await workTasksAPI.complete(taskId);

      showSnackbar('İş görevi başarıyla tamamlandı ve puanlamaya gönderildi', 'success');
      setOpenDialog(false);
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Görev kaydedilirken hata oluştu', 'error');
    }
  };

  const calculateProgress = () => {
    if (checklistItems.length === 0) {
      return 0;
    }
    return (checklistItems.filter(item => item.yapildi).length / checklistItems.length) * 100;
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setActiveStep(0);
    setCurrentTaskId(null);
    setFormData({
      makinaId: '',
      indirilenKalip: '',
      baglananHamade: '',
      makinaDurmaSaati: new Date(),
      yeniKalipAktifSaati: new Date(),
      bakimaGitsinMi: false,
      bakimSebebi: '',
      bakimResimUrl: '',
    });
    dispatchChecklistItems({ type: 'RESET' });
  };

  const handleContinueTask = async task => {
    try {
      // Mevcut görevin detaylarını al
      const taskDetail = await workTasksAPI.getTask(task._id);

      // Checklist template'ini al
      const checklist = taskDetail.data.checklist;

      // Form verilerini doldur
      setFormData({
        makinaId: taskDetail.data.makina._id,
        indirilenKalip: taskDetail.data.indirilenKalip,
        baglananHamade: taskDetail.data.baglananHamade,
        makinaDurmaSaati: new Date(taskDetail.data.makinaDurmaSaati),
        yeniKalipAktifSaati: new Date(taskDetail.data.yeniKalipAktifSaati),
        bakimaGitsinMi: taskDetail.data.bakimaGitsinMi,
        bakimSebebi: taskDetail.data.bakimSebebi || '',
        bakimResimUrl: taskDetail.data.bakimResimUrl || '',
      });

      // Checklist'i set et
      setSelectedChecklist(checklist);

      // Mevcut maddeleri set et
      dispatchChecklistItems({
        type: 'SET_ITEMS',
        payload: taskDetail.data.maddeler.map(madde => ({
          maddeId: madde.maddeId,
          soru: madde.soru,
          puan: madde.puan,
          yapildi: madde.yapildi,
        })),
      });

      // Mevcut görev ID'sini set et
      setCurrentTaskId(task._id);

      // Dialog'u ikinci adımda aç (checklist maddeleri)
      setActiveStep(1);
      setOpenDialog(true);
    } catch {
      showSnackbar('Görev detayları yüklenirken hata oluştu', 'error');
    }
  };

  const handleCompletedTaskClick = async task => {
    try {
      // Tamamlanan görevin detaylarını al
      const taskDetail = await workTasksAPI.getTask(task._id);
      setSelectedCompletedTask(taskDetail.data);
      setOpenCompletedDialog(true);
    } catch {
      showSnackbar('Görev detayları yüklenirken hata oluştu', 'error');
    }
  };

  if (!hasModulePermission('Yaptım')) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Bu sayfaya erişim yetkiniz yok
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          mx: 2,
          color: 'white',
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: 'white' }} size={60} />
          <Typography variant="h6">İş görevleri yükleniyor...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: { xs: 2, md: 4 },
        mb: 4,
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Modern Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          p: { xs: 2, md: 4 },
          mb: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: "''",
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
            opacity: 0.1,
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: { xs: 56, md: 72 },
              height: { xs: 56, md: 72 },
              backdropFilter: 'blur(10px)',
            }}
          >
            <EngineeringIcon sx={{ fontSize: { xs: 32, md: 40 } }} />
          </Avatar>
          <Box flex={1}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h1"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              Yaptım
            </Typography>
            <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ opacity: 0.9, mb: 2 }}>
              {showCompleted
                ? 'Tamamladığınız işe bağlı checklistleri görüntüleyin'
                : 'İşe bağlı checklistleri doldur ve tamamla'}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              {!showCompleted && (
                <>
                  <Chip
                    icon={<AssignmentIcon />}
                    label={`${checklists.length} Checklist`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  {myTasks.length > 0 && (
                    <Chip
                      icon={<PendingIcon />}
                      label={`${myTasks.length} Devam Eden`}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  )}
                </>
              )}
              {showCompleted && (
                <Chip
                  icon={<DoneIcon />}
                  label={`${completedTasks.length} Tamamlanan`}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                  }}
                />
              )}
              <Button
                variant="contained"
                startIcon={showCompleted ? <AssignmentIcon /> : <DoneIcon />}
                onClick={() => setShowCompleted(!showCompleted)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                {showCompleted ? 'Checklistlere Dön' : 'Yaptıklarım'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Tamamlanan Görevler veya Aktif Görevler */}
      {showCompleted && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <DoneIcon color="success" />
            <Typography variant="h5" fontWeight="bold">
              Yaptıklarım
            </Typography>
            <Badge badgeContent={completedTasks.length} color="success" />
          </Stack>

          {completedTasks.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <DoneIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.disabled" gutterBottom>
                Henüz Tamamlanan Görev Yok
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tamamladığınız görevler burada görünecektir
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {completedTasks.map((task, _index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background:
                        task.durum === 'onaylandi'
                          ? 'linear-gradient(135deg, #e8f5e8 0%, #a5d6a7 100%)'
                          : task.durum === 'reddedildi'
                            ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                            : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleCompletedTaskClick(task)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" alignItems="flex-start" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor:
                              task.durum === 'onaylandi'
                                ? 'success.main'
                                : task.durum === 'reddedildi'
                                  ? 'error.main'
                                  : 'info.main',
                          }}
                        >
                          {task.durum === 'onaylandi' ? (
                            <DoneIcon />
                          ) : task.durum === 'reddedildi' ? (
                            <CloseIcon />
                          ) : (
                            <AccessTimeIcon />
                          )}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {task.checklist?.ad || 'Checklist'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Makina: {task.makina?.envanterKodu} - {task.makina?.ad}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Tamamlanma:{' '}
                            {new Date(task.tamamlanmaTarihi).toLocaleDateString('tr-TR')}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Chip
                              label={
                                task.durum === 'onaylandi'
                                  ? 'Onaylandı'
                                  : task.durum === 'reddedildi'
                                    ? 'Reddedildi'
                                    : 'Kontrol Bekliyor'
                              }
                              color={
                                task.durum === 'onaylandi'
                                  ? 'success'
                                  : task.durum === 'reddedildi'
                                    ? 'error'
                                    : 'warning'
                              }
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Chip
                              label={`${task.toplamPuan} Puan`}
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Stack>
                          {task.onaylayanKullanici && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, display: 'block' }}
                            >
                              Onaylayan: {task.onaylayanKullanici?.ad || 'Bilinmiyor'}{' '}
                              {task.onaylayanKullanici?.soyad || ''}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Devam Eden Görevler */}
      {!showCompleted && myTasks.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <PendingIcon color="warning" />
            <Typography variant="h5" fontWeight="bold">
              Devam Eden Görevlerim
            </Typography>
            <Badge badgeContent={myTasks.length} color="warning" />
          </Stack>
          <Grid container spacing={2}>
            {myTasks.map((task, _index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task._id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    },
                  }}
                  onClick={() => handleContinueTask(task)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <ScheduleIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {task.checklist?.ad || 'Checklist'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Makina: {task.makina?.envanterKodu} - {task.makina?.ad}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            icon={<AccessTimeIcon />}
                            label="Devam Ediyor"
                            color="warning"
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            sx={{
                              fontWeight: 'bold',
                              borderRadius: 2,
                              minHeight: 32,
                              px: 2,
                              pointerEvents: 'none', // Card'ın onClick'ini kullan
                            }}
                          >
                            Devam Et
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* İşe Bağlı Checklistler */}
      {!showCompleted && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <CheckBoxIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              İşe Bağlı Checklistler
            </Typography>
            <Badge badgeContent={checklists.length} color="primary" />
          </Stack>

          {checklists.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <AssignmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.disabled" gutterBottom>
                Henüz İşe Bağlı Checklist Yok
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Yönetici tarafından checklist tanımlandıktan sonra burada görünecektir
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {checklists.map((checklist, _index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={checklist._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 4,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: 'linear-gradient(135deg, #e8f5e8 0%, #a5d6a7 100%)',
                      minHeight: 200,
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleChecklistClick(checklist)}
                  >
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Stack spacing={2} height="100%">
                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                          <Avatar
                            sx={{
                              bgcolor: 'success.main',
                              width: 48,
                              height: 48,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                          >
                            <BuildIcon />
                          </Avatar>
                          <Box flex={1}>
                            <Typography
                              variant="h6"
                              component="div"
                              fontWeight="bold"
                              sx={{ mb: 1, lineHeight: 1.2 }}
                            >
                              {checklist?.ad || 'Checklist'}
                            </Typography>
                            {checklist?.hedefDepartman && (
                              <Typography variant="body2" color="text.secondary">
                                {checklist.hedefDepartman?.ad || 'Departman'}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={checklist.isTuru || 'Genel'}
                            size="small"
                            color="primary"
                            sx={{
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Chip
                            icon={<CheckBoxIcon />}
                            label={`${checklist.maddeler.length} Madde`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Stack>

                        <Box sx={{ mt: 'auto' }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrowIcon />}
                            sx={{
                              fontWeight: 'bold',
                              py: 1.5,
                              borderRadius: 3,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              minHeight: 44,
                              pointerEvents: 'none',
                              '&:hover': {
                                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                              },
                            }}
                          >
                            Başlat
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Modern İş Görevi Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            maxHeight: '95vh',
            margin: isMobile ? 0 : 2,
          },
        }}
        TransitionComponent={Slide}
        TransitionProps={{
          direction: 'up',
        }}
      >
        {/* Modern Dialog Header - Mobile App Bar */}
        {isMobile ? (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={handleDialogClose} sx={{ mr: 2 }}>
                <CloseIcon />
              </IconButton>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  {selectedChecklist?.ad}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Adım {activeStep + 1} / 2
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={activeStep === 0 ? 50 : 100}
                sx={{
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    borderRadius: 2,
                  },
                }}
              />
            </Toolbar>
          </AppBar>
        ) : (
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 3,
              position: 'relative',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={handleDialogClose} sx={{ color: 'white', mr: 1 }}>
                <CloseIcon />
              </IconButton>
              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedChecklist?.ad}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  İş görevi oluşturma süreci
                </Typography>
              </Box>
            </Stack>

            {/* Progress indicator */}
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={activeStep === 0 ? 50 : 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'rgba(255,255,255,0.8)',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          </Box>
        )}

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {/* Mobile Step Indicator */}
          {!isMobile && (
            <Box sx={{ p: 3, pb: 0 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                <Step>
                  <StepLabel>
                    <Typography variant="body1" fontWeight="medium">
                      Bilgileri Doldur
                    </Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel>
                    <Typography variant="body1" fontWeight="medium">
                      Checklist Maddeleri
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </Box>
          )}

          {/* Step Content */}
          <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 2, md: 2 } }}>
            {activeStep === 0 && (
              <Box>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        select
                        fullWidth
                        label="Makina Seçimi"
                        value={formData.makinaId}
                        onChange={e => handleFormChange('makinaId', e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            minHeight: 56, // Touch-friendly
                          },
                        }}
                      >
                        <option value="">Seçiniz</option>
                        {machines.map(machine => (
                          <option key={machine._id} value={machine._id}>
                            {machine.envanterKodu || machine.kod} - {machine.ad}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        fullWidth
                        options={kalips}
                        getOptionLabel={option => `${option.kod} - ${option.ad}`}
                        value={kalips.find(k => k._id === formData.indirilenKalip) || null}
                        onChange={(event, newValue) => {
                          handleFormChange('indirilenKalip', newValue ? newValue._id : '');
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label="İndirilen Kalıp"
                            placeholder="Kalıp ara ve seç..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                minHeight: 56,
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props}>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {option.kod} - {option.ad}
                              </Typography>
                              {option.uretilecekUrun && (
                                <Typography variant="body2" color="text.secondary">
                                  Ürün: {option.uretilecekUrun}
                                </Typography>
                              )}
                              {option.lokasyon && (
                                <Typography variant="caption" color="text.secondary">
                                  Lokasyon: {option.lokasyon}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                        filterOptions={(options, { inputValue }) => {
                          return options.filter(option =>
                            option.searchText.includes(inputValue.toLowerCase()),
                          );
                        }}
                        noOptionsText="Kalıp bulunamadı"
                        sx={{ mb: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        fullWidth
                        options={kalips}
                        getOptionLabel={option => `${option.kod} - ${option.ad}`}
                        value={kalips.find(k => k._id === formData.baglananHamade) || null}
                        onChange={(event, newValue) => {
                          handleFormChange('baglananHamade', newValue ? newValue._id : '');
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label="Bağlanan Hamade"
                            placeholder="Kalıp ara ve seç..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                minHeight: 56,
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props}>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {option.kod} - {option.ad}
                              </Typography>
                              {option.uretilecekUrun && (
                                <Typography variant="body2" color="text.secondary">
                                  Ürün: {option.uretilecekUrun}
                                </Typography>
                              )}
                              {option.lokasyon && (
                                <Typography variant="caption" color="text.secondary">
                                  Lokasyon: {option.lokasyon}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                        filterOptions={(options, { inputValue }) => {
                          return options.filter(option =>
                            option.searchText.includes(inputValue.toLowerCase()),
                          );
                        }}
                        noOptionsText="Kalıp bulunamadı"
                        sx={{ mb: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DateTimePicker
                        label="Makinayı Durdurma Saati"
                        value={formData.makinaDurmaSaati}
                        onChange={value => handleFormChange('makinaDurmaSaati', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                minHeight: 56,
                              },
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DateTimePicker
                        label="Yeni Kalıbı Aktif Etme Saati"
                        value={formData.yeniKalipAktifSaati}
                        onChange={value => handleFormChange('yeniKalipAktifSaati', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                minHeight: 56,
                              },
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Paper
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.bakimaGitsinMi}
                              onChange={e => handleFormChange('bakimaGitsinMi', e.target.checked)}
                              sx={{
                                '& .MuiSvgIcon-root': { fontSize: 32 }, // Touch-friendly
                                color: formData.bakimaGitsinMi ? 'warning.main' : 'action.disabled',
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                İndirilen kalıp bakıma gitsin mi?
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Kalıpla ilgili herhangi bir sorun varsa işaretleyin
                              </Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                    {formData.bakimaGitsinMi && (
                      <>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Bakım Sebebi"
                            placeholder="Kalıpla ilgili sorunu detaylı olarak açıklayın..."
                            value={formData.bakimSebebi}
                            onChange={e => handleFormChange('bakimSebebi', e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Paper
                            sx={{
                              p: 3,
                              borderRadius: 3,
                              bgcolor: 'background.default',
                              border: '2px dashed',
                              borderColor: 'divider',
                              textAlign: 'center',
                            }}
                          >
                            <input
                              accept="image/*"
                              capture="environment"
                              style={{ display: 'none' }}
                              id="bakım-resim"
                              type="file"
                              onChange={handleImageUpload}
                            />
                            <label htmlFor="bakım-resim">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CameraIcon />}
                                size="large"
                                sx={{
                                  minHeight: 56,
                                  borderRadius: 3,
                                  fontWeight: 'bold',
                                  px: 4,
                                  borderWidth: 2,
                                  '&:hover': {
                                    borderWidth: 2,
                                  },
                                }}
                              >
                                {formData.bakimResimUrl
                                  ? 'Fotoğrafı Değiştir'
                                  : 'Bakım Fotoğrafı Çek'}
                              </Button>
                            </label>
                            {formData.bakimResimUrl && (
                              <Box sx={{ mt: 3 }}>
                                <img
                                  src={formData.bakimResimUrl}
                                  alt="Bakım"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: 200,
                                    borderRadius: 12,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Fotoğraf başarıyla yüklendi
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </LocalizationProvider>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                {/* Progress Summary */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <TaskAltIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold" color="primary.dark">
                        Checklist Maddeleri
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Her maddeyi kontrol ettikten sonra işaretleyin
                      </Typography>
                    </Box>
                    <Chip
                      label={`${checklistItems.filter(i => i.yapildi).length}/${checklistItems.length}`}
                      color="primary"
                      sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                    />
                  </Stack>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress()}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    İlerleme: %{Math.round(calculateProgress())}
                  </Typography>
                </Paper>

                {/* Checklist Items */}
                <Box sx={{ maxHeight: { xs: '60vh', md: '50vh' }, overflow: 'auto' }}>
                  {checklistItems.map((item, index) => (
                    <Paper
                      key={`checklist-item-${item.maddeId}-${index}-${item.yapildi}`}
                      sx={{
                        mb: 2,
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        border: '1px solid',
                        borderColor: item.yapildi ? 'success.light' : 'divider',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box
                        onClick={() => handleItemCheck(index)}
                        sx={{
                          p: 3,
                          bgcolor: item.yapildi ? 'success.light' : 'background.paper',
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': {
                            bgcolor: item.yapildi ? 'success.main' : 'action.hover',
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="flex-start" spacing={3}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              border: '3px solid',
                              borderColor: item.yapildi ? 'success.main' : 'grey.400',
                              bgcolor: item.yapildi ? 'success.main' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {item.yapildi && (
                              <DoneIcon
                                sx={{
                                  color: 'white',
                                  fontSize: 28,
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </Box>
                          <Box flex={1}>
                            <Typography
                              variant="h6"
                              fontWeight="medium"
                              sx={{
                                color: item.yapildi ? 'success.dark' : 'text.primary',
                                textDecoration: item.yapildi ? 'line-through' : 'none',
                                mb: 1,
                              }}
                            >
                              {item.soru}
                            </Typography>
                            <Chip
                              label={`${item.puan} Puan`}
                              size="small"
                              color={item.yapildi ? 'success' : 'default'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {/* Total Score */}
                <Paper
                  sx={{
                    p: 3,
                    mt: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.dark">
                        Toplam Puan
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tamamlanan görevler
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="bold" color="primary.dark">
                      {checklistItems.filter(i => i.yapildi).reduce((sum, i) => sum + i.puan, 0)} /
                      {checklistItems.reduce((sum, i) => sum + i.puan, 0)}
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <Box
          sx={{
            p: 3,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Button
              onClick={handleDialogClose}
              size="large"
              startIcon={<CloseIcon />}
              sx={{
                minHeight: 48,
                px: 3,
                borderRadius: 3,
              }}
            >
              İptal
            </Button>

            <Stack direction="row" spacing={2}>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    minHeight: 48,
                    px: 3,
                    borderRadius: 3,
                  }}
                >
                  Geri
                </Button>
              )}

              {activeStep < 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="large"
                  endIcon={<PlayArrowIcon />}
                  sx={{
                    minHeight: 48,
                    px: 4,
                    fontWeight: 'bold',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  İleri
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  startIcon={<DoneIcon />}
                  size="large"
                  disabled={checklistItems.filter(i => i.yapildi).length === 0}
                  sx={{
                    minHeight: 48,
                    px: 4,
                    fontWeight: 'bold',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  Tamamla ve Gönder
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </Dialog>

      {/* Tamamlanan Görev Detay Dialog */}
      <Dialog
        open={openCompletedDialog}
        onClose={() => setOpenCompletedDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            maxHeight: '95vh',
            margin: isMobile ? 0 : 2,
          },
        }}
        TransitionComponent={Slide}
        TransitionProps={{
          direction: 'up',
        }}
      >
        {/* Dialog Header */}
        {isMobile ? (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              background:
                selectedCompletedTask?.durum === 'onaylandi'
                  ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                  : selectedCompletedTask?.durum === 'reddedildi'
                    ? 'linear-gradient(135deg, #f44336 0%, #e57373 100%)'
                    : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
            }}
          >
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpenCompletedDialog(false)}
                sx={{ mr: 2 }}
              >
                <CloseIcon />
              </IconButton>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  Görev Detayı
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedCompletedTask?.checklist?.ad}
                </Typography>
              </Box>
              <Chip
                label={
                  selectedCompletedTask?.durum === 'onaylandi'
                    ? 'Onaylandı'
                    : selectedCompletedTask?.durum === 'reddedildi'
                      ? 'Reddedildi'
                      : 'Kontrol Bekliyor'
                }
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Toolbar>
          </AppBar>
        ) : (
          <Box
            sx={{
              p: 3,
              background:
                selectedCompletedTask?.durum === 'onaylandi'
                  ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                  : selectedCompletedTask?.durum === 'reddedildi'
                    ? 'linear-gradient(135deg, #f44336 0%, #e57373 100%)'
                    : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: 56,
                  height: 56,
                }}
              >
                {selectedCompletedTask?.durum === 'onaylandi' ? (
                  <DoneIcon />
                ) : selectedCompletedTask?.durum === 'reddedildi' ? (
                  <CloseIcon />
                ) : (
                  <AccessTimeIcon />
                )}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedCompletedTask?.checklist?.ad}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Makina: {selectedCompletedTask?.makina?.envanterKodu} -{' '}
                  {selectedCompletedTask?.makina?.ad}
                </Typography>
              </Box>
              <Chip
                label={
                  selectedCompletedTask?.durum === 'onaylandi'
                    ? 'Onaylandı'
                    : selectedCompletedTask?.durum === 'reddedildi'
                      ? 'Reddedildi'
                      : 'Kontrol Bekliyor'
                }
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Stack>
          </Box>
        )}

        <DialogContent sx={{ p: 0 }}>
          {selectedCompletedTask && (
            <Box sx={{ p: 3 }}>
              {/* Görev Bilgileri */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Görev Bilgileri
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tamamlanma Tarihi
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date(selectedCompletedTask.tamamlanmaTarihi).toLocaleString('tr-TR')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Puan
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedCompletedTask.toplamPuan} Puan
                    </Typography>
                  </Grid>
                  {selectedCompletedTask.kontrolToplamPuani && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Kontrol Puanı
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedCompletedTask.kontrolToplamPuani} Puan
                      </Typography>
                    </Grid>
                  )}
                  {selectedCompletedTask.onaylayanKullanici && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Onaylayan
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedCompletedTask.onaylayanKullanici?.ad || 'Bilinmiyor'}{' '}
                        {selectedCompletedTask.onaylayanKullanici?.soyad || ''}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Checklist Maddeleri */}
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Checklist Maddeleri
                </Typography>
                <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                  {selectedCompletedTask.maddeler?.map((madde, index) => (
                    <Paper
                      key={`completed-item-${madde.maddeId}-${index}`}
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: madde.yapildi ? 'success.light' : 'error.light',
                        bgcolor: madde.yapildi ? 'success.light' : 'error.light',
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: madde.yapildi ? 'success.main' : 'error.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {madde.yapildi ? (
                              <DoneIcon sx={{ color: 'white', fontSize: 20 }} />
                            ) : (
                              <CloseIcon sx={{ color: 'white', fontSize: 20 }} />
                            )}
                          </Box>
                          <Box flex={1}>
                            <Typography
                              variant="body1"
                              fontWeight="medium"
                              sx={{
                                color: madde.yapildi ? 'success.dark' : 'error.dark',
                                mb: 1,
                              }}
                            >
                              {madde.soru}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={`${madde.puan} Puan`}
                                size="small"
                                color={madde.yapildi ? 'success' : 'error'}
                                sx={{ fontWeight: 'bold' }}
                              />
                              {madde.kontrolPuani && madde.kontrolPuani !== madde.puan && (
                                <Chip
                                  label={`Kontrol: ${madde.kontrolPuani} Puan`}
                                  size="small"
                                  color="warning"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              )}
                            </Stack>
                            {madde.kontrolYorumu && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Kontrol Yorumu: {madde.kontrolYorumu}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Paper>

              {/* Onay Notu */}
              {selectedCompletedTask.onayNotu && (
                <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: 'info.light' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="info.dark">
                    Onay Notu
                  </Typography>
                  <Typography variant="body1" color="info.dark">
                    {selectedCompletedTask.onayNotu}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        {/* Dialog Actions */}
        <Box
          sx={{
            p: 3,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => setOpenCompletedDialog(false)}
            variant="contained"
            size="large"
            startIcon={<CloseIcon />}
            sx={{
              minHeight: 48,
              px: 3,
              borderRadius: 3,
            }}
          >
            Kapat
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
};

export default WorkTasks;
