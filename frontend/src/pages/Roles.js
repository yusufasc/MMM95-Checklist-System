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
  Chip,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { rolesAPI, modulesAPI } from '../services/api';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    ad: '',
    moduller: [],
    checklistYetkileri: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, modulesRes] = await Promise.all([rolesAPI.getAll(), modulesAPI.getAll()]);

      setRoles(rolesRes.data);
      setModules(modulesRes.data);
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
    setEditingRoleId(null);
    // Tüm modüller için varsayılan yetkileri ayarla
    const defaultModules = modules.map(module => ({
      modul: module._id,
      erisebilir: false,
      duzenleyebilir: false,
    }));
    // Tüm roller için varsayılan checklist yetkileri ayarla
    const defaultChecklistYetkileri = roles.map(role => ({
      hedefRol: role._id,
      gorebilir: false,
      onaylayabilir: false,
    }));
    setFormData({
      ad: '',
      moduller: defaultModules,
      checklistYetkileri: defaultChecklistYetkileri,
    });
  };

  const handleEdit = async roleId => {
    try {
      setLoading(true);
      const response = await rolesAPI.getById(roleId);
      const role = response.data;

      setEditMode(true);
      setEditingRoleId(roleId);
      setOpen(true);

      // Mevcut modül yetkileri
      const modulePermissions = modules.map(module => {
        const existing = role.moduller?.find(m => m.modul?._id === module._id);
        return {
          modul: module._id,
          erisebilir: existing?.erisebilir || false,
          duzenleyebilir: existing?.duzenleyebilir || false,
        };
      });

      // Mevcut checklist yetkileri
      const checklistPermissions = roles.map(targetRole => {
        const existing = role.checklistYetkileri?.find(c => {
          // Backend'den hedefRol object olarak geldiği için _id kullanıyoruz
          const hedefRolId = c.hedefRol?._id || c.hedefRol;
          return hedefRolId === targetRole._id;
        });

        const processed = {
          hedefRol: targetRole._id,
          gorebilir: existing?.gorebilir === true,
          onaylayabilir: existing?.onaylayabilir === true,
        };

        return processed;
      });

      setFormData({
        ad: role.ad,
        moduller: modulePermissions,
        checklistYetkileri: checklistPermissions,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Rol bilgileri yükleme hatası:', error);
      }
      setError('Rol bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditingRoleId(null);
    setFormData({
      ad: '',
      moduller: [],
      checklistYetkileri: [],
    });
    setError('');
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleModulePermissionChange = (moduleId, permission, value) => {
    setFormData(prev => ({
      ...prev,
      moduller: prev.moduller.map(mod =>
        mod.modul === moduleId ? { ...mod, [permission]: value } : mod,
      ),
    }));
  };

  const handleChecklistPermissionChange = (roleId, permission, value) => {
    setFormData(prev => {
      const existingPermIndex = prev.checklistYetkileri.findIndex(perm => perm.hedefRol === roleId);

      if (existingPermIndex >= 0) {
        // Mevcut yetki varsa güncelle
        const updatedYetkileri = [...prev.checklistYetkileri];
        updatedYetkileri[existingPermIndex] = {
          ...updatedYetkileri[existingPermIndex],
          [permission]: value,
        };

        // Eğer onaylayabilir true yapılıyorsa, gorebilir de true yap
        if (permission === 'onaylayabilir' && value === true) {
          updatedYetkileri[existingPermIndex].gorebilir = true;
        }

        // Eğer gorebilir false yapılıyorsa, onaylayabilir de false yap
        if (permission === 'gorebilir' && value === false) {
          updatedYetkileri[existingPermIndex].onaylayabilir = false;
        }

        return {
          ...prev,
          checklistYetkileri: updatedYetkileri,
        };
      } else {
        // Yeni yetki ekle
        const newPermission = {
          hedefRol: roleId,
          gorebilir:
            permission === 'gorebilir'
              ? value
              : permission === 'onaylayabilir' && value
                ? true
                : false,
          onaylayabilir: permission === 'onaylayabilir' ? value : false,
        };

        return {
          ...prev,
          checklistYetkileri: [...prev.checklistYetkileri, newPermission],
        };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');

      if (!formData.ad.trim()) {
        setError('Rol adı gereklidir');
        return;
      }

      if (editMode) {
        await rolesAPI.update(editingRoleId, formData);
        setSuccess('Rol başarıyla güncellendi');
      } else {
        await rolesAPI.create(formData);
        setSuccess('Rol başarıyla eklendi');
      }

      handleClose();
      await loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Rol işlemi sırasında hata oluştu');
    }
  };

  const handleDelete = async roleId => {
    if (window.confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
      try {
        await rolesAPI.delete(roleId);
        setSuccess('Rol başarıyla silindi');
        loadData();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Rol silme hatası:', error);
        }
        setError('Rol silinirken hata oluştu');
      }
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
        <Typography variant="h4">Rol Yönetimi</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Yeni Rol
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
              <TableCell>Rol Adı</TableCell>
              <TableCell>Modül Yetkileri</TableCell>
              <TableCell>Checklist Yetkileri</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map(role => (
              <TableRow key={role._id}>
                <TableCell>
                  <Typography variant="h6">{role.ad}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {role.moduller?.map((modulePermission, index) => (
                      <Chip
                        key={index}
                        label={`${modulePermission.modul?.ad} ${modulePermission.erisebilir ? '(E)' : ''} ${modulePermission.duzenleyebilir ? '(D)' : ''}`}
                        size="small"
                        color={modulePermission.erisebilir ? 'primary' : 'default'}
                        variant={modulePermission.duzenleyebilir ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {role.checklistYetkileri?.map((checklistPerm, index) => (
                      <Chip
                        key={index}
                        label={`${checklistPerm.hedefRol?.ad} ${checklistPerm.gorebilir ? '(G)' : ''} ${checklistPerm.onaylayabilir ? '(P)' : ''}`}
                        size="small"
                        color={checklistPerm.gorebilir ? 'secondary' : 'default'}
                        variant={checklistPerm.onaylayabilir ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(role._id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(role._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Yeni/Düzenle Rol Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>{editMode ? 'Rol Düzenle' : 'Yeni Rol Ekle'}</DialogTitle>
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
            label="Rol Adı"
            fullWidth
            variant="outlined"
            value={formData.ad}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Modül Yetkileri" />
              <Tab label="Checklist Yetkileri" />
            </Tabs>
          </Box>

          {/* Modül Yetkileri Tab */}
          {tabValue === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Modül</TableCell>
                    <TableCell align="center">Erişebilir</TableCell>
                    <TableCell align="center">Düzenleyebilir</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map(module => {
                    const modulePermission = formData.moduller.find(m => m.modul === module._id);
                    return (
                      <TableRow key={module._id}>
                        <TableCell>
                          <Typography variant="body2">{module.ad}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {module.aciklama}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={modulePermission?.erisebilir || false}
                            onChange={e =>
                              handleModulePermissionChange(
                                module._id,
                                'erisebilir',
                                e.target.checked,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={modulePermission?.duzenleyebilir || false}
                            onChange={e =>
                              handleModulePermissionChange(
                                module._id,
                                'duzenleyebilir',
                                e.target.checked,
                              )
                            }
                            disabled={!modulePermission?.erisebilir}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Checklist Yetkileri Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Bu rol hangi rollerin checklistlerini görebilir ve puanlayabilir?
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Hedef Rol</TableCell>
                      <TableCell align="center">Checklist Görebilir ✅</TableCell>
                      <TableCell align="center">Checklist Puanlayabilir ✅</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map(targetRole => {
                      const checklistPermission = formData.checklistYetkileri.find(
                        c => c.hedefRol === targetRole._id,
                      );

                      return (
                        <TableRow key={targetRole._id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {targetRole.ad}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={checklistPermission?.gorebilir || false}
                              onChange={e =>
                                handleChecklistPermissionChange(
                                  targetRole._id,
                                  'gorebilir',
                                  e.target.checked,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={checklistPermission?.onaylayabilir || false}
                              onChange={e =>
                                handleChecklistPermissionChange(
                                  targetRole._id,
                                  'onaylayabilir',
                                  e.target.checked,
                                )
                              }
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Roles;
