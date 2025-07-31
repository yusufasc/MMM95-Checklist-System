import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const RolePermissionsTab = ({ roles, settings, onEditPermissions }) => {
  if (!settings || !settings.rolYetkileri) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <SecurityIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
        <Typography variant='h6' color='text.secondary'>
          Rol yetkileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  const getPermissionChip = hasPermission => (
    <Chip
      label={hasPermission ? 'Evet' : 'Hayır'}
      color={hasPermission ? 'success' : 'default'}
      size='small'
      sx={{ fontWeight: 'bold', minWidth: 60 }}
    />
  );

  return (
    <Box>
      <Box display='flex' alignItems='center' gap={2} mb={3}>
        <SecurityIcon color='primary' sx={{ fontSize: 32 }} />
        <Typography variant='h6'>Rol Bazlı İK Yetkileri</Typography>
      </Box>

      <TableContainer
        component={Paper}
        elevation={4}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          '& .MuiTableHead-root': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            color: 'white',
            fontWeight: 'bold',
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>Rol</TableCell>
              <TableCell align='center' sx={{ minWidth: 120 }}>
                Kullanıcı Açabilir
              </TableCell>
              <TableCell align='center' sx={{ minWidth: 120 }}>
                Kullanıcı Silebilir
              </TableCell>
              <TableCell align='center' sx={{ minWidth: 120 }}>
                Puanlama Yapabilir
              </TableCell>
              <TableCell align='center' sx={{ minWidth: 120 }}>
                Excel Yükleyebilir
              </TableCell>
              <TableCell align='center' sx={{ minWidth: 120 }}>
                Rapor Görebilir
              </TableCell>
              <TableCell align='center' sx={{ minWidth: 80 }}>
                İşlem
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map(role => {
              const rolePermission = settings.rolYetkileri?.find(
                ry => ry.rol?.toString() === role._id?.toString(),
              );
              const permissions = rolePermission?.yetkiler || {};

              return (
                <TableRow
                  key={role._id}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(103, 126, 234, 0.08)',
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={role.ad}
                        color='primary'
                        variant='outlined'
                        size='small'
                        sx={{
                          fontWeight: 'bold',
                          maxWidth: '120px',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    </Box>
                  </TableCell>

                  <TableCell align='center'>
                    {getPermissionChip(permissions.kullaniciAcabilir)}
                  </TableCell>

                  <TableCell align='center'>
                    {getPermissionChip(permissions.kullaniciSilebilir)}
                  </TableCell>

                  <TableCell align='center'>
                    {getPermissionChip(permissions.puanlamaYapabilir)}
                  </TableCell>

                  <TableCell align='center'>
                    {getPermissionChip(permissions.excelYukleyebilir)}
                  </TableCell>

                  <TableCell align='center'>
                    {getPermissionChip(permissions.raporGorebilir)}
                  </TableCell>

                  <TableCell align='center'>
                    <IconButton
                      size='small'
                      onClick={() => onEditPermissions(role, permissions)}
                      sx={{
                        bgcolor: 'action.hover',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <SettingsIcon fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Cards */}
      <Box sx={{ mt: 3 }}>
        <Typography variant='h6' gutterBottom>
          Yetki Özeti
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {[
            {
              key: 'kullaniciAcabilir',
              label: 'Kullanıcı Açabilir',
              color: 'primary',
            },
            {
              key: 'kullaniciSilebilir',
              label: 'Kullanıcı Silebilir',
              color: 'error',
            },
            {
              key: 'puanlamaYapabilir',
              label: 'Puanlama Yapabilir',
              color: 'success',
            },
            {
              key: 'excelYukleyebilir',
              label: 'Excel Yükleyebilir',
              color: 'info',
            },
            {
              key: 'raporGorebilir',
              label: 'Rapor Görebilir',
              color: 'warning',
            },
          ].map(permission => {
            const count =
              settings.rolYetkileri?.filter(ry => ry.yetkiler?.[permission.key])
                .length || 0;

            return (
              <Paper
                key={permission.key}
                elevation={2}
                sx={{
                  p: 2,
                  minWidth: 200,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${
                    permission.color === 'primary'
                      ? '#e3f2fd'
                      : permission.color === 'error'
                        ? '#ffebee'
                        : permission.color === 'success'
                          ? '#e8f5e9'
                          : permission.color === 'info'
                            ? '#e1f5fe'
                            : '#fff8e1'
                  } 0%, ${
                    permission.color === 'primary'
                      ? '#bbdefb'
                      : permission.color === 'error'
                        ? '#ffcdd2'
                        : permission.color === 'success'
                          ? '#c8e6c9'
                          : permission.color === 'info'
                            ? '#b3e5fc'
                            : '#ffecb3'
                  } 100%)`,
                }}
              >
                <Typography
                  variant='h4'
                  color={`${permission.color}.main`}
                  fontWeight='bold'
                >
                  {count}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {permission.label}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  / {roles.length} rol
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default RolePermissionsTab;
