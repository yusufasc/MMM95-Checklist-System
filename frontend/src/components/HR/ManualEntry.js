import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  EventBusy as EventBusyIcon,
  CalendarToday as CalendarTodayIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  GetApp as GetAppIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { hrAPI } from '../../services/api';

const ManualEntry = ({ users, hrYetkileri, onSuccess }) => {
  const [formData, setFormData] = useState({
    kullaniciId: '',
    tip: 'mesai',
    yil: new Date().getFullYear(),
    ay: new Date().getMonth() + 1,
    miktar: '',
    aciklama: '',
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [settings, setSettings] = useState(null);

  // Excel state'leri
  const [excelLoading, setExcelLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);

  // Ayarları yükle
  useEffect(() => {
    loadSettings();
  }, []);

  // Seçili kullanıcının kayıtlarını yükle
  useEffect(() => {
    if (selectedUser) {
      loadUserEntries(selectedUser._id);
    }
  }, [selectedUser]);

  const loadSettings = async () => {
    try {
      const response = await hrAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    }
  };

  const loadUserEntries = async userId => {
    try {
      setLoading(true);
      const response = await hrAPI.getManualEntries(userId);
      setEntries(response.data);
    } catch (error) {
      console.error('Kayıtlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.kullaniciId || !formData.miktar) {
      onSuccess('Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    try {
      setLoading(true);

      // Aylık giriş için backend'e gönderilen veri
      const entryData = {
        kullaniciId: formData.kullaniciId,
        tip: formData.tip,
        yil: formData.yil,
        ay: formData.ay,
        miktar: parseFloat(formData.miktar),
        aciklama: formData.aciklama,
        aylikkGirisTipi: true, // Aylık giriş olduğunu belirt
      };

      await hrAPI.createManualEntry(entryData);
      onSuccess('Aylık kayıt başarıyla eklendi', 'success');

      // Formu temizle
      setFormData({
        ...formData,
        miktar: '',
        aciklama: '',
      });

      // Kayıtları yenile
      if (selectedUser) {
        loadUserEntries(selectedUser._id);
      }
    } catch (error) {
      onSuccess(
        error.response?.data?.message || 'Kayıt eklenirken hata oluştu',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (event, newValue) => {
    setSelectedUser(newValue);
    setFormData({
      ...formData,
      kullaniciId: newValue?._id || '',
    });
  };

  const calculateScore = () => {
    if (!settings || !formData.miktar) {
      return 0;
    }

    const miktar = parseFloat(formData.miktar);
    if (isNaN(miktar)) {
      return 0;
    }

    if (formData.tip === 'mesai') {
      return miktar * settings.mesaiPuanlama.saatBasinaPuan;
    } else if (formData.tip === 'devamsizlik_gun') {
      return miktar * settings.devamsizlikPuanlama.gunBasinaPuan;
    } else if (formData.tip === 'devamsizlik_saat') {
      return miktar * settings.devamsizlikPuanlama.saatBasinaPuan;
    }

    return 0;
  };

  const getEntryIcon = tip => {
    switch (tip) {
      case 'mesai':
        return <AccessTimeIcon fontSize='small' />;
      case 'devamsizlik_gun':
      case 'devamsizlik_saat':
        return <EventBusyIcon fontSize='small' />;
      default:
        return null;
    }
  };

  const getEntryLabel = tip => {
    switch (tip) {
      case 'mesai':
        return 'Fazla Mesai';
      case 'devamsizlik_gun':
        return 'Devamsızlık (Gün)';
      case 'devamsizlik_saat':
        return 'Devamsızlık (Saat)';
      default:
        return tip;
    }
  };

  const getEntryColor = tip => {
    switch (tip) {
      case 'mesai':
        return 'success';
      case 'devamsizlik_gun':
      case 'devamsizlik_saat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Ay listesi
  const aylar = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' },
  ];

  // Yıl listesi (son 3 yıl)
  const currentYear = new Date().getFullYear();
  const yillar = [];
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    yillar.push(i);
  }

  // Excel İndirme
  const handleDownloadExcel = async () => {
    try {
      setExcelLoading(true);

      const response = await hrAPI.downloadExcel();

      // Blob oluştur ve indir
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personel_mesai_devamsizlik_sablonu_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onSuccess('Excel şablonu başarıyla indirildi', 'success');
    } catch (error) {
      console.error('Excel indirme hatası:', error);
      onSuccess(
        error.response?.data?.message || 'Excel indirme sırasında hata oluştu',
        'error',
      );
    } finally {
      setExcelLoading(false);
    }
  };

  // Excel Yükleme Dialog Aç
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setUploadFile(null);
    setUploadResults(null);
    setUploadProgress(0);
  };

  // Excel Dosya Seç
  const handleFileSelect = event => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  // Excel Yükleme
  const handleUploadExcel = async () => {
    if (!uploadFile) {
      onSuccess('Lütfen bir dosya seçin', 'error');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('file', uploadFile);

      setUploadProgress(50);

      const response = await hrAPI.uploadExcel(formData);

      setUploadProgress(100);
      setUploadResults(response.data.results);

      onSuccess(response.data.message, 'success');

      // Seçili kullanıcının kayıtlarını yenile
      if (selectedUser) {
        loadUserEntries(selectedUser._id);
      }
    } catch (error) {
      console.error('Excel yükleme hatası:', error);
      onSuccess(
        error.response?.data?.message || 'Excel yükleme sırasında hata oluştu',
        'error',
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Upload Dialog Kapat
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadFile(null);
    setUploadResults(null);
    setUploadProgress(0);
  };

  if (!hrYetkileri?.puanlamaYapabilir) {
    return (
      <Alert severity='warning'>
        Fazla mesai ve devamsızlık kaydı yapma yetkiniz bulunmamaktadır.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Excel Butonları */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
        >
          <GetAppIcon sx={{ mr: 1 }} />
          Excel ile Toplu İşlem
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant='outlined'
              fullWidth
              startIcon={
                excelLoading ? <CircularProgress size={20} /> : <DownloadIcon />
              }
              onClick={handleDownloadExcel}
              disabled={excelLoading}
              sx={{ height: 48 }}
            >
              {excelLoading
                ? 'İndiriliyor...'
                : 'Personel Excel Şablonunu İndir'}
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant='contained'
              fullWidth
              startIcon={<UploadIcon />}
              onClick={handleOpenUploadDialog}
              sx={{ height: 48 }}
            >
              Excel ile Toplu Yükle
            </Button>
          </Grid>
        </Grid>

        <Alert severity='info' sx={{ mt: 2 }}>
          <strong>İşlem Adımları:</strong> <br />
          1. "Personel Excel Şablonunu İndir" butonuna tıklayın <br />
          2. İndirilen Excel dosyasını açın ve mesai/devamsızlık bilgilerini
          girin <br />
          3. "Excel ile Toplu Yükle" butonuna tıklayarak dosyayı sisteme
          yükleyin
        </Alert>
      </Paper>

      {/* Giriş Formu */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
        >
          <CalendarTodayIcon sx={{ mr: 1 }} />
          Aylık Kayıt Ekle
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={users}
                getOptionLabel={option =>
                  `${option.ad} ${option.soyad} (${option.kullaniciAdi})`
                }
                value={selectedUser}
                onChange={handleUserChange}
                renderInput={params => (
                  <TextField {...params} label='Personel' required fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel>Kayıt Tipi</InputLabel>
                <Select
                  value={formData.tip}
                  onChange={e =>
                    setFormData({ ...formData, tip: e.target.value })
                  }
                  label='Kayıt Tipi'
                >
                  <MenuItem value='mesai'>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
                      Fazla Mesai (Aylık)
                    </Box>
                  </MenuItem>
                  <MenuItem value='devamsizlik_gun'>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventBusyIcon sx={{ mr: 1, fontSize: 20 }} />
                      Devamsızlık Gün (Aylık)
                    </Box>
                  </MenuItem>
                  <MenuItem value='devamsizlik_saat'>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventBusyIcon sx={{ mr: 1, fontSize: 20 }} />
                      Devamsızlık Saat (Aylık)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth required>
                <InputLabel>Yıl</InputLabel>
                <Select
                  value={formData.yil}
                  onChange={e =>
                    setFormData({ ...formData, yil: e.target.value })
                  }
                  label='Yıl'
                >
                  {yillar.map(yil => (
                    <MenuItem key={yil} value={yil}>
                      {yil}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <FormControl fullWidth required>
                <InputLabel>Ay</InputLabel>
                <Select
                  value={formData.ay}
                  onChange={e =>
                    setFormData({ ...formData, ay: e.target.value })
                  }
                  label='Ay'
                >
                  {aylar.map(ay => (
                    <MenuItem key={ay.value} value={ay.value}>
                      {ay.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                label={
                  formData.tip === 'mesai'
                    ? 'Toplam Saat'
                    : formData.tip === 'devamsizlik_gun'
                      ? 'Toplam Gün'
                      : 'Toplam Saat'
                }
                type='number'
                value={formData.miktar}
                onChange={e =>
                  setFormData({ ...formData, miktar: e.target.value })
                }
                fullWidth
                required
                inputProps={{ min: 0, step: 0.5 }}
                helperText={settings && `Puan: ${calculateScore()}`}
              />
            </Grid>

            <Grid item xs={12} md={9}>
              <TextField
                label='Açıklama'
                value={formData.aciklama}
                onChange={e =>
                  setFormData({ ...formData, aciklama: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                placeholder='Örn: Proje teslimi için fazla mesai, hastalık nedeniyle devamsızlık vb.'
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                type='submit'
                variant='contained'
                fullWidth
                size='large'
                startIcon={<AddIcon />}
                disabled={loading}
                sx={{ height: '100%' }}
              >
                Aylık Kaydet
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Kayıt Listesi */}
      {selectedUser && (
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom>
            {selectedUser.ad} {selectedUser.soyad} - Aylık Kayıt Geçmişi
          </Typography>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : entries.length === 0 ? (
            <Alert severity='info'>
              Bu personel için henüz aylık kayıt bulunmamaktadır.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dönem</TableCell>
                    <TableCell>Tip</TableCell>
                    <TableCell align='right'>Toplam Miktar</TableCell>
                    <TableCell align='right'>Puan</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell>Kaydeden</TableCell>
                    <TableCell align='center'>İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        {entry.donem
                          ? `${aylar.find(a => a.value === entry.donem.ay)?.label || entry.donem.ay} ${entry.donem.yil}`
                          : format(new Date(entry.tarih), 'MM.yyyy')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getEntryIcon(entry.tip)}
                          label={getEntryLabel(entry.tip)}
                          color={getEntryColor(entry.tip)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        {entry.miktar}{' '}
                        {entry.tip === 'mesai' ||
                        entry.tip === 'devamsizlik_saat'
                          ? 'saat'
                          : 'gün'}
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          variant='body2'
                          color={
                            entry.puan >= 0 ? 'success.main' : 'error.main'
                          }
                          fontWeight='bold'
                        >
                          {entry.puan > 0 ? '+' : ''}
                          {entry.puan}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.aciklama || '-'}</TableCell>
                      <TableCell>
                        {entry.olusturanKullanici?.ad}{' '}
                        {entry.olusturanKullanici?.soyad}
                      </TableCell>
                      <TableCell align='center'>
                        <Tooltip title='Sil'>
                          <IconButton size='small' color='error' disabled>
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Excel Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <CloudUploadIcon sx={{ mr: 1 }} />
          Excel ile Toplu Mesai/Devamsızlık Yükleme
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Bilgilendirme */}
            <Grid item xs={12}>
              <Alert severity='info'>
                <strong>Yeni Format:</strong> Excel dosyasında tarih bilgisi her
                satırda bulunmalıdır. Tarih formatı: "01/2025" veya "Ocak 2025"
              </Alert>
            </Grid>

            {/* Dosya Seçimi */}
            <Grid item xs={12}>
              <Typography variant='subtitle1' gutterBottom>
                Excel Dosyası
              </Typography>

              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: uploadFile ? '#f5f5f5' : 'transparent',
                }}
              >
                <input
                  type='file'
                  accept='.xlsx,.xls'
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id='excel-upload-input'
                />
                <label htmlFor='excel-upload-input'>
                  <Button
                    variant='outlined'
                    component='span'
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Dosya Seç
                  </Button>
                </label>

                {uploadFile ? (
                  <Typography variant='body2' color='text.secondary'>
                    Seçilen dosya: {uploadFile.name}
                  </Typography>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    Excel dosyası seçmek için tıklayın (.xlsx, .xls)
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Progress Bar */}
            {uploadProgress > 0 && (
              <Grid item xs={12}>
                <LinearProgress variant='determinate' value={uploadProgress} />
                <Typography variant='body2' sx={{ mt: 1 }} align='center'>
                  Yükleniyor... {uploadProgress}%
                </Typography>
              </Grid>
            )}

            {/* Upload Sonuçları */}
            {uploadResults && (
              <Grid item xs={12}>
                <Typography variant='subtitle1' gutterBottom>
                  Yükleme Sonuçları
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor: '#e8f5e8',
                        borderRadius: 1,
                      }}
                    >
                      <CheckCircleIcon
                        color='success'
                        sx={{ fontSize: 32, mb: 1 }}
                      />
                      <Typography variant='h6' color='success.main'>
                        {uploadResults.basarili}
                      </Typography>
                      <Typography variant='body2'>Başarılı</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor: '#fff3e0',
                        borderRadius: 1,
                      }}
                    >
                      <WarningIcon
                        color='warning'
                        sx={{ fontSize: 32, mb: 1 }}
                      />
                      <Typography variant='h6' color='warning.main'>
                        {uploadResults.islenmeyen || 0}
                      </Typography>
                      <Typography variant='body2'>İşlenmedi</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor: '#ffebee',
                        borderRadius: 1,
                      }}
                    >
                      <ErrorIcon color='error' sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant='h6' color='error.main'>
                        {uploadResults.hatali}
                      </Typography>
                      <Typography variant='body2'>Hatalı</Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Hata Listesi */}
                {uploadResults.hatalar && uploadResults.hatalar.length > 0 && (
                  <Box>
                    <Typography variant='subtitle2' gutterBottom color='error'>
                      Hatalar:
                    </Typography>
                    <List dense>
                      {uploadResults.hatalar.slice(0, 5).map((hata, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ErrorIcon color='error' fontSize='small' />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Satır ${hata.satir}: ${hata.kullanici}`}
                            secondary={hata.hata}
                          />
                        </ListItem>
                      ))}
                      {uploadResults.hatalar.length > 5 && (
                        <ListItem>
                          <ListItemText
                            primary={`... ve ${uploadResults.hatalar.length - 5} hata daha`}
                            sx={{ fontStyle: 'italic' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Kapat</Button>
          <Button
            variant='contained'
            onClick={handleUploadExcel}
            disabled={!uploadFile || loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <UploadIcon />
            }
          >
            {loading ? 'Yükleniyor...' : 'Excel Yükle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualEntry;
