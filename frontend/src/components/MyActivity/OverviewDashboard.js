import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import CountUp from 'react-countup';

const OverviewDashboard = ({ summary, dailyPerformance }) => {
  if (!summary) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Veri yükleniyor...
        </Typography>
      </Box>
    );
  }

  const stats = summary.genelIstatistikler || {};
  const categories = summary.kategorilerePuanlar || {};

  // Performans kartları için veri
  const performanceCards = [
    {
      title: 'Toplam Görevler',
      value: stats.toplamGorevSayisi || 0,
      icon: <AssignmentIcon />,
      color: '#4CAF50',
      subtitle: 'Son 30 günde',
    },
    {
      title: 'Tamamlanan',
      value: stats.tamamlananGorevSayisi || 0,
      icon: <CheckCircleIcon />,
      color: '#2196F3',
      subtitle: `%${Math.round((stats.tamamlananGorevSayisi / stats.toplamGorevSayisi) * 100 || 0)} başarı`,
    },
    {
      title: 'Toplam Puan',
      value: stats.toplamPuan || 0,
      icon: <StarIcon />,
      color: '#FF9800',
      subtitle: `Günlük ort: ${stats.gunlukOrtalama || 0}`,
    },
    {
      title: 'Bekleyen',
      value: stats.bekleyenGorevSayisi || 0,
      icon: <ScheduleIcon />,
      color: '#F44336',
      subtitle: 'Değerlendirme bekliyor',
    },
  ];

  // Kategori dağılımı için pie chart verisi
  const categoryData = Object.entries(categories)
    .filter(([_, data]) => data.puan > 0)
    .map(([key, data]) => ({
      name: getCategoryName(key),
      value: data.puan,
      count: data.gorevSayisi,
    }));

  // Günlük performans verisi
  const chartData = (dailyPerformance || []).slice(-7).map(day => ({
    tarih: new Date(day.tarih).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
    }),
    puan: day.gunlukPuan || day.toplamPuan || 0,
    gorev: day.tamamlananGorev || day.gorevSayisi || 0,
  }));

  // Kategori bar chart verisi
  const categoryBarData = Object.entries(categories).map(([key, data]) => ({
    kategori: getCategoryName(key),
    puan: data.puan,
    gorev: data.gorevSayisi,
    ortalama: data.ortalama,
  }));

  const COLORS = [
    '#4CAF50',
    '#2196F3',
    '#FF9800',
    '#9C27B0',
    '#F44336',
    '#00BCD4',
  ];

  function getCategoryName(key) {
    const names = {
      checklist: 'Checklist',
      is_bagli: 'İşe Bağlı',
      kalite_kontrol: 'Kalite Kontrol',
      ik_sablon: 'İK Şablon',
      fazla_mesai: 'Mesai',
      ik_devamsizlik: 'Devamsızlık',
      kontrol_puanlari: 'Kontrol Puanları',
    };
    return names[key] || key;
  }

  function getCategoryIcon(key) {
    const icons = {
      checklist: <AssignmentIcon />,
      is_bagli: <WorkIcon />,
      kalite_kontrol: <ScienceIcon />,
      ik_sablon: <PeopleIcon />,
      fazla_mesai: <TrendingUpIcon />,
      ik_devamsizlik: <ScheduleIcon />,
      kontrol_puanlari: <StarIcon />,
    };
    return icons[key] || <AssignmentIcon />;
  }

  return (
    <Box>
      {/* Performans Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {performanceCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                border: `1px solid ${card.color}30`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${card.color}25`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: card.color, mr: 2 }}>
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant='h4'
                      sx={{ fontWeight: 'bold', color: card.color }}
                    >
                      <CountUp end={card.value} duration={1.5} />
                    </Typography>
                  </Box>
                </Box>
                <Typography variant='h6' sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sol Kolon */}
        <Grid item xs={12} lg={8}>
          {/* Günlük Performans Grafiği */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <TrendingUpIcon sx={{ mr: 1, color: '#2196F3' }} />
                Son 7 Günlük Performans
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='tarih' />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === 'puan' ? 'Puan' : 'Görev Sayısı',
                      ]}
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='puan'
                      stroke='#2196F3'
                      strokeWidth={3}
                      name='Puan'
                      dot={{ fill: '#2196F3', strokeWidth: 2, r: 5 }}
                    />
                    <Line
                      type='monotone'
                      dataKey='gorev'
                      stroke='#4CAF50'
                      strokeWidth={3}
                      name='Görev Sayısı'
                      dot={{ fill: '#4CAF50', strokeWidth: 2, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Kategori Performansı */}
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <StarIcon sx={{ mr: 1, color: '#FF9800' }} />
                Kategori Bazlı Performans
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={categoryBarData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='kategori'
                      angle={-45}
                      textAnchor='end'
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='puan' fill='#2196F3' name='Puan' />
                    <Bar dataKey='gorev' fill='#4CAF50' name='Görev Sayısı' />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ Kolon */}
        <Grid item xs={12} lg={4}>
          {/* Puan Dağılımı */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <StarIcon sx={{ mr: 1, color: '#9C27B0' }} />
                Puan Dağılımı
              </Typography>
              {categoryData.length > 0 ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx='50%'
                        cy='50%'
                        outerRadius={80}
                        dataKey='value'
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => [value, 'Puan']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  Henüz puan verisi bulunmuyor
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Kategori Detayları */}
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <AssignmentIcon sx={{ mr: 1, color: '#4CAF50' }} />
                Kategori Detayları
              </Typography>
              <List>
                {Object.entries(categories).map(([key, data], index) => (
                  <React.Fragment key={key}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                          {getCategoryIcon(key)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant='subtitle1'>
                              {getCategoryName(key)}
                            </Typography>
                            <Chip
                              label={`${data.puan} puan`}
                              size='small'
                              color='primary'
                              variant='outlined'
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant='body2' color='text.secondary'>
                              {data.gorevSayisi} görev • Ortalama:{' '}
                              {data.ortalama}
                            </Typography>
                            <LinearProgress
                              variant='determinate'
                              value={Math.min(
                                (data.puan / (stats.toplamPuan || 1)) * 100,
                                100,
                              )}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Object.entries(categories).length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewDashboard;
