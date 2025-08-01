import React from 'react';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  PendingActions as PendingActionsIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Task as TaskIcon,
  Engineering as EngineeringIcon,
  Circle as DefaultIcon,
  Star as StarIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';

/**
 * İkon mapping - spageti kod çözümü
 * Ortak kullanım için centralized icon management
 */
export const iconMap = {
  DashboardIcon: <DashboardIcon />,
  AssignmentIcon: <AssignmentIcon />,
  PendingActionsIcon: <PendingActionsIcon />,
  BarChartIcon: <BarChartIcon />,
  PeopleIcon: <PeopleIcon />,
  SecurityIcon: <SecurityIcon />,
  BusinessIcon: <BusinessIcon />,
  BuildIcon: <BuildIcon />,
  InventoryIcon: <InventoryIcon />,
  AssessmentIcon: <AssessmentIcon />,
  AdminPanelSettingsIcon: <AdminPanelSettingsIcon />,
  TaskIcon: <TaskIcon />,
  EngineeringIcon: <EngineeringIcon />,
  StarIcon: <StarIcon />,
  GroupsIcon: <GroupsIcon />,
};

/**
 * İkon bileşenlerini almak için helper function
 */
export const getIcon = iconName => {
  return iconMap[iconName] || <DefaultIcon sx={{ color: 'text.disabled' }} />;
};
