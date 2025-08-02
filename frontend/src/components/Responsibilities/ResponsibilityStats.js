import React, { memo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  TrendingUp as ProgressIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Work as InProgressIcon,
  ChangeCircle as PartialIcon,
} from '@mui/icons-material';

/**
 * ResponsibilityStats Component
 * Görev istatistiklerini gösteren kart bileşeni
 */
const ResponsibilityStats = memo(({ statistics }) => {
  const {
    toplam = 0,
    atandi = 0,
    devamEdiyor = 0,
    kismenTamamlandi = 0,
    tamamlandi = 0,
  } = statistics;

  // İlerleme hesaplama
  const completionRate = toplam > 0 ? Math.round((tamamlandi / toplam) * 100) : 0;
  const activeRate = toplam > 0 ? Math.round(((devamEdiyor + kismenTamamlandi) / toplam) * 100) : 0;

  // Stat kartları
  const statCards = [
    {
      title: 'Toplam Görev',
      value: toplam,
      icon: TaskIcon,
      color: 'primary',
      description: 'Size atanan tüm görevler',
    },
    {
      title: 'Bekleyen',
      value: atandi,
      icon: PendingIcon,
      color: 'info',
      description: 'Başlatılmamış görevler',
    },
    {
      title: 'Devam Eden',
      value: devamEdiyor,
      icon: InProgressIcon,
      color: 'warning',
      description: 'Üzerinde çalışılan görevler',
    },
    {
      title: 'Kısmen Tamamlanan',
      value: kismenTamamlandi,
      icon: PartialIcon,
      color: 'secondary',
      description: 'Yarı yarıya tamamlanan',
    },
    {
      title: 'Tamamlanan',
      value: tamamlandi,
      icon: CompleteIcon,
      color: 'success',
      description: 'Başarıyla tamamlanan',
    },
  ];

  return (
    <Box mb={3}>
      {/* Ana İstatistik Kartları */}
      <Grid container spacing={2} mb={2}>
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;

          return (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${stat.color}.light 0%, ${stat.color}.main 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
              >
                <CardContent sx={{ pb: '16px !important' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography
                        variant="h4"
                        component="div"
                        fontWeight="bold"
                        color="inherit"
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          opacity: 0.9,
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {stat.title}
                      </Typography>
                    </Box>
                    <IconComponent
                      sx={{
                        fontSize: 40,
                        opacity: 0.3,
                        position: 'absolute',
                        right: 16,
                        top: 16,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.8,
                      fontSize: '0.75rem',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* İlerleme Özeti */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CompleteIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Tamamlanma Oranı
                </Typography>
                <Chip
                  label={`%${completionRate}`}
                  color="success"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={completionRate}
                color="success"
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 1,
                  bgcolor: 'success.light',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  },
                }}
              />

              <Typography variant="body2" color="text.secondary">
                {tamamlandi} / {toplam} görev tamamlandı
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ProgressIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  Aktif Görevler
                </Typography>
                <Chip
                  label={`%${activeRate}`}
                  color="warning"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={activeRate}
                color="warning"
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 1,
                  bgcolor: 'warning.light',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  },
                }}
              />

              <Typography variant="body2" color="text.secondary">
                {devamEdiyor + kismenTamamlandi} / {toplam} görev üzerinde çalışılıyor
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});

ResponsibilityStats.displayName = 'ResponsibilityStats';

export default ResponsibilityStats;