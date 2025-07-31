import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useSnackbar } from '../contexts/SnackbarContext';
import { workTasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Components
import TaskCard from '../components/ControlPending/TaskCard';
import ScoreDialog from '../components/ControlPending/ScoreDialog';

// Hooks
import { useTaskScoring } from '../hooks/useTaskScoring';

const WorkTaskControl = () => {
  const { showSnackbar } = useSnackbar();
  const { hasModulePermission, selectedMachines, refreshUserData } = useAuth();

  // State management
  const [controlData, setControlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsMachineSelection, setNeedsMachineSelection] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Puanlanacak, 1: Puanlanmış

  // Load WorkTask control data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await workTasksAPI.getControlPending();

      if (response.data.needsMachineSelection) {
        setNeedsMachineSelection(true);
        setControlData(null);
      } else {
        setNeedsMachineSelection(false);
        setControlData(response.data.groupedTasks || {});
      }
    } catch (error) {
      setError(
        'İşe bağlı görevler yüklenirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Task scoring hook
  const {
    selectedTask,
    scoreDialog,
    scoringData,
    showComments,
    openScoreDialog,
    closeScoreDialog,
    updateMaddeScore,
    updateKontrolNotu,
    submitScore,
    toggleComments,
  } = useTaskScoring({
    onSuccess: message => {
      showSnackbar(message, 'success');
    },
    onError: message => showSnackbar(message, 'error'),
    onDataRefresh: loadData,
    onTabSwitch: setActiveTab,
  });

  // Access control
  const hasControlPermission = hasModulePermission('Kontrol Bekleyenler');

  // Tab değiştirme
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Görevleri tab'a göre filtrele
  const getFilteredControlData = React.useMemo(() => {
    if (!controlData) {
      return null;
    }

    const filteredData = {};

    Object.entries(controlData).forEach(([machineKey, machineData]) => {
      const filteredTasks = machineData.tasks.filter(task => {
        if (activeTab === 0) {
          // Puanlanacak görevler - sadece tamamlandı
          return task.durum === 'tamamlandi';
        } else {
          // Puanlanmış görevler - onaylandı ve reddedildi
          return ['onaylandi', 'reddedildi'].includes(task.durum);
        }
      });

      if (filteredTasks.length > 0) {
        filteredData[machineKey] = {
          ...machineData,
          tasks: filteredTasks,
        };
      }
    });

    return filteredData;
  }, [controlData, activeTab]);

  // Statistics
  const stats = React.useMemo(() => {
    if (!controlData) {
      return {
        total: 0,
        filtered: 0,
        tamamlandi: 0,
        onaylandi: 0,
        reddedildi: 0,
      };
    }

    const allTasks = Object.values(controlData).flatMap(
      machineData => machineData.tasks,
    );
    const filteredTasks = getFilteredControlData
      ? Object.values(getFilteredControlData).flatMap(
          machineData => machineData.tasks,
        )
      : [];

    return {
      total: allTasks.length,
      filtered: filteredTasks.length,
      tamamlandi: allTasks.filter(t => t.durum === 'tamamlandi').length,
      onaylandi: allTasks.filter(t => t.durum === 'onaylandi').length,
      reddedildi: allTasks.filter(t => t.durum === 'reddedildi').length,
    };
  }, [controlData, getFilteredControlData]);

  // Load data on component mount
  useEffect(() => {
    if (hasControlPermission) {
      loadData();
    }
  }, [hasControlPermission, selectedMachines, loadData]);

  // Access denied
  if (!hasControlPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          Bu sayfaya erişim yetkiniz bulunmuyor. Kontrol Bekleyenler modülü
          yetkisi gereklidir.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header & Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href='/dashboard'>
            <HomeIcon sx={{ mr: 0.5 }} fontSize='inherit' />
            Dashboard
          </Link>
          <Typography
            color='text.primary'
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <BuildIcon sx={{ mr: 0.5 }} fontSize='inherit' />
            Yaptım Kontrol
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BuildIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography
              variant='h4'
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              İşe Bağlı Görev Kontrolü
            </Typography>
            <Typography variant='subtitle1' color='text.secondary'>
              Kalıp değişim görevlerinin puanlanması ve onaylanması
            </Typography>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card
              sx={{
                bgcolor: 'info.50',
                borderLeft: 4,
                borderColor: 'info.main',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', color: 'info.main' }}
                >
                  {stats.total}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Toplam İşe Bağlı Görev
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              sx={{
                bgcolor: 'warning.50',
                borderLeft: 4,
                borderColor: 'warning.main',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', color: 'warning.main' }}
                >
                  {stats.tamamlandi}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Puanlama Bekliyor
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              sx={{
                bgcolor: 'success.50',
                borderLeft: 4,
                borderColor: 'success.main',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', color: 'success.main' }}
                >
                  {stats.onaylandi}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Onaylandı
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              sx={{
                bgcolor: 'error.50',
                borderLeft: 4,
                borderColor: 'error.main',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', color: 'error.main' }}
                >
                  {stats.reddedildi}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Reddedildi
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: activeTab === 0 ? 'warning.main' : 'success.main',
              },
              '& .MuiTabs-indicator': {
                backgroundColor:
                  activeTab === 0 ? 'warning.main' : 'success.main',
                height: 3,
              },
            }}
          >
            <Tab
              icon={<ScheduleIcon />}
              label={`Puanlanacak Görevler (${stats.tamamlandi})`}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'warning.50',
                },
              }}
            />
            <Tab
              icon={<CheckCircleIcon />}
              label={`Puanlanmış Görevler (${stats.onaylandi + stats.reddedildi})`}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'success.50',
                },
              }}
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>İşe bağlı görevler yükleniyor...</Typography>
          </Box>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Machine Selection Warning */}
      {needsMachineSelection && (
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
          <BuildIcon
            sx={{
              fontSize: { xs: 48, md: 64 },
              color: 'warning.main',
              mb: 2,
            }}
          />
          <Typography
            variant='h6'
            sx={{
              fontWeight: 'bold',
              mb: 1,
              color: 'warning.dark',
            }}
          >
            Makina Seçimi Gerekli
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
          >
            İşe bağlı görevleri görüntülemek için önce makina seçimi yapmanız
            gerekmektedir. Lütfen profil sayfanızdan sorumlu olduğunuz
            makinaları seçiniz.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant='contained'
              color='warning'
              size='small'
              onClick={async () => {
                const result = await refreshUserData();
                if (result.success) {
                  showSnackbar('Yetkileri yenilendi! ✅', 'success');
                  setTimeout(() => window.location.reload(), 1000);
                } else {
                  showSnackbar('Yenileme sırasında hata oluştu', 'error');
                }
              }}
              sx={{ borderRadius: 2, minHeight: 44 }}
            >
              <span role='img' aria-label='Yenile'>
                🔄
              </span>{' '}
              Yetkileri Yenile
            </Button>
            <Link href='/profile' style={{ textDecoration: 'none' }}>
              <Chip
                label={
                  <>
                    <span role='img' aria-label='Clipboard'>
                      📋
                    </span>{' '}
                    Profil Sayfası
                  </>
                }
                clickable
                color='warning'
                sx={{
                  py: 2,
                  px: 1,
                  fontSize: '0.9rem',
                  fontWeight: 'medium',
                }}
              />
            </Link>
            <Link href='/dashboard' style={{ textDecoration: 'none' }}>
              <Chip
                label={
                  <>
                    <span role='img' aria-label='Home'>
                      🏠
                    </span>{' '}
                    Dashboard
                  </>
                }
                clickable
                color='primary'
                variant='outlined'
                sx={{
                  py: 2,
                  px: 1,
                  fontSize: '0.9rem',
                  fontWeight: 'medium',
                }}
              />
            </Link>
          </Box>
        </Paper>
      )}

      {/* WorkTask Content */}
      {!loading && !error && !needsMachineSelection && controlData && (
        <>
          {/* Debug Info (Development Only) */}
          {typeof process !== 'undefined' &&
            process.env?.NODE_ENV === 'development' && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                <Typography variant='h6' gutterBottom>
                  <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Debug - İşe Bağlı Görev İstatistikleri
                </Typography>
                <Typography variant='body2'>
                  Toplam makina: {Object.keys(controlData).length} |
                  Filtrelenmiş makina:{' '}
                  {getFilteredControlData
                    ? Object.keys(getFilteredControlData).length
                    : 0}{' '}
                  | Aktif Tab: {activeTab === 0 ? 'Puanlanacak' : 'Puanlanmış'}
                </Typography>
                {Object.entries(controlData).map(
                  ([machineKey, machineData]) => (
                    <Typography key={machineKey} variant='body2'>
                      {machineKey}: {machineData.tasks.length} WorkTask
                    </Typography>
                  ),
                )}
              </Paper>
            )}

          {/* Tab Content */}
          <Box sx={{ mt: 2 }}>
            {/* Tab Header */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                bgcolor: activeTab === 0 ? 'warning.50' : 'success.50',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {activeTab === 0 ? (
                  <ScheduleIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                ) : (
                  <CheckCircleIcon
                    sx={{ color: 'success.main', fontSize: 28 }}
                  />
                )}
                <Box>
                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 'bold',
                      color: activeTab === 0 ? 'warning.dark' : 'success.dark',
                    }}
                  >
                    {activeTab === 0
                      ? 'Puanlanacak Görevler'
                      : 'Puanlanmış Görevler'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {activeTab === 0
                      ? 'Tamamlanmış ve puanlama bekleyen kalıp değişim görevleri'
                      : 'Puanlanmış ve onaylanmış/reddedilmiş kalıp değişim görevleri'}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={`${stats.filtered} Görev`}
                    color={activeTab === 0 ? 'warning' : 'success'}
                    variant='filled'
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Machine-based WorkTasks */}
            {!getFilteredControlData ||
            Object.keys(getFilteredControlData).length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                {activeTab === 0 ? (
                  <ScheduleIcon
                    sx={{ fontSize: 60, color: 'grey.400', mb: 2 }}
                  />
                ) : (
                  <CheckCircleIcon
                    sx={{ fontSize: 60, color: 'grey.400', mb: 2 }}
                  />
                )}
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  {activeTab === 0
                    ? 'Puanlanacak Görev Bulunmuyor'
                    : 'Puanlanmış Görev Bulunmuyor'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {activeTab === 0
                    ? 'Seçtiğiniz makinelerde puanlama bekleyen kalıp değişim görevi bulunamadı.'
                    : 'Seçtiğiniz makinelerde puanlanmış kalıp değişim görevi bulunamadı.'}
                </Typography>
              </Paper>
            ) : (
              Object.entries(getFilteredControlData).map(
                ([machineKey, machineData]) => (
                  <Paper key={machineKey} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    {/* Machine Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <BuildIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                          {machineData.machine?.ad || machineKey}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Typography variant='body2' color='text.secondary'>
                            Makina Kodu:{' '}
                            {machineData.machine?.envanterKodu || 'N/A'}
                          </Typography>
                          <Chip
                            label={`${machineData.tasks.length} ${activeTab === 0 ? 'Puanlanacak' : 'Puanlanmış'} Görev`}
                            size='small'
                            color={activeTab === 0 ? 'warning' : 'success'}
                            variant='outlined'
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* WorkTask Cards */}
                    <Grid container spacing={2}>
                      {machineData.tasks.map(task => (
                        <Grid item xs={12} md={6} lg={4} key={task._id}>
                          <TaskCard
                            task={task}
                            hasChecklistPermission={activeTab === 0} // Sadece puanlanacak görevlerde puanlama izni
                            onScoreTask={openScoreDialog}
                            isMobile={false}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                ),
              )
            )}
          </Box>
        </>
      )}

      {/* Task Scoring Dialog */}
      <ScoreDialog
        open={scoreDialog}
        selectedTask={selectedTask}
        scoringData={scoringData}
        showComments={showComments}
        onClose={closeScoreDialog}
        onScoreChange={updateMaddeScore}
        onImagePreview={url => window.open(url, '_blank')}
        onToggleComment={toggleComments}
        onScoringDataChange={updateKontrolNotu}
        onSubmit={submitScore}
      />
    </Box>
  );
};

export default WorkTaskControl;
