import React from 'react';
import { Box, LinearProgress, Typography, Paper } from '@mui/material';

/**
 * ProgressIndicator Component
 * AI Guide Pattern: Modern progress display with visual feedback
 */
const ProgressIndicator = ({ current, total, label, sx, ...props }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Color based on progress
  const getProgressColor = () => {
    if (percentage >= 100) {
      return 'success';
    }
    if (percentage >= 75) {
      return 'info';
    }
    if (percentage >= 50) {
      return 'warning';
    }
    return 'error';
  };

  const progressColor = getProgressColor();

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2, // AI Guide: Modern rounded corners
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        ...sx,
      }}
      {...props}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {label || 'İlerleme'}
        </Typography>
        <Typography
          variant='h6'
          fontWeight='bold'
          color={`${progressColor}.main`}
        >
          {percentage}%
        </Typography>
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant='determinate'
        value={percentage}
        color={progressColor}
        sx={{
          height: 8, // AI Guide: Better visibility
          borderRadius: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background:
              percentage >= 100
                ? 'linear-gradient(90deg, #4caf50, #8bc34a)' // AI Guide: Success gradient
                : undefined,
          },
        }}
      />

      {/* Details */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          {current} / {total} tamamlandı
        </Typography>

        {percentage >= 100 && (
          <Typography variant='caption' color='success.main' fontWeight='bold'>
            ✓ Tamamlandı
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ProgressIndicator;
