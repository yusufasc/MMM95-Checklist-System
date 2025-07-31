import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Avatar,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Pending as PendingIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Build as BuildIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * OrtaDashboard - Orta Seviye Kullanıcı Dashboard
 * Basit ve güvenilir - complex component'lar kullanmıyor
 */
const OrtaDashboard = () => {
  const { user, hasModulePermission } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    myTasks: [],
    controlPending: [],
    dailyScores: [],
    ranking: [],
    summary: null,
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [myTasksRes, controlRes, summaryRes, rankingRes] =
        await Promise.all([
          api.get('/tasks/my').catch(() => ({ data: [] })),
          api.get('/control-pending').catch(error => {
            console.error('Control-pending API hatası:', error);
            return { data: [] };
          }),
          api.myActivity.getSummary(30).catch(() => ({ data: null })),
          api.myActivity
            .getRanking(30)
            .catch(() => ({ data: { siralamalar: [] } })),
        ]);

      console.log('API Response - Control Pending:', controlRes.data);

      // Control-pending response format'ını handle et
      let controlPendingTasks = [];
      if (controlRes.data?.groupedTasks) {
        // Backend'den gelen grouped format'ını flat task array'e çevir
        Object.values(controlRes.data.groupedTasks).forEach(machineGroup => {
          if (machineGroup.tasks && Array.isArray(machineGroup.tasks)) {
            controlPendingTasks.push(...machineGroup.tasks);
          }
        });
      } else if (Array.isArray(controlRes.data)) {
        controlPendingTasks = controlRes.data;
      }

      setDashboardData({
        myTasks: Array.isArray(myTasksRes.data) ? myTasksRes.data : [],
        controlPending: controlPendingTasks,
        dailyScores: [],
        summary: summaryRes.data || null,
        ranking: Array.isArray(rankingRes.data?.siralamalar)
          ? rankingRes.data.siralamalar
          : [],
      });
    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error);
      setError('Dashboard verisi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Dashboard yetkisi kontrolü kaldırıldı - her rol kendi dashboard'una erişebilir

  if (loading) {
    return (
      <Container>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Dashboard yükleniyor...</Typography>
        </Box>
      </Container>
    );
  }

  const currentUserRanking = dashboardData.ranking.find(
    r => r.kullanici.isCurrentUser,
  );
  const topRankings = dashboardData.ranking.slice(0, 5);

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Orta Seviye Dashboard
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Hoş geldiniz {user?.ad} {user?.soyad} - Orta seviye yönetim paneli
        </Typography>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Özet Kartları */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography variant='h6' fontWeight='bold'>
                  {dashboardData.myTasks.length}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Aktif Görevlerim
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                  <PendingIcon />
                </Avatar>
                <Typography variant='h6' fontWeight='bold'>
                  {dashboardData.controlPending.length}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Kontrol Bekleyenler
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                  <TrophyIcon />
                </Avatar>
                <Typography variant='h6' fontWeight='bold'>
                  {currentUserRanking?.sira || '-'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Sıralamamda
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                  <StarIcon />
                </Avatar>
                <Typography variant='h6' fontWeight='bold'>
                  {dashboardData.summary?.genelIstatistikler?.toplamPuan || 0}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Toplam Puanım
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Görevlerim */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography
                  variant='h6'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AssignmentIcon color='primary' />
                  Aktif Görevlerim ({dashboardData.myTasks.length})
                </Typography>
                <Button
                  size='small'
                  onClick={() => navigate('/tasks')}
                  variant='outlined'
                >
                  Tümünü Gör
                </Button>
              </Box>

              {dashboardData.myTasks.length === 0 ? (
                <Alert severity='info'>
                  Şu anda aktif göreviniz bulunmamaktadır.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {dashboardData.myTasks.slice(0, 5).map((task, index) => (
                    <Card key={index} variant='outlined' sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {task.checklist?.ad || 'Görev'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {task.makina?.ad || 'Makina bilgisi yok'}
                          </Typography>
                        </Box>
                        <Chip
                          label={task.durum || 'Bekliyor'}
                          size='small'
                          color={
                            task.durum === 'tamamlandi' ? 'success' : 'warning'
                          }
                        />
                      </Box>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kontrol Bekleyenler - Sadece yetki varsa göster */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography
                  variant='h6'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PendingIcon color='warning' />
                  Kontrol Bekleyenler ({dashboardData.controlPending.length})
                </Typography>
                {hasModulePermission('Kontrol Bekleyenler') && (
                  <Button
                    size='small'
                    onClick={() => navigate('/control-pending')}
                    variant='outlined'
                  >
                    Kontrol Et
                  </Button>
                )}
              </Box>

              {!hasModulePermission('Kontrol Bekleyenler') ? (
                <Alert severity='info'>
                  Kontrol yetkisine sahip değilsiniz.
                </Alert>
              ) : dashboardData.controlPending.length === 0 ? (
                <Alert severity='success'>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  Tüm görevler kontrol edilmiş!
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {dashboardData.controlPending
                    .slice(0, 5)
                    .map((task, index) => (
                      <Card key={index} variant='outlined' sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box>
                            <Typography variant='subtitle2' fontWeight='bold'>
                              {task.kullanici?.ad} {task.kullanici?.soyad}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {task.checklist?.ad || 'Görev'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              label='Bekliyor'
                              size='small'
                              color='warning'
                            />
                            <Typography
                              variant='caption'
                              display='block'
                              color='text.secondary'
                            >
                              <AccessTimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                              {task.tamamlanmaTarihi
                                ? new Date(
                                    task.tamamlanmaTarihi,
                                  ).toLocaleDateString('tr-TR')
                                : 'Tarih yok'}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sıralama */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography
                  variant='h6'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TrophyIcon color='warning' />
                  Puan Sıralaması
                </Typography>
                <Button
                  size='small'
                  onClick={() => navigate('/my-activity')}
                  variant='outlined'
                >
                  Detaylar
                </Button>
              </Box>

              {topRankings.length === 0 ? (
                <Alert severity='info'>
                  Henüz sıralama verisi bulunmamaktadır.
                </Alert>
              ) : (
                <>
                  {/* Benim Durumum */}
                  {currentUserRanking && (
                    <Card
                      variant='outlined'
                      sx={{
                        mb: 2,
                        bgcolor: 'primary.50',
                        border: '2px solid',
                        borderColor: 'primary.main',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: 32,
                                height: 32,
                              }}
                            >
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {currentUserRanking.sira}
                              </Typography>
                            </Avatar>
                            <Box>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                Siz ({currentUserRanking.kullanici.ad})
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {currentUserRanking.toplamGorev} görev
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant='h6'
                              fontWeight='bold'
                              color='primary.main'
                            >
                              {currentUserRanking.toplamPuan}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              puan
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  <List dense>
                    {topRankings.slice(0, 3).map((ranking, index) => (
                      <React.Fragment key={ranking.kullanici.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  index < 3 ? 'warning.main' : 'grey.400',
                                color: 'white',
                                width: 32,
                                height: 32,
                              }}
                            >
                              <Typography variant='caption' fontWeight='bold'>
                                {ranking.sira}
                              </Typography>
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {ranking.kullanici.ad} {ranking.kullanici.soyad}
                              </Typography>
                            }
                            secondary={`${ranking.toplamGorev} görev`}
                          />
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {ranking.toplamPuan}
                          </Typography>
                        </ListItem>
                        {index < 2 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hızlı Erişim */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Hızlı Erişim
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    fullWidth
                    variant='outlined'
                    onClick={() => navigate('/tasks')}
                    sx={{ p: 2, flexDirection: 'column', height: 80 }}
                  >
                    <AssignmentIcon sx={{ mb: 1 }} />
                    <Typography variant='caption'>Görevlerim</Typography>
                  </Button>
                </Grid>

                {hasModulePermission('Kontrol Bekleyenler') && (
                  <Grid item xs={6} sm={4} md={3}>
                    <Button
                      fullWidth
                      variant='outlined'
                      onClick={() => navigate('/control-pending')}
                      sx={{ p: 2, flexDirection: 'column', height: 80 }}
                    >
                      <PendingIcon sx={{ mb: 1 }} />
                      <Typography variant='caption'>Kontrol Et</Typography>
                    </Button>
                  </Grid>
                )}

                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    fullWidth
                    variant='outlined'
                    onClick={() => navigate('/worktasks')}
                    sx={{ p: 2, flexDirection: 'column', height: 80 }}
                  >
                    <BuildIcon sx={{ mb: 1 }} />
                    <Typography variant='caption'>İş Görevleri</Typography>
                  </Button>
                </Grid>

                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    fullWidth
                    variant='outlined'
                    onClick={() => navigate('/my-activity')}
                    sx={{ p: 2, flexDirection: 'column', height: 80 }}
                  >
                    <TrendingUpIcon sx={{ mb: 1 }} />
                    <Typography variant='caption'>Performansım</Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrtaDashboard;
