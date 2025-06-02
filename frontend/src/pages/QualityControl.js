import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Container, Typography, Box, Alert, Tabs, Tab, Paper } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import QualityControlEvaluation from '../components/QualityControlEvaluation';
import QualityControlStatistics from '../components/QualityControlStatistics';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quality-control-tabpanel-${index}`}
      aria-labelledby={`quality-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

const QualityControl = () => {
  const { hasModulePermission } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const canView = hasModulePermission('Kalite Kontrol');

  if (!canView) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz yok.</Alert>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Başlık */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <RateReviewIcon sx={{ mr: 2, verticalAlign: 'middle', color: '#1976d2' }} />
          Kalite Kontrol - Değerlendirme
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Çalışan performansını değerlendirin ve kalite puanlaması yapın
        </Typography>
      </Box>

      {/* Bilgilendirme */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Kalite Kontrol Personeli:</strong> Bu sayfada makina/çalışan seçerek, önceden
        tanımlanmış şablonlara göre performans değerlendirmesi yapabilirsiniz.
      </Alert>

      {/* Tabs */}
      <Paper sx={{ bgcolor: 'background.paper' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="kalite kontrol tabs"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
            },
          }}
        >
          <Tab
            icon={<AssignmentIcon />}
            label="Değerlendirme Yap"
            id="quality-control-tab-0"
            aria-controls="quality-control-tabpanel-0"
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Değerlendirme Geçmişi"
            id="quality-control-tab-1"
            aria-controls="quality-control-tabpanel-1"
          />
        </Tabs>

        {/* Tab Panelleri */}
        <TabPanel value={tabValue} index={0}>
          <QualityControlEvaluation />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <QualityControlStatistics />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default QualityControl;
