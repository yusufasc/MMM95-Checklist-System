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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { machinesAPI, departmentsAPI, rolesAPI } from '../services/api';

const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    makinaNo: '',
    departman: '',
    sorumluRoller: [],
    durum: 'aktif',
    aciklama: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [machinesRes, departmentsRes, rolesRes] = await Promise.all([
        machinesAPI.getAll(),
        departmentsAPI.getAll(),
        rolesAPI.getAll(),
      ]);

      setMachines(machinesRes.data);
      setDepartments(departmentsRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Veri yükleme hatası:', error);
      }
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (machine = null) => {
    if (machine) {
      setEditingMachine(machine);
      setFormData({
        ad: machine.ad,
        makinaNo: machine.makinaNo,
        departman: machine.departman._id,
        sorumluRoller: machine.sorumluRoller.map(role => role._id),
        durum: machine.durum,
        aciklama: machine.aciklama || '',
      });
    } else {
      setEditingMachine(null);
      setFormData({
        ad: '',
        makinaNo: '',
        departman: '',
        sorumluRoller: [],
        durum: 'aktif',
        aciklama: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMachine(null);
    setError('');
    setSuccess('');
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = event => {
    setFormData(prev => ({
      ...prev,
      sorumluRoller: event.target.value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await machinesAPI.update(editingMachine._id, formData);
        setSuccess('Makina başarıyla güncellendi');
      } else {
        await machinesAPI.create(formData);
        setSuccess('Makina başarıyla eklendi');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'İşlem sırasında hata oluştu');
    }
  };

  const handleDelete = async id => {
    if (window.confirm('Bu makinayı silmek istediğinizden emin misiniz?')) {
      try {
        await machinesAPI.delete(id);
        setSuccess('Makina başarıyla silindi');
        await loadData();
      } catch (error) {
        setError(error.response?.data?.message || 'Silme işlemi sırasında hata oluştu');
      }
    }
  };

  const getDurumColor = durum => {
    switch (durum) {
      case 'aktif':
        return 'success';
      case 'bakim':
        return 'warning';
      case 'arizali':
        return 'error';
      case 'pasif':
        return 'default';
      default:
        return 'default';
    }
  };

  const getDurumText = durum => {
    switch (durum) {
      case 'aktif':
        return 'Aktif';
      case 'bakim':
        return 'Bakımda';
      case 'arizali':
        return 'Arızalı';
      case 'pasif':
        return 'Pasif';
      default:
        return durum;
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <BuildIcon />
          Envanter Yönetimi
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Yeni Makina
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Makina No</TableCell>
              <TableCell>Makina Adı</TableCell>
              <TableCell>Departman</TableCell>
              <TableCell>Sorumlu Roller</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {machines.map(machine => (
              <TableRow key={machine._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {machine.makinaNo}
                  </Typography>
                </TableCell>
                <TableCell>{machine.ad}</TableCell>
                <TableCell>{machine.departman?.ad}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {machine.sorumluRoller.map(role => (
                      <Chip key={role._id} label={role.ad} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDurumText(machine.durum)}
                    color={getDurumColor(machine.durum)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {machine.aciklama}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Düzenle">
                    <IconButton size="small" onClick={() => handleOpenDialog(machine)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(machine._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Makina Ekleme/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingMachine ? 'Makina Düzenle' : 'Yeni Makina Ekle'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                name="makinaNo"
                label="Makina Numarası"
                value={formData.makinaNo}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <TextField
                name="ad"
                label="Makina Adı"
                value={formData.ad}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Departman</InputLabel>
                <Select
                  name="departman"
                  value={formData.departman}
                  onChange={handleInputChange}
                  label="Departman"
                >
                  {departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Sorumlu Roller</InputLabel>
                <Select
                  multiple
                  value={formData.sorumluRoller}
                  onChange={handleRoleChange}
                  label="Sorumlu Roller"
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => {
                        const role = roles.find(r => r._id === value);
                        return <Chip key={value} label={role?.ad} size="small" />;
                      })}
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

              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  name="durum"
                  value={formData.durum}
                  onChange={handleInputChange}
                  label="Durum"
                >
                  <MenuItem value="aktif">Aktif</MenuItem>
                  <MenuItem value="bakim">Bakımda</MenuItem>
                  <MenuItem value="arizali">Arızalı</MenuItem>
                  <MenuItem value="pasif">Pasif</MenuItem>
                </Select>
              </FormControl>

              <TextField
                name="aciklama"
                label="Açıklama"
                value={formData.aciklama}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button type="submit" variant="contained">
              {editingMachine ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Machines;
