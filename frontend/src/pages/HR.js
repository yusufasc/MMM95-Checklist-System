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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import { format } from 'date-fns';
import { hrAPI, rolesAPI, departmentsAPI } from '../services/api';

const HR = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]); // Orijinal kullanıcı listesi
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [scores, setScores] = useState([]);
  const [summaryReport, setSummaryReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [hrYetkileri, setHrYetkileri] = useState(null);

  // User dialog state
  const [userDialog, setUserDialog] = useState({ open: false, user: null });
  const [userForm, setUserForm] = useState({
    ad: '',
    soyad: '',
    kullaniciAdi: '',
    sifre: '',
    roller: [],
    departman: '',
  });

  // Score dialog state
  const [scoreDialog, setScoreDialog] = useState({ open: false });
  const [scoreForm, setScoreForm] = useState({
    kullaniciId: '',
    sablonId: '',
    secilenMaddeler: [],
    mesaiKayitlari: [],
    devamsizlikKayitlari: [],
    donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
  });

  // Yeni puanlama dialog state
  const [evaluationDialog, setEvaluationDialog] = useState({ open: false, template: null });
  const [evaluationForm, setEvaluationForm] = useState({
    kullaniciId: '',
    sablonId: '',
    maddePuanlari: {}, // { maddeId: puan }
    genelNot: '',
    donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
  });
  const [selectedUserScores, setSelectedUserScores] = useState(null);
  const [evaluatedUsers, setEvaluatedUsers] = useState([]); // Puanlanan kullanıcılar

  // Manuel mesai/devamsızlık dialog state
  const [manuelDialog, setManuelDialog] = useState({ open: false, type: '' });
  const [manuelForm, setManuelForm] = useState({
    kullaniciId: '',
    tarih: new Date(),
    saat: '',
    miktar: '',
    tur: 'tam_gun',
    aciklama: '',
    donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
  });

  // Filter states
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterUser, setFilterUser] = useState('');

  const loadDataCallback = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, deptsRes, templatesRes] = await Promise.all([
        hrAPI.getUsers(),
        rolesAPI.getAll(),
        departmentsAPI.getAll(),
        hrAPI.getActiveTemplates(),
      ]);

      setUsers(usersRes.data);
      setOriginalUsers(usersRes.data); // Orijinal listeyi sakla
      setRoles(rolesRes.data);
      setDepartments(deptsRes.data);
      setTemplates(templatesRes.data);

      // Yetkileri backend'den al
      try {
        const yetkileriRes = await hrAPI.getPermissions();
        setHrYetkileri(yetkileriRes.data);
      } catch {
        // Yetki bilgileri alınamadı - fallback yetkiler kullanılacak
        setHrYetkileri({
          kullaniciAcabilir: false,
          kullaniciSilebilir: false,
          puanlamaYapabilir: false,
          excelYukleyebilir: false,
          raporGorebilir: false,
        });
      }
    } catch {
      showSnackbar('Veri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDataCallback();
  }, [loadDataCallback]);

  const loadScoresCallback = useCallback(async () => {
    try {
      const response = await hrAPI.getScores({
        yil: filterYear,
        ay: filterMonth,
        kullaniciId: filterUser,
      });
      setScores(response.data);
    } catch {
      showSnackbar('Puanlama verileri yüklenirken hata oluştu', 'error');
    }
  }, [filterYear, filterMonth, filterUser]);

  const loadSummaryReportCallback = useCallback(async () => {
    try {
      const response = await hrAPI.getSummaryReport({
        yil: filterYear,
        ay: filterMonth,
      });
      setSummaryReport(response.data);
    } catch {
      showSnackbar('Rapor yüklenirken hata oluştu', 'error');
    }
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (activeTab === 2) {
      loadScoresCallback();
    } else if (activeTab === 3) {
      loadSummaryReportCallback();
    }
  }, [activeTab, loadScoresCallback, loadSummaryReportCallback]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // User management
  const handleUserSubmit = async () => {
    try {
      if (
        !userForm.ad ||
        !userForm.soyad ||
        !userForm.kullaniciAdi ||
        !userForm.sifre ||
        userForm.roller.length === 0
      ) {
        showSnackbar('Tüm alanlar doldurulmalıdır', 'error');
        return;
      }

      await hrAPI.createUser(userForm);
      showSnackbar('Kullanıcı oluşturuldu');
      setUserDialog({ open: false, user: null });
      // Formu temizle
      setUserForm({
        ad: '',
        soyad: '',
        kullaniciAdi: '',
        sifre: '',
        roller: [],
        departman: '',
      });
      loadDataCallback();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'İşlem başarısız', 'error');
    }
  };

  const handleDeleteUser = async id => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await hrAPI.deleteUser(id);
        showSnackbar('Kullanıcı silindi');
        loadDataCallback();
      } catch (error) {
        showSnackbar(error.response?.data?.message || 'Silme işlemi başarısız', 'error');
      }
    }
  };

  // Scoring
  const openScoreDialog = () => {
    setScoreForm({
      kullaniciId: '',
      sablonId: '',
      secilenMaddeler: [],
      mesaiKayitlari: [{ tarih: new Date(), saat: 0, aciklama: '' }],
      devamsizlikKayitlari: [{ tarih: new Date(), tur: 'tam_gun', miktar: 0, aciklama: '' }],
      donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
    });
    setScoreDialog({ open: true });
  };

  // Şablon bazlı puanlama
  const openTemplateScoring = async template => {
    setScoreForm({
      kullaniciId: '',
      sablonId: template._id,
      secilenMaddeler: [],
      mesaiKayitlari: [],
      devamsizlikKayitlari: [],
      donem: { yil: filterYear, ay: filterMonth },
    });
    setScoreDialog({ open: true });

    // Şablona göre kullanıcı listesini yükle
    const templateUsers = await loadUsersForTemplate(template._id);
    setUsers(templateUsers);
  };

  // Yeni değerlendirme sistemi
  const openEvaluationDialog = async template => {
    // Madde puanlarını başlat
    const initialMaddePuanlari = {};
    template.maddeler.forEach(madde => {
      initialMaddePuanlari[madde._id] = madde.puan; // Varsayılan puan
    });

    setEvaluationForm({
      kullaniciId: '',
      sablonId: template._id,
      maddePuanlari: initialMaddePuanlari,
      genelNot: '',
      donem: { yil: filterYear, ay: filterMonth },
    });
    setEvaluationDialog({ open: true, template });
    setSelectedUserScores(null);
    loadEvaluatedUsers(template._id);

    // Şablona göre kullanıcı listesini yükle
    const templateUsers = await loadUsersForTemplate(template._id);
    setUsers(templateUsers);
  };

  // Kullanıcı seçildiğinde puanlarını yükle
  const handleUserSelect = async userId => {
    setEvaluationForm({ ...evaluationForm, kullaniciId: userId });

    if (userId) {
      try {
        const response = await hrAPI.getUserScores(userId, {
          yil: filterYear,
          ay: filterMonth,
        });
        setSelectedUserScores(response.data);
      } catch {
        setSelectedUserScores(null);
      }
    } else {
      setSelectedUserScores(null);
    }
  };

  // Puanlanan kullanıcıları yükle
  const loadEvaluatedUsers = async templateId => {
    try {
      const response = await hrAPI.getEvaluatedUsers({
        sablonId: templateId,
        yil: filterYear,
        ay: filterMonth,
      });
      setEvaluatedUsers(response.data || []);
    } catch {
      setEvaluatedUsers([]);
    }
  };

  // Şablona göre kullanıcı listesi yükle
  const loadUsersForTemplate = async templateId => {
    try {
      const response = await hrAPI.getUsers({ sablonId: templateId });
      return response.data;
    } catch {
      return [];
    }
  };

  // Orijinal kullanıcı listesini geri yükle
  const restoreOriginalUsers = () => {
    setUsers(originalUsers);
  };

  // Değerlendirme kaydet
  const handleEvaluationSubmit = async () => {
    try {
      if (!evaluationForm.kullaniciId) {
        showSnackbar('Personel seçilmelidir', 'error');
        return;
      }

      // Kullanıcı daha önce puanlandı mı kontrol et
      const alreadyEvaluated = evaluatedUsers.some(user => user._id === evaluationForm.kullaniciId);

      if (alreadyEvaluated) {
        showSnackbar('Bu personel bu dönemde zaten puanlandı', 'error');
        return;
      }

      // Seçilen maddeleri hazırla
      const secilenMaddeler = Object.keys(evaluationForm.maddePuanlari);

      const submitData = {
        kullaniciId: evaluationForm.kullaniciId,
        sablonId: evaluationForm.sablonId,
        secilenMaddeler,
        maddePuanlari: evaluationForm.maddePuanlari,
        genelNot: evaluationForm.genelNot,
        donem: evaluationForm.donem,
      };

      await hrAPI.createEvaluation(submitData);
      showSnackbar('Değerlendirme kaydedildi');
      setEvaluationDialog({ open: false, template: null });
      loadEvaluatedUsers(evaluationForm.sablonId);
      restoreOriginalUsers(); // Orijinal kullanıcı listesini geri yükle
    } catch {
      showSnackbar('Değerlendirme kaydedilemedi', 'error');
    }
  };

  const handleScoreSubmit = async () => {
    try {
      // Boş kayıtları filtrele
      const filteredMesai = scoreForm.mesaiKayitlari.filter(k => k.saat > 0);
      const filteredDevamsizlik = scoreForm.devamsizlikKayitlari.filter(k => k.miktar > 0);

      const submitData = {
        ...scoreForm,
        mesaiKayitlari: filteredMesai,
        devamsizlikKayitlari: filteredDevamsizlik,
      };

      await hrAPI.createScore(submitData);
      showSnackbar('Puanlama kaydedildi');
      setScoreDialog({ open: false });
      loadScoresCallback();
      restoreOriginalUsers(); // Orijinal kullanıcı listesini geri yükle
    } catch {
      showSnackbar('Puanlama kaydedilemedi', 'error');
    }
  };

  // Excel operations
  const handleExcelDownload = async () => {
    try {
      const response = await hrAPI.downloadExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personel_listesi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showSnackbar('Excel indirme başarısız', 'error');
    }
  };

  const handleExcelUpload = async event => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('yil', filterYear);
    formData.append('ay', filterMonth);

    try {
      const response = await hrAPI.uploadExcel(formData);
      showSnackbar(
        `Excel yüklendi: ${response.data.results.basarili} başarılı, ${response.data.results.hatali} hatalı`,
      );
      loadScoresCallback();
    } catch {
      showSnackbar('Excel yükleme başarısız', 'error');
    }

    event.target.value = null; // Reset input
  };

  // Manuel mesai/devamsızlık ekleme
  const openManuelDialog = type => {
    setManuelDialog({ open: true, type });
    setManuelForm({
      kullaniciId: '',
      tarih: new Date(),
      saat: '',
      miktar: '',
      tur: 'tam_gun',
      aciklama: '',
      donem: { yil: filterYear, ay: filterMonth },
    });
  };

  const handleManuelSubmit = async () => {
    try {
      if (!manuelForm.kullaniciId) {
        showSnackbar('Kullanıcı seçilmelidir', 'error');
        return;
      }

      const scoreData = {
        kullaniciId: manuelForm.kullaniciId,
        donem: manuelForm.donem,
        mesaiKayitlari: [],
        devamsizlikKayitlari: [],
      };

      if (manuelDialog.type === 'mesai') {
        if (!manuelForm.saat || parseFloat(manuelForm.saat) <= 0) {
          showSnackbar('Geçerli bir saat değeri girilmelidir', 'error');
          return;
        }
        scoreData.mesaiKayitlari = [
          {
            tarih: manuelForm.tarih,
            saat: parseFloat(manuelForm.saat),
            aciklama: manuelForm.aciklama,
          },
        ];
      } else if (manuelDialog.type === 'devamsizlik') {
        if (!manuelForm.miktar || parseFloat(manuelForm.miktar) <= 0) {
          showSnackbar('Geçerli bir miktar değeri girilmelidir', 'error');
          return;
        }
        scoreData.devamsizlikKayitlari = [
          {
            tarih: manuelForm.tarih,
            tur: manuelForm.tur,
            miktar: parseFloat(manuelForm.miktar),
            aciklama: manuelForm.aciklama,
          },
        ];
      }

      await hrAPI.createScore(scoreData);
      showSnackbar(`${manuelDialog.type === 'mesai' ? 'Mesai' : 'Devamsızlık'} kaydı eklendi`);
      setManuelDialog({ open: false, type: '' });
      loadScoresCallback();
    } catch {
      showSnackbar('Kayıt eklenirken hata oluştu', 'error');
    }
  };

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
        <PeopleIcon />
        İnsan Kaynakları
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Kullanıcı Yönetimi" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Puanlama" icon={<GradeIcon />} iconPosition="start" />
          <Tab label="Puanlama Geçmişi" icon={<ScheduleIcon />} iconPosition="start" />
          <Tab label="Özet Rapor" icon={<AssessmentIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Kullanıcı Yönetimi Tab */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Kullanıcı Listesi</Typography>
            {hrYetkileri?.kullaniciAcabilir && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setUserForm({
                    ad: '',
                    soyad: '',
                    kullaniciAdi: '',
                    sifre: '',
                    roller: [],
                    departman: '',
                  });
                  setUserDialog({ open: true, user: null });
                }}
              >
                Yeni Kullanıcı
              </Button>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>Kullanıcı Adı</TableCell>
                  <TableCell>Roller</TableCell>
                  <TableCell>Departman</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.ad[0]}
                          {user.soyad[0]}
                        </Avatar>
                        {user.ad} {user.soyad}
                      </Box>
                    </TableCell>
                    <TableCell>{user.kullaniciAdi}</TableCell>
                    <TableCell>
                      {user.roller.map(rol => (
                        <Chip key={rol._id} label={rol.ad} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>{user.departman?.ad || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.aktif ? 'Aktif' : 'Pasif'}
                        color={user.aktif ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {hrYetkileri?.kullaniciSilebilir && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Puanlama Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Personel Puanlama</Typography>
            <Box display="flex" gap={2}>
              {hrYetkileri?.excelYukleyebilir && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleExcelDownload}
                  >
                    Excel İndir
                  </Button>
                  <Button variant="outlined" startIcon={<CloudUploadIcon />} component="label">
                    Excel Yükle
                    <input type="file" hidden accept=".xlsx,.xls" onChange={handleExcelUpload} />
                  </Button>
                </>
              )}
              {hrYetkileri?.puanlamaYapabilir && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    onClick={() => openManuelDialog('mesai')}
                    sx={{ mr: 1 }}
                  >
                    Mesai Ekle
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    onClick={() => openManuelDialog('devamsizlik')}
                    sx={{ mr: 1 }}
                  >
                    Devamsızlık Ekle
                  </Button>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openScoreDialog}>
                    Şablon Puanlama
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Personel puanlaması yapabilir, fazla mesai ve devamsızlık kayıtlarını girebilirsiniz.
            Excel ile toplu veri girişi yapabilirsiniz.
          </Alert>

          <Grid container spacing={3}>
            {templates.map(template => (
              <Grid item xs={12} md={6} key={template._id}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    },
                  }}
                  onClick={() => openTemplateScoring(template)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" gutterBottom>
                        {template.ad}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<GradeIcon />}
                          onClick={e => {
                            e.stopPropagation();
                            openTemplateScoring(template);
                          }}
                        >
                          Eski Sistem
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AssessmentIcon />}
                          onClick={e => {
                            e.stopPropagation();
                            openEvaluationDialog(template);
                          }}
                        >
                          Değerlendir
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {template.maddeler.length} değerlendirme maddesi
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <List dense>
                      {template.maddeler.slice(0, 3).map((madde, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={madde.baslik}
                            secondary={`${madde.puan > 0 ? '+' : ''}${madde.puan} puan (${madde.periyot})`}
                          />
                        </ListItem>
                      ))}
                      {template.maddeler.length > 3 && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={`+${template.maddeler.length - 3} madde daha...`}
                            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Puanlama Geçmişi Tab */}
      {activeTab === 2 && (
        <Box>
          <Box mb={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Yıl</InputLabel>
                  <Select
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                    label="Yıl"
                  >
                    {[2023, 2024, 2025].map(year => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Ay</InputLabel>
                  <Select
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    label="Ay"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <MenuItem key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleString('tr-TR', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kullanıcı Ara"
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={2}>
            {scores.map(score => (
              <Grid item xs={12} key={score._id}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      width="100%"
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar>
                          {score.kullanici.ad[0]}
                          {score.kullanici.soyad[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {score.kullanici.ad} {score.kullanici.soyad}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {score.donem.yil}/{score.donem.ay}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" color="primary">
                          {score.toplamPuanlar.genelToplam} Puan
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Checklist Puanı
                            </Typography>
                            <Typography variant="h5">
                              {score.toplamPuanlar.checklistPuani}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Mesai Puanı
                            </Typography>
                            <Typography variant="h5" color="success.main">
                              +{score.toplamPuanlar.mesaiPuani}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Devamsızlık Puanı
                            </Typography>
                            <Typography variant="h5" color="error.main">
                              {score.toplamPuanlar.devamsizlikPuani}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Diğer Modül Puanı
                            </Typography>
                            <Typography variant="h5">
                              {score.toplamPuanlar.digerModulPuani}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Özet Rapor Tab */}
      {activeTab === 3 && hrYetkileri?.raporGorebilir && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Personel Performans Özeti - {filterYear}/{filterMonth}
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sıra</TableCell>
                  <TableCell>Personel</TableCell>
                  <TableCell align="right">Checklist</TableCell>
                  <TableCell align="right">Mesai</TableCell>
                  <TableCell align="right">Devamsızlık</TableCell>
                  <TableCell align="right">Diğer</TableCell>
                  <TableCell align="right">Toplam Puan</TableCell>
                  <TableCell>Performans</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryReport.map((item, index) => {
                  const performanceColor =
                    item.genelToplam >= 80
                      ? 'success'
                      : item.genelToplam >= 50
                        ? 'warning'
                        : 'error';

                  return (
                    <TableRow key={item.kullanici._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {item.kullanici.ad[0]}
                            {item.kullanici.soyad[0]}
                          </Avatar>
                          {item.kullanici.ad} {item.kullanici.soyad}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{item.toplamChecklistPuani}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        +{item.toplamMesaiPuani}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {item.toplamDevamsizlikPuani}
                      </TableCell>
                      <TableCell align="right">{item.toplamDigerModulPuani}</TableCell>
                      <TableCell align="right">
                        <Typography variant="h6">{item.genelToplam}</Typography>
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(0, item.genelToplam))}
                          color={performanceColor}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* User Dialog */}
      <Dialog
        open={userDialog.open}
        onClose={() => setUserDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Kullanıcı</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ad"
                value={userForm.ad}
                onChange={e => setUserForm({ ...userForm, ad: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Soyad"
                value={userForm.soyad}
                onChange={e => setUserForm({ ...userForm, soyad: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                value={userForm.kullaniciAdi}
                onChange={e => setUserForm({ ...userForm, kullaniciAdi: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Şifre"
                type="password"
                value={userForm.sifre}
                onChange={e => setUserForm({ ...userForm, sifre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Roller</InputLabel>
                <Select
                  multiple
                  value={userForm.roller}
                  onChange={e => setUserForm({ ...userForm, roller: e.target.value })}
                  label="Roller"
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip
                          key={value}
                          label={roles.find(r => r._id === value)?.ad}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {roles.map(role => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Departman</InputLabel>
                <Select
                  value={userForm.departman}
                  onChange={e => setUserForm({ ...userForm, departman: e.target.value })}
                  label="Departman"
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUserDialog({ open: false, user: null });
              setUserForm({
                ad: '',
                soyad: '',
                kullaniciAdi: '',
                sifre: '',
                roller: [],
                departman: '',
              });
            }}
          >
            İptal
          </Button>
          <Button onClick={handleUserSubmit} variant="contained">
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Score Dialog */}
      <Dialog
        open={scoreDialog.open}
        onClose={() => {
          setScoreDialog({ open: false });
          restoreOriginalUsers(); // Orijinal kullanıcı listesini geri yükle
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Personel Puanlama</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Personel</InputLabel>
                <Select
                  value={scoreForm.kullaniciId}
                  onChange={e => setScoreForm({ ...scoreForm, kullaniciId: e.target.value })}
                  label="Personel"
                >
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.ad} {user.soyad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>İK Şablonu</InputLabel>
                <Select
                  value={scoreForm.sablonId}
                  onChange={e => setScoreForm({ ...scoreForm, sablonId: e.target.value })}
                  label="İK Şablonu"
                >
                  {templates.map(template => (
                    <MenuItem key={template._id} value={template._id}>
                      {template.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {scoreForm.sablonId && (
            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Değerlendirme Maddeleri</Typography>
                <Box>
                  <Button
                    size="small"
                    onClick={() => {
                      const selectedTemplate = templates.find(t => t._id === scoreForm.sablonId);
                      const allMaddeIds = selectedTemplate?.maddeler.map(m => m._id) || [];
                      setScoreForm({
                        ...scoreForm,
                        secilenMaddeler: allMaddeIds,
                      });
                    }}
                    sx={{ mr: 1 }}
                  >
                    Tümünü Seç
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setScoreForm({
                        ...scoreForm,
                        secilenMaddeler: [],
                      });
                    }}
                  >
                    Temizle
                  </Button>
                </Box>
              </Box>

              <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                <Grid container spacing={1}>
                  {templates
                    .find(t => t._id === scoreForm.sablonId)
                    ?.maddeler.map(madde => (
                      <Grid item xs={12} key={madde._id}>
                        <Card
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            border: scoreForm.secilenMaddeler.includes(madde._id) ? 2 : 1,
                            borderColor: scoreForm.secilenMaddeler.includes(madde._id)
                              ? 'primary.main'
                              : 'divider',
                            backgroundColor: scoreForm.secilenMaddeler.includes(madde._id)
                              ? 'primary.50'
                              : 'background.paper',
                            '&:hover': {
                              backgroundColor: scoreForm.secilenMaddeler.includes(madde._id)
                                ? 'primary.100'
                                : 'grey.50',
                            },
                          }}
                          onClick={() => {
                            if (scoreForm.secilenMaddeler.includes(madde._id)) {
                              setScoreForm({
                                ...scoreForm,
                                secilenMaddeler: scoreForm.secilenMaddeler.filter(
                                  id => id !== madde._id,
                                ),
                              });
                            } else {
                              setScoreForm({
                                ...scoreForm,
                                secilenMaddeler: [...scoreForm.secilenMaddeler, madde._id],
                              });
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Checkbox
                              checked={scoreForm.secilenMaddeler.includes(madde._id)}
                              onChange={() => {}} // onClick handles the logic
                              color="primary"
                            />
                            <Box flex={1}>
                              <Typography variant="body1" fontWeight="medium">
                                {madde.baslik}
                              </Typography>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography variant="body2" color="text.secondary">
                                  {madde.periyot}
                                </Typography>
                                <Chip
                                  label={`${madde.puan > 0 ? '+' : ''}${madde.puan} puan`}
                                  size="small"
                                  color={madde.puan > 0 ? 'success' : 'error'}
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </Paper>

              {scoreForm.secilenMaddeler.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{scoreForm.secilenMaddeler.length} madde seçildi.</strong> Toplam puan:{' '}
                    <strong>
                      {templates
                        .find(t => t._id === scoreForm.sablonId)
                        ?.maddeler.filter(m => scoreForm.secilenMaddeler.includes(m._id))
                        .reduce((total, madde) => total + madde.puan, 0) || 0}{' '}
                      puan
                    </strong>
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="subtitle1">Fazla Mesai Kayıtları (İsteğe Bağlı)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {scoreForm.mesaiKayitlari.filter(k => k.saat > 0).length} kayıt
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setScoreForm({
                      ...scoreForm,
                      mesaiKayitlari: [
                        ...scoreForm.mesaiKayitlari,
                        { tarih: new Date(), saat: 0, aciklama: '' },
                      ],
                    });
                  }}
                >
                  Mesai Ekle
                </Button>
              </Box>
              {scoreForm.mesaiKayitlari.map((kayit, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={12} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                      <DatePicker
                        label="Tarih"
                        value={kayit.tarih}
                        onChange={value => {
                          const newKayitlar = [...scoreForm.mesaiKayitlari];
                          newKayitlar[index].tarih = value;
                          setScoreForm({ ...scoreForm, mesaiKayitlari: newKayitlar });
                        }}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Saat"
                      type="number"
                      value={kayit.saat}
                      onChange={e => {
                        const newKayitlar = [...scoreForm.mesaiKayitlari];
                        newKayitlar[index].saat = parseFloat(e.target.value) || 0;
                        setScoreForm({ ...scoreForm, mesaiKayitlari: newKayitlar });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={kayit.aciklama}
                      onChange={e => {
                        const newKayitlar = [...scoreForm.mesaiKayitlari];
                        newKayitlar[index].aciklama = e.target.value;
                        setScoreForm({ ...scoreForm, mesaiKayitlari: newKayitlar });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => {
                        const newKayitlar = scoreForm.mesaiKayitlari.filter((_, i) => i !== index);
                        setScoreForm({ ...scoreForm, mesaiKayitlari: newKayitlar });
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="subtitle1">Devamsızlık Kayıtları (İsteğe Bağlı)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {scoreForm.devamsizlikKayitlari.filter(k => k.miktar > 0).length} kayıt
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setScoreForm({
                      ...scoreForm,
                      devamsizlikKayitlari: [
                        ...scoreForm.devamsizlikKayitlari,
                        { tarih: new Date(), tur: 'tam_gun', miktar: 0, aciklama: '' },
                      ],
                    });
                  }}
                >
                  Devamsızlık Ekle
                </Button>
              </Box>
              {scoreForm.devamsizlikKayitlari.map((kayit, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                      <DatePicker
                        label="Tarih"
                        value={kayit.tarih}
                        onChange={value => {
                          const newKayitlar = [...scoreForm.devamsizlikKayitlari];
                          newKayitlar[index].tarih = value;
                          setScoreForm({ ...scoreForm, devamsizlikKayitlari: newKayitlar });
                        }}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Tür</InputLabel>
                      <Select
                        value={kayit.tur}
                        onChange={e => {
                          const newKayitlar = [...scoreForm.devamsizlikKayitlari];
                          newKayitlar[index].tur = e.target.value;
                          setScoreForm({ ...scoreForm, devamsizlikKayitlari: newKayitlar });
                        }}
                        label="Tür"
                      >
                        <MenuItem value="tam_gun">Tam Gün</MenuItem>
                        <MenuItem value="saat">Saat</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Miktar"
                      type="number"
                      value={kayit.miktar}
                      onChange={e => {
                        const newKayitlar = [...scoreForm.devamsizlikKayitlari];
                        newKayitlar[index].miktar = parseFloat(e.target.value) || 0;
                        setScoreForm({ ...scoreForm, devamsizlikKayitlari: newKayitlar });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={kayit.aciklama}
                      onChange={e => {
                        const newKayitlar = [...scoreForm.devamsizlikKayitlari];
                        newKayitlar[index].aciklama = e.target.value;
                        setScoreForm({ ...scoreForm, devamsizlikKayitlari: newKayitlar });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => {
                        const newKayitlar = scoreForm.devamsizlikKayitlari.filter(
                          (_, i) => i !== index,
                        );
                        setScoreForm({ ...scoreForm, devamsizlikKayitlari: newKayitlar });
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setScoreDialog({ open: false });
              restoreOriginalUsers(); // Orijinal kullanıcı listesini geri yükle
            }}
          >
            İptal
          </Button>
          <Button onClick={handleScoreSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manuel Mesai/Devamsızlık Dialog */}
      <Dialog
        open={manuelDialog.open}
        onClose={() => setManuelDialog({ open: false, type: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {manuelDialog.type === 'mesai' ? 'Fazla Mesai Ekle' : 'Devamsızlık Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Kullanıcı</InputLabel>
                <Select
                  value={manuelForm.kullaniciId}
                  onChange={e => setManuelForm({ ...manuelForm, kullaniciId: e.target.value })}
                  label="Kullanıcı"
                >
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.ad} {user.soyad} ({user.kullaniciAdi})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Tarih"
                  value={manuelForm.tarih}
                  onChange={value => setManuelForm({ ...manuelForm, tarih: value })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            {manuelDialog.type === 'mesai' ? (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Saat"
                  type="number"
                  value={manuelForm.saat}
                  onChange={e => setManuelForm({ ...manuelForm, saat: e.target.value })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">saat</InputAdornment>,
                  }}
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tür</InputLabel>
                    <Select
                      value={manuelForm.tur}
                      onChange={e => setManuelForm({ ...manuelForm, tur: e.target.value })}
                      label="Tür"
                    >
                      <MenuItem value="tam_gun">Tam Gün</MenuItem>
                      <MenuItem value="saat">Saat</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Miktar"
                    type="number"
                    value={manuelForm.miktar}
                    onChange={e => setManuelForm({ ...manuelForm, miktar: e.target.value })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {manuelForm.tur === 'tam_gun' ? 'gün' : 'saat'}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={3}
                value={manuelForm.aciklama}
                onChange={e => setManuelForm({ ...manuelForm, aciklama: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Yıl"
                type="number"
                value={manuelForm.donem.yil}
                onChange={e =>
                  setManuelForm({
                    ...manuelForm,
                    donem: {
                      ...manuelForm.donem,
                      yil: parseInt(e.target.value) || new Date().getFullYear(),
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ay"
                type="number"
                value={manuelForm.donem.ay}
                onChange={e =>
                  setManuelForm({
                    ...manuelForm,
                    donem: {
                      ...manuelForm.donem,
                      ay: parseInt(e.target.value) || new Date().getMonth() + 1,
                    },
                  })
                }
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManuelDialog({ open: false, type: '' })}>İptal</Button>
          <Button onClick={handleManuelSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yeni Değerlendirme Dialog */}
      <Dialog
        open={evaluationDialog.open}
        onClose={() => {
          setEvaluationDialog({ open: false, template: null });
          restoreOriginalUsers(); // Orijinal kullanıcı listesini geri yükle
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <AssessmentIcon />
            Personel Değerlendirme - {evaluationDialog.template?.ad}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Personel Seçimi */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Değerlendirilecek Personel</InputLabel>
                <Select
                  value={evaluationForm.kullaniciId}
                  onChange={e => handleUserSelect(e.target.value)}
                  label="Değerlendirilecek Personel"
                >
                  {users
                    .filter(user => !evaluatedUsers.some(evalUser => evalUser._id === user._id))
                    .map(user => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.ad} {user.soyad} ({user.kullaniciAdi})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mevcut Puanlar */}
            {selectedUserScores && selectedUserScores.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Mevcut Puanlar ({filterYear}/{filterMonth})
                  </Typography>
                  {selectedUserScores.map((score, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        Kullanıcı Puanı: {score.toplamPuanlar?.kullaniciPuani || 0}
                      </Typography>
                      <Typography variant="body2">
                        Kontrol Puanı: {score.toplamPuanlar?.kontrolPuani || 0}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Performans: %
                        {Math.round(((score.toplamPuanlar?.genelToplam || 0) / 100) * 100)}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            )}

            {/* Değerlendirme Maddeleri */}
            {evaluationForm.kullaniciId && evaluationDialog.template && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  📋 Checklist Maddeleri ({evaluationDialog.template.maddeler.length})
                </Typography>

                <Grid container spacing={2}>
                  {evaluationDialog.template.maddeler.map((madde, index) => (
                    <Grid item xs={12} key={madde._id}>
                      <Paper
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={`#${index + 1}`}
                            color="primary"
                            size="small"
                            sx={{ minWidth: 40 }}
                          />
                          <Box flex={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {madde.baslik}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="text.secondary">
                              Evet
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={evaluationForm.maddePuanlari[madde._id] || madde.puan}
                              onChange={e => {
                                const newPuan = parseInt(e.target.value) || 0;
                                setEvaluationForm({
                                  ...evaluationForm,
                                  maddePuanlari: {
                                    ...evaluationForm.maddePuanlari,
                                    [madde._id]: newPuan,
                                  },
                                });
                              }}
                              inputProps={{
                                min: 0,
                                max: 10,
                                style: { textAlign: 'center', width: '60px' },
                              }}
                              sx={{ width: 80 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              /{madde.puan}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {/* Toplam Puan Gösterimi */}
                <Paper sx={{ p: 2, mt: 3, backgroundColor: 'primary.50' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Toplam Puan</Typography>
                    <Typography variant="h4" color="primary">
                      {Object.values(evaluationForm.maddePuanlari).reduce(
                        (total, puan) => total + (puan || 0),
                        0,
                      )}
                      {' / '}
                      {evaluationDialog.template.maddeler.reduce(
                        (total, madde) => total + madde.puan,
                        0,
                      )}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      100,
                      (Object.values(evaluationForm.maddePuanlari).reduce(
                        (total, puan) => total + (puan || 0),
                        0,
                      ) /
                        evaluationDialog.template.maddeler.reduce(
                          (total, madde) => total + madde.puan,
                          0,
                        )) *
                        100,
                    )}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Paper>

                {/* Genel Değerlendirme Notu */}
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    📝 Genel Kontrol Notu
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Genel değerlendirme notunuzu buraya yazın..."
                    value={evaluationForm.genelNot}
                    onChange={e =>
                      setEvaluationForm({ ...evaluationForm, genelNot: e.target.value })
                    }
                  />
                </Box>
              </Grid>
            )}

            {/* Puanlanan Personeller Listesi */}
            {evaluatedUsers.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  ✅ Bu Dönemde Puanlanan Personeller
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {evaluatedUsers.map(user => (
                    <Chip
                      key={user._id}
                      label={`${user.ad} ${user.soyad}`}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEvaluationDialog({ open: false, template: null });
              restoreOriginalUsers(); // Orijinal kullanıcı listesini geri yükle
            }}
          >
            ❌ İptal
          </Button>
          <Button
            onClick={handleEvaluationSubmit}
            variant="contained"
            disabled={!evaluationForm.kullaniciId}
            startIcon={<AssessmentIcon />}
          >
            📊 Puanlamayı Kaydet
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

export default HR;
