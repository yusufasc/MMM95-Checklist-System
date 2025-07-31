import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { rolesAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const RolePermissionsManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.getMyPermissions();
      setRoles(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Rol yetkileri yüklenirken hata:', error);
      setError('Rol yetkileri yüklenemedi');
      showSnackbar('Rol yetkileri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePermissionChange = async (
    roleId,
    moduleId,
    permissionType,
    newValue,
  ) => {
    try {
      await rolesAPI.updateRolePermission(
        roleId,
        moduleId,
        permissionType,
        newValue,
      );

      // Local state güncelle
      setRoles(prevRoles =>
        prevRoles.map(role => {
          if (role._id === roleId) {
            return {
              ...role,
              yetkiler: role.yetkiler.map(yetki => {
                if (yetki.modul._id === moduleId) {
                  return {
                    ...yetki,
                    [permissionType]: newValue,
                  };
                }
                return yetki;
              }),
            };
          }
          return role;
        }),
      );

      showSnackbar('Yetki başarıyla güncellendi', 'success');
    } catch (error) {
      console.error('Yetki güncellenirken hata:', error);
      showSnackbar('Yetki güncellenirken hata oluştu', 'error');
    }
  };

  const getPermissionChip = (canView, canEdit) => {
    if (canEdit) {
      return <Chip label='Tam Yetki' color='success' size='small' />;
    } else if (canView) {
      return <Chip label='Sadece Görüntüleme' color='warning' size='small' />;
    } else {
      return <Chip label='Yetki Yok' color='error' size='small' />;
    }
  };

  const isCriticalModule = moduleName => {
    const criticalModules = [
      'Kullanıcı Yönetimi',
      'Rol Yönetimi',
      'Sistem Ayarları',
    ];
    return criticalModules.includes(moduleName);
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
        <Typography variant='h6' sx={{ ml: 2 }}>
          Rol yetkileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Rol Yetkileri Yönetimi
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Kendi rollerinizin modül yetkilerini görüntüleyebilir ve
        düzenleyebilirsiniz.
      </Typography>

      {roles.map(role => (
        <Accordion key={role._id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h6'>{role.ad}</Typography>
              <Chip
                label={`${role.yetkiler?.length || 0} Modül`}
                color='primary'
                size='small'
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {role.yetkiler?.map(yetki => (
                <Grid item xs={12} md={6} lg={4} key={yetki.modul._id}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant='subtitle1' gutterBottom>
                      {yetki.modul.ad}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      {yetki.modul.aciklama}
                    </Typography>

                    {getPermissionChip(yetki.gorebilir, yetki.duzenleyebilir)}

                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2'>Görüntüleme</Typography>
                        <Switch
                          checked={yetki.gorebilir}
                          onChange={e =>
                            handlePermissionChange(
                              role._id,
                              yetki.modul._id,
                              'gorebilir',
                              e.target.checked,
                            )
                          }
                          disabled={isCriticalModule(yetki.modul.ad)}
                          size='small'
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant='body2'>Düzenleme</Typography>
                        <Switch
                          checked={yetki.duzenleyebilir}
                          onChange={e =>
                            handlePermissionChange(
                              role._id,
                              yetki.modul._id,
                              'duzenleyebilir',
                              e.target.checked,
                            )
                          }
                          disabled={
                            !yetki.gorebilir || isCriticalModule(yetki.modul.ad)
                          }
                          size='small'
                        />
                      </Box>
                    </Box>

                    {isCriticalModule(yetki.modul.ad) && (
                      <Alert severity='info' sx={{ mt: 1 }}>
                        <Typography variant='caption'>
                          Bu modül sadece admin tarafından düzenlenebilir.
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default RolePermissionsManager;
