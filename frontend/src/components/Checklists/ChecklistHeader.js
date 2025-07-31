import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  ChecklistRtl as ChecklistIcon,
} from '@mui/icons-material';

const ChecklistHeader = ({ checklistCount, onAddClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper
      elevation={8}
      sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}
          >
            <ChecklistIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight='bold'>
              Checklist Şablonları
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              Toplam {checklistCount} şablon
            </Typography>
          </Box>
        </Box>

        {!isMobile && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={onAddClick}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
                transform: 'translateY(-2px)',
              },
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 'bold',
              minHeight: 44,
            }}
          >
            Yeni Checklist
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ChecklistHeader;
