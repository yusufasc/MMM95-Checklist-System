import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  FileUpload as FileUploadIcon,
  Assessment as AssessmentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const PermissionsDialog = ({
  open,
  onClose,
  role,
  roles,
  selectedPermissions,
  onPermissionChange,
  onRolePermissionChange,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const permissions = [
    {
      key: 'kullaniciAcabilir',
      label: 'Kullanıcı Açabilir',
      icon: <PersonIcon />,
      color: 'primary',
      description: 'Yeni kullanıcı hesapları oluşturabilir',
      hasRoleSelection: true,
      roleField: 'acabildigiRoller',
    },
    {
      key: 'kullaniciSilebilir',
      label: 'Kullanıcı Silebilir',
      icon: <DeleteIcon />,
      color: 'error',
      description: 'Mevcut kullanıcı hesaplarını silebilir',
      hasRoleSelection: true,
      roleField: 'silebildigiRoller',
    },
    {
      key: 'puanlamaYapabilir',
      label: 'Puanlama Yapabilir',
      icon: <AssignmentIcon />,
      color: 'success',
      description: 'Personel değerlendirmesi ve puanlama yapabilir',
      hasRoleSelection: false,
    },
    {
      key: 'excelYukleyebilir',
      label: 'Excel Yükleyebilir',
      icon: <FileUploadIcon />,
      color: 'info',
      description: 'Excel dosyalarını sisteme yükleyebilir',
      hasRoleSelection: false,
    },
    {
      key: 'raporGorebilir',
      label: 'Rapor Görebilir',
      icon: <AssessmentIcon />,
      color: 'warning',
      description: 'İK raporlarını görüntüleyebilir',
      hasRoleSelection: false,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
          minHeight: '70vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3,
        }}
      >
        <SecurityIcon sx={{ fontSize: 32 }} />
        <Box>
          <Box
            component='span'
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontWeight: 'bold',
              display: 'block',
              wordBreak: 'break-word',
            }}
          >
            {role?.ad} - İK Yetkileri
          </Box>
          <Typography variant='body2' sx={{ opacity: 0.9, mt: 0.5 }}>
            Bu rol için İnsan Kaynakları modülü yetkilerini düzenleyin
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={3}>
          {permissions.map(permission => (
            <Grid item xs={12} key={permission.key}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: selectedPermissions[permission.key]
                    ? `${permission.color}.main`
                    : 'transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: `${permission.color}.light`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Main Permission */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedPermissions[permission.key] || false}
                      onChange={e =>
                        onPermissionChange(permission.key, e.target.checked)
                      }
                      color={permission.color}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        {React.cloneElement(permission.icon, {
                          color: permission.color,
                          fontSize: 'small',
                        })}
                        <Typography variant='h6' fontWeight='bold'>
                          {permission.label}
                        </Typography>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        {permission.description}
                      </Typography>
                    </Box>
                  }
                />

                {/* Role Selection for User Management Permissions */}
                {permission.hasRoleSelection &&
                  selectedPermissions[permission.key] && (
                  <Box sx={{ mt: 2 }}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        bgcolor: `${permission.color}.light`,
                        borderRadius: 2,
                        border: `1px solid ${permission.color}.main`,
                      }}
                    >
                      <Typography
                        variant='body1'
                        fontWeight='bold'
                        gutterBottom
                        sx={{ mb: 2 }}
                      >
                        {permission.key === 'kullaniciAcabilir'
                          ? 'Açabileceği Roller:'
                          : 'Silebildiği Roller:'}
                      </Typography>

                      <Box
                        sx={{
                          maxHeight: 250,
                          overflowY: 'auto',
                          pr: 1,
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '10px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: permission.color + '.main',
                            borderRadius: '10px',
                          },
                        }}
                      >
                        <Grid container spacing={1}>
                          {roles.map(roleOption => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              lg={4}
                              xl={3}
                              key={roleOption._id}
                            >
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  border: '1px solid',
                                  borderColor: selectedPermissions[
                                    permission.roleField
                                  ]?.includes(roleOption._id)
                                    ? `${permission.color}.main`
                                    : 'grey.300',
                                  borderRadius: 2,
                                  bgcolor: selectedPermissions[
                                    permission.roleField
                                  ]?.includes(roleOption._id)
                                    ? `${permission.color}.50`
                                    : 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  minHeight: '70px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  '&:hover': {
                                    borderColor: `${permission.color}.main`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: 1,
                                  },
                                }}
                                onClick={() => {
                                  const isChecked =
                                      selectedPermissions[
                                        permission.roleField
                                      ]?.includes(roleOption._id) || false;
                                  onRolePermissionChange(
                                    permission.roleField,
                                    roleOption._id,
                                    !isChecked,
                                  );
                                }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={
                                          selectedPermissions[
                                            permission.roleField
                                          ]?.includes(roleOption._id) || false
                                      }
                                      onChange={e => {
                                        onRolePermissionChange(
                                          permission.roleField,
                                          roleOption._id,
                                          e.target.checked,
                                        );
                                      }}
                                      color={permission.color}
                                      size='small'
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography
                                        variant='body2'
                                        fontWeight='medium'
                                        sx={{
                                          wordBreak: 'break-word',
                                          lineHeight: 1.2,
                                          fontSize: '0.9rem',
                                        }}
                                      >
                                        {roleOption.ad}
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{
                                    margin: 0,
                                    width: '100%',
                                    '& .MuiFormControlLabel-label': {
                                      fontSize: '0.875rem',
                                      width: '100%',
                                    },
                                  }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Summary */}
        <Paper
          elevation={2}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
          }}
        >
          <Typography
            variant='h6'
            fontWeight='bold'
            color='purple'
            gutterBottom
          >
            <span role='img' aria-label='pano'>
              📋
            </span>{' '}
            Yetki Özeti
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            <strong>{role?.ad}</strong> rolü için seçilen yetkiler:
          </Typography>
          <Box sx={{ mt: 1 }}>
            {permissions
              .filter(p => selectedPermissions[p.key])
              .map(p => (
                <Typography
                  key={p.key}
                  variant='caption'
                  sx={{
                    display: 'inline-block',
                    bgcolor: `${p.color}.light`,
                    color: `${p.color}.dark`,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mr: 1,
                    mb: 0.5,
                    fontWeight: 'bold',
                  }}
                >
                  ✓ {p.label}
                </Typography>
              ))}
            {permissions.filter(p => selectedPermissions[p.key]).length ===
              0 && (
              <Typography
                variant='body2'
                color='text.secondary'
                fontStyle='italic'
              >
                Henüz yetki seçilmemiş
              </Typography>
            )}
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          gap: 2,
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          variant='outlined'
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          İptal
        </Button>
        <Button
          onClick={onSubmit}
          variant='contained'
          sx={{
            borderRadius: 2,
            minWidth: 120,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          }}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsDialog;
