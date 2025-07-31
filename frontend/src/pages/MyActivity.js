import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  ListAlt as ChecklistIcon,
  EmojiEvents as RankingIcon,
  CardGiftcard as CardGiftcardIcon,
  Engineering as EngineIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import TaskDetailsModal from '../components/TaskDetailsModal';

// Custom hooks
import { useMyActivityData } from '../hooks/useMyActivityData';
import controlScoresAPI from '../services/controlScoresAPI';

// Components
import SummaryCards from '../components/MyActivity/SummaryCards';
import PerformanceChart from '../components/MyActivity/PerformanceChart';
import CategoryChart from '../components/MyActivity/CategoryChart';
import ActivityList from '../components/MyActivity/ActivityList';
import QualityScores from '../components/MyActivity/QualityScores';
import ControlPendingScores from '../components/MyActivity/ControlPendingScores';
import HRScores from '../components/MyActivity/HRScores';
import BonusScores from '../components/MyActivity/BonusScores';
import ScoreBreakdown from '../components/MyActivity/ScoreBreakdown';
import RankingBoard from '../components/MyActivity/RankingBoard';
import UserEquipment from '../components/common/UserEquipment';

const MyActivity = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: 'all',
    taskType: 'all',
  });

  // Kontrol puanları için state
  const [controlSummary, setControlSummary] = useState(null);

  // Snackbar state for UserEquipment
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const { user } = useAuth();

  // 🎯 Merkezi veri yönetimi
  const {
    loading,
    error,
    summary,
    dailyPerformance,
    activities,
    pagination,
    scoreDetails,
    monthlyTotals,
    qualityScores,
    qualityScoresLoading,
    hrScores,
    workTaskScores,
    bonusEvaluations,
    loadSummaryData,
    loadDetailedActivities,
    loadScoreDetails,
    loadScoreBreakdown,
    loadMonthlyTotals,
    loadQualityScores,
    loadHRScores,
    loadWorkTaskScores,
    loadBonusEvaluations,
  } = useMyActivityData();

  // Kontrol puanları yükleme fonksiyonu
  const loadControlScores = async () => {
    try {
      const summaryParams = {
        year: filters.year,
        month: filters.month,
      };
      const summaryRes = await controlScoresAPI.getSummary(summaryParams);
      setControlSummary(summaryRes);
    } catch (err) {
      console.error('❌ Kontrol puanları özeti yüklenirken hata:', err);
    }
  };

  // 🔢 ScoreBreakdown'dakiyle aynı puan hesaplaması
  const calculateDetailedScores = () => {
    // API response wrapper'ını handle et
    const monthlyData = monthlyTotals?.data || monthlyTotals;

    // Güvenli destructuring - backend'deki veri yapısına uygun
    const {
      ik = { toplam: 0 },
      kaliteKontrol = { toplamPuan: 0 },
      workTask = { toplamPuan: 0 },
      checklistSablonlari = { iseBagliGorevler: 0, rutinGorevler: 0 },
    } = monthlyData || {};

    // İK toplam puanını hrScores'dan hesapla (daha güvenilir)
    const ikToplamPuan =
      hrScores && hrScores.length > 0
        ? hrScores.reduce((sum, score) => {
            const puan =
              score.puan || score.toplamPuan || score.puanlar?.toplam || 0;
            return sum + puan;
          }, 0)
        : ik.toplam;

    // WorkTask toplam puanını workTaskScores'dan hesapla
    const workTaskToplamPuan =
      workTaskScores && workTaskScores.length > 0
        ? workTaskScores.reduce((sum, score) => {
            const puan =
              score.puan ||
              score.toplamPuan ||
              score.puanlar?.toplam ||
              score.puanlar?.alinan ||
              0;
            return sum + puan;
          }, 0)
        : workTask.toplamPuan || checklistSablonlari.iseBagliGorevler;

    // Kalite Kontrol toplam puanını hesapla
    const kaliteKontrolToplamPuan =
      qualityScores && qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => {
            const puan =
              score.puan || score.toplamPuan || score.puanlar?.toplam || 0;
            return sum + puan;
          }, 0)
        : kaliteKontrol.toplamPuan;

    // Bonus evaluations toplam puanını hesapla
    const bonusToplamPuan =
      bonusEvaluations && bonusEvaluations.length > 0
        ? bonusEvaluations.reduce((sum, bonus) => {
            return sum + (bonus.toplamPuan || 0);
          }, 0)
        : 0;

    // ✅ DÜZELTME: Checklist Şablonları puanını monthlyTotals'dan al
    // Backend'de doğru hesaplanan değeri kullan (ControlScore dahil)
    const checklistSablonlariPuani = checklistSablonlari?.rutinGorevler || 0;

    // Kontrol Puanları toplam puanını hesapla (ControlScore'dan)
    const kontrolKartiPuani = controlSummary?.genel?.toplamPuan || 0;

    // Toplam puanı hesapla
    const toplamPuan =
      ikToplamPuan +
      kaliteKontrolToplamPuan +
      workTaskToplamPuan +
      checklistSablonlariPuani + // ✅ Düzeltildi: scoreDetails'den geliyor
      kontrolKartiPuani +
      bonusToplamPuan;

    // Görev sayılarını hesapla
    const toplamGorevSayisi =
      (hrScores?.length || 0) +
      (qualityScores?.length || 0) +
      (workTaskScores?.length || 0) +
      (bonusEvaluations?.length || 0) +
      (scoreDetails?.checklist?.length || 0) + // ✅ Düzeltildi: scoreDetails'den
      (controlSummary?.genel?.kontrolSayisi || 0);

    return {
      ikToplamPuan,
      kaliteKontrolToplamPuan,
      workTaskToplamPuan,
      checklistSablonlariPuani, // ✅ Yeni field
      kontrolToplamPuan: kontrolKartiPuani,
      bonusToplamPuan,
      toplamPuan,
      toplamGorevSayisi,
      // Görev sayıları
      ikGorevSayisi: hrScores?.length || 0,
      kaliteKontrolGorevSayisi: qualityScores?.length || 0,
      workTaskGorevSayisi: workTaskScores?.length || 0,
      checklistGorevSayisi: scoreDetails?.checklist?.length || 0, // ✅ Düzeltildi
      kontrolGorevSayisi: controlSummary?.genel?.kontrolSayisi || 0,
      bonusGorevSayisi: bonusEvaluations?.length || 0,
    };
  };

  // Task details modal
  const [taskDetailsModal, setTaskDetailsModal] = useState({
    open: false,
    taskId: null,
  });

  // 🎯 TAB KONFİGÜRASYONU - SPAGETTİ KOD TEMİZLENDİ
  const tabs = [
    {
      id: 0,
      icon: <DashboardIcon />,
      label: 'Genel Bakış',
      color: '#4CAF50',
      loadAction: null, // Özet veriler ilk yüklemede yüklenir
    },
    {
      id: 1,
      icon: <TrendingUpIcon />,
      label: 'Detaylı Aktiviteler',
      color: '#2196F3',
      loadAction: () => loadDetailedActivities({ ...filters, type: 'monthly' }),
    },
    {
      id: 2,
      icon: <AssignmentIcon />,
      label: 'Genel Karnem',
      color: '#FF9800',
      loadAction: async () => {
        await loadScoreBreakdown({ ...filters, tip: 'all' });
        await loadMonthlyTotals(filters);
      },
    },
    {
      id: 3,
      icon: <ScienceIcon />,
      label: 'Kalite Kontrol Puanlarım',
      color: '#9C27B0',
      loadAction: () => loadQualityScores(filters),
    },
    {
      id: 4,
      icon: <PeopleIcon />,
      label: 'İK Puanlarım',
      color: '#F44336',
      loadAction: () => loadScoreDetails({ ...filters, tip: 'hr' }),
    },
    {
      id: 5,
      icon: <WorkIcon />,
      label: 'Görev Puanlarım',
      color: '#00BCD4',
      loadAction: () => loadScoreDetails({ ...filters, tip: 'worktask' }),
    },
    {
      id: 6,
      icon: <ChecklistIcon />,
      label: 'Checklist Şablonları',
      color: '#795548',
      loadAction: () => loadScoreDetails({ ...filters, tip: 'checklist' }),
    },
    {
      id: 7,
      icon: <AssignmentIcon />,
      label: 'Kontrol Puanlarım',
      color: '#673AB7',
      loadAction: () => loadScoreDetails({ ...filters, tip: 'control_score' }),
    },
    {
      id: 8,
      icon: <CardGiftcardIcon />,
      label: 'Bonus Puanlarım',
      color: '#E91E63',
      loadAction: () =>
        loadScoreDetails({ ...filters, tip: 'bonus_evaluation' }),
    },
    {
      id: 9,
      icon: <EngineIcon />,
      label: 'Ekipmanlarım',
      color: '#607D8B',
      loadAction: null, // UserEquipment kendi verilerini yükler
    },
    {
      id: 10,
      icon: <RankingIcon />,
      label: 'Sıralama',
      color: '#FF5722',
      loadAction: null, // RankingBoard kendi verilerini yükler
    },
  ];

  // 🚀 İlk yükleme - sadece özet veriler
  useEffect(() => {
    loadSummaryData();
    loadControlScores();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 🎯 TAB DEĞİŞİMİNDE VERİ YÜKLEME - TEMİZ MANTIK
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab?.loadAction) {
      console.log(`🔍 Tab ${activeTab} (${currentTab.label}) yükleniyor...`);
      currentTab.loadAction();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔄 FİLTRE DEĞİŞİMİNDE MEVCUT TAB'I YENİLE
  useEffect(() => {
    // Her filtre değişiminde kontrol puanlarını da yenile
    loadControlScores();

    if (activeTab > 0) {
      // İlk tab hariç (özet veriler)
      const currentTab = tabs.find(tab => tab.id === activeTab);
      if (currentTab?.loadAction) {
        console.log(
          `🔄 Tab ${activeTab} (${currentTab.label}) filtre değişimi nedeniyle yenileniyor...`,
        );
        currentTab.loadAction();
      }
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🎯 Genel Bakış için tüm score verilerini yükle
  useEffect(() => {
    if (activeTab === 0) {
      // İlk tab açıldığında tüm score verilerini yükle
      loadHRScores({
        month: filters.month,
        year: filters.year,
      });
      loadWorkTaskScores({
        month: filters.month,
        year: filters.year,
      });
      loadBonusEvaluations({
        month: filters.month,
        year: filters.year,
      });
      loadQualityScores(filters);
      loadMonthlyTotals(filters);
    }
  }, [activeTab, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Modal handlers
  const handleShowTaskDetails = taskId => {
    setTaskDetailsModal({
      open: true,
      taskId: taskId,
    });
  };

  const handleCloseTaskDetails = () => {
    setTaskDetailsModal({
      open: false,
      taskId: null,
    });
  };

  // 🎯 Segment'lere özel veri filtreleme - YENİ LOGIC
  const getSegmentData = segmentType => {
    switch (segmentType) {
      case 'quality_control':
        return scoreDetails.filter(s => s.tip === 'quality_control');
      case 'hr':
        return scoreDetails.filter(s => s.tip?.includes('hr_'));
      case 'worktask_only':
        // Sadece WorkTask görevleri (kendi yaptığı + buddy olduğu)
        return scoreDetails.filter(s => s.tip === 'worktask');
      case 'checklist_only':
        return scoreDetails.filter(s => s.tip === 'checklist');
      case 'control_scores':
        // Sadece ControlScore kayıtları (puanlama yapan için)
        return scoreDetails.filter(s => s.tip === 'control_score');
      case 'bonus_evaluation':
        return scoreDetails.filter(s => s.tip === 'bonus_evaluation');
      default:
        return scoreDetails;
    }
  };

  // Snackbar handler for UserEquipment
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading && activeTab === 0) {
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
          <Typography variant='h5'>Kişisel Performans Yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error}
        <Button
          onClick={() => window.location.reload()}
          sx={{ ml: 2 }}
          variant='outlined'
        >
          Yenile
        </Button>
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        {/* Modern Glassmorphism Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden',
            pt: 4,
            pb: 6,
          }}
        >
          {/* Animated Background Elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              '@keyframes float1': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-20px)' },
              },
              animation: 'float1 6s ease-in-out infinite',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              '@keyframes float2': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(20px)' },
              },
              animation: 'float2 8s ease-in-out infinite',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1, px: 3 }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Fade in timeout={1000}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          mr: 2,
                          background: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '2px solid rgba(255,255,255,0.3)',
                        }}
                      >
                        <DashboardIcon sx={{ fontSize: 30, color: 'white' }} />
                      </Avatar>
                      <Box>
                        <Typography
                          variant={isMobile ? 'h4' : 'h3'}
                          sx={{
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        >
                          Kişisel Performans
                        </Typography>
                        <Typography
                          variant='h6'
                          sx={{
                            opacity: 0.9,
                            color: 'white',
                            fontWeight: 300,
                          }}
                        >
                          {user?.ad} {user?.soyad} •{' '}
                          {user?.roller?.[0]?.ad || 'Kullanıcı'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Performance Stats */}
                    <Box
                      sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}
                    >
                      <Chip
                        icon={<AssignmentIcon />}
                        label={`${summary?.genelIstatistikler?.toplamGorevSayisi || 0} Görev`}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: 'bold',
                        }}
                      />
                      <Chip
                        icon={<StarIcon />}
                        label={`${summary?.genelIstatistikler?.toplamPuan || 0} Puan`}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: 'bold',
                        }}
                      />
                      <Chip
                        icon={<TrendingUpIcon />}
                        label={`${summary?.genelIstatistikler?.ortalamaPuan?.toFixed(1) || '0.0'} Ortalama`}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  </Box>
                </Fade>
              </Grid>

              <Grid item xs={12} md={4}>
                <Slide direction='left' in timeout={1200}>
                  <Card
                    sx={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 3,
                      color: 'white',
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography
                        variant='h6'
                        sx={{ mb: 1, fontWeight: 'bold' }}
                      >
                        Bu Ay Performansı
                      </Typography>
                      <Typography
                        variant='h3'
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {calculateDetailedScores().toplamPuan || 0}
                      </Typography>
                      <Typography variant='body2' sx={{ opacity: 0.8 }}>
                        {calculateDetailedScores().toplamGorevSayisi || 0}{' '}
                        görevden
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Modern Tab Navigation */}
        <Box sx={{ px: 3, mt: -3, position: 'relative', zIndex: 2 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Box sx={{ p: 2 }}>
              {/* Filter Controls */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', color: '#333' }}
                >
                  Performans Segmentleri
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title='Filtreleri Göster/Gizle'>
                    <IconButton
                      onClick={() => setShowFilters(!showFilters)}
                      sx={{
                        background: showFilters
                          ? 'primary.main'
                          : 'transparent',
                        color: showFilters ? 'white' : 'primary.main',
                        '&:hover': {
                          background: 'primary.main',
                          color: 'white',
                        },
                      }}
                    >
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title='Yenile'>
                    <IconButton
                      onClick={() => {
                        const currentTab = tabs.find(
                          tab => tab.id === activeTab,
                        );
                        if (currentTab?.loadAction) {
                          currentTab.loadAction();
                        }
                      }}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          background: 'primary.main',
                          color: 'white',
                        },
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Filter Panel */}
              <Slide direction='down' in={showFilters}>
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size='small'>
                        <InputLabel>Yıl</InputLabel>
                        <Select
                          value={filters.year}
                          label='Yıl'
                          onChange={e =>
                            handleFilterChange('year', e.target.value)
                          }
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <MenuItem key={year} value={year}>
                                {year}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size='small'>
                        <InputLabel>Ay</InputLabel>
                        <Select
                          value={filters.month}
                          label='Ay'
                          onChange={e =>
                            handleFilterChange('month', e.target.value)
                          }
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>
                              {new Date(
                                new Date().getFullYear(),
                                i,
                              ).toLocaleDateString('tr-TR', { month: 'long' })}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size='small'>
                        <InputLabel>Departman</InputLabel>
                        <Select
                          value={filters.department}
                          label='Departman'
                          onChange={e =>
                            handleFilterChange('department', e.target.value)
                          }
                        >
                          <MenuItem value='all'>Tümü</MenuItem>
                          <MenuItem value='uretim'>Üretim</MenuItem>
                          <MenuItem value='kalite'>Kalite</MenuItem>
                          <MenuItem value='ik'>İnsan Kaynakları</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size='small'>
                        <InputLabel>Görev Tipi</InputLabel>
                        <Select
                          value={filters.taskType}
                          label='Görev Tipi'
                          onChange={e =>
                            handleFilterChange('taskType', e.target.value)
                          }
                        >
                          <MenuItem value='all'>Tümü</MenuItem>
                          <MenuItem value='checklist'>Checklist</MenuItem>
                          <MenuItem value='worktask'>İşe Bağlı</MenuItem>
                          <MenuItem value='quality'>Kalite Kontrol</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Slide>

              {/* Modern Tabs */}
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant={isMobile ? 'scrollable' : 'fullWidth'}
                scrollButtons={isMobile ? 'auto' : false}
                sx={{
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background:
                      'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  },
                  '& .MuiTab-root': {
                    minHeight: 60,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#666',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#667eea',
                      background: 'rgba(102, 126, 234, 0.05)',
                    },
                    '&.Mui-selected': {
                      color: '#667eea',
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                  },
                }}
              >
                {tabs.map(tab => (
                  <Tab
                    key={tab.id}
                    icon={tab.icon}
                    label={isMobile ? '' : tab.label}
                    iconPosition='start'
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.2rem',
                        mr: isMobile ? 0 : 1,
                      },
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          </Card>
        </Box>

        {/* Tab Content - Modern Card Layout */}
        <Box sx={{ px: 3, mt: 3 }}>
          <Fade in timeout={500} key={activeTab}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                background: 'white',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {activeTab === 0 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <DashboardIcon sx={{ color: '#667eea' }} />
                      Genel Bakış
                    </Typography>

                    {/* Summary Cards */}
                    <Box sx={{ mb: 4 }}>
                      <SummaryCards
                        summary={summary}
                        detailedScores={calculateDetailedScores()}
                      />
                    </Box>

                    {/* Charts Grid */}
                    <Grid container spacing={3}>
                      <Grid item xs={12} lg={8}>
                        <Card
                          sx={{
                            height: '100%',
                            background:
                              'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            border: '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant='h6'
                              sx={{ mb: 2, fontWeight: 'bold' }}
                            >
                              <span role='img' aria-label='chart'>
                                📈
                              </span>{' '}
                              Günlük Performans Trendi
                            </Typography>
                            <PerformanceChart data={dailyPerformance} />
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} lg={4}>
                        <Card
                          sx={{
                            height: '100%',
                            background:
                              'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
                            border: '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant='h6'
                              sx={{ mb: 2, fontWeight: 'bold' }}
                            >
                              <span role='img' aria-label='target'>
                                🎯
                              </span>{' '}
                              Kategori Dağılımı
                            </Typography>
                            <CategoryChart data={summary} />
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <TrendingUpIcon sx={{ color: '#2196F3' }} />
                      Detaylı Aktiviteler
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
                        border: '1px solid rgba(33, 150, 243, 0.1)',
                      }}
                    >
                      <CardContent>
                        <ActivityList
                          activities={activities}
                          pagination={pagination}
                          onShowTaskDetails={handleShowTaskDetails}
                          loading={loading}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AssignmentIcon sx={{ color: '#FF9800' }} />
                      Genel Karnem
                    </Typography>

                    <ScoreBreakdown
                      scoreDetails={scoreDetails}
                      monthlyTotals={monthlyTotals}
                      hrScores={hrScores}
                      workTaskScores={workTaskScores}
                      bonusEvaluations={bonusEvaluations}
                      qualityScores={qualityScores}
                      controlSummary={controlSummary}
                      loading={loading}
                    />
                  </Box>
                )}

                {activeTab === 3 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <ScienceIcon sx={{ color: '#9C27B0' }} />
                      Kalite Kontrol Puanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)',
                        border: '1px solid rgba(156, 39, 176, 0.1)',
                      }}
                    >
                      <CardContent>
                        <QualityScores
                          qualityScores={qualityScores}
                          loading={qualityScoresLoading}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 4 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <PeopleIcon sx={{ color: '#F44336' }} />
                      İK Puanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
                        border: '1px solid rgba(244, 67, 54, 0.1)',
                      }}
                    >
                      <CardContent>
                        <HRScores data={getSegmentData('hr')} />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 5 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <WorkIcon sx={{ color: '#00BCD4' }} />
                      Görev Puanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #f0fdff 0%, #cdf4ff 100%)',
                        border: '1px solid rgba(0, 188, 212, 0.1)',
                      }}
                    >
                      <CardContent>
                        <ActivityList
                          activities={getSegmentData('worktask_only')}
                          onShowTaskDetails={handleShowTaskDetails}
                          loading={loading}
                          pagination={{ toplamSayfa: 1, mevcutSayfa: 1 }}
                          emptyMessage='Bu ay henüz görev puanınız bulunmuyor.'
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 6 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <ChecklistIcon sx={{ color: '#795548' }} />
                      Checklist Puanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                        border: '1px solid rgba(121, 85, 72, 0.1)',
                      }}
                    >
                      <CardContent>
                        <ActivityList
                          activities={getSegmentData('checklist_only')}
                          onShowTaskDetails={handleShowTaskDetails}
                          loading={loading}
                          pagination={{ toplamSayfa: 1, mevcutSayfa: 1 }}
                          emptyMessage='Bu ay henüz checklist puanınız bulunmuyor.'
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 7 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AssignmentIcon sx={{ color: '#673AB7' }} />
                      Kontrol Puanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                        border: '1px solid rgba(103, 58, 183, 0.1)',
                      }}
                    >
                      <CardContent>
                        <ControlPendingScores
                          data={getSegmentData('control_scores')}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 8 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CardGiftcardIcon sx={{ color: '#E91E63' }} />
                      Değerlendirme Puanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
                        border: '1px solid rgba(233, 30, 99, 0.1)',
                      }}
                    >
                      <CardContent>
                        <BonusScores
                          data={getSegmentData('bonus_evaluation')}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 9 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <EngineIcon sx={{ color: '#607D8B' }} />
                      Ekipmanlarım
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
                        border: '1px solid rgba(96, 125, 139, 0.1)',
                      }}
                    >
                      <CardContent>
                        <UserEquipment onShowSnackbar={showSnackbar} />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 10 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant='h5'
                      sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <RankingIcon sx={{ color: '#FF5722' }} />
                      Sıralama Tablosu
                    </Typography>

                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
                        border: '1px solid rgba(255, 87, 34, 0.1)',
                      }}
                    >
                      <CardContent>
                        <RankingBoard />
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Box>

        {/* Task Details Modal */}
        <TaskDetailsModal
          open={taskDetailsModal.open}
          taskId={taskDetailsModal.taskId}
          onClose={handleCloseTaskDetails}
        />

        {/* Snackbar for UserEquipment */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default MyActivity;
