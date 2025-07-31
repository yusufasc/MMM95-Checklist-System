import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

const PerformanceChart = ({ dailyPerformance }) => {
  const [chartType, setChartType] = useState('line');
  const [viewMode, setViewMode] = useState('all');

  if (!dailyPerformance || dailyPerformance.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Günlük Performans Grafiği
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='body1' color='text.secondary'>
            Henüz performans verisi bulunamadı
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Veri formatını düzenle
  const chartData = dailyPerformance.map(day => ({
    tarih: day.tarih,
    tarihFormatli: day.tarihFormatli,
    'Toplam Puan': day.gunlukPuan || day.toplamPuan || 0,
    'Görev Sayısı': day.tamamlananGorev || day.gorevSayisi || 0,
    Checklist: day.scores?.checklist || 0,
    'İşe Bağlı': day.scores?.is_bagli || 0,
    'Kalite Kontrol': day.scores?.kalite_kontrol || 0,
    'İK Şablon': day.scores?.ik_sablon || 0,
    Mesai: day.scores?.fazla_mesai || 0,
    Devamsızlık: day.scores?.ik_devamsizlik || 0,
    'Kontrol Puanları': day.scores?.kontrol_puanlari || 0,
    'Bonus Puanları': day.scores?.bonus_puanlari || 0,
  }));

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Görünüm moduna göre veri seçimi
  const getDisplayData = () => {
    if (viewMode === 'summary') {
      return chartData.map(day => ({
        ...day,
        'Toplam Puan': day['Toplam Puan'],
        'Görev Sayısı': day['Görev Sayısı'],
      }));
    }
    return chartData;
  };

  const renderChart = () => {
    const data = getDisplayData();

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const xAxisProps = {
      dataKey: 'tarih',
      tick: { fontSize: 12 },
      tickFormatter: value => {
        const date = new Date(value);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      },
    };

    const tooltipProps = {
      labelFormatter: value => {
        const date = new Date(value);
        return date.toLocaleDateString('tr-TR');
      },
      formatter: (value, name) => [value, name],
    };

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis {...xAxisProps} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipProps} />
          <Legend />
          {viewMode === 'summary' ? (
            <>
              <Area
                type='monotone'
                dataKey='Toplam Puan'
                stackId='1'
                stroke='#8884d8'
                fill='#8884d8'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='Görev Sayısı'
                stackId='2'
                stroke='#82ca9d'
                fill='#82ca9d'
                fillOpacity={0.6}
              />
            </>
          ) : (
            <>
              <Area
                type='monotone'
                dataKey='Checklist'
                stackId='1'
                stroke='#4CAF50'
                fill='#4CAF50'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='İşe Bağlı'
                stackId='1'
                stroke='#FF9800'
                fill='#FF9800'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='Kalite Kontrol'
                stackId='1'
                stroke='#2196F3'
                fill='#2196F3'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='İK Şablon'
                stackId='1'
                stroke='#9C27B0'
                fill='#9C27B0'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='Mesai'
                stackId='1'
                stroke='#FF5722'
                fill='#FF5722'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='Kontrol Puanları'
                stackId='1'
                stroke='#00BCD4'
                fill='#00BCD4'
                fillOpacity={0.6}
              />
              <Area
                type='monotone'
                dataKey='Bonus Puanları'
                stackId='1'
                stroke='#E91E63'
                fill='#E91E63'
                fillOpacity={0.6}
              />
            </>
          )}
        </AreaChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis {...xAxisProps} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipProps} />
          <Legend />
          {viewMode === 'summary' ? (
            <>
              <Bar dataKey='Toplam Puan' fill='#8884d8' />
              <Bar dataKey='Görev Sayısı' fill='#82ca9d' />
            </>
          ) : (
            <>
              <Bar dataKey='Checklist' fill='#4CAF50' />
              <Bar dataKey='İşe Bağlı' fill='#FF9800' />
              <Bar dataKey='Kalite Kontrol' fill='#2196F3' />
              <Bar dataKey='İK Şablon' fill='#9C27B0' />
              <Bar dataKey='Mesai' fill='#FF5722' />
              <Bar dataKey='Kontrol Puanları' fill='#00BCD4' />
              <Bar dataKey='Bonus Puanları' fill='#E91E63' />
            </>
          )}
        </BarChart>
      );
    }

    // Default: Line Chart
    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis {...xAxisProps} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip {...tooltipProps} />
        <Legend />
        {viewMode === 'summary' ? (
          <>
            <Line
              type='monotone'
              dataKey='Toplam Puan'
              stroke='#8884d8'
              strokeWidth={3}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
            />
            <Line
              type='monotone'
              dataKey='Görev Sayısı'
              stroke='#82ca9d'
              strokeWidth={3}
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
            />
          </>
        ) : (
          <>
            <Line
              type='monotone'
              dataKey='Checklist'
              stroke='#4CAF50'
              strokeWidth={2}
              dot={{ fill: '#4CAF50', strokeWidth: 2, r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='İşe Bağlı'
              stroke='#FF9800'
              strokeWidth={2}
              dot={{ fill: '#FF9800', strokeWidth: 2, r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='Kalite Kontrol'
              stroke='#2196F3'
              strokeWidth={2}
              dot={{ fill: '#2196F3', strokeWidth: 2, r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='İK Şablon'
              stroke='#9C27B0'
              strokeWidth={2}
              dot={{ fill: '#9C27B0', strokeWidth: 2, r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='Mesai'
              stroke='#FF5722'
              strokeWidth={2}
              dot={{ fill: '#FF5722', strokeWidth: 2, r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='Kontrol Puanları'
              stroke='#00BCD4'
              strokeWidth={2}
              dot={{ fill: '#00BCD4', strokeWidth: 2, r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='Bonus Puanları'
              stroke='#E91E63'
              strokeWidth={2}
              dot={{ fill: '#E91E63', strokeWidth: 2, r: 3 }}
            />
          </>
        )}
      </LineChart>
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h6'>
          Günlük Performans Grafiği{' '}
          <span role='img' aria-label='grafik'>
            📈
          </span>
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size='small'
          >
            <ToggleButton value='summary'>Özet</ToggleButton>
            <ToggleButton value='all'>Detaylı</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size='small'
          >
            <ToggleButton value='line'>Çizgi</ToggleButton>
            <ToggleButton value='area'>Alan</ToggleButton>
            <ToggleButton value='bar'>Çubuk</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width='100%' height='100%'>
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default PerformanceChart;
