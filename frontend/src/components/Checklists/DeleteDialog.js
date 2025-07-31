import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Paper,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const DeleteDialog = ({
  open,
  onClose,
  checklist,
  deleteError,
  showForceDelete,
  onDelete,
  onForceDelete,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'error.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <DeleteIcon />
        <Box component='span' sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Checklist Silme Onayı
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Warning Alert */}
        <Alert severity='warning' sx={{ mb: 2 }}>
          <Typography variant='body2' fontWeight='bold'>
            Bu işlem geri alınamaz!
          </Typography>
        </Alert>

        {/* Error Message for Dependencies */}
        {deleteError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            <Box>
              <Typography variant='body2' gutterBottom>
                {deleteError.message}
              </Typography>
              {deleteError.canForceDelete && (
                <Typography variant='body2' sx={{ mt: 1 }}>
                  <strong>
                    <span role='img' aria-label='uyarı'>
                      🚨
                    </span>{' '}
                    Zorla Silme:
                  </strong>{' '}
                  Bu işlem {deleteError.activeTasksCount} aktif görevi iptal
                  ederek checklist'i silecektir.
                </Typography>
              )}
            </Box>
          </Alert>
        )}

        {/* Checklist Info */}
        <Paper
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            border: '2px solid',
            borderColor: 'error.light',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <WarningIcon color='error' />
            <Typography variant='h6' color='error.main' fontWeight='bold'>
              Silinecek Checklist
            </Typography>
          </Box>

          <Typography variant='body1' fontWeight='bold' sx={{ mb: 1 }}>
            {checklist?.ad}
          </Typography>

          <Typography variant='body2' color='text.secondary'>
            Tür: {checklist?.tur === 'rutin' ? 'Rutin' : 'İş Bağlı'}
          </Typography>

          {checklist?.isTuru && (
            <Typography variant='body2' color='text.secondary'>
              İş Türü: {checklist.isTuru}
            </Typography>
          )}

          <Typography variant='body2' color='text.secondary'>
            Madde Sayısı: {checklist?.maddeler?.length || 0}
          </Typography>
        </Paper>

        {/* Additional Warning for Force Delete */}
        {showForceDelete && (
          <Alert severity='error' sx={{ mt: 2 }}>
            <Typography variant='body2' fontWeight='bold'>
              <span role='img' aria-label='uyarı'>
                ⚠️
              </span>{' '}
              UYARI: Zorla silme işlemi
            </Typography>
            <Typography variant='body2'>
              Bu işlem tüm aktif görevleri iptal edecek ve verileri geri
              getirilemeyecektir.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant='outlined' sx={{ borderRadius: 2 }}>
          İptal
        </Button>

        <Button
          onClick={onDelete}
          color='error'
          variant='outlined'
          sx={{ borderRadius: 2 }}
        >
          Normal Sil
        </Button>

        {showForceDelete && (
          <Button
            onClick={onForceDelete}
            color='error'
            variant='contained'
            startIcon={<DeleteIcon />}
            sx={{
              borderRadius: 2,
              bgcolor: 'error.dark',
              '&:hover': {
                bgcolor: 'error.darker',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <span role='img' aria-label='acil'>
              🚨
            </span>{' '}
            Zorla Sil
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
