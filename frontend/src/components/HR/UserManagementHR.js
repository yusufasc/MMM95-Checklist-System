import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Paper,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { hrAPI, rolesAPI, departmentsAPI } from '../../services/api';

const UserManagementHR = ({
  users: initialUsers,
  hrYetkileri,
  onUserDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    kullaniciAdi: '',
    sifre: '',
    roller: [],
    departmanlar: [],
    durum: 'aktif',
  });

  // Load roles and departments when dialog opens
  const handleOpen = async () => {
    try {
      setLoading(true);
      const [rolesRes, deptRes] = await Promise.all([
        rolesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      setRoles(rolesRes.data);
      setDepartments(deptRes.data);
      setOpen(true);
      resetForm();
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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

  const handleClose = () => {
    setOpen(false);
    resetForm();
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

      if (!formData.sifre || formData.sifre.length < 6) {
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

      setLoading(true);
      await hrAPI.createUser(formData);

      handleClose();
      // Parent component will reload data
      window.location.reload(); // Temporary solution
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Kullanıcı oluşturma sırasında hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hrYetkileri?.kullaniciAcabilir && !hrYetkileri?.kullaniciSilebilir) {
    return (
      <Alert severity='warning'>
        Kullanıcı yönetimi yetkisine sahip değilsiniz.
      </Alert>
    );
  }

  // Filter users based on allowed roles
  const filteredUsers = initialUsers.filter(user => {
    if (!hrYetkileri.acabildigiRoller && !hrYetkileri.silebildigiRoller) {
      return false;
    }

    const userRoleIds = user.roller?.map(r => r._id) || [];
    const allowedRoleIds = [
      ...(hrYetkileri.acabildigiRoller || []),
      ...(hrYetkileri.silebildigiRoller || []),
    ].map(r => r._id || r);

    return userRoleIds.some(roleId => allowedRoleIds.includes(roleId));
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant='h6' component='h2'>
          Kullanıcı Yönetimi ({filteredUsers.length} kullanıcı)
        </Typography>
        {hrYetkileri?.kullaniciAcabilir && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{ borderRadius: 2 }}
          >
            Yeni Kullanıcı
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Ad Soyad</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Kullanıcı Adı</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Departmanlar</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Roller</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow
                key={user._id}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:nth-of-type(odd)': { bgcolor: 'action.selected' },
                }}
              >
                <TableCell>
                  {user.ad} {user.soyad}
                </TableCell>
                <TableCell>{user.kullaniciAdi}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.departmanlar?.map(dept => (
                      <Chip
                        key={dept._id}
                        label={dept.ad}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.roller?.map(role => (
                      <Chip
                        key={role._id}
                        label={role.ad}
                        size='small'
                        color='primary'
                        variant='outlined'
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.durum}
                    color={user.durum === 'aktif' ? 'success' : 'error'}
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {hrYetkileri?.kullaniciSilebilir && (
                      <IconButton
                        size='small'
                        onClick={() => onUserDelete(user._id)}
                        color='error'
                        sx={{ minWidth: 32 }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
                  <Typography color='text.secondary'>
                    Yönetebileceğiniz kullanıcı bulunmamaktadır.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add User Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
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
            label='Ad'
            fullWidth
            variant='outlined'
            value={formData.ad}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin='dense'
            name='soyad'
            label='Soyad'
            fullWidth
            variant='outlined'
            value={formData.soyad}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin='dense'
            name='kullaniciAdi'
            label='Kullanıcı Adı'
            fullWidth
            variant='outlined'
            value={formData.kullaniciAdi}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin='dense'
            name='sifre'
            label='Şifre (en az 6 karakter)'
            type='password'
            fullWidth
            variant='outlined'
            value={formData.sifre}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Roller</InputLabel>
            <Select
              name='roller'
              multiple
              value={formData.roller}
              onChange={handleChange}
              label='Roller'
            >
              {roles
                .filter(role => {
                  if (!hrYetkileri.acabildigiRoller) {
                    return false;
                  }
                  const allowedRoleIds = hrYetkileri.acabildigiRoller.map(
                    r => r._id || r,
                  );
                  return allowedRoleIds.includes(role._id);
                })
                .map(role => (
                  <MenuItem key={role._id} value={role._id}>
                    {role.ad}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Departmanlar</InputLabel>
            <Select
              name='departmanlar'
              multiple
              value={formData.departmanlar}
              onChange={handleChange}
              label='Departmanlar'
            >
              {departments.map(dept => (
                <MenuItem key={dept._id} value={dept._id}>
                  {dept.ad}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementHR;
