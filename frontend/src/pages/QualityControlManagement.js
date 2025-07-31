import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import QualityControlTemplates from '../components/Quality/QualityControlTemplates';
import QualityControlStatistics from '../components/Quality/QualityControlStatistics';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`qc-management-tabpanel-${index}`}
      aria-labelledby={`qc-management-tab-${index}`}
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

const QualityControlManagement = () => {
  const { hasModulePermission, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Sadece admin erişimi
  const canAccess =
    isAdmin() || hasModulePermission('Kalite Kontrol', 'duzenleyebilir');

  if (!canAccess) {
    return (
      <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
        <Alert severity='error'>
          Bu sayfaya sadece yöneticiler erişebilir.
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      {/* Başlık */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          component='h1'
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #e91e63, #9c27b0)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <AdminIcon
            sx={{ mr: 2, verticalAlign: 'middle', color: '#e91e63' }}
          />
          Kalite Kontrol Yönetimi
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          Değerlendirme şablonlarını yönetin ve kalite kontrol süreçlerini
          analiz edin
        </Typography>
      </Box>

      {/* Alert */}
      <Alert severity='info' sx={{ mb: 3 }}>
        <strong>Yönetici Paneli:</strong> Bu sayfada oluşturulan şablonlar,
        kalite kontrol personeli tarafından çalışan değerlendirmelerinde
        kullanılacaktır.
      </Alert>

      {/* Tabs */}
      <Paper sx={{ bgcolor: 'background.paper' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label='kalite kontrol yönetimi tabs'
          variant='fullWidth'
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
            label='Şablon Yönetimi'
            id='qc-management-tab-0'
            aria-controls='qc-management-tabpanel-0'
          />
          <Tab
            icon={<AnalyticsIcon />}
            label='Sistem İstatistikleri'
            id='qc-management-tab-1'
            aria-controls='qc-management-tabpanel-1'
          />
          <Tab
            icon={<SettingsIcon />}
            label='Sistem Ayarları'
            id='qc-management-tab-2'
            aria-controls='qc-management-tabpanel-2'
          />
        </Tabs>

        {/* Tab Panelleri */}
        <TabPanel value={tabValue} index={0}>
          <QualityControlTemplates />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <QualityControlStatistics />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Sistem Ayarları
            </Typography>
            <Alert severity='info'>Sistem ayarları yakında eklenecektir.</Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default QualityControlManagement;
