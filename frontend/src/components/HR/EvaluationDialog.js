import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';

const EvaluationDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Değerlendirme Dialog'u</DialogTitle>
      <DialogContent>
        <Alert severity='info'>
          Bu component henüz oluşturulmadı. Mevcut HR.js dosyasından extract
          edilecek.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EvaluationDialog;
