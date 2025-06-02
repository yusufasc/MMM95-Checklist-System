import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Fade,
  Grow,
  Divider,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
  Edit as EditIcon,
  ChecklistRtl as ChecklistIcon,
  Schedule as ScheduleIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { checklistsAPI, rolesAPI, departmentsAPI } from '../services/api';

const Checklists = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [checklists, setChecklists] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    ad: '',
    tur: 'iseBagli',
    hedefRol: '',
    hedefDepartman: '',
    periyot: 'gunluk',
    isTuru: '',
    maddeler: [{ soru: '', puan: 5, resimUrl: '', aciklama: '' }],
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingChecklist, setDeletingChecklist] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showForceDelete, setShowForceDelete] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [checklistsRes, rolesRes, departmentsRes] = await Promise.all([
        checklistsAPI.getAll(),
        rolesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);

      setChecklists(checklistsRes.data);
      setRoles(rolesRes.data);
      setDepartments(departmentsRes.data);
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setEditMode(false);
    setEditingId(null);
    setFormData({
      ad: '',
      tur: 'iseBagli',
      hedefRol: '',
      hedefDepartman: '',
      periyot: 'gunluk',
      isTuru: '',
      maddeler: [{ soru: '', puan: 5, resimUrl: '', aciklama: '' }],
    });
    setOpen(true);
  };

  const handleEdit = checklist => {
    setEditMode(true);
    setEditingId(checklist._id);
    setFormData({
      ad: checklist.ad,
      tur: checklist.tur,
      hedefRol: checklist.hedefRol?._id || checklist.hedefRol,
      hedefDepartman: checklist.hedefDepartman?._id || checklist.hedefDepartman,
      periyot: checklist.periyot,
      isTuru: checklist.isTuru || '',
      maddeler: checklist.maddeler || [{ soru: '', puan: 5, resimUrl: '', aciklama: '' }],
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditingId(null);
    setError('');
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMaddelerChange = (index, field, value) => {
    const newMaddeler = [...formData.maddeler];
    newMaddeler[index][field] = value;
    setFormData({
      ...formData,
      maddeler: newMaddeler,
    });
  };

  const addMadde = () => {
    setFormData({
      ...formData,
      maddeler: [...formData.maddeler, { soru: '', puan: 5, resimUrl: '', aciklama: '' }],
    });
  };

  const removeMadde = index => {
    if (formData.maddeler.length > 1) {
      const newMaddeler = formData.maddeler.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        maddeler: newMaddeler,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');

      // Validasyon
      if (!formData.ad.trim()) {
        setError('Checklist adı gereklidir');
        return;
      }

      if (!formData.hedefRol) {
        setError('Hedef rol seçin');
        return;
      }

      if (!formData.hedefDepartman) {
        setError('Hedef departman seçin');
        return;
      }

      if (formData.tur === 'iseBagli' && !formData.isTuru.trim()) {
        setError('İş türü gereklidir');
        return;
      }

      const emptyMaddeler = formData.maddeler.filter(m => !m.soru.trim());
      if (emptyMaddeler.length > 0) {
        setError('Tüm maddelerin soruları doldurulmalıdır');
        return;
      }

      if (editMode) {
        await checklistsAPI.update(editingId, formData);
        setSuccess('Checklist şablonu başarıyla güncellendi');
      } else {
        await checklistsAPI.create(formData);
        setSuccess('Checklist şablonu başarıyla eklendi');
      }

      handleClose();
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'İşlem sırasında hata oluştu');
    }
  };

  const handleDeleteOpen = checklist => {
    setDeletingChecklist(checklist);
    setDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialog(false);
    setDeletingChecklist(null);
    setDeleteError(null);
    setShowForceDelete(false);
  };

  const handleDelete = async () => {
    try {
      setError('');
      setDeleteError(null);
      await checklistsAPI.delete(deletingChecklist._id);
      setSuccess(`"${deletingChecklist.ad}" checklist şablonu başarıyla silindi`);
      handleDeleteClose();
      loadData();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.canForceDelete && errorData?.activeTasksCount > 0) {
        setDeleteError({
          message: errorData.message,
          activeTasksCount: errorData.activeTasksCount,
          canForceDelete: true,
        });
        setShowForceDelete(true);
      } else {
        setError(errorData?.message || 'Silme işlemi sırasında hata oluştu');
      }
    }
  };

  const handleForceDelete = async () => {
    try {
      setError('');
      setDeleteError(null);
      const response = await checklistsAPI.forceDelete(deletingChecklist._id);
      const result = response.data;
      setSuccess(
        `"${deletingChecklist.ad}" checklist şablonu ve ${result.cancelledTasksCount} aktif görev başarıyla silindi`,
      );
      handleDeleteClose();
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Zorla silme işlemi sırasında hata oluştu');
    }
  };

  const getTypeColor = type => {
    return type === 'rutin' ? 'primary' : 'secondary';
  };

  const getTypeIcon = type => {
    return type === 'rutin' ? <ScheduleIcon /> : <WorkIcon />;
  };

  const getPeriyotText = periyot => {
    const periyotMap = {
      gunluk: 'Günlük',
      haftalik: 'Haftalık',
      aylik: 'Aylık',
      olayBazli: 'Olay Bazlı',
    };
    return periyotMap[periyot] || periyot;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Paper
        elevation={8}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <ChecklistIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
                Checklist Şablonları
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Toplam {checklists.length} şablon
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                },
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontWeight: 'bold',
                minHeight: 44,
              }}
            >
              Yeni Checklist
            </Button>
          )}
        </Box>
      </Paper>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Alerts */}
      {error && (
        <Fade in={!!error}>
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError('')}
            action={
              <IconButton size="small" onClick={() => setError('')}>
                <CloseIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {success && (
        <Fade in={!!success}>
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setSuccess('')}
            action={
              <IconButton size="small" onClick={() => setSuccess('')}>
                <CloseIcon />
              </IconButton>
            }
          >
            {success}
          </Alert>
        </Fade>
      )}

      {/* Checklist Cards */}
      {checklists.length === 0 ? (
        <Paper
          elevation={4}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          }}
        >
          <ChecklistIcon sx={{ fontSize: 80, color: 'rgba(0,0,0,0.3)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Henüz checklist şablonu bulunmuyor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            İlk checklist şablonunuzu oluşturmak için "Yeni Checklist" butonuna tıklayın
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {checklists.map((checklist, index) => (
            <Grid item xs={12} sm={6} lg={4} key={checklist._id}>
              <Grow in timeout={300 + index * 100}>
                <Card
                  elevation={8}
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background:
                        checklist.tur === 'rutin'
                          ? 'linear-gradient(90deg, #667eea, #764ba2)'
                          : 'linear-gradient(90deg, #f093fb, #f5576c)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: checklist.tur === 'rutin' ? 'primary.main' : 'secondary.main',
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getTypeIcon(checklist.tur)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            color: 'text.primary',
                            lineHeight: 1.2,
                            mb: 0.5,
                          }}
                        >
                          {checklist.ad}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {checklist.isTuru && `İş Türü: ${checklist.isTuru}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleEdit(checklist);
                          }}
                          sx={{
                            bgcolor: 'action.hover',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteOpen(checklist);
                          }}
                          sx={{
                            bgcolor: 'action.hover',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'white',
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Info Chips */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        icon={getTypeIcon(checklist.tur)}
                        label={checklist.tur === 'rutin' ? 'Rutin' : 'İşe Bağlı'}
                        color={getTypeColor(checklist.tur)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Chip
                        icon={<ScheduleIcon />}
                        label={getPeriyotText(checklist.periyot)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {/* Details */}
                    <Box sx={{ space: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GroupIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Rol:</strong> {checklist.hedefRol?.ad}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WorkIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Departman:</strong> {checklist.hedefDepartman?.ad}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Madde Sayısı:</strong> {checklist.maddeler?.length || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(checklist)}
                      sx={{
                        borderRadius: 3,
                        py: 1,
                        fontWeight: 'bold',
                        minHeight: 44,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteOpen(checklist)}
                      sx={{
                        borderRadius: 3,
                        py: 1,
                        fontWeight: 'bold',
                        minHeight: 44,
                        minWidth: 120,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          bgcolor: 'error.main',
                          color: 'white',
                        },
                      }}
                    >
                      Sil
                    </Button>
                  </CardActions>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Checklist Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            },
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}
          >
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <ChecklistIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {editMode ? 'Checklist Şablonu Düzenle' : 'Yeni Checklist Şablonu Ekle'}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
              Temel Bilgiler
            </Typography>

            <TextField
              autoFocus
              margin="dense"
              name="ad"
              label="Checklist Adı *"
              fullWidth
              variant="outlined"
              value={formData.ad}
              onChange={handleChange}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              placeholder="örn: Kalıp Değişim İşlemi"
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tür *</InputLabel>
                  <Select
                    name="tur"
                    value={formData.tur}
                    onChange={handleChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="rutin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" />
                        Rutin (Sürekli)
                      </Box>
                    </MenuItem>
                    <MenuItem value="iseBagli">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon fontSize="small" />
                        İşe Bağlı (Olay Bazlı)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Periyot *</InputLabel>
                  <Select
                    name="periyot"
                    value={formData.periyot}
                    onChange={handleChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="gunluk">Günlük</MenuItem>
                    <MenuItem value="haftalik">Haftalık</MenuItem>
                    <MenuItem value="aylik">Aylık</MenuItem>
                    <MenuItem value="olayBazli">Olay Bazlı</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Hedef Rol *</InputLabel>
                  <Select
                    name="hedefRol"
                    value={formData.hedefRol}
                    onChange={handleChange}
                    sx={{ borderRadius: 2 }}
                  >
                    {roles.map(role => (
                      <MenuItem key={role._id} value={role._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupIcon fontSize="small" />
                          {role.ad}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Hedef Departman *</InputLabel>
                  <Select
                    name="hedefDepartman"
                    value={formData.hedefDepartman}
                    onChange={handleChange}
                    sx={{ borderRadius: 2 }}
                  >
                    {departments.map(dept => (
                      <MenuItem key={dept._id} value={dept._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WorkIcon fontSize="small" />
                          {dept.ad}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {formData.tur === 'iseBagli' && (
              <Grow in={formData.tur === 'iseBagli'}>
                <TextField
                  margin="dense"
                  name="isTuru"
                  label="İş Türü *"
                  fullWidth
                  variant="outlined"
                  value={formData.isTuru}
                  onChange={handleChange}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  placeholder="örn: Kalıp Değişim, Makine Arızası"
                  helperText="Bu iş türü için geçerli olan kontrol listesi"
                />
              </Grow>
            )}
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" color="primary" fontWeight="bold">
                Checklist Maddeleri ({formData.maddeler.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={addMadde}
                sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Madde Ekle
              </Button>
            </Box>

            <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {formData.maddeler.map((madde, index) => (
                <Grow in key={index} timeout={300 + index * 100}>
                  <ListItem
                    sx={{
                      border: '2px solid #e3f2fd',
                      mb: 2,
                      borderRadius: 3,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      position: 'relative',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={`Madde ${index + 1}`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeMadde(index)}
                          disabled={formData.maddeler.length === 1}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'white',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            label="Kontrol Sorusu *"
                            value={madde.soru}
                            onChange={e => handleMaddelerChange(index, 'soru', e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                            placeholder="örn: Eski kalıp çıkarıldı mı?"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Puan *"
                            type="number"
                            value={madde.puan}
                            onChange={e =>
                              handleMaddelerChange(index, 'puan', parseInt(e.target.value) || 0)
                            }
                            fullWidth
                            inputProps={{ min: 1, max: 100 }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Resim URL (Opsiyonel)"
                            value={madde.resimUrl}
                            onChange={e => handleMaddelerChange(index, 'resimUrl', e.target.value)}
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                            placeholder="https://example.com/image.jpg"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Açıklama (Opsiyonel)"
                            value={madde.aciklama}
                            onChange={e => handleMaddelerChange(index, 'aciklama', e.target.value)}
                            fullWidth
                            multiline
                            rows={1}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                            placeholder="Ek açıklamalar..."
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </ListItem>
                </Grow>
              ))}
            </List>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            onClick={handleClose}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              minHeight: 44,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1,
              fontWeight: 'bold',
              minHeight: 44,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            {editMode ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog'u */}
      <Dialog
        open={deleteDialog}
        onClose={handleDeleteClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <DeleteIcon />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            Checklist Şablonu Sil
          </Typography>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              Bu işlem geri alınamaz!
            </Typography>
            <Typography variant="body2">
              Checklist şablonu silindiğinde, bu şablona bağlı aktif görevler varsa silme işlemi
              engellenecektir. Tamamlanmış görevler korunacaktır.
            </Typography>
          </Alert>

          {/* Aktif Görev Uyarısı */}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                ⚠️ Aktif Görevler Bulundu!
              </Typography>
              <Typography variant="body2" gutterBottom>
                {deleteError.message}
              </Typography>
              {deleteError.canForceDelete && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  <strong>Zorla Silme:</strong> Tüm aktif görevleri iptal ederek şablonu
                  silebilirsiniz. Bu işlem geri alınamaz!
                </Typography>
              )}
            </Alert>
          )}

          {deletingChecklist && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography variant="body1" gutterBottom>
                <strong>Silinecek Checklist:</strong>
              </Typography>
              <Typography variant="h6" color="error.main" fontWeight="bold" gutterBottom>
                {deletingChecklist.ad}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Tür:</strong> {deletingChecklist.tur === 'rutin' ? 'Rutin' : 'İşe Bağlı'}
                <br />
                <strong>Hedef Rol:</strong> {deletingChecklist.hedefRol?.ad}
                <br />
                <strong>Departman:</strong> {deletingChecklist.hedefDepartman?.ad}
                <br />
                <strong>Madde Sayısı:</strong> {deletingChecklist.maddeler?.length || 0}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
            Bu checklist şablonunu silmek istediğinizden emin misiniz?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            onClick={handleDeleteClose}
            variant="outlined"
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              minHeight: 44,
            }}
          >
            İptal
          </Button>

          {!showForceDelete ? (
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1,
                fontWeight: 'bold',
                minHeight: 44,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: 'linear-gradient(135deg, #e91e63 0%, #f44336 100%)',
                },
              }}
            >
              Evet, Sil
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleDelete}
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  minHeight: 44,
                }}
              >
                Normal Sil
              </Button>
              <Button
                onClick={handleForceDelete}
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1,
                  fontWeight: 'bold',
                  minHeight: 44,
                  background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    background: 'linear-gradient(135deg, #b71c1c 0%, #8e0000 100%)',
                  },
                }}
              >
                🚨 Zorla Sil ({deleteError?.activeTasksCount} Görev)
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Checklists;
