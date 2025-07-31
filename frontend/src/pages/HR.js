import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  AccessTime as AccessTimeIcon,
  Download as DownloadIcon,
  Computer as ComputerIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

// Hooks
import useHRData from '../hooks/useHRData';
import useHRFilters from '../hooks/useHRFilters';

// Components
import UserManagementHR from '../components/HR/UserManagementHR';
import EvaluationTemplates from '../components/HR/EvaluationTemplates';
import ScoreHistory from '../components/HR/ScoreHistory';
import HRReports from '../components/HR/HRReports';
import HREvaluationDialog from '../components/HR/HREvaluationDialog';
import ManualEntry from '../components/HR/ManualEntry';
import TestExcelDownload from '../components/HR/TestExcelDownload';
import EquipmentManagement from '../components/HR/EquipmentManagement';
import AssignmentManagement from '../components/HR/AssignmentManagement';
import EquipmentRequestManagement from '../components/HR/EquipmentRequestManagement';

// Services
import { hrAPI } from '../services/api';

const HR = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [evaluationDialog, setEvaluationDialog] = useState({
    open: false,
    template: null,
  });

  // Custom hooks
  const {
    users,
    originalUsers,
    allUsers,
    templates,
    scores,
    summaryReport,
    loading,
    hrYetkileri,
    loadData,
    loadAllUsersForManualEntry,
    loadScores,
    loadSummaryReport,
  } = useHRData();

  // Placeholder for future dialog functionality

  const { filterYear, filterMonth, setFilters } = useHRFilters();

  // Load scores and reports when tab changes
  useEffect(() => {
    if (activeTab === 2) {
      // Mesai/Devamsızlık sekmesi açıldığında tüm kullanıcıları yükle
      loadAllUsersForManualEntry();
    } else if (activeTab === 3) {
      loadScores(filterYear, filterMonth, '');
    } else if (activeTab === 4) {
      loadSummaryReport(filterYear, filterMonth);
    }
  }, [
    activeTab,
    filterYear,
    filterMonth,
    loadAllUsersForManualEntry,
    loadScores,
    loadSummaryReport,
  ]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDeleteUser = async id => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await hrAPI.deleteUser(id);
      showSnackbar('Kullanıcı başarıyla silindi');
      loadData();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Silme işlemi sırasında hata oluştu',
        'error',
      );
    }
  };

  // Evaluation handlers
  const handleTemplateEvaluate = template => {
    setEvaluationDialog({
      open: true,
      template: template,
    });
  };

  const handleEvaluationSuccess = message => {
    showSnackbar(message, 'success');
    loadScores(filterYear, filterMonth, ''); // Refresh scores
  };

  const handleEvaluationClose = () => {
    setEvaluationDialog({
      open: false,
      template: null,
    });
  };

  // Filter handlers
  const handleFilterChange = newFilters => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <Container maxWidth='xl' sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>HR verileri yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          component='h1'
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
          <PeopleIcon
            sx={{ mr: 2, verticalAlign: 'middle', color: '#1976d2' }}
          />
          İnsan Kaynakları Yönetimi
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          Kullanıcı yönetimi, performans değerlendirme ve raporlama
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ bgcolor: 'background.paper' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label='hr tabs'
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
            },
          }}
        >
          <Tab
            icon={<PeopleIcon />}
            label='Kullanıcılar'
            id='hr-tab-0'
            aria-controls='hr-tabpanel-0'
          />
          <Tab
            icon={<AssessmentIcon />}
            label='Puanlama Şablonları'
            id='hr-tab-1'
            aria-controls='hr-tabpanel-1'
          />
          <Tab
            icon={<AccessTimeIcon />}
            label='Mesai/Devamsızlık'
            id='hr-tab-2'
            aria-controls='hr-tabpanel-2'
          />
          <Tab
            icon={<HistoryIcon />}
            label='Puanlama Geçmişi'
            id='hr-tab-3'
            aria-controls='hr-tabpanel-3'
          />
          <Tab
            icon={<BarChartIcon />}
            label='Raporlar'
            id='hr-tab-4'
            aria-controls='hr-tabpanel-4'
          />
          <Tab
            icon={<DownloadIcon />}
            label='Excel Test'
            id='hr-tab-5'
            aria-controls='hr-tabpanel-5'
          />
          <Tab
            icon={<ComputerIcon />}
            label='Ekipman Tanıtımı'
            id='hr-tab-6'
            aria-controls='hr-tabpanel-6'
          />
          <Tab
            icon={<AssignmentIcon />}
            label='Ekipman Zimmetleme'
            id='hr-tab-7'
            aria-controls='hr-tabpanel-7'
          />
          <Tab
            icon={<NotificationsIcon />}
            label='Talep Bildirimleri'
            id='hr-tab-8'
            aria-controls='hr-tabpanel-8'
          />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <UserManagementHR
              users={users}
              hrYetkileri={hrYetkileri}
              onUserDelete={handleDeleteUser}
            />
          )}

          {activeTab === 1 && (
            <EvaluationTemplates
              templates={templates}
              hrYetkileri={hrYetkileri}
              onTemplateEvaluate={handleTemplateEvaluate}
            />
          )}

          {activeTab === 2 && (
            <ManualEntry
              users={allUsers.length > 0 ? allUsers : users}
              hrYetkileri={hrYetkileri}
              onSuccess={showSnackbar}
            />
          )}

          {activeTab === 3 && (
            <ScoreHistory
              scores={scores}
              users={originalUsers}
              hrYetkileri={hrYetkileri}
              filterYear={filterYear}
              filterMonth={filterMonth}
              filterUser=''
              onFilterChange={handleFilterChange}
            />
          )}

          {activeTab === 4 && (
            <HRReports
              summaryReport={summaryReport}
              hrYetkileri={hrYetkileri}
              filterYear={filterYear}
              filterMonth={filterMonth}
              onFilterChange={handleFilterChange}
              onExcelDownload={() => {
                /* Excel download logic */
              }}
            />
          )}

          {activeTab === 5 && <TestExcelDownload />}

          {activeTab === 6 && <EquipmentManagement onSuccess={showSnackbar} />}

          {activeTab === 7 && <AssignmentManagement onSuccess={showSnackbar} />}

          {activeTab === 8 && (
            <EquipmentRequestManagement onSuccess={showSnackbar} />
          )}
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Evaluation Dialog */}
      <HREvaluationDialog
        open={evaluationDialog.open}
        onClose={handleEvaluationClose}
        template={evaluationDialog.template}
        onSuccess={handleEvaluationSuccess}
      />
    </Container>
  );
};

export default HR;
