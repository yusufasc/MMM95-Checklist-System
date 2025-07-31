import React from 'react';
import {
  Box,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Avatar,
  Button,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

import { useLocation } from 'react-router-dom';
import { getIcon } from '../../utils/iconMap';

/**
 * Desktop Sidebar Component - spageti kod çözümü
 * Layout.js'den ayrıştırılan desktop sidebar logic'i
 */
const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  menuItems,
  user,
  onMenuClick,
  onLogout,
}) => {
  const location = useLocation();

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Divider'ları filtrele - sadece normal menu item'larını göster
  const filteredMenuItems = menuItems.filter(item => !item.isDivider);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          px: [1],
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant='h6' noWrap component='div' fontWeight='bold'>
            Serinova 360
          </Typography>
        )}
        <IconButton onClick={handleToggleCollapse}>
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>

      <Divider />

      <List sx={{ flexGrow: 1, py: 1 }}>
        {/* Tüm Menu Items - Sadeleştirilmiş Yapı */}
        {filteredMenuItems.map(item => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip
              title={sidebarCollapsed ? item.text : ''}
              placement='right'
            >
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => onMenuClick(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: sidebarCollapsed ? 'center' : 'initial',
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
                    mr: sidebarCollapsed ? 0 : 3,
                    justifyContent: 'center',
                    color:
                      location.pathname === item.path ? 'inherit' : 'inherit',
                  }}
                >
                  {getIcon(item.icon)}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight:
                        location.pathname === item.path ? 'bold' : 'normal',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* User Info Section - Footer'da sabit */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        {sidebarCollapsed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title={`${user?.ad} ${user?.soyad}`} placement='right'>
              <Avatar sx={{ width: 32, height: 32, mx: 'auto' }}>
                {user?.ad?.charAt(0)}
                {user?.soyad?.charAt(0)}
              </Avatar>
            </Tooltip>
            <Tooltip title='Çıkış Yap' placement='right'>
              <IconButton onClick={onLogout} size='small'>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                {user?.ad?.charAt(0)}
                {user?.soyad?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant='body2' fontWeight='bold' noWrap>
                  {user?.ad} {user?.soyad}
                </Typography>
                <Typography variant='caption' color='text.secondary' noWrap>
                  {user?.roller?.[0]?.ad}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              size='small'
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{ fontSize: '0.75rem' }}
            >
              Çıkış
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
