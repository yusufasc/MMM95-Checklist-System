import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  Tooltip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Task as TaskIcon,
  Build as BuildIcon,
  PendingActions as PendingActionsIcon,
  BarChart as BarChartIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Inventory as InventoryIcon,
  Engineering as EngineeringIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;
const collapsedDrawerWidth = 60;

// İkon mapping
const iconMap = {
  DashboardIcon: <DashboardIcon />,
  PeopleIcon: <PeopleIcon />,
  SecurityIcon: <SecurityIcon />,
  BusinessIcon: <BusinessIcon />,
  AssignmentIcon: <AssignmentIcon />,
  TaskIcon: <TaskIcon />,
  BuildIcon: <BuildIcon />,
  PendingActionsIcon: <PendingActionsIcon />,
  BarChartIcon: <BarChartIcon />,
  InventoryIcon: <InventoryIcon />,
  EngineeringIcon: <EngineeringIcon />,
  AdminPanelSettingsIcon: <AdminPanelSettingsIcon />,
  AssessmentIcon: <AssessmentIcon />,
};

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [machineSelectionDialog, setMachineSelectionDialog] = useState(false);
  const [tempSelectedMachines, setTempSelectedMachines] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout,
    getAccessibleMenuItems,
    user,
    selectedMachines,
    accessibleMachines,
    updateSelectedMachines,
    loadMachineData,
  } = useAuth();

  const menuItems = getAccessibleMenuItems();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Makina seçimi açıldı:', {
        accessibleMachines: accessibleMachines.length,
        selectedMachines: selectedMachines.length,
        accessibleMachinesData: accessibleMachines,
      });
    }
  };

  const handleMachineSelectionClose = () => {
    setMachineSelectionDialog(false);
    setTempSelectedMachines([]);
    setError('');
    setSuccess('');
  };

  const handleMachineChange = event => {
    const value = event.target.value;
    const selectedIds = typeof value === 'string' ? value.split(',') : value;
    const selectedMachineObjects = accessibleMachines.filter(machine =>
      selectedIds.includes(machine._id),
    );
    setTempSelectedMachines(selectedMachineObjects);
  };

  const handleMachineSelectionSave = async () => {
    const result = await updateSelectedMachines(tempSelectedMachines);
    if (result.success) {
      setSuccess('Makina seçimi başarıyla güncellendi');
      setTimeout(() => {
        handleMachineSelectionClose();
      }, 1000);
    } else {
      setError(result.error);
    }
  };

  const currentDrawerWidth = isMobile
    ? drawerWidth
    : sidebarCollapsed
      ? collapsedDrawerWidth
      : drawerWidth;

  // Desktop Sidebar Content
  const desktopDrawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            Serinova 360
          </Typography>
        )}
        <IconButton onClick={handleSidebarToggle} size="small">
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map((item, index) => {
          // Divider (ayırıcı çizgi) kontrolü
          if (item.isDivider) {
            return (
              <Box key={`divider-${index}`} sx={{ mx: 2, my: 1 }}>
                <Divider />
                {!sidebarCollapsed && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'center',
                      mt: 1,
                      mb: 0.5,
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  >
                    KULLANICI SAYFALAR
                  </Typography>
                )}
              </Box>
            );
          }

          return (
            <Tooltip
              key={item.text}
              title={sidebarCollapsed ? item.text : ''}
              placement="right"
              arrow
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    minHeight: 48,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    px: sidebarCollapsed ? 0 : 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarCollapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: location.pathname === item.path ? 'inherit' : 'inherit',
                    }}
                  >
                    {iconMap[item.icon]}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                        }}
                      />
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      {/* User Info */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main', fontSize: '0.875rem' }}
            >
              {user?.ad?.charAt(0)}
              {user?.soyad?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="bold" noWrap>
                {user?.ad} {user?.soyad}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.roller?.[0]?.ad}
              </Typography>
            </Box>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ fontSize: '0.75rem' }}
          >
            Çıkış Yap
          </Button>
        </Box>
      )}
    </Box>
  );

  // Mobile Sidebar Content
  const mobileDrawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          Serinova 360
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => {
          // Divider (ayırıcı çizgi) kontrolü
          if (item.isDivider) {
            return (
              <Box key={`mobile-divider-${index}`} sx={{ mx: 2, my: 1 }}>
                <Divider />
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    mt: 1,
                    mb: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}
                >
                  KULLANICI SAYFALAR
                </Typography>
              </Box>
            );
          }

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}
                >
                  {iconMap[item.icon]}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mt: 2 }} />

      {/* Mobile User Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}>
            {user?.ad?.charAt(0)}
            {user?.soyad?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight="bold">
              {user?.ad} {user?.soyad}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.roller?.[0]?.ad}
            </Typography>
          </Box>
        </Box>
        <Button fullWidth variant="contained" startIcon={<LogoutIcon />} onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </Box>
    </Box>
  );

  const currentPageTitle =
    menuItems.find(item => item.path === location.pathname)?.text || 'MMM Checklist Sistemi';

  // Makina seçimi gereken sayfalar
  const needsMachineSelection = ['/tasks', '/control-pending'].includes(location.pathname);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar - Mobile Optimized */}
      <AppBar
        position="fixed"
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
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page Title */}
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            {currentPageTitle}
          </Typography>

          {/* Makina Seçimi Butonu - Responsive */}
          {needsMachineSelection && (
            <Badge
              badgeContent={selectedMachines.length}
              color="secondary"
              sx={{ mr: { xs: 1, md: 2 } }}
            >
              <Button
                color="inherit"
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

          {/* User Info - Desktop Only */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'rgba(255,255,255,0.2)' }}>
                {user?.ad?.charAt(0)}
                {user?.soyad?.charAt(0)}
              </Avatar>
              <Typography variant="body2">
                {user?.ad} {user?.soyad}
              </Typography>
            </Box>
          )}

          {/* Desktop Logout Button */}
          {!isMobile && (
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Çıkış
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
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
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            },
          }}
        >
          {mobileDrawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
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
          {desktopDrawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
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
        <Outlet />
      </Box>

      {/* Makina Seçimi Dialog - Mobile Optimized */}
      <Dialog
        open={machineSelectionDialog}
        onClose={handleMachineSelectionClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: { xs: 1.5, md: 2 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ mr: 1 }} />
            <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold">
              Çalıştığınız Makinaları Seçin
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bu vardiyada çalıştığınız makinaları seçin. Bu seçim tüm sayfalarda geçerli olacak.
          </Typography>

          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
              <strong>Debug:</strong> Erişilebilir makina sayısı: {accessibleMachines.length}
              <br />
              Seçili makina sayısı: {selectedMachines.length}
              <br />
              Kullanıcı rolü: {user?.roller?.map(r => r.ad).join(', ')}
              <br />
              Kullanıcı ID: {user?._id}
              <br />
              Makina verisi yüklendi mi: {accessibleMachines.length > 0 ? 'Evet' : 'Hayır'}
              <br />
              {accessibleMachines.length > 0 && (
                <>
                  İlk makina: {accessibleMachines[0]?.kod} - {accessibleMachines[0]?.ad}
                </>
              )}
            </Alert>
          )}

          {accessibleMachines.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Makina listesi yükleniyor veya erişilebilir makina bulunamadı.
              <br />
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => loadMachineData(user?.roller)}
              >
                Makina Listesini Yenile
              </Button>
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Makinalar ({accessibleMachines.length} adet)</InputLabel>
              <Select
                multiple
                value={tempSelectedMachines.map(m => m._id)}
                onChange={handleMachineChange}
                input={<OutlinedInput label={`Makinalar (${accessibleMachines.length} adet)`} />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => {
                      const machine = accessibleMachines.find(m => m._id === value);
                      return (
                        <Chip
                          key={value}
                          label={
                            machine
                              ? `${machine.kod || machine.makinaNo || machine.envanterKodu} - ${machine.ad}`
                              : value
                          }
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {accessibleMachines.map(machine => (
                  <MenuItem key={machine._id} value={machine._id}>
                    <Checkbox checked={tempSelectedMachines.some(m => m._id === machine._id)} />
                    <ListItemText
                      primary={`${machine.kod || machine.makinaNo || machine.envanterKodu} - ${machine.ad}`}
                      secondary={machine.lokasyon ? `Lokasyon: ${machine.lokasyon}` : ''}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button onClick={handleMachineSelectionClose} size={isMobile ? 'medium' : 'large'}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleMachineSelectionSave}
            size={isMobile ? 'medium' : 'large'}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
