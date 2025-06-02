import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { inventoryAPI } from '../services/api';

const ExcelUploadDialog = ({ open, onClose, categories, onUploadSuccess }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: File selection, 2: Upload, 3: Result
  const fileInputRef = React.useRef(null);

  const handleClose = () => {
    setSelectedCategory('');
    setFile(null);
    setUploading(false);
    setUploadResult(null);
    setError('');
    setStep(1);
    onClose();
  };

  const handleFileSelect = event => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Dosya tipi kontrolü
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya boyutu 10MB'den küçük olmalıdır");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFile(file);
    setError('');
  };

  const handleUpload = async () => {
    if (!file || !selectedCategory) {
      setError('Lütfen dosya ve kategori seçin');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setStep(2);

      const formData = new FormData();
      formData.append('file', file);

      const response = await inventoryAPI.importExcel(selectedCategory, formData);

      setUploadResult(response.data);
      setStep(3);

      // Başarılı upload sonrası callback
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      let errorMessage = 'Excel dosyası yüklenirken hata oluştu';

      if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Geçersiz dosya formatı veya kategori ID';
      } else if (error.response?.status === 413) {
        errorMessage = 'Dosya boyutu çok büyük';
      } else if (error.response?.status === 500) {
        errorMessage = error.response.data.message || 'Sunucu hatası';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
      setStep(1);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedCategory) {
      setError('Lütfen önce kategori seçin');
      return;
    }

    try {
      const response = await inventoryAPI.downloadExcelTemplate(selectedCategory);

      // Blob'u dosya olarak indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const category = categories.find(c => c._id === selectedCategory);
      link.setAttribute('download', `envanter_template_${category?.ad || 'kategori'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Şablon indirme hatası:', error);
      }
      setError('Şablon indirme hatası');
    }
  };

  const renderFileSelection = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Kategori</InputLabel>
        <Select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          label="Kategori"
        >
          {categories.map(category => (
            <MenuItem key={category._id} value={category._id}>
              {category.ad}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Excel Dosyası Seçin
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sadece .xlsx ve .xls dosyaları desteklenmektedir
        </Typography>

        <input
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          id="excel-file-input"
          type="file"
          onChange={handleFileSelect}
          ref={fileInputRef}
        />
        <label htmlFor="excel-file-input">
          <Button variant="outlined" component="span">
            Dosya Seç
          </Button>
        </label>

        {file && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Seçilen dosya: {file.name}
          </Typography>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={handleDownloadTemplate}
          disabled={!selectedCategory}
        >
          Excel Şablonu İndir
        </Button>
      </Box>
    </Box>
  );

  const renderFileUpload = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Dosya Yükleniyor...
      </Typography>
      <CircularProgress sx={{ mt: 2, mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Lütfen bekleyin, dosya işleniyor
      </Typography>
    </Box>
  );

  const renderUploadResult = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
        <Typography variant="h6">Yükleme Tamamlandı</Typography>
      </Box>

      {uploadResult && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>{uploadResult.basariliSayisi}</strong> kayıt başarıyla eklendi
            {uploadResult.toplamSatir && <span> (Toplam {uploadResult.toplamSatir} satırdan)</span>}
          </Alert>

          {uploadResult.hataSayisi > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadResult.hataSayisi} hataya sahip satır bulundu
            </Alert>
          )}

          {uploadResult.uyariSayisi > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {uploadResult.uyariSayisi} uyarı bulundu
            </Alert>
          )}

          {uploadResult.duplicateSayisi > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {uploadResult.duplicateSayisi} duplicate kayıt bulundu
            </Alert>
          )}

          {(uploadResult.hataSayisi > 0 ||
            uploadResult.uyariSayisi > 0 ||
            uploadResult.duplicateSayisi > 0) && (
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Detaylar:
              </Typography>
              <List dense>
                {uploadResult.hatalar &&
                  uploadResult.hatalar.map((error, index) => (
                    <ListItem key={`error-${index}`}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Satır ${error.row}: ${error.errors ? error.errors.join(', ') : error.message || 'Bilinmeyen hata'}`}
                        secondary={error.envanterKodu ? `Envanter Kodu: ${error.envanterKodu}` : ''}
                      />
                    </ListItem>
                  ))}
                {uploadResult.uyarilar &&
                  uploadResult.uyarilar.map((warning, index) => (
                    <ListItem key={`warning-${index}`}>
                      <ListItemIcon>
                        <ErrorIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={`Satır ${warning.row}: ${warning.message}`} />
                    </ListItem>
                  ))}
                {uploadResult.duplicates &&
                  uploadResult.duplicates.map((duplicate, index) => (
                    <ListItem key={`duplicate-${index}`}>
                      <ListItemIcon>
                        <ErrorIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Satır ${duplicate.row}: ${duplicate.message}`}
                        secondary={`Envanter Kodu: ${duplicate.envanterKodu}`}
                      />
                    </ListItem>
                  ))}
              </List>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: 400 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">
          Excel Dosyası Yükle
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 1 && renderFileSelection()}
        {step === 2 && renderFileUpload()}
        {step === 3 && renderUploadResult()}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={uploading}>
          {step === 3 ? 'Kapat' : 'İptal'}
        </Button>

        {step === 1 && (
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedCategory || !file || uploading}
          >
            Yükle
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

ExcelUploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.array.isRequired,
  onUploadSuccess: PropTypes.func.isRequired,
};

export default ExcelUploadDialog;
