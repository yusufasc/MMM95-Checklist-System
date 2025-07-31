import React from 'react';
import { DialogTitle, Typography, Box } from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

/**
 * Task Dialog Header Component
 * TaskDialog.js'den ayrıştırıldı - 819 satır → modüler yapı
 */
const TaskHeader = ({
  selectedTask,
  selectedMachines,
  isMobile,
  getCompletionPercentage,
  getTotalScore,
  getMaxScore,
  getCompletedItemsWithImages,
}) => {
  return (
    <DialogTitle
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 1, md: 3 },
        px: { xs: 1.5, md: 3 },
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          mb: { xs: 0.5, md: 0 },
        }}
      >
        <AssignmentIcon sx={{ mr: 1, fontSize: { xs: 20, md: 32 } }} />
        <Box sx={{ flex: 1 }}>
          <Box
            component='span'
            sx={{
              fontSize: isMobile ? '1rem' : '1.5rem',
              fontWeight: 'bold',
              display: 'block',
            }}
          >
            {selectedTask?.checklist?.ad}
          </Box>

          {/* Makina Bilgisi */}
          {(() => {
            if (selectedTask?.makina) {
              return (
                <Typography
                  variant='caption'
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: '0.7rem', md: '0.875rem' },
                  }}
                >
                  <span role='img' aria-label='konum'>
                    📍
                  </span>{' '}
                  {selectedTask.makina.makinaNo} - {selectedTask.makina.ad}
                </Typography>
              );
            }

            if (selectedMachines.length > 0) {
              const selectedMachine = selectedMachines[0];
              return (
                <Typography
                  variant='caption'
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: '0.7rem', md: '0.875rem' },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    display: 'inline-block',
                  }}
                >
                  <span role='img' aria-label='seçili-makina'>
                    🎯
                  </span>{' '}
                  Seçili Makina: {selectedMachine.makinaNo} -{' '}
                  {selectedMachine.ad}
                </Typography>
              );
            }

            return (
              <Typography
                variant='caption'
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: '0.7rem', md: '0.875rem' },
                  bgcolor: 'rgba(255,193,7,0.3)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block',
                }}
              >
                <span role='img' aria-label='uyarı'>
                  ⚠️
                </span>{' '}
                Makina seçimi yapılmalı
              </Typography>
            );
          })()}
        </Box>
      </Box>

      {/* Progress Stats */}
      {selectedTask?.durum === 'bekliyor' && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            width: '100%',
            mt: { xs: 0.5, md: 0 },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant='caption'
              sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
            >
              İlerleme
            </Typography>
            <Typography
              variant={isMobile ? 'caption' : 'h6'}
              fontWeight='bold'
              sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
            >
              %{getCompletionPercentage()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant='caption'
              sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
            >
              Puan
            </Typography>
            <Typography
              variant={isMobile ? 'caption' : 'h6'}
              fontWeight='bold'
              sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
            >
              {getTotalScore()} / {getMaxScore()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant='caption'
              sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
            >
              Fotoğraf
            </Typography>
            <Typography
              variant={isMobile ? 'caption' : 'h6'}
              fontWeight='bold'
              sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
            >
              <span role='img' aria-label='fotoğraf'>
                📸
              </span>{' '}
              {getCompletedItemsWithImages()}
            </Typography>
          </Box>
        </Box>
      )}
    </DialogTitle>
  );
};

export default TaskHeader;
