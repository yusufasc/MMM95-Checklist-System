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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { usersAPI, rolesAPI, departmentsAPI } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    kullaniciAdi: '',
    sifre: '',
    roller: [],
    departmanlar: [],
    durum: 'aktif',
  });

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, departmentsRes] = await Promise.all([
        usersAPI.getAll(),
        rolesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);

      setUsers(usersRes.data);
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
    setOpen(true);
    setEditMode(false);
    setEditingUserId(null);
    setFormData({
      ad: '',
      soyad: '',
      kullaniciAdi: '',
      sifre: '',
      roller: [],
      departmanlar: [],
      durum: 'aktif',
    });
  };

  const handleEdit = user => {
    setEditMode(true);
    setEditingUserId(user._id);
    setOpen(true);
    setFormData({
      ad: user.ad,
      soyad: user.soyad,
      kullaniciAdi: user.kullaniciAdi,
      sifre: '', // Şifreyi boş bırak
      roller: user.roller.map(r => r._id),
      departmanlar: user.departmanlar.map(d => d._id),
      durum: user.durum,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditingUserId(null);
    setFormData({
      ad: '',
      soyad: '',
      kullaniciAdi: '',
      sifre: '',
      roller: [],
      departmanlar: [],
      durum: 'aktif',
    });
    setError('');
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');

      // Validasyon
      if (!formData.ad || !formData.soyad || !formData.kullaniciAdi) {
        setError('Ad, soyad ve kullanıcı adı zorunludur');
        return;
      }

      if (!editMode && !formData.sifre) {
        setError('Şifre zorunludur');
        return;
      }

      if (formData.sifre && formData.sifre.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return;
      }

      if (formData.roller.length === 0) {
        setError('En az bir rol seçin');
        return;
      }

      if (formData.departmanlar.length === 0) {
        setError('En az bir departman seçin');
        return;
      }

      if (editMode) {
        // Şifre boşsa, şifre alanını formdan çıkar
        const updateData = { ...formData };
        if (!updateData.sifre) {
          delete updateData.sifre;
        }
        await usersAPI.update(editingUserId, updateData);
        setSuccess('Kullanıcı başarıyla güncellendi');
      } else {
        await usersAPI.create(formData);
        setSuccess('Kullanıcı başarıyla eklendi');
      }

      handleClose();
      loadData(); // Listeyi yenile
    } catch (error) {
      setError(error.response?.data?.message || 'İşlem sırasında bir hata oluştu');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Kullanıcı Yönetimi</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Yeni Kullanıcı
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
              <TableCell>Ad Soyad</TableCell>
              <TableCell>Kullanıcı Adı</TableCell>
              <TableCell>Roller</TableCell>
              <TableCell>Departmanlar</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user._id}>
                <TableCell>
                  {user.ad} {user.soyad}
                </TableCell>
                <TableCell>{user.kullaniciAdi}</TableCell>
                <TableCell>
                  {user.roller?.map(rol => (
                    <Chip key={rol._id} label={rol.ad} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  {user.departmanlar?.map(dept => (
                    <Chip
                      key={dept._id}
                      label={dept.ad}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.durum}
                    color={user.durum === 'aktif' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => handleEdit(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kullanıcı Ekleme/Düzenleme Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            name="ad"
            label="Ad"
            fullWidth
            variant="outlined"
            value={formData.ad}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="soyad"
            label="Soyad"
            fullWidth
            variant="outlined"
            value={formData.soyad}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="kullaniciAdi"
            label="Kullanıcı Adı"
            fullWidth
            variant="outlined"
            value={formData.kullaniciAdi}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="sifre"
            label={
              editMode
                ? 'Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)'
                : 'Şifre (en az 6 karakter)'
            }
            type="password"
            fullWidth
            variant="outlined"
            value={formData.sifre}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Roller</InputLabel>
            <Select
              name="roller"
              multiple
              value={formData.roller}
              onChange={handleChange}
              label="Roller"
            >
              {roles.map(role => (
                <MenuItem key={role._id} value={role._id}>
                  {role.ad}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Departmanlar</InputLabel>
            <Select
              name="departmanlar"
              multiple
              value={formData.departmanlar}
              onChange={handleChange}
              label="Departmanlar"
            >
              {departments.map(dept => (
                <MenuItem key={dept._id} value={dept._id}>
                  {dept.ad}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Durum</InputLabel>
            <Select name="durum" value={formData.durum} onChange={handleChange} label="Durum">
              <MenuItem value="aktif">Aktif</MenuItem>
              <MenuItem value="pasif">Pasif</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            İptal
          </Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<SaveIcon />}>
            {editMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
