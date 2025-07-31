import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CategoryChart = ({ summary }) => {
  if (!summary || !summary.kategorilerePuanlar) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Kategori Bazlı Puan Dağılımı
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='body1' color='text.secondary'>
            Henüz kategori verisi bulunamadı
          </Typography>
        </Box>
      </Paper>
    );
  }

  const kategoriler = summary.kategorilerePuanlar;

  // Pie chart için veri hazırlama
  const pieData = Object.entries(kategoriler)
    .filter(([_, data]) => data.puan > 0)
    .map(([kategori, data]) => ({
      name: getCategoryDisplayName(kategori),
      value: data.puan,
      count: data.gorevSayisi,
    }));

  // Bar chart için veri hazırlama
  const barData = Object.entries(kategoriler).map(([kategori, data]) => ({
    kategori: getCategoryDisplayName(kategori),
    puan: data.puan,
    gorevSayisi: data.gorevSayisi,
  }));

  // Renk paleti
  const COLORS = [
    '#4CAF50', // Yeşil - Checklist
    '#FF9800', // Turuncu - İşe Bağlı
    '#2196F3', // Mavi - Kalite Kontrol
    '#9C27B0', // Mor - İK Şablon
    '#FF5722', // Kırmızı - Mesai
    '#607D8B', // Gri - Devamsızlık
    '#E91E63', // Pembe - Bonus
    '#00BCD4', // Cyan - Kontrol
  ];

  function getCategoryDisplayName(kategori) {
    const displayNames = {
      checklist: 'Checklist',
      is_bagli: 'İşe Bağlı',
      kalite_kontrol: 'Kalite Kontrol',
      ik_sablon: 'İK Şablon',
      fazla_mesai: 'Mesai',
      ik_devamsizlik: 'Devamsızlık',
      kontrol_puanlari: 'Kontrol Puanları',
      bonus_puanlari: 'Bonus Puanları',
    };
    return displayNames[kategori] || kategori;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant='subtitle2'>{data.name}</Typography>
          <Typography variant='body2' color='primary'>
            Puan: {data.value}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Görev: {data.count}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant='h6' sx={{ mb: 3 }}>
        Kategori Bazlı Puan Dağılımı{' '}
        <span role='img' aria-label='pasta'>
          🥧
        </span>
      </Typography>

      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 300 }}>
            <Typography variant='subtitle1' sx={{ mb: 2, textAlign: 'center' }}>
              Puan Dağılımı
            </Typography>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={pieData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Bar Chart */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 300 }}>
            <Typography variant='subtitle1' sx={{ mb: 2, textAlign: 'center' }}>
              Kategori Karşılaştırması
            </Typography>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='kategori'
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor='end'
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'puan' ? 'Puan' : 'Görev Sayısı',
                  ]}
                />
                <Legend />
                <Bar dataKey='puan' fill='#8884d8' name='Puan' />
                <Bar dataKey='gorevSayisi' fill='#82ca9d' name='Görev Sayısı' />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CategoryChart;
