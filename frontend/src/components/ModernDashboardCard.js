import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import CountUp from 'react-countup';

/**
 * Modern Dashboard Card Component
 * Mobile-first design with glassmorphism effect
 */
const ModernDashboardCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  subtitle,
  _isLoading = false,
  onClick,
  animateValue = true,
}) => {
  const theme = useTheme();

  const cardColors = {
    primary: {
      bg: alpha(theme.palette.primary.main, 0.08),
      iconBg: theme.palette.primary.main,
      iconColor: theme.palette.primary.contrastText,
    },
    success: {
      bg: alpha(theme.palette.success.main, 0.08),
      iconBg: theme.palette.success.main,
      iconColor: theme.palette.success.contrastText,
    },
    warning: {
      bg: alpha(theme.palette.warning.main, 0.08),
      iconBg: theme.palette.warning.main,
      iconColor: theme.palette.warning.contrastText,
    },
    error: {
      bg: alpha(theme.palette.error.main, 0.08),
      iconBg: theme.palette.error.main,
      iconColor: theme.palette.error.contrastText,
    },
  };

  const currentColor = cardColors[color] || cardColors.primary;

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: { xs: 'auto', sm: 180 },
        minHeight: { xs: 120, sm: 160 },
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        borderRadius: 3,
        background: `linear-gradient(135deg, ${currentColor.bg} 0%, ${alpha(
          currentColor.bg,
          0.3,
        )} 100%)`,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 40px ${alpha(currentColor.iconBg, 0.15)}`,
              borderColor: alpha(currentColor.iconBg, 0.3),
            }
          : {},
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: currentColor.iconBg,
              color: currentColor.iconColor,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              mr: 2,
              boxShadow: `0 4px 12px ${alpha(currentColor.iconBg, 0.25)}`,
            }}
          >
            {Icon && <Icon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
          </Avatar>

          {trend && (
            <Chip
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              size='small'
              color={trend > 0 ? 'success' : 'error'}
              sx={{
                ml: 'auto',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        <Typography
          variant='h4'
          component='div'
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            color: currentColor.iconBg,
            mb: 0.5,
            lineHeight: 1.2,
          }}
        >
          {animateValue && typeof value === 'number' ? (
            <CountUp end={value} duration={2} separator='.' />
          ) : (
            value
          )}
        </Typography>

        <Typography
          variant='h6'
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 600,
            color: 'text.primary',
            mb: subtitle ? 0.5 : 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant='body2'
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.2,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernDashboardCard;
