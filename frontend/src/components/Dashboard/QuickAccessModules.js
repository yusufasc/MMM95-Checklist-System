import React from 'react';
import { Paper, Typography, Grid, Card, CardContent, Box } from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  Task as TaskIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { moduleConfigs } from '../../utils/dashboardConfig';

const iconMap = {
  PeopleIcon,
  AssignmentIcon,
  InventoryIcon,
  TaskIcon,
  BarChartIcon,
};

const QuickAccessModules = ({ onQuickAction, _stats = {} }) => {
  const { hasModulePermission } = useAuth();

  // Filter modules based on permissions
  const visibleModules = moduleConfigs.filter(module =>
    hasModulePermission(module.permission),
  );

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 3 }}>
        Hızlı Erişim
      </Typography>

      <Grid container spacing={2}>
        {visibleModules.map(module => {
          const IconComponent = iconMap[module.icon] || TaskIcon;

          return (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: `2px solid ${module.color}40`,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${module.color}40`,
                    borderColor: module.color,
                  },
                }}
                onClick={() => onQuickAction(module.path)}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: `${module.color}20`,
                      margin: '0 auto 16px',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 30, color: module.color }} />
                  </Box>

                  <Typography
                    variant='h6'
                    sx={{ fontWeight: 'bold', mb: 1, color: module.color }}
                  >
                    {module.title}
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    {module.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default QuickAccessModules;
