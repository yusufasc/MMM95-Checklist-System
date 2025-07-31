import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { systemInfoConfig } from '../../utils/dashboardConfig';

const iconMap = {
  SecurityIcon,
  BusinessIcon,
  AssignmentIcon,
  StorageIcon,
  CheckCircleIcon,
};

const SystemInfo = ({ stats = {} }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
      <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 3 }}>
        Sistem Bilgileri
      </Typography>

      {/* System Status */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Sistem Durumu
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={`Veritabanı: ${systemInfoConfig.status.database}`}
            color='success'
            size='small'
          />
          <Chip
            label={`Versiyon: ${systemInfoConfig.status.version}`}
            color='info'
            size='small'
          />
        </Box>

        <Typography variant='body2' color='text.secondary'>
          Son Güncelleme: {systemInfoConfig.status.lastUpdate()}
        </Typography>
      </Box>

      {/* System Details */}
      <List>
        {systemInfoConfig.items.map((item, index) => {
          const IconComponent = iconMap[item.icon] || StorageIcon;

          return (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <IconComponent sx={{ color: '#2196f3' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                    {item.getText(stats)}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {/* Additional Stats */}
      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 1 }}>
          Güncel İstatistikler
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Toplam Kullanıcı:
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
            {stats.totalUsers || 0}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Aktif Görevler:
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
            {stats.activeTasks || 0}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='body2' color='text.secondary'>
            Envanter Öğeleri:
          </Typography>
          <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
            {stats.inventoryItems || 0}
          </Typography>
        </Box>
      </Box>

      {/* System Health */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            borderRadius: 20,
            bgcolor: '#e8f5e8',
            border: '1px solid #4caf50',
          }}
        >
          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16, mr: 1 }} />
          <Typography
            variant='body2'
            sx={{ color: '#4caf50', fontWeight: 'bold' }}
          >
            Sistem Sağlıklı
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default SystemInfo;
