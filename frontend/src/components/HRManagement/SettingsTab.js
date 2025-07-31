import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const SettingsTab = ({ settings, onEditSettings }) => {
  if (!settings) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant='h6' color='text.secondary'>
          Ayarlar yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h6'>Puanlama Ayarları</Typography>
        <Button
          variant='contained'
          startIcon={<EditIcon />}
          onClick={onEditSettings}
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          }}
        >
          Ayarları Düzenle
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Fazla Mesai Puanlama Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              border: '2px solid #4caf50',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(76, 175, 80, 0.2)',
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                }}
              >
                <TrendingUpIcon
                  sx={{
                    fontSize: 32,
                    color: 'success.main',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    p: 0.5,
                  }}
                />
                <Typography variant='h6' fontWeight='bold' color='success.dark'>
                  Fazla Mesai Puanlama
                </Typography>
              </Box>

              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary='Durum'
                    secondary={
                      settings.mesaiPuanlama?.aktif ? 'Aktif' : 'Pasif'
                    }
                  />
                  <Chip
                    label={settings.mesaiPuanlama?.aktif ? 'Aktif' : 'Pasif'}
                    color={
                      settings.mesaiPuanlama?.aktif ? 'success' : 'default'
                    }
                    size='small'
                    sx={{ fontWeight: 'bold' }}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary='Saat Başına Puan'
                    secondary={`+${settings.mesaiPuanlama?.saatBasinaPuan || 0} puan`}
                  />
                  <Chip
                    label={`+${settings.mesaiPuanlama?.saatBasinaPuan || 0}`}
                    color='success'
                    variant='outlined'
                    size='small'
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary='Günlük Maksimum Saat'
                    secondary={`${settings.mesaiPuanlama?.gunlukMaksimumSaat || 0} saat`}
                  />
                  <Chip
                    label={`${settings.mesaiPuanlama?.gunlukMaksimumSaat || 0}h`}
                    color='primary'
                    variant='outlined'
                    size='small'
                  />
                </ListItem>
              </List>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'rgba(255,255,255,0.6)',
                  borderRadius: 2,
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                }}
              >
                <Typography
                  variant='body2'
                  color='success.dark'
                  fontWeight='medium'
                >
                  {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
                  💡 Fazla mesai çalışan personele pozitif puan verilir
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Devamsızlık Puanlama Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              border: '2px solid #f44336',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(244, 67, 54, 0.2)',
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                }}
              >
                <TrendingDownIcon
                  sx={{
                    fontSize: 32,
                    color: 'error.main',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    p: 0.5,
                  }}
                />
                <Typography variant='h6' fontWeight='bold' color='error.dark'>
                  Devamsızlık Puanlama
                </Typography>
              </Box>

              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary='Durum'
                    secondary={
                      settings.devamsizlikPuanlama?.aktif ? 'Aktif' : 'Pasif'
                    }
                  />
                  <Chip
                    label={
                      settings.devamsizlikPuanlama?.aktif ? 'Aktif' : 'Pasif'
                    }
                    color={
                      settings.devamsizlikPuanlama?.aktif
                        ? 'success'
                        : 'default'
                    }
                    size='small'
                    sx={{ fontWeight: 'bold' }}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary='Gün Başına Puan'
                    secondary={`${settings.devamsizlikPuanlama?.gunBasinaPuan || 0} puan`}
                  />
                  <Chip
                    label={`${settings.devamsizlikPuanlama?.gunBasinaPuan || 0}`}
                    color='error'
                    variant='outlined'
                    size='small'
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary='Saat Başına Puan'
                    secondary={`${settings.devamsizlikPuanlama?.saatBasinaPuan || 0} puan`}
                  />
                  <Chip
                    label={`${settings.devamsizlikPuanlama?.saatBasinaPuan || 0}`}
                    color='error'
                    variant='outlined'
                    size='small'
                  />
                </ListItem>
              </List>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'rgba(255,255,255,0.6)',
                  borderRadius: 2,
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                }}
              >
                <Typography
                  variant='body2'
                  color='error.dark'
                  fontWeight='medium'
                >
                  <span role='img' aria-label='uyarı'>
                    ⚠️
                  </span>{' '}
                  Devamsızlık yapan personele negatif puan verilir
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Card */}
      <Card
        elevation={2}
        sx={{
          mt: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
        }}
      >
        <CardContent>
          <Typography
            variant='h6'
            fontWeight='bold'
            color='purple'
            gutterBottom
          >
            <span role='img' aria-label='grafik'>
              📊
            </span>{' '}
            Puanlama Sistemi Özeti
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant='body2' color='text.secondary'>
                <strong>Fazla Mesai:</strong>{' '}
                {settings.mesaiPuanlama?.aktif ? 'Aktif' : 'Pasif'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Maksimum: {settings.mesaiPuanlama?.gunlukMaksimumSaat || 0}{' '}
                saat/gün
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant='body2' color='text.secondary'>
                <strong>Devamsızlık:</strong>{' '}
                {settings.devamsizlikPuanlama?.aktif ? 'Aktif' : 'Pasif'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Penalty: {settings.devamsizlikPuanlama?.gunBasinaPuan || 0}{' '}
                puan/gün
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsTab;
