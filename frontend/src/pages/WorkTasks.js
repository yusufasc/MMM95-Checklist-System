import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useWorkTaskData } from '../components/WorkTask/useWorkTaskData';
import WorkTaskListSimple from '../components/WorkTask/WorkTaskList-simple';
import WorkTaskForm from '../components/WorkTask/WorkTaskForm';
import { hrAPI } from '../services/api';

/**
 * WorkTasks - Kalıp Değişim İş Takip Sistemi (REFACTORED)
 * Orijinal: 1037 satır → Modüler: ~100 satır (%90 azalma)
 * 🎯 Custom Hook + Modüler Components
 */
const WorkTasks = () => {
  const { hasModulePermission } = useAuth();
  const { showSnackbar } = useSnackbar();

  // 🎯 Custom Hook - Data Management
  const {
    loading,
    submitting,
    checklists,
    makinalar,
    kaliplar,
    createWorkTask,
  } = useWorkTaskData();

  // 👥 Users data for buddy selection
  const [users, setUsers] = useState([]);

  // 👥 Load users data for buddy selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await hrAPI.getUsers({ forManualEntry: 'true' });

        // HR API direkt data array döndürüyor, wrapper object değil
        const userData = response.data || response;
        if (userData && Array.isArray(userData)) {
          setUsers(userData);
          console.log(
            `✅ ${userData.length} kullanıcı yüklendi - Buddy selection hazır`,
          );
        } else {
          console.error('❌ HR API response invalid format:', response);
        }
      } catch (error) {
        console.error('❌ HR API Error:', error);
        showSnackbar('Kullanıcılar yüklenirken hata oluştu', 'error');
      }
    };

    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 🎯 Local State - Form Dialog
  const [openForm, setOpenForm] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  // 📝 Checklist seçme ve form açma
  const handleChecklistSelect = checklist => {
    setSelectedChecklist(checklist);
    setOpenForm(true);
  };

  // 📤 Form submit handler
  const handleFormSubmit = async submitData => {
    const result = await createWorkTask(submitData, showSnackbar);

    if (result.success) {
      handleFormClose();
    }
  };

  // 🔄 Form kapatma
  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedChecklist(null);
  };

  // 🚫 Permission kontrolü
  if (!hasModulePermission('Yaptım')) {
    return (
      <Container>
        <Alert severity='error' sx={{ mt: 3 }}>
          Bu sayfaya erişim yetkiniz yok
        </Alert>
      </Container>
    );
  }

  // ⏳ Loading state - Ana verilerin yüklenmesini bekle, users asenkron yüklenebilir
  if (loading) {
    return (
      <Container>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Veriler yükleniyor...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth='xl' sx={{ py: 3 }}>
        {/* 📋 Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant='h4' component='h1' gutterBottom>
            İş Görevleri - Kalıp Değişim Sistemi
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Checklist seçerek kalıp değişim sürecini başlatın
          </Typography>
        </Box>

        {/* 🎯 Modüler Component - Checklist List */}
        <WorkTaskListSimple
          checklists={checklists}
          onChecklistSelect={handleChecklistSelect}
        />
      </Container>

      {/* 📝 Modüler Component - Form Dialog */}
      <WorkTaskForm
        open={openForm}
        onClose={handleFormClose}
        selectedChecklist={selectedChecklist}
        makinalar={makinalar}
        kaliplar={kaliplar}
        users={users}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />
    </>
  );
};

export default WorkTasks;
