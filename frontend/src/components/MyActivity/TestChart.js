import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TestChart = () => {
  // Test verisi
  const testData = [
    { tarih: '2024-01-01', puan: 85, gorev: 5 },
    { tarih: '2024-01-02', puan: 92, gorev: 7 },
    { tarih: '2024-01-03', puan: 78, gorev: 4 },
    { tarih: '2024-01-04', puan: 95, gorev: 8 },
    { tarih: '2024-01-05', puan: 88, gorev: 6 },
  ];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant='h6' sx={{ mb: 3 }}>
        Test Grafiği - Recharts Çalışıyor mu? 🧪
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={testData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='tarih' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type='monotone'
              dataKey='puan'
              stroke='#8884d8'
              strokeWidth={2}
            />
            <Line
              type='monotone'
              dataKey='gorev'
              stroke='#82ca9d'
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default TestChart;
