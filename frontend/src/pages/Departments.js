import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Checkbox,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { departmentsAPI } from '../services/api';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    ad: '',
    digerDepartmanYetkileri: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getAll();
      setDepartments(response.data);
    } catch (error) {
      setError(
        'Veriler yüklenirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setEditMode(false);
    setEditingId(null);
    setOpen(true);
  };

  const handleEdit = department => {
    setEditMode(true);
    setEditingId(department._id);
    setFormData({
      ad: department.ad,
      digerDepartmanYetkileri: department.digerDepartmanYetkileri || [],
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditingId(null);
    setFormData({
      ad: '',
      digerDepartmanYetkileri: [],
    });
    setError('');
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleYetkiChange = (hedefDepartmanId, yetkiTuru, value) => {
    const newYetkiler = [...formData.digerDepartmanYetkileri];
    const existingIndex = newYetkiler.findIndex(
      y =>
        y.hedefDepartman === hedefDepartmanId ||
        y.hedefDepartman?._id === hedefDepartmanId,
    );

    if (existingIndex >= 0) {
      newYetkiler[existingIndex][yetkiTuru] = value;
    } else {
      newYetkiler.push({
        hedefDepartman: hedefDepartmanId,
        gorebilir: yetkiTuru === 'gorebilir' ? value : false,
        puanlayabilir: yetkiTuru === 'puanlayabilir' ? value : false,
      });
    }

    setFormData({
      ...formData,
      digerDepartmanYetkileri: newYetkiler,
    });
  };

  const getYetkiDurumu = (hedefDepartmanId, yetkiTuru) => {
    const yetki = formData.digerDepartmanYetkileri.find(
      y =>
        y.hedefDepartman === hedefDepartmanId ||
        y.hedefDepartman?._id === hedefDepartmanId,
    );
    return yetki ? yetki[yetkiTuru] : false;
  };

  const handleSubmit = async () => {
    try {
      setError('');

      if (!formData.ad.trim()) {
        setError('Departman adı gereklidir');
        return;
      }

      // Boş yetkileri temizle
      const cleanedYetkiler = formData.digerDepartmanYetkileri.filter(
        y => y.gorebilir || y.puanlayabilir,
      );

      const submitData = {
        ...formData,
        digerDepartmanYetkileri: cleanedYetkiler,
      };

      if (editMode) {
        await departmentsAPI.update(editingId, submitData);
        setSuccess('Departman başarıyla güncellendi');
      } else {
        await departmentsAPI.create(submitData);
        setSuccess('Departman başarıyla eklendi');
      }

      handleClose();
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'İşlem sırasında hata oluştu');
    }
  };

  const getYetkiSayisi = department => {
    return department.digerDepartmanYetkileri?.length || 0;
  };

  const getYetkiDetayi = department => {
    const yetkiler = department.digerDepartmanYetkileri || [];
    const gorebilir = yetkiler.filter(y => y.gorebilir).length;
    const puanlayabilir = yetkiler.filter(y => y.puanlayabilir).length;
    return { gorebilir, puanlayabilir };
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4'>Departman Yönetimi</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Yeni Departman
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Departman Adı</TableCell>
              <TableCell>Yetki Sayısı</TableCell>
              <TableCell>Yetki Detayı</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map(department => {
              const yetkiDetayi = getYetkiDetayi(department);
              return (
                <TableRow key={department._id}>
                  <TableCell>
                    <Typography variant='h6'>{department.ad}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getYetkiSayisi(department)}
                      color='primary'
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={<VisibilityIcon />}
                        label={`${yetkiDetayi.gorebilir} Görme`}
                        variant='outlined'
                        size='small'
                        color='info'
                      />
                      <Chip
                        icon={<AssessmentIcon />}
                        label={`${yetkiDetayi.puanlayabilir} Puanlama`}
                        variant='outlined'
                        size='small'
                        color='success'
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(department.olusturmaTarihi).toLocaleDateString(
                      'tr-TR',
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size='small'
                      onClick={() => handleEdit(department)}
                      color='primary'
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Departman Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>
          {editMode ? 'Departman Düzenle' : 'Yeni Departman Ekle'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin='dense'
            name='ad'
            label='Departman Adı'
            fullWidth
            variant='outlined'
            value={formData.ad}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Typography variant='h6' gutterBottom>
            Diğer Departmanlara Yetkileri
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Bu departmanın hangi departmanları görüntüleyebileceğini ve
            puanlayabileceğini belirleyin.
          </Typography>

          {departments
            .filter(dept => !editMode || dept._id !== editingId)
            .map(targetDept => (
              <Accordion key={targetDept._id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Typography variant='h6'>{targetDept.ad}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {getYetkiDurumu(targetDept._id, 'gorebilir') && (
                        <Chip label='Görme' size='small' color='info' />
                      )}
                      {getYetkiDurumu(targetDept._id, 'puanlayabilir') && (
                        <Chip label='Puanlama' size='small' color='success' />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={getYetkiDurumu(targetDept._id, 'gorebilir')}
                          onChange={e =>
                            handleYetkiChange(
                              targetDept._id,
                              'gorebilir',
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label='Bu departmanın işlerini görüntüleyebilir'
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={getYetkiDurumu(
                            targetDept._id,
                            'puanlayabilir',
                          )}
                          onChange={e =>
                            handleYetkiChange(
                              targetDept._id,
                              'puanlayabilir',
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label='Bu departmanın işlerini puanlayabilir'
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSubmit} variant='contained'>
            {editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;
