import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CHART_COLORS, chartConfig } from '../../utils/dashboardConfig';

const PerformanceChart = ({ performanceData = [] }) => {
  // Default data if performanceData is empty
  const defaultData = [
    { name: 'Tamamlanan', value: 65, color: '#4caf50' },
    { name: 'Devam Eden', value: 25, color: '#ff9800' },
    { name: 'Bekleyen', value: 10, color: '#f44336' },
  ];

  const chartData = performanceData.length > 0 ? performanceData : defaultData;

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 3 }}>
        Performans Analizi
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
        }}
      >
        {/* Pie Chart */}
        <Box sx={{ flex: 1, minHeight: 300 }}>
          <Typography variant='h6' sx={{ mb: 2, textAlign: 'center' }}>
            Görev Dağılımı
          </Typography>
          <ResponsiveContainer width='100%' height={chartConfig.pie.height}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                labelLine={chartConfig.pie.labelLine}
                outerRadius={chartConfig.pie.outerRadius}
                fill='#8884d8'
                dataKey='value'
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.color || CHART_COLORS[index % CHART_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Bar Chart */}
        <Box sx={{ flex: 1, minHeight: 300 }}>
          <Typography variant='h6' sx={{ mb: 2, textAlign: 'center' }}>
            Aylık Trend
          </Typography>
          <ResponsiveContainer width='100%' height={chartConfig.pie.height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='value' fill='#8884d8' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Performance Metrics */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
        {chartData.map((metric, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <Typography
              variant='h4'
              sx={{
                fontWeight: 'bold',
                color:
                  metric.color || CHART_COLORS[index % CHART_COLORS.length],
              }}
            >
              {metric.value}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {metric.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default PerformanceChart;
