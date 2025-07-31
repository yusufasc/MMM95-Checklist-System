import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Avatar,
  Box,
  Stack,
  LinearProgress,
  Badge,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  Visibility as VisibilityIcon,
  Engineering as EngineeringIcon,
  Group as GroupIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import {
  getStatusColor,
  getStatusText,
  getTaskImagesCount,
  canScoreTask,
  canViewTask,
  formatTaskDate,
  getTaskTypeText,
  getTaskTypeBadgeColor,
} from '../../utils/controlPendingHelpers';

const TaskCard = ({ task, hasChecklistPermission, onScoreTask, isMobile }) => {
  const imagesCount = getTaskImagesCount(task);
  const canScore = canScoreTask(task, hasChecklistPermission);
  const canView = canViewTask(task, hasChecklistPermission);

  if (!canView) {
    return null;
  }

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        },
        border: '1px solid',
        borderColor: task.durum === 'tamamlandi' ? 'warning.200' : 'grey.200',
        bgcolor: task.durum === 'tamamlandi' ? 'warning.50' : 'white',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {task.checklist?.ad || 'Görev'}
            </Typography>

            <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mb: 1 }}>
              <Chip
                label={getTaskTypeText(task.taskType)}
                color={getTaskTypeBadgeColor(task.taskType)}
                size='small'
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                label={getStatusText(task.durum)}
                color={getStatusColor(task.durum)}
                size='small'
              />
              {task.checklist?.kategori && (
                <Chip
                  label={task.checklist.kategori}
                  variant='outlined'
                  size='small'
                />
              )}
            </Stack>
          </Box>

          {/* Task Avatar */}
          <Avatar
            sx={{
              bgcolor:
                task.taskType === 'worktask'
                  ? 'primary.main'
                  : 'secondary.main',
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
            }}
          >
            {task.taskType === 'worktask' ? <BuildIcon /> : <CheckCircleIcon />}
          </Avatar>
        </Box>

        {/* Task Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            <PersonIcon
              sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
            />
            <strong>Yapan:</strong> {task.kullanici?.ad} {task.kullanici?.soyad}
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            <ScheduleIcon
              sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
            />
            <strong>Tamamlanma:</strong> {formatTaskDate(task.tamamlanmaTarihi)}
          </Typography>

          {task.makina && (
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              <BuildIcon
                sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
              />
              <strong>Makina:</strong> {task.makina.ad || task.makina.makinaNo}
            </Typography>
          )}

          {/* WorkTask özel bilgileri */}
          {task.taskType === 'worktask' && (
            <>
              {/* ✅ YENİ: Buddy Bilgisi */}
              {task.kalipDegisimBuddy && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  <GroupIcon
                    sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
                  />
                  <strong>Kalıp Değişim Buddy:</strong>{' '}
                  {task.kalipDegisimBuddy.ad} {task.kalipDegisimBuddy.soyad}
                </Typography>
              )}

              {/* ✅ YENİ: Makina Durdurma Saati */}
              {task.makinaDurmaSaati && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  <StopIcon
                    sx={{
                      fontSize: 16,
                      mr: 0.5,
                      verticalAlign: 'middle',
                      color: 'warning.main',
                    }}
                  />
                  <strong>Makina Durdurma:</strong>{' '}
                  {new Date(task.makinaDurmaSaati).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              )}

              {/* ✅ YENİ: Makina Başlatma Saati */}
              {task.yeniKalipAktifSaati && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  <PlayArrowIcon
                    sx={{
                      fontSize: 16,
                      mr: 0.5,
                      verticalAlign: 'middle',
                      color: 'success.main',
                    }}
                  />
                  <strong>Makina Başlatma:</strong>{' '}
                  {new Date(task.yeniKalipAktifSaati).toLocaleDateString(
                    'tr-TR',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </Typography>
              )}

              {/* ✅ YENİ: Değişim Süresi (eğer her iki saat de varsa) */}
              {task.makinaDurmaSaati && task.yeniKalipAktifSaati && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <span role='img' aria-label='timer'>
                    ⏱️
                  </span>
                  <Chip
                    label={(() => {
                      const durma = new Date(task.makinaDurmaSaati);
                      const baslama = new Date(task.yeniKalipAktifSaati);
                      const farkMs = baslama - durma;
                      const farkDakika = Math.round(farkMs / (1000 * 60));

                      if (farkDakika < 60) {
                        return `Değişim Süresi: ${farkDakika} dakika`;
                      } else {
                        const saat = Math.floor(farkDakika / 60);
                        const dakika = farkDakika % 60;
                        return `Değişim Süresi: ${saat}s ${dakika}dk`;
                      }
                    })()}
                    color={(() => {
                      const durma = new Date(task.makinaDurmaSaati);
                      const baslama = new Date(task.yeniKalipAktifSaati);
                      const farkDakika = Math.round(
                        (baslama - durma) / (1000 * 60),
                      );

                      if (farkDakika <= 60) {
                        return 'success';
                      }
                      if (farkDakika <= 120) {
                        return 'warning';
                      }
                      return 'error';
                    })()}
                    size='small'
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}

              {task.indirilenKalip && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  <span role='img' aria-label='down'>
                    🔽
                  </span>
                  <strong> İndirilen Kalıp:</strong>{' '}
                  {task.indirilenKalip.kod || task.indirilenKalip.envanterKodu}{' '}
                  - {task.indirilenKalip.ad}
                </Typography>
              )}
              {task.baglananHamade && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  <span role='img' aria-label='up'>
                    🔼
                  </span>
                  <strong> Bağlanan Kalıp:</strong>{' '}
                  {task.baglananHamade.kod || task.baglananHamade.envanterKodu}{' '}
                  - {task.baglananHamade.ad}
                </Typography>
              )}
              {task.bakimaGitsinMi && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <span role='img' aria-label='wrench'>
                    🔧
                  </span>
                  <Chip
                    label='İnen kalıp bakıma gönderildi'
                    color='error'
                    size='small'
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Score Progress */}
        {task.maddeler && task.maddeler.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='body2' fontWeight='bold'>
                Checklist İlerlemesi
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {task.maddeler.filter(m => m.tamamlandi).length} /{' '}
                {task.maddeler.length}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={
                (task.maddeler.filter(m => m.tamamlandi).length /
                  task.maddeler.length) *
                100
              }
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor:
                    task.durum === 'onaylandi'
                      ? 'success.main'
                      : 'warning.main',
                },
              }}
            />
          </Box>
        )}

        {/* Scores */}
        {(task.toplamPuan > 0 || task.kontrolToplamPuani > 0) && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {task.toplamPuan > 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  Kullanıcı Puanı
                </Typography>
                <Typography variant='h6' fontWeight='bold' color='primary.main'>
                  {task.toplamPuan}
                </Typography>
              </Box>
            )}
            {task.kontrolToplamPuani > 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  Kontrol Puanı
                </Typography>
                <Typography variant='h6' fontWeight='bold' color='success.main'>
                  {task.kontrolToplamPuani}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
          {/* Images Button */}
          {imagesCount > 0 && (
            <Badge badgeContent={imagesCount} color='primary'>
              <IconButton
                size='small'
                sx={{
                  color: 'info.main',
                  bgcolor: 'info.50',
                  '&:hover': { bgcolor: 'info.100' },
                }}
              >
                <EngineeringIcon />
              </IconButton>
            </Badge>
          )}

          {/* Action Buttons */}
          <Box sx={{ flexGrow: 1 }} />

          {canScore ? (
            <Button
              variant='contained'
              size='small'
              color='warning'
              startIcon={<VisibilityIcon />}
              onClick={() => onScoreTask(task)}
              sx={{ borderRadius: 1.5 }}
            >
              Puanla
            </Button>
          ) : (
            <Button
              variant='outlined'
              size='small'
              startIcon={<VisibilityIcon />}
              onClick={() => onScoreTask(task)}
              sx={{ borderRadius: 1.5 }}
            >
              Görüntüle
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>
  );
};

export default TaskCard;
