import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { hrManagementAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const HRManagement = () => {
  const { hasModulePermission } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Template dialog state
  const [templateDialog, setTemplateDialog] = useState({ open: false, template: null });
  const [templateForm, setTemplateForm] = useState({
    ad: '',
    aciklama: '',
    maddeler: [],
    hedefRoller: [], // Şablonun hangi rollere atanacağı
  });

  // Settings dialog state
  const [settingsDialog, setSettingsDialog] = useState({ open: false });
  const [settingsForm, setSettingsForm] = useState({
    mesaiPuanlama: { aktif: true, saatBasinaPuan: 3, gunlukMaksimumSaat: 4 },
    devamsizlikPuanlama: { aktif: true, gunBasinaPuan: -5, saatBasinaPuan: -1 },
  });

  // Permissions dialog state
  const [permissionsDialog, setPermissionsDialog] = useState({ open: false, role: null });
  const [selectedPermissions, setSelectedPermissions] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, settingsRes, rolesRes, usersRes] = await Promise.all([
        hrManagementAPI.getTemplates(),
        hrManagementAPI.getSettings(),
        hrManagementAPI.getRoles(),
        hrManagementAPI.getUsers(),
      ]);

      setTemplates(templatesRes.data);
      setSettings(settingsRes.data);
      setRoles(rolesRes.data);
      setUsers(usersRes.data);
    } catch {
      showSnackbar('Veri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasModulePermission('İnsan Kaynakları Yönetimi', 'duzenleyebilir')) {
      loadData();
    }
  }, [hasModulePermission, loadData]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Template işlemleri
  const handleTemplateSubmit = async () => {
    try {
      if (templateForm.ad && templateForm.maddeler.length > 0) {
        if (templateDialog.template) {
          await hrManagementAPI.updateTemplate(templateDialog.template._id, templateForm);
          showSnackbar('Şablon güncellendi');
        } else {
          await hrManagementAPI.createTemplate(templateForm);
          showSnackbar('Şablon oluşturuldu');
        }
        setTemplateDialog({ open: false, template: null });
        loadData();
      } else {
        showSnackbar('Şablon adı ve en az bir madde gereklidir', 'error');
      }
    } catch {
      showSnackbar('İşlem başarısız', 'error');
    }
  };

  const handleDeleteTemplate = async id => {
    if (window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      try {
        await hrManagementAPI.deleteTemplate(id);
        showSnackbar('Şablon silindi');
        loadData();
      } catch {
        showSnackbar('Silme işlemi başarısız', 'error');
      }
    }
  };

  const openTemplateDialog = (template = null) => {
    if (template) {
      // Backend'den gelen hedef rolleri ID'lere çevir
      const hedefRolIds = template.hedefRoller
        ? template.hedefRoller
          .map(rol => {
            if (typeof rol === 'object' && rol._id) {
              return rol._id;
            }
            return rol;
          })
          .filter(Boolean)
        : [];

      setTemplateForm({
        ad: template.ad,
        aciklama: template.aciklama || '',
        maddeler: template.maddeler || [],
        hedefRoller: hedefRolIds,
      });
    } else {
      setTemplateForm({
        ad: '',
        aciklama: '',
        maddeler: [{ baslik: '', aciklama: '', puan: 0, periyot: 'aylik', aktif: true }],
        hedefRoller: [],
      });
    }
    setTemplateDialog({ open: true, template });
  };

  const addTemplateMadde = () => {
    setTemplateForm({
      ...templateForm,
      maddeler: [
        ...templateForm.maddeler,
        { baslik: '', aciklama: '', puan: 0, periyot: 'aylik', aktif: true },
      ],
    });
  };

  const updateTemplateMadde = (index, field, value) => {
    const newMaddeler = [...templateForm.maddeler];
    newMaddeler[index][field] = value;
    setTemplateForm({ ...templateForm, maddeler: newMaddeler });
  };

  const removeTemplateMadde = index => {
    const newMaddeler = templateForm.maddeler.filter((_, i) => i !== index);
    setTemplateForm({ ...templateForm, maddeler: newMaddeler });
  };

  // Settings işlemleri
  const openSettingsDialog = () => {
    setSettingsForm({
      mesaiPuanlama: settings.mesaiPuanlama,
      devamsizlikPuanlama: settings.devamsizlikPuanlama,
    });
    setSettingsDialog({ open: true });
  };

  const handleSettingsSubmit = async () => {
    try {
      await hrManagementAPI.updateSettings(settingsForm);
      showSnackbar('Ayarlar güncellendi');
      setSettingsDialog({ open: false });
      loadData();
    } catch {
      showSnackbar('Güncelleme başarısız', 'error');
    }
  };

  // Permission işlemleri
  const openPermissionsDialog = role => {
    const rolePermission = settings.rolYetkileri.find(ry => ry.rol._id === role._id);
    setSelectedPermissions(rolePermission?.yetkiler || {});
    setPermissionsDialog({ open: true, role });
  };

  const handlePermissionsSubmit = async () => {
    try {
      await hrManagementAPI.updateRolePermissions(permissionsDialog.role._id, selectedPermissions);
      showSnackbar('Rol yetkileri güncellendi');
      setPermissionsDialog({ open: false, role: null });
      loadData();
    } catch {
      showSnackbar('Güncelleme başarısız', 'error');
    }
  };

  const toggleModuleAccess = async (item, type) => {
    try {
      const currentAccess = settings.modulErisimYetkileri.find(mey => {
        if (type === 'user') {
          return mey.kullanici?._id === item._id;
        }
        return mey.rol?._id === item._id;
      });

      const newStatus = currentAccess?.erisimDurumu === 'aktif' ? 'pasif' : 'aktif';

      await hrManagementAPI.updateModuleAccess({
        [type === 'user' ? 'kullaniciId' : 'rolId']: item._id,
        erisimDurumu: newStatus,
      });

      showSnackbar(`Modül erişimi ${newStatus === 'aktif' ? 'verildi' : 'kaldırıldı'}`);
      loadData();
    } catch {
      showSnackbar('İşlem başarısız', 'error');
    }
  };

  if (!hasModulePermission('İnsan Kaynakları Yönetimi', 'duzenleyebilir')) {
    return <Alert severity="error">Bu sayfaya erişim yetkiniz yok</Alert>;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        İnsan Kaynakları Yönetimi
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="İK Şablonları" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Puanlama Ayarları" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Rol Yetkileri" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Modül Erişimi" icon={<PeopleIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* İK Şablonları Tab */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">İK Checklist Şablonları</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openTemplateDialog()}
            >
              Yeni Şablon
            </Button>
          </Box>

          <Grid container spacing={2}>
            {templates.map(template => (
              <Grid item xs={12} md={6} key={template._id}>
                <Card
                  sx={{
                    height: '100%',
                    background: template.aktif
                      ? 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)'
                      : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {template.ad}
                        </Typography>
                        {template.aciklama && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {template.aciklama}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip
                            label={template.aktif ? 'Aktif' : 'Pasif'}
                            color={template.aktif ? 'success' : 'default'}
                            size="small"
                          />
                          {
                            template.hedefRoller &&
                              template.hedefRoller.length > 0 &&
                              template.hedefRoller
                                .filter(rol => rol !== null && rol !== undefined) // null/undefined rolleri filtrele
                                .map(rol => {
                                  // Rol obje ise _id'sini al, string ise kendisini kullan
                                  const rolId = typeof rol === 'object' && rol._id ? rol._id : rol;
                                  const rolAdi =
                                    typeof rol === 'object' && rol.ad
                                      ? rol.ad
                                      : roles.find(r => r._id === rol)?.ad;

                                  // Geçerli rol adı yoksa render etme
                                  if (!rolAdi || !rolId) {
                                    return null;
                                  }

                                  return (
                                    <Chip
                                      key={rolId}
                                      label={rolAdi}
                                      color="primary"
                                      variant="outlined"
                                      size="small"
                                    />
                                  );
                                })
                                .filter(Boolean) // null değerleri filtrele
                          }
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => openTemplateDialog(template)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTemplate(template._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                      Maddeler ({template.maddeler.length}):
                    </Typography>
                    <List dense>
                      {template.maddeler.slice(0, 3).map((madde, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={madde.baslik}
                            secondary={`${madde.puan > 0 ? '+' : ''}${madde.puan} puan (${madde.periyot})`}
                          />
                        </ListItem>
                      ))}
                      {template.maddeler.length > 3 && (
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                          +{template.maddeler.length - 3} madde daha...
                        </Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Puanlama Ayarları Tab */}
      {activeTab === 1 && settings && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Puanlama Ayarları</Typography>
            <Button variant="contained" startIcon={<EditIcon />} onClick={openSettingsDialog}>
              Ayarları Düzenle
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Fazla Mesai Puanlama
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Durum"
                        secondary={settings.mesaiPuanlama.aktif ? 'Aktif' : 'Pasif'}
                      />
                      <Chip
                        label={settings.mesaiPuanlama.aktif ? 'Aktif' : 'Pasif'}
                        color={settings.mesaiPuanlama.aktif ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Saat Başına Puan"
                        secondary={`+${settings.mesaiPuanlama.saatBasinaPuan} puan`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Günlük Maksimum Saat"
                        secondary={`${settings.mesaiPuanlama.gunlukMaksimumSaat} saat`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Devamsızlık Puanlama
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Durum"
                        secondary={settings.devamsizlikPuanlama.aktif ? 'Aktif' : 'Pasif'}
                      />
                      <Chip
                        label={settings.devamsizlikPuanlama.aktif ? 'Aktif' : 'Pasif'}
                        color={settings.devamsizlikPuanlama.aktif ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Gün Başına Puan"
                        secondary={`${settings.devamsizlikPuanlama.gunBasinaPuan} puan`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Saat Başına Puan"
                        secondary={`${settings.devamsizlikPuanlama.saatBasinaPuan} puan`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Rol Yetkileri Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Rol Bazlı İK Yetkileri
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rol</TableCell>
                  <TableCell>Kullanıcı Açabilir</TableCell>
                  <TableCell>Kullanıcı Silebilir</TableCell>
                  <TableCell>Puanlama Yapabilir</TableCell>
                  <TableCell>Excel Yükleyebilir</TableCell>
                  <TableCell>Rapor Görebilir</TableCell>
                  <TableCell>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map(role => {
                  const rolePermission = settings.rolYetkileri.find(ry => ry.rol._id === role._id);
                  const permissions = rolePermission?.yetkiler || {};

                  return (
                    <TableRow key={role._id}>
                      <TableCell>{role.ad}</TableCell>
                      <TableCell>
                        <Chip
                          label={permissions.kullaniciAcabilir ? 'Evet' : 'Hayır'}
                          color={permissions.kullaniciAcabilir ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permissions.kullaniciSilebilir ? 'Evet' : 'Hayır'}
                          color={permissions.kullaniciSilebilir ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permissions.puanlamaYapabilir ? 'Evet' : 'Hayır'}
                          color={permissions.puanlamaYapabilir ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permissions.excelYukleyebilir ? 'Evet' : 'Hayır'}
                          color={permissions.excelYukleyebilir ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permissions.raporGorebilir ? 'Evet' : 'Hayır'}
                          color={permissions.raporGorebilir ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openPermissionsDialog(role)}>
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Modül Erişimi Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            İnsan Kaynakları Modülü Erişim Yönetimi
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Kullanıcı Bazlı Erişim
                </Typography>
                <List>
                  {users.map(user => {
                    const hasAccess = settings.modulErisimYetkileri.find(
                      mey => mey.kullanici?._id === user._id && mey.erisimDurumu === 'aktif',
                    );

                    return (
                      <ListItem key={user._id}>
                        <ListItemText
                          primary={`${user.ad} ${user.soyad}`}
                          secondary={user.kullaniciAdi}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={!!hasAccess}
                            onChange={() => toggleModuleAccess(user, 'user')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Rol Bazlı Erişim
                </Typography>
                <List>
                  {roles.map(role => {
                    const hasAccess = settings.modulErisimYetkileri.find(
                      mey => mey.rol?._id === role._id && mey.erisimDurumu === 'aktif',
                    );

                    return (
                      <ListItem key={role._id}>
                        <ListItemText primary={role.ad} />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={!!hasAccess}
                            onChange={() => toggleModuleAccess(role, 'role')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Template Dialog */}
      <Dialog
        open={templateDialog.open}
        onClose={() => setTemplateDialog({ open: false, template: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{templateDialog.template ? 'Şablon Düzenle' : 'Yeni İK Şablonu'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Şablon Adı"
            value={templateForm.ad}
            onChange={e => setTemplateForm({ ...templateForm, ad: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Açıklama"
            value={templateForm.aciklama}
            onChange={e => setTemplateForm({ ...templateForm, aciklama: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Hedef Roller</InputLabel>
            <Select
              multiple
              value={templateForm.hedefRoller}
              onChange={e => setTemplateForm({ ...templateForm, hedefRoller: e.target.value })}
              label="Hedef Roller"
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(value => (
                    <Chip
                      key={value}
                      label={roles.find(r => r._id === value)?.ad || value}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {roles.map(role => (
                <MenuItem key={role._id} value={role._id}>
                  <Checkbox checked={templateForm.hedefRoller.indexOf(role._id) > -1} />
                  <ListItemText primary={role.ad} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Checklist Maddeleri
            </Typography>
            {templateForm.maddeler.map((madde, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Madde Başlığı"
                      value={madde.baslik}
                      onChange={e => updateTemplateMadde(index, 'baslik', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Puan"
                      type="number"
                      value={madde.puan}
                      onChange={e =>
                        updateTemplateMadde(index, 'puan', parseInt(e.target.value) || 0)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Periyot</InputLabel>
                      <Select
                        value={madde.periyot}
                        onChange={e => updateTemplateMadde(index, 'periyot', e.target.value)}
                        label="Periyot"
                      >
                        <MenuItem value="gunluk">Günlük</MenuItem>
                        <MenuItem value="haftalik">Haftalık</MenuItem>
                        <MenuItem value="aylik">Aylık</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={madde.aciklama || ''}
                      onChange={e => updateTemplateMadde(index, 'aciklama', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton onClick={() => removeTemplateMadde(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addTemplateMadde}>
              Madde Ekle
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog({ open: false, template: null })}>İptal</Button>
          <Button onClick={handleTemplateSubmit} variant="contained">
            {templateDialog.template ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialog.open}
        onClose={() => setSettingsDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Puanlama Ayarları</DialogTitle>
        <DialogContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Fazla Mesai Puanlama</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={settingsForm.mesaiPuanlama.aktif}
                    onChange={e =>
                      setSettingsForm({
                        ...settingsForm,
                        mesaiPuanlama: { ...settingsForm.mesaiPuanlama, aktif: e.target.checked },
                      })
                    }
                  />
                }
                label="Aktif"
              />
              <TextField
                fullWidth
                label="Saat Başına Puan"
                type="number"
                value={settingsForm.mesaiPuanlama.saatBasinaPuan}
                onChange={e =>
                  setSettingsForm({
                    ...settingsForm,
                    mesaiPuanlama: {
                      ...settingsForm.mesaiPuanlama,
                      saatBasinaPuan: parseInt(e.target.value) || 0,
                    },
                  })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Günlük Maksimum Saat"
                type="number"
                value={settingsForm.mesaiPuanlama.gunlukMaksimumSaat}
                onChange={e =>
                  setSettingsForm({
                    ...settingsForm,
                    mesaiPuanlama: {
                      ...settingsForm.mesaiPuanlama,
                      gunlukMaksimumSaat: parseInt(e.target.value) || 0,
                    },
                  })
                }
                margin="normal"
              />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Devamsızlık Puanlama</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={settingsForm.devamsizlikPuanlama.aktif}
                    onChange={e =>
                      setSettingsForm({
                        ...settingsForm,
                        devamsizlikPuanlama: {
                          ...settingsForm.devamsizlikPuanlama,
                          aktif: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Aktif"
              />
              <TextField
                fullWidth
                label="Gün Başına Puan"
                type="number"
                value={settingsForm.devamsizlikPuanlama.gunBasinaPuan}
                onChange={e =>
                  setSettingsForm({
                    ...settingsForm,
                    devamsizlikPuanlama: {
                      ...settingsForm.devamsizlikPuanlama,
                      gunBasinaPuan: parseInt(e.target.value) || 0,
                    },
                  })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Saat Başına Puan"
                type="number"
                value={settingsForm.devamsizlikPuanlama.saatBasinaPuan}
                onChange={e =>
                  setSettingsForm({
                    ...settingsForm,
                    devamsizlikPuanlama: {
                      ...settingsForm.devamsizlikPuanlama,
                      saatBasinaPuan: parseInt(e.target.value) || 0,
                    },
                  })
                }
                margin="normal"
              />
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog({ open: false })}>İptal</Button>
          <Button onClick={handleSettingsSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={permissionsDialog.open}
        onClose={() => setPermissionsDialog({ open: false, role: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{permissionsDialog.role?.ad} - İK Yetkileri</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPermissions.kullaniciAcabilir || false}
                onChange={e =>
                  setSelectedPermissions({
                    ...selectedPermissions,
                    kullaniciAcabilir: e.target.checked,
                  })
                }
              />
            }
            label="Kullanıcı Açabilir"
          />

          {selectedPermissions.kullaniciAcabilir && (
            <Box ml={4} mb={2}>
              <Typography variant="body2" gutterBottom>
                Açabileceği Roller:
              </Typography>
              {roles.map(role => (
                <FormControlLabel
                  key={role._id}
                  control={
                    <Checkbox
                      checked={selectedPermissions.acabildigiRoller?.includes(role._id) || false}
                      onChange={e => {
                        const current = selectedPermissions.acabildigiRoller || [];
                        if (e.target.checked) {
                          setSelectedPermissions({
                            ...selectedPermissions,
                            acabildigiRoller: [...current, role._id],
                          });
                        } else {
                          setSelectedPermissions({
                            ...selectedPermissions,
                            acabildigiRoller: current.filter(id => id !== role._id),
                          });
                        }
                      }}
                    />
                  }
                  label={role.ad}
                />
              ))}
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPermissions.kullaniciSilebilir || false}
                onChange={e =>
                  setSelectedPermissions({
                    ...selectedPermissions,
                    kullaniciSilebilir: e.target.checked,
                  })
                }
              />
            }
            label="Kullanıcı Silebilir"
          />

          {selectedPermissions.kullaniciSilebilir && (
            <Box ml={4} mb={2}>
              <Typography variant="body2" gutterBottom>
                Silebildiği Roller:
              </Typography>
              {roles.map(role => (
                <FormControlLabel
                  key={role._id}
                  control={
                    <Checkbox
                      checked={selectedPermissions.silebildigiRoller?.includes(role._id) || false}
                      onChange={e => {
                        const current = selectedPermissions.silebildigiRoller || [];
                        if (e.target.checked) {
                          setSelectedPermissions({
                            ...selectedPermissions,
                            silebildigiRoller: [...current, role._id],
                          });
                        } else {
                          setSelectedPermissions({
                            ...selectedPermissions,
                            silebildigiRoller: current.filter(id => id !== role._id),
                          });
                        }
                      }}
                    />
                  }
                  label={role.ad}
                />
              ))}
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPermissions.puanlamaYapabilir || false}
                onChange={e =>
                  setSelectedPermissions({
                    ...selectedPermissions,
                    puanlamaYapabilir: e.target.checked,
                  })
                }
              />
            }
            label="Puanlama Yapabilir"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPermissions.excelYukleyebilir || false}
                onChange={e =>
                  setSelectedPermissions({
                    ...selectedPermissions,
                    excelYukleyebilir: e.target.checked,
                  })
                }
              />
            }
            label="Excel Yükleyebilir"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPermissions.raporGorebilir || false}
                onChange={e =>
                  setSelectedPermissions({
                    ...selectedPermissions,
                    raporGorebilir: e.target.checked,
                  })
                }
              />
            }
            label="Rapor Görebilir"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialog({ open: false, role: null })}>İptal</Button>
          <Button onClick={handlePermissionsSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HRManagement;
