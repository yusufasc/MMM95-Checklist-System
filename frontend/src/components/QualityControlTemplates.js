import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { qualityControlAPI, rolesAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useAuth } from '../contexts/AuthContext';

const QualityControlTemplates = () => {
  const { hasModulePermission } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    aciklama: '',
    rol: '',
    aktif: true,
    maddeler: [],
    degerlendirmeSaatleri: [],
    degerlendirmeSikligi: 'Günlük',
    degerlendirmePeriyodu: 2,
  });
  const [itemFormData, setItemFormData] = useState({
    baslik: '',
    aciklama: '',
    maksimumPuan: 10,
  });

  const canEdit = hasModulePermission('Kalite Kontrol', 'duzenleyebilir');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, rolesRes] = await Promise.all([
        qualityControlAPI.getTemplates(),
        rolesAPI.getAll(),
      ]);
      setTemplates(templatesRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      showSnackbar(
        `Veriler yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setFormData({
      ad: '',
      aciklama: '',
      rol: '',
      aktif: true,
      maddeler: [],
      degerlendirmeSaatleri: [],
      degerlendirmeSikligi: 'Günlük',
      degerlendirmePeriyodu: 2,
    });
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = template => {
    // Mevcut maddelere geçici id ekle (düzenleme için)
    const maddelerWithTempIds = (template.maddeler || []).map((madde, index) => ({
      ...madde,
      id: madde._id || `temp_${Date.now()}_${index}`,
    }));

    setFormData({
      ad: template.ad,
      aciklama: template.aciklama,
      rol: template.rol._id,
      aktif: template.aktif,
      maddeler: maddelerWithTempIds,
      degerlendirmeSaatleri: template.degerlendirmeSaatleri || [],
      degerlendirmeSikligi: template.degerlendirmeSikligi || 'Günlük',
      degerlendirmePeriyodu: template.degerlendirmePeriyodu || 2,
    });
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = template => {
    setSelectedTemplate(template);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (forceDelete = false) => {
    try {
      if (forceDelete) {
        // Zorla silme - backend'de force parametresi ile
        await qualityControlAPI.deleteTemplate(selectedTemplate._id, { force: true });
        showSnackbar('Şablon ve bağımlılıkları başarıyla silindi', 'success');
      } else {
        // Normal silme
        await qualityControlAPI.deleteTemplate(selectedTemplate._id);
        showSnackbar('Şablon başarıyla silindi', 'success');
      }

      setDeleteDialogOpen(false);
      setDeleteError(null);
      loadData();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.canForceDelete) {
        // Bağımlılık hatası - zorla silme seçeneği sun
        setDeleteError({
          message: error.response.data.message,
          canForceDelete: true,
          dependencyCount: error.response.data.dependencyCount,
        });
      } else {
        showSnackbar(
          `Şablon silinirken hata oluştu: ${error.response?.data?.message || error.message}`,
          'error',
        );
        setDeleteDialogOpen(false);
      }
    }
  };

  // const handleFormChange = (field, value) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // };

  // const handleMaddeChange = (index, field, value) => {
  //   const newMaddeler = [...formData.maddeler];
  //   newMaddeler[index] = { ...newMaddeler[index], [field]: value };
  //   setFormData(prev => ({ ...prev, maddeler: newMaddeler }));
  // };

  // const handleMaddeAdd = () => {
  //   setFormData(prev => ({
  //     ...prev,
  //     maddeler: [
  //       ...prev.maddeler,
  //       {
  //         baslik: '',
  //         aciklama: '',
  //         maksimumPuan: 10,
  //         zorunlu: true,
  //       },
  //     ],
  //   }));
  // };

  // const handleMaddeDelete = (index) => {
  //   const newMaddeler = formData.maddeler.filter((_, i) => i !== index);
  //   setFormData(prev => ({ ...prev, maddeler: newMaddeler }));
  // };

  const handleSaveTemplate = async () => {
    try {
      // Geçici id'leri ve MongoDB _id'leri temizle
      const cleanedMaddeler = formData.maddeler.map(madde => {
        const { id, _id, ...cleanMadde } = madde;
        return cleanMadde;
      });

      const templateData = {
        ...formData,
        maddeler: cleanedMaddeler,
        toplamMaksimumPuan: cleanedMaddeler.reduce((sum, item) => sum + item.maksimumPuan, 0),
      };

      if (selectedTemplate) {
        await qualityControlAPI.updateTemplate(selectedTemplate._id, templateData);
        showSnackbar('Şablon başarıyla güncellendi', 'success');
      } else {
        await qualityControlAPI.createTemplate(templateData);
        showSnackbar('Şablon başarıyla oluşturuldu', 'success');
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      showSnackbar(
        'Şablon kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message),
        'error',
      );
    }
  };

  const handleAddItem = () => {
    if (!itemFormData.baslik.trim()) {
      showSnackbar('Madde başlığı gereklidir', 'warning');
      return;
    }

    // Geçici string ID kullan (MongoDB ObjectId ile karışmaması için)
    const newItem = {
      ...itemFormData,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setFormData(prev => ({
      ...prev,
      maddeler: [...prev.maddeler, newItem],
    }));

    setItemFormData({
      baslik: '',
      aciklama: '',
      maksimumPuan: 10,
    });
  };

  const handleRemoveItem = index => {
    setFormData(prev => ({
      ...prev,
      maddeler: prev.maddeler.filter((_, i) => i !== index),
    }));
  };

  // const handleToggleTemplateStatus = async (template) => {
  //   try {
  //     await qualityControlAPI.updateTemplate(template._id, {
  //       ...template,
  //       aktif: !template.aktif,
  //     });
  //     showSnackbar(`Şablon ${!template.aktif ? 'aktif' : 'pasif'} edildi`, 'success');
  //     loadData();
  //   } catch (error) {
  //     showSnackbar('Durum güncellenirken hata oluştu', 'error');
  //   }
  // };

  const getTotalScore = maddeler => {
    return maddeler?.reduce((sum, madde) => sum + madde.maksimumPuan, 0) || 0;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Başlık ve Ekle Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Değerlendirme Şablonları
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{
              background: 'linear-gradient(45deg, #9c27b0, #673ab7)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7b1fa2, #5e35b1)',
              },
            }}
          >
            Yeni Şablon
          </Button>
        )}
      </Box>

      {/* Şablon Listesi */}
      {templates.length === 0 ? (
        <Alert severity="info">Henüz değerlendirme şablonu oluşturulmamış.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Şablon Adı</TableCell>
                <TableCell>Hedef Rol</TableCell>
                <TableCell>Madde Sayısı</TableCell>
                <TableCell>Toplam Puan</TableCell>
                <TableCell>Değerlendirme Saatleri</TableCell>
                <TableCell>Periyot</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Oluşturan</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map(template => (
                <TableRow key={template._id}>
                  <TableCell>{template.ad}</TableCell>
                  <TableCell>
                    <Chip label={template.rol.ad} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{template.maddeler.length}</TableCell>
                  <TableCell>{getTotalScore(template.maddeler)}</TableCell>
                  <TableCell>
                    {template.degerlendirmeSaatleri?.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {template.degerlendirmeSaatleri.map((saat, index) => (
                          <Chip
                            key={index}
                            label={saat.saat}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Chip label="Her Zaman" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${template.degerlendirmePeriyodu || 2}h`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={template.aktif ? 'Aktif' : 'Pasif'}
                      size="small"
                      color={template.aktif ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {template.olusturanKullanici?.ad} {template.olusturanKullanici?.soyad}
                  </TableCell>
                  <TableCell align="right">
                    {canEdit && (
                      <>
                        <IconButton onClick={() => handleEdit(template)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(template)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Şablon Ekleme/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Şablon Adı"
                  value={formData.ad}
                  onChange={e => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Hedef Rol</InputLabel>
                  <Select
                    value={formData.rol}
                    label="Hedef Rol"
                    onChange={e => setFormData(prev => ({ ...prev, rol: e.target.value }))}
                  >
                    {roles.map(role => (
                      <MenuItem key={role._id} value={role._id}>
                        {role.ad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Değerlendirme Saatleri */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Değerlendirme Saatleri
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>ÖNEMLİ:</strong> Değerlendirme saati eklemezseniz, şablon 24 saat
                    boyunca kullanılabilir olacaktır. Saat eklerseniz, sadece belirlenen saatlerden
                    sonraki periyot süresince değerlendirme yapılabilir.
                  </Typography>
                </Alert>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {(formData.degerlendirmeSaatleri || []).map((saat, index) => (
                    <Chip
                      key={index}
                      label={`${saat.saat} - ${saat.aciklama || 'Değerlendirme'}`}
                      onDelete={() => {
                        const newSaatler = formData.degerlendirmeSaatleri.filter(
                          (_, i) => i !== index,
                        );
                        setFormData(prev => ({ ...prev, degerlendirmeSaatleri: newSaatler }));
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    size="small"
                    label="Saat"
                    type="time"
                    value={formData.newSaat || ''}
                    onChange={e => setFormData(prev => ({ ...prev, newSaat: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 130 }}
                  />
                  <TextField
                    size="small"
                    label="Açıklama"
                    value={formData.newSaatAciklama || ''}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, newSaatAciklama: e.target.value }))
                    }
                    placeholder="Sabah Vardiyası"
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (!formData.newSaat) {
                        return;
                      }
                      const newSaat = {
                        saat: formData.newSaat,
                        aciklama: formData.newSaatAciklama || 'Değerlendirme',
                      };
                      setFormData(prev => ({
                        ...prev,
                        degerlendirmeSaatleri: [...(prev.degerlendirmeSaatleri || []), newSaat],
                        newSaat: '',
                        newSaatAciklama: '',
                      }));
                    }}
                    disabled={!formData.newSaat}
                  >
                    Ekle
                  </Button>
                </Box>
              </Grid>

              {/* Değerlendirme Sıklığı */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Değerlendirme Sıklığı</InputLabel>
                  <Select
                    value={formData.degerlendirmeSikligi || 'Günlük'}
                    label="Değerlendirme Sıklığı"
                    onChange={e =>
                      setFormData(prev => ({ ...prev, degerlendirmeSikligi: e.target.value }))
                    }
                  >
                    <MenuItem value="Günlük">Günlük</MenuItem>
                    <MenuItem value="Haftalık">Haftalık</MenuItem>
                    <MenuItem value="Aylık">Aylık</MenuItem>
                    <MenuItem value="Özel">Özel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Değerlendirme Periyodu */}
              <Grid item xs={12} md={6}>
                <Box sx={{ px: 2, mt: 2 }}>
                  <Typography gutterBottom variant="subtitle2" fontWeight="bold">
                    Değerlendirme Periyodu: {formData.degerlendirmePeriyodu} saat
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    Belirlenen saatten sonra kaç saat boyunca değerlendirme yapılabilir
                  </Typography>
                  <Slider
                    value={formData.degerlendirmePeriyodu || 2}
                    onChange={(e, value) =>
                      setFormData(prev => ({ ...prev, degerlendirmePeriyodu: value }))
                    }
                    min={1}
                    max={8}
                    marks={[
                      { value: 1, label: '1h' },
                      { value: 2, label: '2h' },
                      { value: 4, label: '4h' },
                      { value: 6, label: '6h' },
                      { value: 8, label: '8h' },
                    ]}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{
                      '& .MuiSlider-mark': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.75rem',
                      },
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={2}
                  value={formData.aciklama}
                  onChange={e => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.aktif}
                      onChange={e => setFormData(prev => ({ ...prev, aktif: e.target.checked }))}
                    />
                  }
                  label="Aktif"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Değerlendirme Maddeleri */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Değerlendirme Maddeleri
            </Typography>

            {/* Yeni Madde Ekleme Formu */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Yeni Madde Ekle
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Madde Başlığı"
                    value={itemFormData.baslik}
                    onChange={e => setItemFormData(prev => ({ ...prev, baslik: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>Maksimum Puan: {itemFormData.maksimumPuan}</Typography>
                    <Slider
                      value={itemFormData.maksimumPuan}
                      onChange={(e, value) =>
                        setItemFormData(prev => ({ ...prev, maksimumPuan: value }))
                      }
                      min={1}
                      max={100}
                      marks
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Açıklama (İsteğe Bağlı)"
                    value={itemFormData.aciklama}
                    onChange={e => setItemFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fotoğraf ekleme her madde için isteğe bağlıdır
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    size="small"
                  >
                    Madde Ekle
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Eklenen Maddeler Listesi */}
            {formData.maddeler.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Eklenen Maddeler ({formData.maddeler.length})
                </Typography>
                <List>
                  {formData.maddeler.map((madde, index) => (
                    <ListItem key={madde.id || index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {index + 1}. {madde.baslik}
                            </Typography>
                            <Chip
                              label={`${madde.maksimumPuan} puan`}
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {madde.aciklama && (
                              <Typography variant="body2" color="text.secondary">
                                {madde.aciklama}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveItem(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Toplam Puan:</strong> {getTotalScore(formData.maddeler)} puan
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<CancelIcon />}>
            İptal
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(45deg, #9c27b0, #673ab7)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7b1fa2, #5e35b1)',
              },
            }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gelişmiş Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disablePortal={false}
        hideBackdrop={false}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ bgcolor: 'error.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DeleteIcon />
            <Typography variant="h6">Şablon Silme Onayı</Typography>
          </Box>
        </DialogTitle>
        <DialogContent id="delete-dialog-description">
          {/* Uyarı mesajı */}
          <Alert severity="warning" sx={{ mb: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon />
              <Typography variant="body2">Bu işlem geri alınamaz!</Typography>
            </Box>
          </Alert>

          {/* Bağımlılık uyarısı */}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {deleteError.message}
              </Typography>
              {deleteError.canForceDelete && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Zorla Silme:</strong> Tüm bağımlılıkları iptal ederek silebilirsiniz.
                </Typography>
              )}
            </Alert>
          )}

          {/* Silinecek şablon bilgileri */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
            <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
              {selectedTemplate?.ad}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Hedef Rol: {selectedTemplate?.rol?.ad}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Madde Sayısı: {selectedTemplate?.maddeler?.length || 0}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteError(null);
            }}
            variant="outlined"
          >
            İptal
          </Button>
          <Button
            onClick={() => confirmDelete(false)}
            color="error"
            variant="outlined"
            disabled={deleteError?.canForceDelete}
          >
            Normal Sil
          </Button>
          {deleteError?.canForceDelete && (
            <Button
              onClick={() => confirmDelete(true)}
              color="error"
              variant="contained"
              startIcon={<WarningIcon />}
              sx={{
                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #d32f2f, #c62828)',
                },
              }}
            >
              🚨 Zorla Sil
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityControlTemplates;
