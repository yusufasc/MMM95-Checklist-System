import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  Chip,
  Tab,
  Tabs,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { assignmentAPI, equipmentRequestAPI } from '../services/api';
import ProfileInfo from '../components/Profile/ProfileInfo';
import MyEquipments from '../components/Profile/MyEquipments';
import EquipmentRequests from '../components/Profile/EquipmentRequests';

const Profile = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userAssignments, setUserAssignments] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [error, setError] = useState('');

  // Extract complex expressions to avoid ESLint warnings
  const userId = user?._id || user?.id;
  const hasUserId = Boolean(userId);

  // Debug user info
  console.log('👤 Profile User Debug:');
  console.log('User object:', user);
  console.log('User _id:', user?._id);
  console.log('User id:', user?.id);
  console.log('Final userId:', userId);
  console.log('User kullaniciAdi:', user?.kullaniciAdi);
  console.log('User ad/soyad:', user?.ad, user?.soyad);

  const loadUserData = useCallback(async () => {
    if (!userId) {
      console.warn('User ID not available, skipping data load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔍 Profile Debug: Loading data for user ID:', userId);

      // Kullanıcının zimmetli ekipmanlarını ve taleplerini getir
      const [assignmentsRes, requestsRes] = await Promise.all([
        assignmentAPI.getUserAssignments(userId),
        equipmentRequestAPI.getMyRequests(),
      ]);

      console.log('📦 Assignments Response:', assignmentsRes);
      console.log('📦 Assignments Data:', assignmentsRes.data);
      console.log('📝 Requests Response:', requestsRes);
      console.log('📝 Requests Data:', requestsRes.data);

      setUserAssignments(assignmentsRes.data || []);
      setUserRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Profil verileri yüklenirken hata:', err);
      setError(
        err.response?.data?.message || 'Veriler yüklenirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && hasUserId) {
      loadUserData();
    } else if (isAuthenticated && !hasUserId) {
      // Kullanıcı authenticated ama user data henüz yüklenmedi
      setLoading(false);
    }
  }, [isAuthenticated, hasUserId, loadUserData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    if (userId) {
      loadUserData();
    }
  };

  const handleRequestsRefresh = () => {
    // Sadece requests'i yenile
    if (userId) {
      equipmentRequestAPI
        .getMyRequests()
        .then(response => {
          setUserRequests(response.data || []);
        })
        .catch(err => {
          console.error('Talepler yenilenirken hata:', err);
        });
    }
  };

  if (!isAuthenticated) {
    return (
      <Alert severity='warning'>
        Profil sayfasını görüntülemek için lütfen giriş yapınız.
      </Alert>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Kullanıcı bilgileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Profil Header */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white',
        }}
      >
        <Grid container spacing={3} alignItems='center'>
          <Grid item>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '3rem',
                border: '4px solid rgba(255,255,255,0.3)',
              }}
            >
              {user?.ad?.charAt(0)}
              {user?.soyad?.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant='h3' fontWeight='bold' gutterBottom>
              {user?.ad} {user?.soyad}
            </Typography>
            <Typography variant='h6' sx={{ opacity: 0.9, mb: 2 }}>
              @{user?.kullaniciAdi}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {user?.roller?.map(role => (
                <Chip
                  key={role._id}
                  label={role.ad}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item>
            <IconButton
              onClick={handleRefresh}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant='fullWidth'
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 'medium',
            },
          }}
        >
          <Tab
            icon={<PersonIcon />}
            label='Profil Bilgileri'
            iconPosition='start'
          />
          <Tab
            icon={<AssignmentIcon />}
            label={`Ekipmanlarım (${userAssignments.length})`}
            iconPosition='start'
          />
          <Tab
            icon={<WorkIcon />}
            label={`Taleplerim (${userRequests.length})`}
            iconPosition='start'
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && <ProfileInfo user={user} />}
        {activeTab === 1 && (
          <MyEquipments
            assignments={userAssignments}
            onRefresh={loadUserData}
          />
        )}
        {activeTab === 2 && (
          <EquipmentRequests
            requests={userRequests}
            onRefresh={handleRequestsRefresh}
          />
        )}
      </Box>
    </Box>
  );
};

export default Profile;
