import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Build as BuildIcon } from '@mui/icons-material';
import { CARD_GRADIENTS, MESSAGES } from '../../utils/dashboardConfig';

/**
 * Dashboard Header Component
 * Welcome message and refresh functionality
 */
const DashboardHeader = ({ user }) => {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        background: CARD_GRADIENTS.primary,
        borderRadius: 3,
        color: 'white',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant='h3' sx={{ fontWeight: 'bold', mb: 1 }}>
            {MESSAGES.WELCOME_MESSAGE}, {user?.ad} {user?.soyad}! 👋
          </Typography>
          <Typography variant='h6' sx={{ opacity: 0.9 }}>
            {MESSAGES.DASHBOARD_TITLE}
          </Typography>
        </Box>
        <BuildIcon sx={{ fontSize: 80, opacity: 0.7 }} />
      </Box>
    </Paper>
  );
};

export default DashboardHeader;
