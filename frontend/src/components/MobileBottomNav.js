import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  PendingActions as PendingActionsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Mobile Bottom Navigation Component
 * Touch-friendly navigation for mobile devices
 */
const MobileBottomNav = ({ pendingCount = 0 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModulePermission } = useAuth();

  // Navigation items based on permissions
  const navItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      show: true,
    },
    {
      label: 'Görevlerim',
      icon: <AssignmentIcon />,
      path: '/tasks',
      show: hasModulePermission('Görev Yönetimi'),
    },
    {
      label: 'Yaptım',
      icon: <BuildIcon />,
      path: '/worktasks',
      show: hasModulePermission('Yaptım'),
    },
    {
      label: 'Kontrol',
      icon: <PendingActionsIcon />,
      path: '/control-pending',
      show: hasModulePermission('Kontrol Bekleyenler'),
      badge: pendingCount,
    },
    {
      label: 'Profil',
      icon: <PersonIcon />,
      path: '/my-activity',
      show: true,
    },
  ].filter(item => item.show);

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const currentIndex = navItems.findIndex(item =>
      currentPath.startsWith(item.path),
    );
    return currentIndex >= 0 ? currentIndex : 0;
  };

  const handleChange = (event, newValue) => {
    if (navItems[newValue]) {
      navigate(navItems[newValue].path);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.bottomNavigation,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        backdropFilter: 'blur(10px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        sx={{
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 600,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
              marginTop: '4px',
              '&.Mui-selected': {
                fontSize: '0.7rem',
              },
            },
          },
        }}
      >
        {navItems.map((item, _index) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={
              item.badge > 0 ? (
                <Badge
                  badgeContent={item.badge}
                  color='error'
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    },
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )
            }
            sx={{
              '&.Mui-selected': {
                '& .MuiSvgIcon-root': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s ease',
                },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
