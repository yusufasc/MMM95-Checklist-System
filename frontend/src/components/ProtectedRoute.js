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
    alert(
      `🚨 EMERGENCY: YETKİ REDDİ! Modül: ${module}, Permission: ${permission}`,
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
