import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Badge,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Build as BuildIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { inventoryAPI } from '../services/api';

// Import unified sidebar components - spageti kod çözümü
import Sidebar from './Layout/Sidebar';
import MobileSidebar from './Layout/MobileSidebar';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [machineSelectionDialog, setMachineSelectionDialog] = useState(false);
  const [machines, setMachines] = useState([]);
  const [tempSelectedMachines, setTempSelectedMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout,
    getAccessibleMenuItems,
    user,
    selectedMachines,
    updateSelectedMachines,
    loadMachineData,
    currentShift,
    endCurrentShift,
  } = useAuth();

  const { unreadCount, markAllAsRead } = useNotifications();

  const menuItems = getAccessibleMenuItems();

  // Load accessible machines
  const loadAccessibleMachines = useCallback(async () => {
    try {
      const response = await inventoryAPI.getMachines('all');
      setMachines(response.data);
    } catch (error) {
      console.error('Makina listesi yüklenirken hata:', error);
      setMachines([]);
    }
  }, []);

  useEffect(() => {
    loadAccessibleMachines();
  }, [loadAccessibleMachines]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleMenuClick = path => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleMachineSelectionOpen = () => {
    setTempSelectedMachines([...selectedMachines]);
    setMachineSelectionDialog(true);
    setError('');
    setSuccess('');

    // Debug için
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.log('Makina seçimi açıldı:', {
        accessibleMachines: machines.length,
        selectedMachines: selectedMachines.length,
        accessibleMachinesData: machines,
      });
    }
  };

  const handleMachineSelectionClose = () => {
    setMachineSelectionDialog(false);
    setTempSelectedMachines([]);
    setError('');
    setSuccess('');
  };

  const handleMachineSelectionSave = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await updateSelectedMachines(tempSelectedMachines);

      if (result.success) {
        setSuccess('Makina seçimi başarıyla kaydedildi');
        setTimeout(() => {
          handleMachineSelectionClose();
        }, 1500);
      } else {
        setError(result.error || 'Makina seçimi kaydedilemedi');
      }
    } catch (error) {
      console.error('Makina seçimi kaydedilirken hata:', error);
      setError('Makina seçimi kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const currentDrawerWidth = isMobile
    ? drawerWidth
    : sidebarCollapsed
      ? collapsedDrawerWidth
      : drawerWidth;

  const currentPageTitle =
    menuItems.find(item => item.path === location.pathname)?.text ||
    'MMM Checklist Sistemi';

  // Makina seçimi gereken roller - sadece bu rollerdeki kullanıcılar için göster
  const needsMachineSelection = user?.roller?.some(role =>
    [
      'Ortacı',
      'Usta',
      'Paketlemeci',
      'Kalite Kontrol',
      'VARDİYA AMİRİ',
      'Admin',
    ].includes(role.ad || role),
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar - Mobile Optimized */}
      <AppBar
        position='fixed'
        sx={{
          width: {
            xs: '100%',
            md: `calc(100% - ${currentDrawerWidth}px)`,
          },
          ml: {
            xs: 0,
            md: `${currentDrawerWidth}px`,
          },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
          {/* Mobile Menu Button */}
          <IconButton
            color='inherit'
            aria-label='open drawer'
            edge='start'
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page Title */}
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            noWrap
            component='div'
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            {currentPageTitle}
          </Typography>

          {/* Makina Seçimi Butonu - Responsive */}
          {needsMachineSelection && (
            <Badge
              badgeContent={selectedMachines.length}
              color='secondary'
              sx={{ mr: { xs: 1, md: 2 } }}
            >
              <Button
                color='inherit'
                startIcon={!isMobile && <SettingsIcon />}
                onClick={handleMachineSelectionOpen}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1, md: 2 },
                }}
              >
                {isMobile ? '⚙️' : `Makina Seçimi (${selectedMachines.length})`}
              </Button>
            </Badge>
          )}

          {/* Notification Badge */}
          <IconButton
            color='inherit'
            onClick={() => markAllAsRead()}
            sx={{ mr: { xs: 1, md: 2 } }}
            title={`${unreadCount} okunmamış bildirim`}
          >
            <Badge badgeContent={unreadCount} color='error' max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Info - Desktop Only */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1,
                  bgcolor: 'rgba(255,255,255,0.2)',
                }}
              >
                {user?.ad?.charAt(0)}
                {user?.soyad?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant='body2'>
                  {user?.ad} {user?.soyad}
                </Typography>
                {currentShift && (
                  <Typography
                    variant='caption'
                    sx={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    {currentShift.type} Vardiyası
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Desktop Logout Button */}
          {!isMobile && (
            <Button
              color='inherit'
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Çıkış
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component='nav'
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant='temporary'
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundImage:
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            },
          }}
        >
          <MobileSidebar
            menuItems={menuItems}
            user={user}
            onMenuClick={handleMenuClick}
            onLogout={handleLogout}
          />
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant='permanent'
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              border: 'none',
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
            },
          }}
          open
        >
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            menuItems={menuItems}
            user={user}
            onMenuClick={handleMenuClick}
            onLogout={handleLogout}
          />
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: {
            xs: '100%',
            md: `calc(100% - ${currentDrawerWidth}px)`,
          },
          minHeight: '100vh',
          bgcolor: 'grey.50',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }} />

        {/* Global Makina Seçimi Info Bar - Tüm sayfalarda göster */}
        {needsMachineSelection && selectedMachines.length > 0 && (
          <Alert
            severity='info'
            sx={{
              mb: 2,
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
            }}
            icon={<BuildIcon />}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                Aktif Makinalar:
              </Typography>
              {selectedMachines.map(machine => {
                // Model Kodu / Tipi bilgisini al
                const modelKodu =
                  machine.dinamikAlanlar?.['Model Kodu / Tipi'] ||
                  machine.dinamikAlanlar?.['model kodu / tipi'] ||
                  machine.dinamikAlanlar?.modelKodu;

                // Chip label'ını oluştur
                const chipLabel = modelKodu
                  ? `${machine.kod} - ${machine.ad} (${modelKodu})`
                  : `${machine.kod} - ${machine.ad}`;

                return (
                  <Chip
                    key={machine._id}
                    label={chipLabel}
                    color='primary'
                    variant='outlined'
                    size='small'
                    sx={{ fontSize: '0.75rem' }}
                  />
                );
              })}
              <Button
                size='small'
                variant='outlined'
                onClick={handleMachineSelectionOpen}
                sx={{ ml: 'auto' }}
              >
                Değiştir
              </Button>
            </Box>
          </Alert>
        )}

        {/* Makina Seçimi Gerekli Uyarısı */}
        {needsMachineSelection && selectedMachines.length === 0 && (
          <Alert severity='warning' sx={{ mb: 2 }} icon={<BuildIcon />}>
            <Typography variant='body2' fontWeight='bold'>
              <span role='img' aria-label='alet'>
                🔧
              </span>{' '}
              Makina Seçimi Gerekli
            </Typography>
            <Typography variant='caption'>
              Sağ üstteki "Makina Seçimi" butonunu kullanarak çalıştığınız
              makinaları seçin.
            </Typography>
          </Alert>
        )}

        <Outlet />
      </Box>

      {/* Makina Seçimi Dialog - Mobile Optimized */}
      <Dialog
        open={machineSelectionDialog}
        onClose={handleMachineSelectionClose}
        maxWidth='md'
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant='h6' component='div' sx={{ fontWeight: 'bold' }}>
            Makina Seçimi
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Çalıştığınız makinaları seçin (Vardiya boyunca aktif kalacak)
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Mevcut Vardiya Bilgisi */}
          {currentShift && (
            <Alert severity='info' sx={{ mb: 2 }} icon={<BuildIcon />}>
              <Typography variant='body2' fontWeight='bold'>
                <span role='img' aria-label='saat'>
                  🕒
                </span>{' '}
                Aktif Vardiya: {currentShift.type}
              </Typography>
              <Typography variant='caption' display='block'>
                Başlangıç:{' '}
                {new Date(currentShift.start).toLocaleString('tr-TR')}
              </Typography>
              <Typography variant='caption' display='block'>
                Bitiş: {new Date(currentShift.end).toLocaleString('tr-TR')}
              </Typography>
              <Typography variant='caption' display='block'>
                Seçili Makina: {selectedMachines.length} adet
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {machines.length === 0 ? (
            <Alert severity='warning' sx={{ mb: 2 }}>
              Makina listesi yükleniyor veya erişilebilir makina bulunamadı.
              <br />
              <Button
                variant='outlined'
                size='small'
                sx={{ mt: 1 }}
                onClick={() => loadMachineData(user?.roller)}
              >
                Makina Listesini Yenile
              </Button>
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Makinalar ({machines.length} adet)</InputLabel>
              <Select
                multiple
                value={tempSelectedMachines.map(m => m._id)}
                onChange={e => {
                  const selectedIds = e.target.value;

                  // Paketlemeci rolü için makina seçim limiti kontrolü
                  const isPaketlemeci = user?.roller?.some(
                    rol => rol.ad === 'Paketlemeci',
                  );
                  if (isPaketlemeci && selectedIds.length > 1) {
                    setError('Paketlemeci rolü maksimum 1 makina seçebilir.');
                    return;
                  }

                  const selectedMachineObjects = selectedIds
                    .map(id => machines.find(m => m._id === id))
                    .filter(Boolean);
                  setTempSelectedMachines(selectedMachineObjects);
                  setError(''); // Hata varsa temizle
                }}
                input={
                  <OutlinedInput
                    label={`Makinalar (${machines.length} adet)`}
                  />
                }
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => {
                      const machine = machines.find(m => m._id === value);
                      if (!machine) {
                        return null;
                      }

                      // Model Kodu / Tipi bilgisini al
                      const modelKodu =
                        machine.dinamikAlanlar?.['Model Kodu / Tipi'] ||
                        machine.dinamikAlanlar?.['model kodu / tipi'] ||
                        machine.dinamikAlanlar?.modelKodu;

                      // Chip label'ını oluştur
                      const chipLabel = modelKodu
                        ? `${machine.kod} - ${machine.ad} (${modelKodu})`
                        : `${machine.kod} - ${machine.ad}`;

                      return (
                        <Chip
                          key={machine._id}
                          label={chipLabel}
                          size='small'
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {machines.map(machine => (
                  <MenuItem key={machine._id} value={machine._id}>
                    <Checkbox
                      checked={tempSelectedMachines.some(
                        m => m._id === machine._id,
                      )}
                    />
                    <ListItemText
                      primary={`${machine.kod} - ${machine.ad}`}
                      secondary={
                        <>
                          {/* Model Kodu / Tipi */}
                          {(machine.dinamikAlanlar?.['Model Kodu / Tipi'] ||
                            machine.dinamikAlanlar?.['model kodu / tipi'] ||
                            machine.dinamikAlanlar?.modelKodu) && (
                            <span style={{ color: '#1976d2', fontWeight: 500 }}>
                              <span role='img' aria-label='tool'>
                                🔧
                              </span>{' '}
                              {machine.dinamikAlanlar['Model Kodu / Tipi'] ||
                                machine.dinamikAlanlar['model kodu / tipi'] ||
                                machine.dinamikAlanlar.modelKodu}
                            </span>
                          )}
                          {/* Lokasyon (eğer var ise) */}
                          {machine.lokasyon && (
                            <span
                              style={{
                                marginLeft: machine.dinamikAlanlar?.[
                                  'Model Kodu / Tipi'
                                ]
                                  ? ' • '
                                  : '',
                              }}
                            >
                              <span role='img' aria-label='location'>
                                📍
                              </span>{' '}
                              {machine.lokasyon}
                            </span>
                          )}
                        </>
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          {/* Vardiya Sonlandır Butonu */}
          {currentShift && (
            <Button
              color='warning'
              variant='outlined'
              onClick={async () => {
                try {
                  const result = await endCurrentShift();
                  if (result.success) {
                    setSuccess('Vardiya başarıyla sonlandırıldı!');
                    setError(null);
                    setTempSelectedMachines([]);
                    setTimeout(() => {
                      handleMachineSelectionClose();
                    }, 1500);
                  } else {
                    setError(result.error || 'Vardiya sonlandırılamadı');
                  }
                } catch (err) {
                  setError('Vardiya sonlandırılırken bir hata oluştu');
                }
              }}
              size={isMobile ? 'medium' : 'large'}
              sx={{ mr: 'auto' }}
            >
              Vardiyayı Sonlandır
            </Button>
          )}

          <Button
            onClick={handleMachineSelectionClose}
            size={isMobile ? 'medium' : 'large'}
          >
            İptal
          </Button>
          <Button
            variant='contained'
            onClick={handleMachineSelectionSave}
            size={isMobile ? 'medium' : 'large'}
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
