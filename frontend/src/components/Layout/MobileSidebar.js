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
  Button,
  Avatar,
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { iconMap } from '../../utils/iconMap';

/**
 * Mobile Sidebar Component - spageti kod çözümü
 * Layout.js'den ayrıştırılan mobile sidebar logic'i
 */
const MobileSidebar = ({ menuItems, user, onMenuClick, onLogout }) => {
  const location = useLocation();

  return (
    <Box>
      <Toolbar>
        <Typography variant='h6' noWrap component='div' fontWeight='bold'>
          Serinova 360
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems
          .filter(item => !item.isDivider)
          .map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => onMenuClick(item.path)}
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
                  sx={{
                    color:
                      location.pathname === item.path ? 'inherit' : 'inherit',
                  }}
                >
                  {iconMap[item.icon]}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      <Divider sx={{ mt: 2 }} />

      {/* Mobile User Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}
          >
            {user?.ad?.charAt(0)}
            {user?.soyad?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant='body1' fontWeight='bold'>
              {user?.ad} {user?.soyad}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {user?.roller?.[0]?.ad}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant='contained'
          startIcon={<LogoutIcon />}
          onClick={onLogout}
        >
          Çıkış Yap
        </Button>
      </Box>
    </Box>
  );
};

export default MobileSidebar;
