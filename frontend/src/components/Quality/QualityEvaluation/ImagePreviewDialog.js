import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { IMAGE_PREVIEW_CONFIG } from '../../../utils/qualityEvaluationConfig';

const ImagePreviewDialog = ({ open, imageUrl, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={IMAGE_PREVIEW_CONFIG.maxWidth}
      fullWidth={IMAGE_PREVIEW_CONFIG.fullWidth}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 1 }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt='Fotoğraf önizleme'
              style={IMAGE_PREVIEW_CONFIG.style}
            />
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

ImagePreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  imageUrl: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ImagePreviewDialog;
