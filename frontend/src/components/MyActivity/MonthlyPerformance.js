import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { myActivityAPI } from '../../services/api';

const MonthlyPerformance = ({ filters }) => {
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
  }, [filters]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      // Aylık veri için API çağrısı
      const response = await myActivityAPI.getDailyPerformance(30);
      setMonthlyData(response.data);
    } catch (error) {
      console.error('Aylık veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Aylık performans verileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (!monthlyData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Aylık performans verisi bulunamadı
        </Typography>
      </Box>
    );
  }

  // Günlük performans verilerini işle
  const dailyData = monthlyData.performansVerileri || [];

  // Haftalık gruplandırma
  const weeklyData = groupByWeek(dailyData);

  // Aylık özet
  const monthlyStats = calculateMonthlyStats(dailyData);

  // Grafik verisi
  const chartData = dailyData.map(day => ({
    tarih: new Date(day.tarih).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
    }),
    puan: day.toplamPuan || 0,
    gorev: day.gorevSayisi || 0,
    checklist: day.scores?.checklist || 0,
    iseBagli: day.scores?.is_bagli || 0,
    kaliteKontrol: day.scores?.kalite_kontrol || 0,
  }));

  function groupByWeek(data) {
    const weeks = [];
    let currentWeek = [];

    data.forEach((day, index) => {
      currentWeek.push(day);

      if (currentWeek.length === 7 || index === data.length - 1) {
        weeks.push({
          weekNumber: weeks.length + 1,
          days: [...currentWeek],
          totalScore: currentWeek.reduce(
            (sum, d) => sum + (d.toplamPuan || 0),
            0,
          ),
          totalTasks: currentWeek.reduce(
            (sum, d) => sum + (d.gorevSayisi || 0),
            0,
          ),
          avgScore: Math.round(
            currentWeek.reduce((sum, d) => sum + (d.toplamPuan || 0), 0) /
              currentWeek.length,
          ),
        });
        currentWeek = [];
      }
    });

    return weeks;
  }

  function calculateMonthlyStats(data) {
    const totalScore = data.reduce(
      (sum, day) => sum + (day.toplamPuan || 0),
      0,
    );
    const totalTasks = data.reduce(
      (sum, day) => sum + (day.gorevSayisi || 0),
      0,
    );
    const workingDays = data.filter(day => day.gorevSayisi > 0).length;

    return {
      totalScore,
      totalTasks,
      avgDailyScore: Math.round(totalScore / data.length),
      avgDailyTasks: Math.round(totalTasks / data.length),
      workingDays,
      bestDay: data.reduce(
        (best, day) =>
          (day.toplamPuan || 0) > (best.toplamPuan || 0) ? day : best,
        data[0] || {},
      ),
    };
  }

  function getScoreColor(score) {
    if (score >= 90) {
      return '#4CAF50';
    }
    if (score >= 70) {
      return '#FF9800';
    }
    return '#F44336';
  }

  return (
    <Box>
      {/* Aylık Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {monthlyStats.totalTasks}
                </Typography>
              </Box>
              <Typography variant='h6'>Toplam Görev</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Günlük ortalama: {monthlyStats.avgDailyTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {monthlyStats.totalScore}
                </Typography>
              </Box>
              <Typography variant='h6'>Toplam Puan</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Günlük ortalama: {monthlyStats.avgDailyScore}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {monthlyStats.workingDays}
                </Typography>
              </Box>
              <Typography variant='h6'>Aktif Gün</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Görev yapılan günler
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {monthlyStats.bestDay.toplamPuan || 0}
                </Typography>
              </Box>
              <Typography variant='h6'>En İyi Gün</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                {monthlyStats.bestDay.tarihFormatli || 'Veri yok'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sol Kolon - Grafik */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <TrendingUpIcon sx={{ mr: 1, color: '#2196F3' }} />
                Aylık Performans Trendi
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='tarih' />
                    <YAxis />
                    <RechartsTooltip />
                    <Area
                      type='monotone'
                      dataKey='puan'
                      stackId='1'
                      stroke='#2196F3'
                      fill='#2196F3'
                      fillOpacity={0.6}
                      name='Toplam Puan'
                    />
                    <Area
                      type='monotone'
                      dataKey='checklist'
                      stackId='2'
                      stroke='#4CAF50'
                      fill='#4CAF50'
                      fillOpacity={0.6}
                      name='Checklist'
                    />
                    <Area
                      type='monotone'
                      dataKey='iseBagli'
                      stackId='2'
                      stroke='#FF9800'
                      fill='#FF9800'
                      fillOpacity={0.6}
                      name='İşe Bağlı'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Haftalık Performans Tablosu */}
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <CalendarIcon sx={{ mr: 1, color: '#FF9800' }} />
                Haftalık Performans Özeti
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hafta</TableCell>
                      <TableCell align='center'>Toplam Puan</TableCell>
                      <TableCell align='center'>Toplam Görev</TableCell>
                      <TableCell align='center'>Günlük Ortalama</TableCell>
                      <TableCell align='center'>Performans</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weeklyData.map(week => (
                      <TableRow key={week.weekNumber}>
                        <TableCell>
                          <Typography variant='subtitle2'>
                            {week.weekNumber}. Hafta
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {week.days.length} gün
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={week.totalScore}
                            color='primary'
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={week.totalTasks}
                            color='secondary'
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2'>
                            {week.avgScore}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <LinearProgress
                            variant='determinate'
                            value={Math.min((week.avgScore / 100) * 100, 100)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getScoreColor(week.avgScore),
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ Kolon - Günlük Detaylar */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <ScheduleIcon sx={{ mr: 1, color: '#9C27B0' }} />
                Günlük Detaylar
              </Typography>
              <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                {dailyData
                  .slice(-10)
                  .reverse()
                  .map((day, index) => (
                    <Card
                      key={index}
                      variant='outlined'
                      sx={{
                        mb: 2,
                        border: `2px solid ${getScoreColor(day.toplamPuan || 0)}20`,
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant='subtitle2'>
                            {day.tarihFormatli}
                          </Typography>
                          <Chip
                            label={`${day.toplamPuan || 0} puan`}
                            size='small'
                            sx={{
                              backgroundColor: getScoreColor(
                                day.toplamPuan || 0,
                              ),
                              color: 'white',
                            }}
                          />
                        </Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mb: 1 }}
                        >
                          {day.gorevSayisi || 0} görev tamamlandı
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {day.scores?.checklist > 0 && (
                            <Chip
                              label={`Checklist: ${day.scores.checklist}`}
                              size='small'
                              variant='outlined'
                            />
                          )}
                          {day.scores?.is_bagli > 0 && (
                            <Chip
                              label={`İşe Bağlı: ${day.scores.is_bagli}`}
                              size='small'
                              variant='outlined'
                            />
                          )}
                          {day.scores?.kalite_kontrol > 0 && (
                            <Chip
                              label={`Kalite: ${day.scores.kalite_kontrol}`}
                              size='small'
                              variant='outlined'
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonthlyPerformance;
