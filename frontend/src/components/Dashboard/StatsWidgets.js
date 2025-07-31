import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Task as TaskIcon,
  Inventory as InventoryIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { statsWidgetConfigs } from '../../utils/dashboardConfig';

const iconMap = {
  PeopleIcon,
  TaskIcon,
  InventoryIcon,
  PendingActionsIcon,
  CheckCircleIcon,
  WarningIcon,
};

const StatsWidgets = ({ stats = {} }) => {
  const { hasModulePermission } = useAuth();

  // Filter widgets based on permissions
  const visibleWidgets = statsWidgetConfigs.filter(widget =>
    hasModulePermission(widget.permission),
  );

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {visibleWidgets.map(widget => {
        const IconComponent = iconMap[widget.icon] || TaskIcon;
        const value = widget.getValue(stats);
        const maxValue = widget.getMaxValue ? widget.getMaxValue(stats) : 100;
        const progress = maxValue > 0 ? (value / maxValue) * 100 : 0;

        return (
          <Grid item xs={12} sm={6} md={3} key={widget.id}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${widget.color}20, ${widget.color}10)`,
                border: `2px solid ${widget.color}40`,
                borderRadius: 2,
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <IconComponent sx={{ fontSize: 40, color: widget.color }} />
                  <Typography
                    variant='h4'
                    sx={{ fontWeight: 'bold', color: widget.color }}
                  >
                    {value || 0}
                  </Typography>
                </Box>

                <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
                  {widget.title}
                </Typography>

                {widget.getSubtext && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {widget.getSubtext(stats)}
                  </Typography>
                )}

                {widget.showProgress && (
                  <LinearProgress
                    variant='determinate'
                    value={progress}
                    sx={{
                      mb: 2,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: `${widget.color}30`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: widget.color,
                      },
                    }}
                  />
                )}

                {widget.chips && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {widget.chips.map((chip, index) => (
                      <Chip
                        key={index}
                        label={chip.getLabel(stats)}
                        color={chip.color}
                        size='small'
                      />
                    ))}
                  </Box>
                )}

                {widget.extraInfo && (
                  <Box sx={{ mt: 2 }}>
                    {widget.extraInfo.map((info, index) => {
                      const InfoIcon = iconMap[info.icon];
                      return (
                        <Box
                          key={index}
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          {InfoIcon && (
                            <InfoIcon
                              sx={{ fontSize: 16, mr: 1, color: widget.color }}
                            />
                          )}
                          <Typography variant='body2' color='text.secondary'>
                            {info.getText(stats)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {widget.getStatusIcon && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    {(() => {
                      const status = widget.getStatusIcon(stats);
                      const StatusIcon = iconMap[status.icon];
                      return (
                        <>
                          {StatusIcon && (
                            <StatusIcon
                              sx={{
                                fontSize: 16,
                                mr: 1,
                                color: status.urgent
                                  ? '#ff5722'
                                  : status.success
                                    ? '#4caf50'
                                    : widget.color,
                              }}
                            />
                          )}
                          <Typography
                            variant='body2'
                            sx={{
                              color: status.urgent
                                ? '#ff5722'
                                : status.success
                                  ? '#4caf50'
                                  : 'text.secondary',
                              fontWeight: status.urgent ? 'bold' : 'normal',
                            }}
                          >
                            {status.text}
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default StatsWidgets;
