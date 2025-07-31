import React from 'react';
import { Alert, Typography, Paper, Stack, Chip } from '@mui/material';
import { Build as BuildIcon } from '@mui/icons-material';

const MachineAlert = ({ selectedMachines }) => {
  return (
    <>
      {/* Makina Seçimi Uyarısı */}
      {selectedMachines.length === 0 && (
        <Alert severity='warning' sx={{ mb: 2, py: 1 }} icon={<BuildIcon />}>
          <Typography variant='body2' fontWeight='bold'>
            <span role='img' aria-label='araç'>
              🔧
            </span>{' '}
            Makina Seçimi Gerekli
          </Typography>
          <Typography variant='caption'>
            Sağ üstteki "Makina Seçimi" butonunu kullanın.
          </Typography>
        </Alert>
      )}

      {/* Seçili Makinalar */}
      {selectedMachines.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography
            variant='body2'
            fontWeight='bold'
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            <BuildIcon sx={{ mr: 1, fontSize: 16 }} />
            Çalıştığınız Makinalar
          </Typography>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {selectedMachines.map(machine => (
              <Chip
                key={machine._id}
                label={`${machine.makinaNo} - ${machine.ad}`}
                color='primary'
                variant='outlined'
                size='small'
                sx={{ mb: 0.5, fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Paper>
      )}
    </>
  );
};

export default MachineAlert;
