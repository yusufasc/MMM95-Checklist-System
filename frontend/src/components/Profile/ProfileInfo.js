import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const ProfileInfo = ({ user }) => {
  const formatDate = date => {
    if (!date) {
      return 'Belirtilmemiş';
    }
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Grid container spacing={3}>
      {/* Kişisel Bilgiler */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant='h6' fontWeight='bold' gutterBottom>
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Kişisel Bilgiler
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            <ListItem>
              <ListItemIcon>
                <BadgeIcon />
              </ListItemIcon>
              <ListItemText
                primary='Ad Soyad'
                secondary={`${user?.ad || ''} ${user?.soyad || ''}`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary='Kullanıcı Adı'
                secondary={user?.kullaniciAdi || 'Belirtilmemiş'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText
                primary='E-posta'
                secondary={user?.email || 'Belirtilmemiş'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <PhoneIcon />
              </ListItemIcon>
              <ListItemText
                primary='Telefon'
                secondary={user?.telefon || 'Belirtilmemiş'}
              />
            </ListItem>
          </List>
        </Paper>
      </Grid>

      {/* İş Bilgileri */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant='h6' fontWeight='bold' gutterBottom>
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            İş Bilgileri
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            <ListItem>
              <ListItemIcon>
                <BadgeIcon />
              </ListItemIcon>
              <ListItemText
                primary='Roller'
                secondary={
                  <Typography component='div' sx={{ mt: 1 }}>
                    {user?.roller?.length > 0
                      ? user.roller.map(role => (
                          <Chip
                            key={role._id}
                            label={role.ad}
                            size='small'
                            sx={{ mr: 1, mb: 1 }}
                            color='primary'
                          />
                        ))
                      : 'Rol atanmamış'}
                  </Typography>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText
                primary='Departmanlar'
                secondary={
                  <Typography component='div' sx={{ mt: 1 }}>
                    {user?.departmanlar?.length > 0
                      ? user.departmanlar.map(dept => (
                          <Chip
                            key={dept._id}
                            label={dept.ad}
                            size='small'
                            sx={{ mr: 1, mb: 1 }}
                            color='secondary'
                          />
                        ))
                      : 'Departman atanmamış'}
                  </Typography>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CalendarIcon />
              </ListItemIcon>
              <ListItemText
                primary='Kayıt Tarihi'
                secondary={formatDate(user?.olusturmaTarihi)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CalendarIcon />
              </ListItemIcon>
              <ListItemText
                primary='Son Güncelleme'
                secondary={formatDate(user?.guncellemeTarihi)}
              />
            </ListItem>
          </List>
        </Paper>
      </Grid>

      {/* Durum Bilgisi */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' fontWeight='bold' gutterBottom>
            Hesap Durumu
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={user?.durum === 'aktif' ? 'Aktif' : 'Pasif'}
              color={user?.durum === 'aktif' ? 'success' : 'error'}
              variant='filled'
            />
            <Typography variant='body2' color='text.secondary'>
              Hesap durumu:{' '}
              {user?.durum === 'aktif'
                ? 'Hesabınız aktif ve sistemi kullanabilirsiniz'
                : 'Hesabınız pasif durumda'}
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ProfileInfo;
