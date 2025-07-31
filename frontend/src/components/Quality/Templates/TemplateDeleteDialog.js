import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  DIALOG_CONFIG,
  BUTTON_STYLES,
  ALERT_MESSAGES,
  getDeleteConfirmationText,
} from '../../../utils/templatesConfig';

const TemplateDeleteDialog = ({
  open,
  selectedTemplate,
  deleteError,
  onClose,
  onConfirmDelete,
}) => {
  const templateInfo = getDeleteConfirmationText(selectedTemplate);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={DIALOG_CONFIG.deleteMaxWidth}
      fullWidth={DIALOG_CONFIG.fullWidth}
    >
      <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DeleteIcon />
          <Box
            component='span'
            sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}
          >
            Şablon Silme Onayı
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity='warning' sx={{ mb: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon />
            <Typography variant='body2'>
              {ALERT_MESSAGES.DELETE_WARNING}
            </Typography>
          </Box>
        </Alert>

        {deleteError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 'bold', mb: 1 }}>
              {deleteError.message}
            </Typography>
            {deleteError.canForceDelete && (
              <Typography variant='body2' sx={{ mt: 1 }}>
                <strong>Zorla Silme:</strong> {ALERT_MESSAGES.FORCE_DELETE_INFO}
              </Typography>
            )}
          </Alert>
        )}

        <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
          <Typography variant='h6' color='error.main' sx={{ mb: 1 }}>
            {templateInfo.title}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            Hedef Rol: {templateInfo.role}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Madde Sayısı: {templateInfo.itemCount}
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant='outlined'>
          İptal
        </Button>
        <Button
          onClick={() => onConfirmDelete(false)}
          color='error'
          variant='outlined'
          disabled={deleteError?.canForceDelete}
        >
          Normal Sil
        </Button>
        {deleteError?.canForceDelete && (
          <Button
            onClick={() => onConfirmDelete(true)}
            color='error'
            variant='contained'
            startIcon={<WarningIcon />}
            sx={BUTTON_STYLES.danger}
          >
            <span role='img' aria-label='acil durum'>
              🚨
            </span>{' '}
            Zorla Sil
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

TemplateDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  selectedTemplate: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    ad: PropTypes.string.isRequired,
    rol: PropTypes.shape({
      ad: PropTypes.string.isRequired,
    }),
    maddeler: PropTypes.array,
  }),
  deleteError: PropTypes.shape({
    message: PropTypes.string.isRequired,
    canForceDelete: PropTypes.bool,
    dependencyCount: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirmDelete: PropTypes.func.isRequired,
};

export default TemplateDeleteDialog;
