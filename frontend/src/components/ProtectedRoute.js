import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, module, permission = 'erisebilir' }) => {
  const { hasModulePermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (!hasModulePermission(module, permission)) {
    // Detaylı debug bilgisi
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.error('🚨 YETKİ REDDİ DEBUG:', {
      module,
      permission,
      userName: user.kullaniciAdi,
      userRoles: user.roller?.map(r => r.ad),
      userRoleDetails: user.roller,
    });

    // Debug için menu permission kontrolü
    console.log('🔍 MENU DEBUG: hasModulePermission test sonuçları:');
    const testModules = ['Toplanti Yonetimi', 'Kalite Kontrol', 'Analytics Dashboard', 'Dashboard'];
    testModules.forEach(mod => {
      const result = hasModulePermission(mod);
      console.log(`  - ${mod}: ${result ? '✅ Allowed' : '❌ Denied'}`);
    });

    alert(
      '🚨 YETKİ REDDİ!\n' +
      `Modül: ${module}\n` +
      `Permission: ${permission}\n` +
      `Kullanıcı: ${user.kullaniciAdi}\n` +
      `Roller: ${user.roller?.map(r => r.ad).join(', ')}\n\n` +
      'Console\'da detayları kontrol edin (F12)',
    );
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h5' color='error' gutterBottom>
            Erişim Reddedildi
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Gerekli modül: {module}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  module: PropTypes.string.isRequired,
  permission: PropTypes.string,
};
