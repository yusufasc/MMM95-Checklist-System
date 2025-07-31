import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  Alert,
  Paper,
  Chip,
  Avatar,
  Fab,
  Zoom,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CardGiftcard as BonusIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { bonusEvaluationAPI, rolesAPI } from '../services/api';

const BonusEvaluationManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasModulePermission, user } = useAuth();

  // State management
  const [templates, setTemplates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    rol: '',
    bonusKategorisi: 'Performans',
    bonusCarpani: 1.0,
    degerlendirmePeriyodu: 30, // 30 gün = Aylık
    minimumPuan: 70,
    degerlendirmeSikligi: 'Aylık',
    aktif: true,
    maddeler: [],
  });
  const [statsData, setStatsData] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    totalEvaluations: 0,
    avgScore: 0,
  });

  const canManage = hasModulePermission(
    'Bonus Değerlendirme Yönetimi',
    'duzenleyebilir',
  );
  const canView = hasModulePermission('Bonus Değerlendirme Yönetimi');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, rolesRes, dashboardRes] = await Promise.all([
        bonusEvaluationAPI.getTemplates(),
        rolesAPI.getAll(),
        bonusEvaluationAPI.getDashboard().catch(() => ({ data: { data: {} } })),
      ]);

      if (templatesRes.data?.success) {
        setTemplates(templatesRes.data.data || []);
      }
      if (rolesRes.data) {
        setRoles(rolesRes.data || []);
      }
      if (dashboardRes.data?.success) {
        const data = dashboardRes.data.data;
        setStatsData({
          totalTemplates: templates.length,
          activeTemplates: data.activeTemplates || 0,
          totalEvaluations: data.monthlyEvaluations || 0,
          avgScore: data.avgScore || 0,
        });
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  }, [templates.length]);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView, loadData]);

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        ad: template.ad || '',
        rol: template.rol?._id || '',
        bonusKategorisi: template.bonusKategorisi || 'Performans',
        bonusCarpani: template.bonusCarpani || 1.0,
        degerlendirmePeriyodu: template.degerlendirmePeriyodu || 30,
        minimumPuan: template.minimumPuan || 70,
        degerlendirmeSikligi: template.degerlendirmeSikligi || 'Aylık',
        aktif: template.aktif !== false,
        maddeler: template.maddeler || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        ad: '',
        rol: '',
        bonusKategorisi: 'Performans',
        bonusCarpani: 1.0,
        degerlendirmePeriyodu: 'Aylık',
        minimumPuan: 70,
        degerlendirmeSikligi: 'Aylık',
        aktif: true,
        maddeler: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      const templateData = {
        ...formData,
        maddeler: formData.maddeler.map((madde, index) => ({
          ...madde,
          siraNo: index + 1,
        })),
      };

      if (editingTemplate) {
        await bonusEvaluationAPI.updateTemplate(
          editingTemplate._id,
          templateData,
        );
      } else {
        await bonusEvaluationAPI.createTemplate(templateData);
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Template save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async templateId => {
    if (window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await bonusEvaluationAPI.deleteTemplate(templateId);
        loadData();
      } catch (error) {
        console.error('Template delete error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const addMadde = () => {
    setFormData({
      ...formData,
      maddeler: [
        ...formData.maddeler,
        {
          baslik: '',
          aciklama: '',
          maksimumPuan: 10,
          zorunlu: true,
          fotografGereklimi: false,
        },
      ],
    });
  };

  const updateMadde = (index, field, value) => {
    const newMaddeler = [...formData.maddeler];
    newMaddeler[index] = { ...newMaddeler[index], [field]: value };
    setFormData({ ...formData, maddeler: newMaddeler });
  };

  const removeMadde = index => {
    const newMaddeler = formData.maddeler.filter((_, i) => i !== index);
    setFormData({ ...formData, maddeler: newMaddeler });
  };

  if (!canView) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ borderRadius: 3 }}>
          <Typography variant='h6' gutterBottom>
            Erişim Engellendi
          </Typography>
          Bu sayfaya erişim yetkiniz bulunmuyor. Bonus Değerlendirme Yönetimi
          modülü yetkisi gereklidir.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Container maxWidth='xl' sx={{ py: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
          }}
        >
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Typography variant='h3' fontWeight='bold' gutterBottom>
                Bonus Değerlendirme Yönetimi
                <BonusIcon sx={{ ml: 2, fontSize: '2.5rem' }} />
              </Typography>
              <Typography variant='h6' sx={{ opacity: 0.9, mb: 2 }}>
                Hoş geldiniz, {user?.ad} {user?.soyad}
              </Typography>
              <Typography variant='body1' sx={{ opacity: 0.8 }}>
                Bonus değerlendirme şablonlarını oluşturun ve yönetin
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: { xs: 80, md: 120 },
                    height: { xs: 80, md: 120 },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mx: 'auto',
                    mb: 2,
                    fontSize: { xs: '2rem', md: '3rem' },
                  }}
                >
                  {user?.ad?.charAt(0)}
                  {user?.soyad?.charAt(0)}
                </Avatar>
                <Chip
                  label='Sistem Yöneticisi'
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.9rem',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Toplam
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : statsData.totalTemplates}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Şablon
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Aktif
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : statsData.activeTemplates}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Şablon
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GroupsIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Bu Ay
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : statsData.totalEvaluations}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Değerlendirme
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                minHeight: 140,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BonusIcon sx={{ fontSize: '2rem', mr: 1 }} />
                  <Typography variant='h6' fontWeight='bold'>
                    Ortalama
                  </Typography>
                </Box>
                <Typography variant='h3' fontWeight='bold' gutterBottom>
                  {loading ? '...' : `${statsData.avgScore}%`}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Başarı
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Templates Table */}
        <Paper elevation={0} sx={{ borderRadius: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='h5' fontWeight='bold'>
                Bonus Değerlendirme Şablonları
              </Typography>
              {canManage && (
                <Button
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    borderRadius: 3,
                    background:
                      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  }}
                >
                  Yeni Şablon
                </Button>
              )}
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Şablon Adı</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Çarpan</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Madde Sayısı</TableCell>
                  {canManage && <TableCell>İşlemler</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {templates
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(template => (
                    <TableRow key={template._id}>
                      <TableCell>
                        <Typography fontWeight='bold'>{template.ad}</Typography>
                      </TableCell>
                      <TableCell>{template.rol?.ad}</TableCell>
                      <TableCell>
                        <Chip
                          label={template.bonusKategorisi}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>x{template.bonusCarpani}</TableCell>
                      <TableCell>
                        <Chip
                          label={template.aktif ? 'Aktif' : 'Pasif'}
                          color={template.aktif ? 'success' : 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        {template.maddeler?.length || 0} madde
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <IconButton
                            size='small'
                            onClick={() => handleOpenDialog(template)}
                            color='primary'
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteTemplate(template._id)}
                            color='error'
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div'
            count={templates.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
            labelRowsPerPage='Sayfa başına:'
          />
        </Paper>

        {/* Template Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Şablon Adı'
                  value={formData.ad}
                  onChange={e =>
                    setFormData({ ...formData, ad: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={formData.rol}
                    onChange={e =>
                      setFormData({ ...formData, rol: e.target.value })
                    }
                    label='Rol'
                  >
                    {roles.map(role => (
                      <MenuItem key={role._id} value={role._id}>
                        {role.ad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Bonus Kategorisi</InputLabel>
                  <Select
                    value={formData.bonusKategorisi}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        bonusKategorisi: e.target.value,
                      })
                    }
                    label='Bonus Kategorisi'
                  >
                    <MenuItem value='Performans'>Performans</MenuItem>
                    <MenuItem value='İnovasyon'>İnovasyon</MenuItem>
                    <MenuItem value='Takım Çalışması'>Takım Çalışması</MenuItem>
                    <MenuItem value='Liderlik'>Liderlik</MenuItem>
                    <MenuItem value='Özel Başarı'>Özel Başarı</MenuItem>
                    <MenuItem value='Performans Bonusu'>
                      Performans Bonusu
                    </MenuItem>
                    <MenuItem value='Verimlilik Bonusu'>
                      Verimlilik Bonusu
                    </MenuItem>
                    <MenuItem value='Günlük Bonus'>Günlük Bonus</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Bonus Çarpanı'
                  value={formData.bonusCarpani}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      bonusCarpani: parseFloat(e.target.value),
                    })
                  }
                  inputProps={{ step: 0.1, min: 0.1, max: 5.0 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Minimum Puan'
                  value={formData.minimumPuan}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      minimumPuan: parseInt(e.target.value, 10),
                    })
                  }
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Değerlendirme Sıklığı</InputLabel>
                  <Select
                    value={formData.degerlendirmeSikligi}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        degerlendirmeSikligi: e.target.value,
                      })
                    }
                    label='Değerlendirme Sıklığı'
                  >
                    <MenuItem value='Aylık'>Aylık</MenuItem>
                    <MenuItem value='Üç Aylık'>Üç Aylık</MenuItem>
                    <MenuItem value='Altı Aylık'>Altı Aylık</MenuItem>
                    <MenuItem value='Yıllık'>Yıllık</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Değerlendirme Periyodu (Gün)'
                  value={formData.degerlendirmePeriyodu}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      degerlendirmePeriyodu: parseInt(e.target.value, 10),
                    })
                  }
                  inputProps={{ min: 1, max: 365 }}
                  helperText='Değerlendirmeler arasındaki minimum gün sayısı'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.aktif}
                      onChange={e =>
                        setFormData({ ...formData, aktif: e.target.checked })
                      }
                    />
                  }
                  label='Aktif'
                />
              </Grid>

              {/* Değerlendirme Maddeleri */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6'>Değerlendirme Maddeleri</Typography>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={addMadde}
                  >
                    Madde Ekle
                  </Button>
                </Box>

                {formData.maddeler.map((madde, index) => (
                  <Accordion key={index} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {madde.baslik || `Madde ${index + 1}`} (
                        {madde.maksimumPuan} puan)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label='Başlık'
                            value={madde.baslik}
                            onChange={e =>
                              updateMadde(index, 'baslik', e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label='Açıklama'
                            value={madde.aciklama}
                            onChange={e =>
                              updateMadde(index, 'aciklama', e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            type='number'
                            label='Maksimum Puan'
                            value={madde.maksimumPuan}
                            onChange={e =>
                              updateMadde(
                                index,
                                'maksimumPuan',
                                parseInt(e.target.value, 10),
                              )
                            }
                            inputProps={{ min: 1, max: 100 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              height: '100%',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={madde.zorunlu}
                                  onChange={e =>
                                    updateMadde(
                                      index,
                                      'zorunlu',
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label='Zorunlu'
                            />
                            <Button
                              variant='outlined'
                              color='error'
                              size='small'
                              onClick={() => removeMadde(index)}
                            >
                              Sil
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
              İptal
            </Button>
            <Button
              onClick={handleSaveTemplate}
              variant='contained'
              startIcon={<SaveIcon />}
              disabled={
                !formData.ad || !formData.rol || formData.maddeler.length === 0
              }
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* Mobile FAB */}
        {isMobile && canManage && (
          <Zoom in={true}>
            <Fab
              color='primary'
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
              onClick={() => handleOpenDialog()}
            >
              <AddIcon />
            </Fab>
          </Zoom>
        )}
      </Container>
    </Box>
  );
};

export default BonusEvaluationManagement;
