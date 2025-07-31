import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Skeleton,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  SearchOff as SearchOffIcon,
  CloudOff as CloudOffIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

/**
 * Modern Skeleton Loading Component
 * Animated skeletons for better UX
 */
export const ModernSkeleton = ({ variant = 'card', count = 3 }) => {
  const _theme = useTheme();

  const SkeletonCard = () => (
    <Card sx={{ mb: 2, borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant='circular' width={48} height={48} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant='text' width='60%' height={24} />
            <Skeleton variant='text' width='40%' height={20} />
          </Box>
        </Box>
        <Skeleton
          variant='rectangular'
          height={80}
          sx={{ borderRadius: 2, mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton
            variant='rectangular'
            width={80}
            height={32}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant='rectangular'
            width={60}
            height={32}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const SkeletonList = () => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Skeleton variant='circular' width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant='text' width='70%' height={20} />
          <Skeleton variant='text' width='50%' height={16} />
        </Box>
        <Skeleton
          variant='rectangular'
          width={60}
          height={24}
          sx={{ borderRadius: 1 }}
        />
      </Box>
    </Box>
  );

  const SkeletonTable = () => (
    <Box>
      <Skeleton
        variant='rectangular'
        height={56}
        sx={{ mb: 1, borderRadius: 1 }}
      />
      {[...Array(5)].map((_, index) => (
        <Skeleton
          key={index}
          variant='rectangular'
          height={48}
          sx={{ mb: 0.5, borderRadius: 1 }}
        />
      ))}
    </Box>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'list':
        return [...Array(count)].map((_, index) => (
          <SkeletonList key={index} />
        ));
      case 'table':
        return <SkeletonTable />;
      default:
        return [...Array(count)].map((_, index) => (
          <SkeletonCard key={index} />
        ));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderSkeleton()}
    </motion.div>
  );
};

/**
 * Modern Empty State Component
 * Engaging empty states with animations
 */
export const ModernEmptyState = ({
  icon: Icon = InboxIcon,
  title = 'Henüz veri bulunmuyor',
  description = 'İçerik eklendiğinde burada görünecek',
  actionButton,
  variant = 'default',
}) => {
  const theme = useTheme();

  const variants = {
    default: {
      iconColor: theme.palette.grey[400],
      bgColor: alpha(theme.palette.grey[100], 0.5),
    },
    search: {
      iconColor: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.05),
      icon: SearchOffIcon,
      title: 'Arama sonucu bulunamadı',
      description: 'Farklı anahtar kelimeler deneyebilirsiniz',
    },
    error: {
      iconColor: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.05),
      icon: CloudOffIcon,
      title: 'Bağlantı hatası',
      description: 'Lütfen daha sonra tekrar deneyin',
    },
    tasks: {
      iconColor: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.05),
      icon: AssignmentIcon,
      title: 'Henüz görev bulunmuyor',
      description: 'Yeni görev atandığında burada görünecek',
    },
  };

  const currentVariant = variants[variant] || variants.default;
  const FinalIcon = currentVariant.icon || Icon;
  const finalTitle = currentVariant.title || title;
  const finalDescription = currentVariant.description || description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 6, sm: 8 },
          px: 3,
          textAlign: 'center',
          bgcolor: currentVariant.bgColor,
          borderRadius: 3,
          border: `2px dashed ${alpha(currentVariant.iconColor, 0.2)}`,
          minHeight: { xs: 200, sm: 250 },
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Box
            sx={{
              width: { xs: 64, sm: 80 },
              height: { xs: 64, sm: 80 },
              borderRadius: '50%',
              bgcolor: alpha(currentVariant.iconColor, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <FinalIcon
              sx={{
                fontSize: { xs: 32, sm: 40 },
                color: currentVariant.iconColor,
              }}
            />
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Typography
            variant='h6'
            sx={{
              mb: 1,
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: 'text.primary',
            }}
          >
            {finalTitle}
          </Typography>

          <Typography
            variant='body2'
            sx={{
              color: 'text.secondary',
              mb: actionButton ? 3 : 0,
              maxWidth: 400,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5,
            }}
          >
            {finalDescription}
          </Typography>

          {actionButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              {actionButton}
            </motion.div>
          )}
        </motion.div>
      </Box>
    </motion.div>
  );
};

/**
 * Modern Loading Overlay Component
 * Full-screen loading with blur effect
 */
export const ModernLoadingOverlay = ({ message = 'Yükleniyor...' }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.modal,
        backdropFilter: 'blur(4px)',
        backgroundColor: alpha(theme.palette.background.default, 0.7),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: theme.shadows[8],
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
              mb: 2,
            }}
          />
        </motion.div>

        <Typography variant='body1' sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      </Box>
    </motion.div>
  );
};

/**
 * Modern Progress Bar Component
 * Animated progress with smooth transitions
 */
export const ModernProgress = ({ value = 0, label, showPercentage = true }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {showPercentage && (
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              {Math.round(value)}%
            </Typography>
          )}
        </Box>
      )}

      <Box
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            borderRadius: 4,
          }}
        />
      </Box>
    </Box>
  );
};
