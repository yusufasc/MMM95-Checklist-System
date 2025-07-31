import React from 'react';
import PropTypes from 'prop-types';
import { Fab } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { FAB_CONFIG } from '../../../utils/qualityEvaluationConfig';

const SaveButton = ({ loading, onSave, visible }) => {
  if (!visible) {
    return null;
  }

  return (
    <Fab
      color='primary'
      variant='extended'
      onClick={onSave}
      disabled={loading}
      sx={{
        position: FAB_CONFIG.position,
        bottom: FAB_CONFIG.bottom,
        right: FAB_CONFIG.right,
        zIndex: FAB_CONFIG.zIndex,
        background: FAB_CONFIG.background,
        '&:hover': {
          background: FAB_CONFIG.hoverBackground,
        },
      }}
    >
      <SaveIcon sx={{ mr: 1 }} />
      {loading ? 'Kaydediliyor...' : 'Kaydet'}
    </Fab>
  );
};

SaveButton.propTypes = {
  loading: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
};

export default SaveButton;
