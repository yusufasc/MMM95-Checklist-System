import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import LoadingWrapper from './LoadingWrapper';

/**
 * Unified Dialog Component - spageti kod çözümü
 * Tüm dialog variant'larını tek component'te birleştir
 */
const UnifiedDialog = ({
  open,
  onClose,
  title,
  children,
  actions = [],
  maxWidth = 'md',
  fullWidth = true,
  loading = false,
  error = '',
  showCloseButton = true,
  disableBackdropClick = false,
  customActions,
}) => {
  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };

  const renderDefaultActions = () => {
    if (customActions) {
      return customActions;
    }

    return actions.map((action, index) => (
      <Button
        key={index}
        onClick={action.onClick}
        color={action.color || 'primary'}
        variant={action.variant || 'text'}
        disabled={action.disabled || loading}
        startIcon={action.startIcon}
        endIcon={action.endIcon}
      >
        {action.label}
      </Button>
    ));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 200,
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box
            component='span'
            sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}
          >
            {title}
          </Box>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              sx={{
                color: 'grey.500',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent sx={{ py: 3 }}>
        <LoadingWrapper loading={loading} error={error} minHeight={100}>
          {children}
        </LoadingWrapper>
      </DialogContent>

      {/* Dialog Actions */}
      {(actions.length > 0 || customActions) && (
        <>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            {renderDefaultActions()}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

/**
 * Confirm Dialog - Özel confirm dialog variant'ı
 */
export const ConfirmDialog = ({
  open,
  onClose,
  title = 'Onaylayın',
  message,
  confirmText = 'Evet',
  cancelText = 'Hayır',
  onConfirm,
  confirmColor = 'error',
  loading = false,
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <UnifiedDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth='sm'
      loading={loading}
      actions={[
        {
          label: cancelText,
          onClick: onClose,
          variant: 'outlined',
        },
        {
          label: confirmText,
          onClick: handleConfirm,
          variant: 'contained',
          color: confirmColor,
        },
      ]}
    >
      <Typography variant='body1'>{message}</Typography>
    </UnifiedDialog>
  );
};

/**
 * Form Dialog - Form içeren dialog'lar için
 */
export const FormDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  onCancel,
  submitText = 'Kaydet',
  cancelText = 'İptal',
  submitDisabled = false,
  loading = false,
  error = '',
}) => {
  const handleSubmit = async () => {
    if (onSubmit) {
      const result = await onSubmit();
      if (result !== false) {
        onClose();
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <UnifiedDialog
      open={open}
      onClose={onClose}
      title={title}
      loading={loading}
      error={error}
      disableBackdropClick={true}
      actions={[
        {
          label: cancelText,
          onClick: handleCancel,
          variant: 'outlined',
        },
        {
          label: submitText,
          onClick: handleSubmit,
          variant: 'contained',
          disabled: submitDisabled,
        },
      ]}
    >
      {children}
    </UnifiedDialog>
  );
};

export default UnifiedDialog;
