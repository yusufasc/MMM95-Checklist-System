import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  Chip,
  LinearProgress,
  Zoom,
  Grow,
  Container,
  Paper,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon,
  AccessTime as AccessTimeIcon,
  WorkspacePremium as WorkspacePremiumIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import CountUp from 'react-countup';
import { performanceAPI } from '../services/api';

// Özel styled component'lar
const LeaderCard = styled(Card)(({ theme, rank }) => ({
  background:
    rank === 1
      ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' // Altın
      : rank === 2
        ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' // Gümüş
        : rank === 3
          ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)' // Bronz
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Normal
  padding: theme.spacing(3),
  borderRadius: 16,
  boxShadow:
    rank <= 3 ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.1)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s',
  },
  '&:hover::before': {
    transform: 'translateX(100%)',
  },
}));

const ScoreChip = styled(Chip)(({ bgcolor }) => ({
  fontWeight: 'bold',
  fontSize: '0.9rem',
  padding: '4px 8px',
  borderRadius: 8,
  background: bgcolor,
  color: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  '& .MuiChip-label': {
    color: '#fff',
  },
  '& .MuiChip-icon': {
    color: '#fff',
  },
}));

const AnimatedAvatar = styled(Avatar)(() => ({
  width: 80,
  height: 80,
  border: '4px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  fontSize: '2rem',
  fontWeight: 'bold',
}));

const StyledLinearProgress = styled(LinearProgress)(() => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: 'rgba(255,255,255,0.3)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    background: 'linear-gradient(90deg, #00bcd4, #4caf50)',
  },
}));

// Puan renkleri
const scoreColors = {
  ik_sablon: '#FF6B6B', // Kırmızı - İK Şablon
  ik_devamsizlik: '#4ECDC4', // Turkuaz - İK Devamsızlık/Fazla Mesai
  kalite_kontrol: '#45B7D1', // Mavi - Kalite Kontrol
  checklist: '#96CEB4', // Yeşil - Checklist
  is_bagli: '#FECA57', // Sarı - İşe Bağlı Checklist
  kalip_degisim: '#9B59B6', // Mor - Kalıp Değişimi
};

// Rol ikonları
const roleIcons = {
  Paketlemeci: <InventoryIcon />,
  Orta: <BuildIcon />,
  Usta: <EngineeringIcon />,
  'Vardiya Amiri': <GroupsIcon />,
  'Kalite Kontrol': <CheckCircleIcon />,
  İK: <PsychologyIcon />,
};

const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [performanceData, setPerformanceData] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Gerçek zamanlı saat
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
    // Her 30 saniyede bir veriyi yenile
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await performanceAPI.getScores();
      setPerformanceData(response.data);
    } catch (err) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Performans verileri yükleme hatası:', err);
      }
      // Test verisi ekle
      const testData = {
        Admin: [
          {
            user: { _id: '1', ad: 'Ahmet', soyad: 'Yılmaz' },
            scores: {
              ik_sablon: 85,
              ik_devamsizlik: 92,
              kalite_kontrol: 78,
              checklist: 88,
              is_bagli: 95,
              kalip_degisim: 82,
            },
            totalScore: 520,
            rank: 1,
            trend: 'up',
            trendValue: 2,
          },
        ],
        Paketlemeci: [
          {
            user: { _id: '2', ad: 'Mehmet', soyad: 'Demir' },
            scores: {
              ik_sablon: 75,
              ik_devamsizlik: 88,
              kalite_kontrol: 85,
              checklist: 92,
              is_bagli: 78,
              kalip_degisim: 90,
            },
            totalScore: 508,
            rank: 1,
            trend: 'up',
            trendValue: 1,
          },
          {
            user: { _id: '3', ad: 'Fatma', soyad: 'Kaya' },
            scores: {
              ik_sablon: 80,
              ik_devamsizlik: 85,
              kalite_kontrol: 82,
              checklist: 89,
              is_bagli: 88,
              kalip_degisim: 76,
            },
            totalScore: 500,
            rank: 2,
            trend: 'down',
            trendValue: 1,
          },
        ],
      };
      setPerformanceData(testData);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboard = (roleData, roleName) => {
    if (!roleData || roleData.length === 0) {
      return null;
    }

    return (
      <Box key={roleName} sx={{ mb: 6 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            p: 2,
            background:
              'linear-gradient(90deg, rgba(103,58,183,0.1) 0%, rgba(63,81,181,0.1) 100%)',
            borderRadius: 2,
          }}
        >
          {roleIcons[roleName] || <GroupsIcon />}
          <Typography
            variant='h4'
            sx={{ ml: 2, fontWeight: 'bold', color: '#333' }}
          >
            {roleName} Liderlik Tablosu
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {roleData.slice(0, 10).map((data, index) => (
            <Grid item xs={12} key={data.user._id}>
              <Grow in timeout={1000 + index * 100}>
                <LeaderCard rank={data.rank}>
                  <Grid container alignItems='center' spacing={2}>
                    {/* Sıralama ve Avatar */}
                    <Grid item xs={12} md={3}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        {data.rank <= 3 && (
                          <Zoom in timeout={1500}>
                            <TrophyIcon
                              sx={{
                                fontSize:
                                  data.rank === 1
                                    ? 60
                                    : data.rank === 2
                                      ? 50
                                      : 40,
                                color: '#fff',
                                filter:
                                  'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                              }}
                            />
                          </Zoom>
                        )}
                        <AnimatedAvatar>
                          {data.user.ad?.charAt(0)}
                          {data.user.soyad?.charAt(0)}
                        </AnimatedAvatar>
                        <Box>
                          <Typography
                            variant='h5'
                            sx={{ color: '#fff', fontWeight: 'bold' }}
                          >
                            #{data.rank}
                          </Typography>
                          <Typography variant='h6' sx={{ color: '#fff' }}>
                            {data.user.ad} {data.user.soyad}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {data.trend === 'up' ? (
                              <TrendingUpIcon
                                sx={{ color: '#4caf50', fontSize: 20 }}
                              />
                            ) : (
                              <TrendingUpIcon
                                sx={{
                                  color: '#f44336',
                                  fontSize: 20,
                                  transform: 'rotate(180deg)',
                                }}
                              />
                            )}
                            <Typography
                              variant='caption'
                              sx={{ color: '#fff' }}
                            >
                              {data.trendValue} sıra
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Puan Detayları */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Tooltip title='İK Şablon Puanı'>
                          <ScoreChip
                            icon={<AssignmentIcon />}
                            label={`İK-Ş: ${data.scores.ik_sablon}`}
                            bgcolor={scoreColors.ik_sablon}
                          />
                        </Tooltip>
                        <Tooltip title='İK Devamsızlık/Fazla Mesai'>
                          <ScoreChip
                            icon={<AccessTimeIcon />}
                            label={`İK-D: ${data.scores.ik_devamsizlik}`}
                            bgcolor={scoreColors.ik_devamsizlik}
                          />
                        </Tooltip>
                        <Tooltip title='Kalite Kontrol Puanı'>
                          <ScoreChip
                            icon={<CheckCircleIcon />}
                            label={`KK: ${data.scores.kalite_kontrol}`}
                            bgcolor={scoreColors.kalite_kontrol}
                          />
                        </Tooltip>
                        <Tooltip title='Checklist Puanı'>
                          <ScoreChip
                            icon={<AssignmentIcon />}
                            label={`CL: ${data.scores.checklist}`}
                            bgcolor={scoreColors.checklist}
                          />
                        </Tooltip>
                        <Tooltip title='İşe Bağlı Checklist'>
                          <ScoreChip
                            icon={<BuildIcon />}
                            label={`İB: ${data.scores.is_bagli}`}
                            bgcolor={scoreColors.is_bagli}
                          />
                        </Tooltip>
                        <Tooltip title='Kalıp Değişimi Puanı'>
                          <ScoreChip
                            icon={<EngineeringIcon />}
                            label={`KD: ${data.scores.kalip_degisim}`}
                            bgcolor={scoreColors.kalip_degisim}
                          />
                        </Tooltip>
                      </Box>
                    </Grid>

                    {/* Toplam Puan */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant='h2'
                          sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}
                        >
                          <CountUp end={data.totalScore} duration={2} />
                        </Typography>
                        <Typography variant='h6' sx={{ color: '#fff' }}>
                          Toplam Puan
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 1,
                          }}
                        >
                          {data.rank === 1 && (
                            <FireIcon sx={{ color: '#fff', mr: 1 }} />
                          )}
                          {data.rank <= 3 && (
                            <Box sx={{ display: 'flex' }}>
                              {[...Array(4 - data.rank)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  sx={{ color: '#fff', fontSize: 20 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Progress Bar */}
                  <Box sx={{ mt: 2 }}>
                    <StyledLinearProgress
                      variant='determinate'
                      value={(data.totalScore / 600) * 100}
                    />
                  </Box>
                </LeaderCard>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <BoltIcon sx={{ fontSize: 80, color: '#fff', mb: 2 }} />
          <Typography variant='h4' sx={{ color: '#fff' }}>
            Performans Verileri Yükleniyor...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
        p: 3,
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(90deg, #FC466B 0%, #3F5EFB 100%)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <Grid container alignItems='center'>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WorkspacePremiumIcon sx={{ fontSize: 60, color: '#fff' }} />
              <Box>
                <Typography
                  variant='h2'
                  sx={{ color: '#fff', fontWeight: 'bold' }}
                >
                  MMM PERFORMANS YARIŞMASI
                </Typography>
                <Typography variant='h5' sx={{ color: '#fff', opacity: 0.9 }}>
                  Fabrikamızın Şampiyonları
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant='h4' sx={{ color: '#fff' }}>
                {currentTime.toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
              <Typography
                variant='h3'
                sx={{ color: '#fff', fontWeight: 'bold' }}
              >
                {currentTime.toLocaleTimeString('tr-TR')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Puan Açıklamaları */}
      <Paper sx={{ p: 2, mb: 4, backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <Typography variant='h6' gutterBottom sx={{ fontWeight: 'bold' }}>
          Puan Kategorileri
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(scoreColors).map(([key, color]) => (
            <Grid item xs={6} md={2} key={key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: color,
                    borderRadius: '50%',
                  }}
                />
                <Typography variant='body2'>
                  {key === 'ik_sablon' && 'İK Şablon'}
                  {key === 'ik_devamsizlik' && 'İK Devamsızlık'}
                  {key === 'kalite_kontrol' && 'Kalite Kontrol'}
                  {key === 'checklist' && 'Checklist'}
                  {key === 'is_bagli' && 'İşe Bağlı'}
                  {key === 'kalip_degisim' && 'Kalıp Değişimi'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Rol Tabları */}
      <Container maxWidth={false}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              '& .MuiTab-root': {
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 'bold',
              },
              '& .Mui-selected': {
                color: '#4caf50 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4caf50',
                height: 4,
              },
            }}
          >
            {Object.keys(performanceData).map(role => (
              <Tab
                key={role}
                label={role}
                icon={roleIcons[role] || <GroupsIcon />}
                iconPosition='start'
              />
            ))}
          </Tabs>
        </Box>

        {/* Seçili Rol Liderlik Tablosu */}
        {Object.keys(performanceData).map((role, index) => (
          <Box key={role} role='tabpanel' hidden={tabValue !== index}>
            {tabValue === index &&
              renderLeaderboard(performanceData[role], role)}
          </Box>
        ))}
      </Container>
    </Box>
  );
};

export default Performance;
