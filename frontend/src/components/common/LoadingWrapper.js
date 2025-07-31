import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';

/**
 * Ortak loading wrapper component - spageti kod çözümü
 * Tüm loading state'leri için tek merkezi component
 */
const LoadingWrapper = ({
  loading,
  error,
  children,
  loadingMessage = 'Yükleniyor...',
  minHeight = 200,
}) => {
  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight={minHeight}
        flexDirection='column'
        gap={2}
      >
        <CircularProgress />
        {loadingMessage && (
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {loadingMessage}
          </Box>
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return children;
};

export default LoadingWrapper;
