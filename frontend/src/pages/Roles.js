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
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { rolesAPI, modulesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import frontendCache from '../services/cacheService';
import RolePermissionsManager from '../components/RolePermissions/RolePermissionsManager';

const Roles = () => {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'permissions'
  const [formData, setFormData] = useState({
    ad: '',
    moduller: [],
    checklistYetkileri: [],
  });
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh için key

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Force fresh data - timestamp ile
      const timestamp = new Date().getTime();

      // Önce modülleri yükle
      const [modulesResponse, rolesResponse] = await Promise.all([
        modulesAPI.getAll(),
        rolesAPI.getAll(),
      ]);

      // State'i güncelle
      setModules(modulesResponse.data);

      // Roles state'ini tamamen yenile
      setRoles([...rolesResponse.data]);

      // Force re-render
      setRefreshKey(prev => prev + 1);

      // Debug log
      console.log(
        `📋 Roller yenilendi (${timestamp}):`,
        rolesResponse.data.map(r => ({
          ad: r.ad,
          checklistYetkileri: r.checklistYetkileri?.length || 0,
        })),
      );

      // Detaylı checklist yetkileri logu
      console.log('🔍 Detaylı Checklist Yetkileri:');
      for (const role of rolesResponse.data) {
        console.log(`\n${role.ad}:`);
        if (role.checklistYetkileri) {
          for (const yetki of role.checklistYetkileri) {
            if (yetki.gorebilir || yetki.puanlayabilir) {
              console.log(
                `  - ${yetki.hedefRol?.ad}: G=${yetki.gorebilir}, P=${yetki.puanlayabilir}`,
              );
            }
          }
        }
      }
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Veri yükleme hatası:', error);
      }
      setError('Veriler yüklenirken hata oluştu');
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
      puanlayabilir: false,
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
          puanlayabilir: existing?.puanlayabilir === true,
        };

        return processed;
      });

      setFormData({
        ad: role.ad,
        moduller: modulePermissions,
        checklistYetkileri: checklistPermissions,
      });
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
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
      const existingPermIndex = prev.checklistYetkileri.findIndex(
        perm => perm.hedefRol === roleId,
      );

      if (existingPermIndex >= 0) {
        // Mevcut yetki varsa güncelle
        const updatedYetkileri = [...prev.checklistYetkileri];
        updatedYetkileri[existingPermIndex] = {
          ...updatedYetkileri[existingPermIndex],
          [permission]: value,
        };

        // Eğer puanlayabilir true yapılıyorsa, gorebilir de true yap
        if (permission === 'puanlayabilir' && value === true) {
          updatedYetkileri[existingPermIndex].gorebilir = true;
        }

        // Eğer gorebilir false yapılıyorsa, puanlayabilir de false yap
        if (permission === 'gorebilir' && value === false) {
          updatedYetkileri[existingPermIndex].puanlayabilir = false;
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
              : permission === 'puanlayabilir' && value
                ? true
                : false,
          puanlayabilir: permission === 'puanlayabilir' ? value : false,
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

      // Kapsamlı cache temizleme
      rolesAPI.clearCache();

      // Frontend cache service'ini kullan
      frontendCache.invalidateRoles();

      // Browser'daki tüm cache'leri temizle
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName)),
          );
        }
      } catch (cacheError) {
        console.warn('Cache temizleme hatası:', cacheError);
      }

      if (editMode) {
        const response = await rolesAPI.update(editingRoleId, formData);
        console.log('✅ Rol güncellendi:', response.data);

        setSuccess('Rol başarıyla güncellendi');
        handleClose();

        // AGRESIF ÇÖZÜM: Component'i tamamen yeniden yükle
        setTimeout(() => {
          console.log('🔄 Force reload: Tüm veri yeniden yükleniyor...');

          // State'i sıfırla
          setRoles([]);
          setModules([]);
          setRefreshKey(prev => prev + 1);

          // Tüm veriyi yeniden yükle
          loadData();
        }, 500); // 500ms delay ile UI smooth'u koruyalım
      } else {
        const response = await rolesAPI.create(formData);

        // Yeni rolü listeye ekle
        setRoles(prevRoles => [...prevRoles, response.data]);

        setSuccess('Rol başarıyla eklendi');
        handleClose();

        // Yeni rol için de refresh
        setTimeout(() => {
          loadData();
        }, 500);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Rol işlemi sırasında hata oluştu',
      );
    }
  };

  const handleDelete = async roleId => {
    if (window.confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
      try {
        await rolesAPI.delete(roleId);
        setSuccess('Rol başarıyla silindi');
        loadData();
      } catch (error) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.error('Rol silme hatası:', error);
        }
        setError(error.response?.data?.message || 'Rol silinirken hata oluştu');
      }
    }
  };

  // Filtreleme
  const filteredRoles = roles.filter(role =>
    role.ad.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  // Admin değilse sadece permissions view'ı göster
  if (!isAdmin()) {
    return <RolePermissionsManager />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4'>Rol Yönetimi</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'admin' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('admin')}
              size='small'
            >
              Admin Yönetimi
            </Button>
            <Button
              variant={viewMode === 'permissions' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('permissions')}
              startIcon={<SecurityIcon />}
              size='small'
            >
              Yetki Görünümü
            </Button>
          </Box>

          {viewMode === 'admin' && (
            <>
              <TextField
                size='small'
                placeholder='Rol ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleOpen}
              >
                Yeni Rol
              </Button>
            </>
          )}
        </Box>
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

      {/* Content based on view mode */}
      {viewMode === 'permissions' ? (
        <RolePermissionsManager />
      ) : (
        <TableContainer component={Paper} key={refreshKey}>
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
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align='center' sx={{ py: 3 }}>
                    <Typography variant='body1' color='text.secondary'>
                      {searchTerm
                        ? `"${searchTerm}" ile eşleşen rol bulunamadı`
                        : 'Henüz rol tanımlanmamış'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map(role => (
                  <TableRow key={`${role._id}-${refreshKey}`}>
                    <TableCell>
                      <Typography variant='h6'>{role.ad}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {role.moduller?.map((modulePermission, index) => (
                          <Chip
                            key={`${role._id}-${modulePermission.modul?._id || index}-${refreshKey}-${modulePermission.erisebilir}-${modulePermission.duzenleyebilir}`}
                            label={`${modulePermission.modul?.ad} ${modulePermission.erisebilir ? '(E)' : ''} ${modulePermission.duzenleyebilir ? '(D)' : ''}`}
                            size='small'
                            color={
                              modulePermission.erisebilir
                                ? 'primary'
                                : 'default'
                            }
                            variant={
                              modulePermission.duzenleyebilir
                                ? 'filled'
                                : 'outlined'
                            }
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {role.checklistYetkileri
                          ?.filter(
                            checklistPerm =>
                              checklistPerm.gorebilir ||
                              checklistPerm.puanlayabilir,
                          )
                          ?.map(checklistPerm => (
                            <Chip
                              key={`${role._id}-${checklistPerm.hedefRol?._id || checklistPerm.hedefRol}-${refreshKey}-${checklistPerm.gorebilir}-${checklistPerm.puanlayabilir}`}
                              label={`${checklistPerm.hedefRol?.ad || 'Bilinmeyen'} ${checklistPerm.gorebilir ? '(G)' : ''} ${checklistPerm.puanlayabilir ? '(P)' : ''}`}
                              size='small'
                              color={
                                checklistPerm.gorebilir
                                  ? 'secondary'
                                  : 'default'
                              }
                              variant={
                                checklistPerm.puanlayabilir
                                  ? 'filled'
                                  : 'outlined'
                              }
                            />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size='small'
                        onClick={() => handleEdit(role._id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => handleDelete(role._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Yeni/Düzenle Rol Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
        <DialogTitle>{editMode ? 'Rol Düzenle' : 'Yeni Rol Ekle'}</DialogTitle>
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
            label='Rol Adı'
            fullWidth
            variant='outlined'
            value={formData.ad}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label='Modül Yetkileri' />
              <Tab label='Checklist Yetkileri' />
            </Tabs>
          </Box>

          {/* Modül Yetkileri Tab */}
          {tabValue === 0 && (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Modül</TableCell>
                    <TableCell align='center'>Erişebilir</TableCell>
                    <TableCell align='center'>Düzenleyebilir</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map(module => {
                    const modulePermission = formData.moduller.find(
                      m => m.modul === module._id,
                    );
                    return (
                      <TableRow key={module._id}>
                        <TableCell>
                          <Typography variant='body2'>{module.ad}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {module.aciklama}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
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
                        <TableCell align='center'>
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
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Bu rol hangi rollerin checklistlerini görebilir ve
                puanlayabilir?
              </Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hedef Rol</TableCell>
                      <TableCell align='center'>
                        Checklist Görebilir{' '}
                        <Tooltip title='Bu rolün checklistlerini görüntüleyebilir'>
                          <InfoIcon fontSize='small' sx={{ ml: 0.5 }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell align='center'>
                        Checklist Puanlayabilir{' '}
                        <Tooltip title='Bu rolün checklistlerini puanlayabilir'>
                          <InfoIcon fontSize='small' sx={{ ml: 0.5 }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map(targetRole => {
                      const checklistPermission =
                        formData.checklistYetkileri.find(
                          c => c.hedefRol === targetRole._id,
                        );

                      return (
                        <TableRow key={targetRole._id}>
                          <TableCell>
                            <Typography variant='body2' fontWeight='bold'>
                              {targetRole.ad}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
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
                          <TableCell align='center'>
                            <Checkbox
                              checked={
                                checklistPermission?.puanlayabilir || false
                              }
                              onChange={e =>
                                handleChecklistPermissionChange(
                                  targetRole._id,
                                  'puanlayabilir',
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
          <Button onClick={handleSubmit} variant='contained'>
            {editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Roles;
