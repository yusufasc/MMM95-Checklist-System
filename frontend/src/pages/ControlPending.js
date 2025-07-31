import React, { useState, useMemo, useCallback } from 'react';
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
  Paper,
  Avatar,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon,
  Build as BuildIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useControlPendingData } from '../hooks/useControlPendingData';
import { useControlPendingDialog } from '../hooks/useControlPendingDialog';
import { useControlPendingFilters } from '../hooks/useControlPendingFilters';
import MachineSection from '../components/ControlPending/MachineSection';
import ScoreDialog from '../components/ControlPending/ScoreDialog';
import FilterControls from '../components/ControlPending/FilterControls';

const ControlPending = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  const { selectedMachines, hasChecklistPermission, refreshUserData } =
    useAuth();

  // Debug selectedMachines - AGGRESSIVE LOGGING
  console.log('🚨 CONTROL PENDING COMPONENT ÇALIŞIYOR!');
  console.log(
    '🔍 ControlPending - selectedMachines:',
    selectedMachines?.length || 0,
  );
  console.log('🔍 ControlPending - selectedMachines detay:', selectedMachines);

  // Component render kontrolü
  console.log(
    '🔍 ControlPending - Component render oldu:',
    new Date().toLocaleTimeString(),
  );

  // Data management hook
  const {
    controlData,
    loading,
    error,
    success,
    needsMachineSelection,
    handleScoreSubmit,
    clearError,
    clearSuccess,
  } = useControlPendingData(selectedMachines);

  // Filtering and sorting hook
  const { filters, setFilters, filteredAndSortedData, stats } =
    useControlPendingFilters(controlData, activeTab);

  // Dialog management hook
  const {
    selectedTask,
    scoreDialog,
    scoringData,
    imagePreview,
    imageDialog,
    setScoringData,
    handleScoreTask,
    handleScoreClose,
    handleMaddeScoreChange,
    handleImagePreview,
  } = useControlPendingDialog();

  // Tab değiştiğinde filtreleri sıfırla
  const handleTabChange = useCallback(
    (event, newValue) => {
      setActiveTab(newValue);
      // Filtreleri sıfırla
      setFilters({
        sortBy: 'tamamlanmaTarihi',
        sortOrder: 'desc',
        durum: 'all',
        dateFrom: '',
        dateTo: '',
        searchText: '',
      });
    },
    [setFilters],
  );

  // Memoized calculations - used for future statistics display
  // eslint-disable-next-line no-unused-vars
  const _memoizedStats = useMemo(() => {
    if (!controlData) {
      return { total: 0, filtered: 0, machines: 0 };
    }

    const totalTasks = Object.values(controlData).reduce(
      (total, machineData) => total + machineData.tasks.length,
      0,
    );

    return {
      total: totalTasks,
      filtered: stats.filtered,
      machines: Object.keys(controlData).length,
    };
  }, [controlData, stats.filtered]);

  // Score submit handler
  const handleSubmitScore = useCallback(async () => {
    const result = await handleScoreSubmit(selectedTask, scoringData);
    if (result.success) {
      handleScoreClose();

      // Puanlama sonrası otomatik olarak "Onaylananlar" sekmesine geç
      if (result.switchToApprovedTab) {
        setTimeout(() => {
          setActiveTab(1);
        }, 1000);
      }
    }
  }, [handleScoreSubmit, selectedTask, scoringData, handleScoreClose]);

  if (loading) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress size={60} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Kontrol bekleyen görevler yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 2 } }}
        >
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
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component='h1'
              fontWeight='bold'
            >
              Kontrol Bekleyenler
            </Typography>
            {!isMobile && (
              <Typography variant='subtitle1' color='text.secondary'>
                Rutin checklistleri kontrol edin ve puanlayın
              </Typography>
            )}
          </Box>
          <Button
            variant='outlined'
            color='primary'
            size='small'
            onClick={async () => {
              const result = await refreshUserData();
              if (result.success) {
                clearError();
                setTimeout(() => window.location.reload(), 1000);
              } else {
                clearSuccess();
              }
            }}
            sx={{ borderRadius: 2, minHeight: 44 }}
          >
            <span role='img' aria-label='yenile'>
              🔄
            </span>{' '}
            Yetkileri Yenile
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity='error' sx={{ mb: 2, py: 1 }} onClose={clearError}>
          <Typography variant='body2'>{error}</Typography>
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 2, py: 1 }} onClose={clearSuccess}>
          <Typography variant='body2'>{success}</Typography>
        </Alert>
      )}

      {/* Machine Selection Warning */}
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
          <BuildIcon
            sx={{ fontSize: { xs: 60, md: 100 }, color: 'warning.main', mb: 2 }}
          />
          <Typography
            variant={isMobile ? 'h6' : 'h4'}
            color='warning.dark'
            gutterBottom
            fontWeight='bold'
          >
            <span role='img' aria-label='uyarı'>
              ⚠️
            </span>{' '}
            Makina Seçimi Gerekli
          </Typography>
          <Typography
            variant='body1'
            color='text.primary'
            sx={{ mb: 3, fontWeight: 'medium' }}
          >
            Tamamlanan rutin checklistleri görmek için önce kontrol ettiğiniz
            makinaları seçmeniz gerekiyor.
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            • Sağ üstteki <strong>"Makina Seçimi"</strong> butonuna tıklayın
            <br />
            • Kontrol ettiğiniz makinaları seçin
            <br />• Seçtiğiniz makinalardaki tamamlanan görevler burada
            görünecektir
          </Typography>
          <Button
            variant='contained'
            color='warning'
            size='large'
            startIcon={<BuildIcon />}
            sx={{ fontWeight: 'bold', px: 4, py: 1.5, borderRadius: 3 }}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Makina Seçimi Yap
          </Button>
        </Paper>
      )}

      {/* Selected Machines Info */}
      {selectedMachines.length > 0 && !needsMachineSelection && (
        <Paper
          sx={{
            p: { xs: 1.5, md: 3 },
            mb: 2,
            bgcolor: 'warning.50',
            borderRadius: 2,
          }}
        >
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
          >
            <BuildIcon sx={{ mr: 1, fontSize: { xs: 16, md: 20 } }} />
            Kontrol Ettiğiniz Makinalar
          </Typography>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {selectedMachines.map(machine => (
              <Chip
                key={machine._id}
                label={`${machine.makinaNo} - ${machine.ad}`}
                color='warning'
                variant='outlined'
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  mb: 0.5,
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', md: '0.875rem' },
                }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Tabs */}
      {controlData && Object.keys(controlData).length > 0 && (
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: { xs: 48, md: 64 },
                fontSize: { xs: '0.875rem', md: '1rem' },
                fontWeight: 'bold',
              },
            }}
          >
            <Tab
              label={
                <Badge
                  badgeContent={stats.tamamlandi}
                  color='warning'
                  max={999}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span role='img' aria-label='bekliyor'>
                      ⏳
                    </span>
                    {!isMobile && 'Puanlama Bekleyenler'}
                    {isMobile && 'Puanlama'}
                  </Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Badge
                  badgeContent={stats.onaylandi + stats.reddedildi}
                  color='success'
                  max={999}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span role='img' aria-label='tamamlandi'>
                      ✅
                    </span>
                    {!isMobile && 'Puanlanmış Görevler'}
                    {isMobile && 'Puanlanmış'}
                  </Box>
                </Badge>
              }
            />
          </Tabs>
        </Paper>
      )}

      {/* Filter Controls */}
      {controlData && Object.keys(controlData).length > 0 && (
        <FilterControls
          filters={filters}
          onFiltersChange={setFilters}
          totalTasks={stats.total}
          filteredTasks={stats.filtered}
          activeTab={activeTab}
        />
      )}

      {/* Debug Info */}
      {typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development' &&
        controlData && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', borderRadius: 2 }}>
            <Typography variant='h6' gutterBottom>
              <span role='img' aria-label='incele'>
                🔍
              </span>{' '}
              Debug Bilgileri & İstatistikler
            </Typography>
            <Typography variant='body2'>
              Toplam görev: {stats.total} | Filtrelenmiş: {stats.filtered}
            </Typography>
            <Typography variant='body2'>
              Bekliyor: {stats.tamamlandi} | Onaylandı: {stats.onaylandi} |
              Reddedildi: {stats.reddedildi}
            </Typography>
            <Typography variant='body2'>
              <span role='img' aria-label='hedef'>
                🎯
              </span>{' '}
              ControlData Keys: {Object.keys(controlData).join(', ')}
            </Typography>
            <Typography variant='body2'>
              <span role='img' aria-label='hedef'>
                🎯
              </span>{' '}
              FilteredAndSortedData Keys:{' '}
              {filteredAndSortedData
                ? Object.keys(filteredAndSortedData).join(', ')
                : 'null'}
            </Typography>
            {Object.entries(controlData).map(([machineKey, machineData]) => {
              const workTasks = machineData.tasks.filter(
                t => t.taskType === 'worktask',
              );
              const normalTasks = machineData.tasks.filter(
                t => t.taskType !== 'worktask',
              );
              return (
                <Typography key={machineKey} variant='body2'>
                  <span role='img' aria-label='arac'>
                    🔧
                  </span>{' '}
                  {machineKey}: {machineData.tasks.length} görev (
                  {normalTasks.length} Task + {workTasks.length} WorkTask)
                </Typography>
              );
            })}
            {filteredAndSortedData &&
              Object.entries(filteredAndSortedData).map(
                ([machineKey, machineData]) => {
                  return (
                    <Typography
                      key={`filtered-${machineKey}`}
                      variant='body2'
                      sx={{ color: 'primary.main' }}
                    >
                      <span role='img' aria-label='tamamlandi'>
                        ✅
                      </span>{' '}
                      Filtrelenmiş {machineKey}: {machineData.tasks.length}{' '}
                      görev
                    </Typography>
                  );
                },
              )}
          </Paper>
        )}

      {/* Machine-based Tasks */}
      {filteredAndSortedData && Object.keys(filteredAndSortedData).length > 0
        ? Object.entries(filteredAndSortedData)
            .filter(([, machineData]) => machineData.tasks.length > 0) // Sadece görev olan makinaları göster
            .map(([machineKey, machineData]) => (
              <MachineSection
                key={machineKey}
                machineKey={machineKey}
                machineData={machineData}
                hasChecklistPermission={hasChecklistPermission}
                onScoreTask={handleScoreTask}
                isMobile={isMobile}
              />
            ))
        : selectedMachines.length > 0 && (
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                textAlign: 'center',
                bgcolor:
                  stats.filtered === 0 && stats.total > 0
                    ? 'warning.50'
                    : 'success.50',
                borderRadius: 3,
              }}
            >
              <Typography variant='h6' gutterBottom>
                <span
                  role='img'
                  aria-label={
                    stats.filtered === 0 && stats.total > 0
                      ? 'filtre'
                      : 'başarılı'
                  }
                >
                  {stats.filtered === 0 && stats.total > 0 ? '🔍' : '✅'}
                </span>{' '}
                {stats.filtered === 0 && stats.total > 0
                  ? 'Filtrelere uygun görev bulunamadı'
                  : activeTab === 0
                    ? 'Puanlama bekleyen görev bulunmuyor'
                    : 'Puanlanmış görev bulunmuyor'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {stats.filtered === 0 && stats.total > 0
                  ? `Toplam ${stats.total} görev var ama filtrelere uygun görev bulunamadı. Filtreleri değiştirmeyi deneyin.`
                  : activeTab === 0
                    ? 'Tüm görevler kontrol edilmiş durumda.'
                    : 'Henüz onaylanmış görev bulunmuyor.'}
              </Typography>
            </Paper>
          )}

      {/* Score Dialog */}
      <ScoreDialog
        open={scoreDialog}
        selectedTask={selectedTask}
        scoringData={scoringData}
        onClose={handleScoreClose}
        onScoreChange={handleMaddeScoreChange}
        onImagePreview={handleImagePreview}
        onScoringDataChange={setScoringData}
        onSubmit={handleSubmitScore}
      />

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialog}
        onClose={() => handleImagePreview(null)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <ImageIcon sx={{ mr: 1 }} />
          Fotoğraf Önizleme
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt='Önizleme'
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
          <Button onClick={() => handleImagePreview(null)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default ControlPending;
