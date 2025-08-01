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
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  GetApp as GetAppIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import EmojiWrapper from '../EmojiWrapper';

/**
 * 📊 Meeting Excel Dialog Component
 * Excel import/export için dialog (MMM95 pattern)
 */
const MeetingExcelDialog = ({ open, onClose, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: Import, 1: Export, 2: Template
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef(null);

  const handleClose = () => {
    setActiveTab(0);
    setFile(null);
    setUploading(false);
    setDownloading(false);
    setUploadResult(null);
    setError('');
    setUploadProgress(0);
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setUploadResult(null);
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
    if (!file) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const response = await api.meetingExcel.importFromExcel(
        file,
        progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(progress);
        },
      );

      setUploadResult(response.data);

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      console.log('📊 Meeting Excel import success:', response.data);
    } catch (error) {
      console.error('❌ Meeting Excel import error:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Excel import hatası oluştu';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      setError('');

      console.log('📊 Downloading meeting Excel template...');

      const response = await api.meetingExcel.downloadTemplate();

      // Blob URL oluştur ve download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `toplanti_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Meeting Excel template downloaded successfully');
    } catch (error) {
      console.error('❌ Meeting Excel template download error:', error);

      const errorMessage =
        error.response?.data?.message || 'Excel şablonu indirilemedi';
      setError(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const handleExportMeetings = async () => {
    try {
      setDownloading(true);
      setError('');

      console.log('📊 Exporting meetings to Excel...');

      const response = await api.meetingExcel.exportMeetings();

      // Blob URL oluştur ve download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `toplanti_listesi_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Meetings exported to Excel successfully');
    } catch (error) {
      console.error('❌ Meeting Excel export error:', error);

      const errorMessage =
        error.response?.data?.message || 'Excel export hatası oluştu';
      setError(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    setError('');
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6' component='div' sx={{ fontWeight: 'bold' }}>
            <EmojiWrapper emoji='📊' label='grafik' /> Toplantı Excel İşlemleri
          </Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mt: 1 }}>
          <Tab
            label='📤 Import'
            icon={<FileUploadIcon />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
          <Tab
            label='📥 Export'
            icon={<DownloadIcon />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
          <Tab
            label='📋 Şablon'
            icon={<DescriptionIcon />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* IMPORT TAB */}
        {activeTab === 0 && (
          <Box>
            <Typography variant='h6' gutterBottom>
              Excel'den Toplantı İmport Et
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Toplantıları toplu olarak sisteme aktarmak için Excel dosyası
              yükleyin.
            </Typography>

            {!uploadResult ? (
              <Paper
                variant='outlined'
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: file ? 'primary.main' : 'grey.300',
                  bgcolor: file ? 'primary.50' : 'grey.50',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.xlsx,.xls'
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <UploadIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
                />

                {file ? (
                  <Box>
                    <Typography variant='body1' fontWeight='bold'>
                      {file.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant='body1' fontWeight='bold'>
                      Excel dosyası seçmek için tıklayın
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      .xlsx veya .xls formatında, maksimum 10MB
                    </Typography>
                  </Box>
                )}

                {uploading && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress
                      variant='determinate'
                      value={uploadProgress}
                    />
                    <Typography variant='caption' sx={{ ml: 1 }}>
                      %{uploadProgress}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ) : (
              <Alert severity='success' sx={{ mb: 2 }}>
                <Typography variant='body1' fontWeight='bold'>
                  <EmojiWrapper emoji='✅' label='başarılı' /> Excel Import
                  Tamamlandı!
                </Typography>
                <Typography variant='body2'>
                  Toplam: {uploadResult.toplamSatir} satır işlendi
                </Typography>
                <Typography variant='body2'>
                  Başarılı: {uploadResult.basariliSayisi} toplantı oluşturuldu
                </Typography>
                {uploadResult.hataliSayisi > 0 && (
                  <Typography variant='body2' color='warning.main'>
                    Hatalı: {uploadResult.hataliSayisi} satır
                  </Typography>
                )}

                {uploadResult.hatalar && uploadResult.hatalar.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant='caption' color='text.secondary'>
                      İlk 5 hata:
                    </Typography>
                    <List dense>
                      {uploadResult.hatalar.slice(0, 5).map((hata, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={hata}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        )}

        {/* EXPORT TAB */}
        {activeTab === 1 && (
          <Box>
            <Typography variant='h6' gutterBottom>
              Toplantıları Excel'e Export Et
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Sistemdeki tüm toplantıları Excel dosyası olarak indirin.
            </Typography>

            <Paper variant='outlined' sx={{ p: 3, textAlign: 'center' }}>
              <GetAppIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant='body1' fontWeight='bold' gutterBottom>
                Toplantıları Excel'e Aktar
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Tüm toplantı bilgileri, katılımcılar ve detaylar dahil
              </Typography>

              <Button
                variant='contained'
                color='success'
                size='large'
                onClick={handleExportMeetings}
                disabled={downloading}
                startIcon={
                  downloading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DownloadIcon />
                  )
                }
              >
                {downloading ? 'İndiriliyor...' : 'Excel İndir'}
              </Button>
            </Paper>
          </Box>
        )}

        {/* TEMPLATE TAB */}
        {activeTab === 2 && (
          <Box>
            <Typography variant='h6' gutterBottom>
              Excel Şablonu İndir
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Toplantı import etmek için kullanabileceğiniz Excel şablonunu
              indirin.
            </Typography>

            <Paper variant='outlined' sx={{ p: 3, textAlign: 'center' }}>
              <DescriptionIcon
                sx={{ fontSize: 48, color: 'info.main', mb: 2 }}
              />
              <Typography variant='body1' fontWeight='bold' gutterBottom>
                Toplantı Excel Şablonu
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Örnek veriler ve açıklamalar dahil hazır şablon
              </Typography>

              <Button
                variant='contained'
                color='info'
                size='large'
                onClick={handleDownloadTemplate}
                disabled={downloading}
                startIcon={
                  downloading ? <CircularProgress size={20} /> : <GetAppIcon />
                }
              >
                {downloading ? 'İndiriliyor...' : 'Şablon İndir'}
              </Button>
            </Paper>

            {/* Şablon Açıklaması */}
            <Alert severity='info' sx={{ mt: 2 }}>
              <Typography variant='body2' fontWeight='bold' gutterBottom>
                <EmojiWrapper emoji='📋' label='şablon' /> Şablon Kullanım
                Kılavuzu:
              </Typography>
              <Typography variant='caption' component='div'>
                • Başlık ve Tarih alanları zorunludur
                <br />
                • Tarih formatı: YYYY-MM-DD (örn: 2025-01-22)
                <br />
                • Saat formatı: HH:MM (örn: 09:30)
                <br />
                • Email'ler virgül (,) ile ayrılmalı
                <br />
                • Gündem maddeleri pipe (|) ile ayrılmalı
                <br />• Kategori, Durum, Öncelik değerleri şablonda
                belirtilmiştir
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {activeTab === 0 && (
          <>
            {file && !uploadResult && (
              <Button onClick={resetFileInput} color='secondary'>
                Dosyayı Değiştir
              </Button>
            )}
            {uploadResult && (
              <Button onClick={resetFileInput} color='primary'>
                Yeni Import
              </Button>
            )}
            <Button onClick={handleClose}>
              {uploadResult ? 'Kapat' : 'İptal'}
            </Button>
            {file && !uploadResult && (
              <Button
                variant='contained'
                onClick={handleUpload}
                disabled={uploading}
                startIcon={
                  uploading ? <CircularProgress size={20} /> : <UploadIcon />
                }
              >
                {uploading ? 'Yükleniyor...' : 'Import Et'}
              </Button>
            )}
          </>
        )}

        {(activeTab === 1 || activeTab === 2) && (
          <Button onClick={handleClose}>Kapat</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

MeetingExcelDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUploadSuccess: PropTypes.func,
};

export default MeetingExcelDialog;
