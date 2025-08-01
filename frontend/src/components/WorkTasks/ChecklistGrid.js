import React, { memo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Badge,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';

/**
 * Utility function to detect kalıp tasks
 * Follows AI Assistant Guide patterns
 */
const isKalipTask = checklist => {
  return (
    checklist?.ad &&
    typeof checklist.ad === 'string' &&
    checklist.ad.toLowerCase().includes('kalıp')
  );
};

/**
 * Get category icon based on type
 * AI Guide Pattern: Configuration-driven approach
 */
const getCategoryIcon = (kategori, isKalip = false) => {
  if (isKalip) {
    return <AutoAwesomeIcon />;
  }

  const safeKategori =
    typeof kategori === 'string' ? kategori.toLowerCase() : '';

  switch (safeKategori) {
    case 'bakım':
      return <EngineeringIcon />;
    case 'kalite':
      return <AssignmentIcon />;
    default:
      return <BuildIcon />;
  }
};

/**
 * Get category color based on type
 * AI Guide Pattern: Consistent color mapping
 */
const getCategoryColor = (kategori, isKalip = false) => {
  if (isKalip) {
    return '#FF9800';
  } // Orange for kalıp tasks

  const safeKategori =
    typeof kategori === 'string' ? kategori.toLowerCase() : '';

  switch (safeKategori) {
    case 'bakım':
      return '#FF6B6B';
    case 'kalite':
      return '#45B7D1';
    case 'üretim':
      return '#96CEB4';
    default:
      return '#6C7B7F';
  }
};

/**
 * Individual Checklist Card Component
 * Memoized for performance optimization
 */
const ChecklistCard = memo(({ checklist, onClick }) => {
  const isKalip = isKalipTask(checklist);
  const categoryColor = getCategoryColor(checklist.kategori, isKalip);

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        sx={{
          cursor: 'pointer',
          height: '100%',
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 3, // AI Guide: Modern rounded corners
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // AI Guide: Smooth animations
          '&:hover': {
            borderColor: categoryColor,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)', // AI Guide: Enhanced shadows
            transform: 'translateY(-4px)', // AI Guide: Lift effect
          },
        }}
        onClick={() => onClick(checklist)}
      >
        <CardContent>
          {/* Header Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: categoryColor,
                mr: 2,
                width: 56,
                height: 56,
                boxShadow: 2, // AI Guide: Depth perception
              }}
            >
              {getCategoryIcon(checklist.kategori, isKalip)}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant='h6'
                  component='div'
                  noWrap
                  sx={{ fontWeight: 600 }} // AI Guide: Typography hierarchy
                >
                  {typeof checklist.ad === 'string'
                    ? checklist.ad
                    : 'Checklist'}
                </Typography>

                {/* Kalıp Task Badge - AI Guide: Visual indicators */}
                {isKalip && (
                  <Badge
                    badgeContent='WIZARD'
                    color='warning'
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        height: 16,
                        minWidth: 48,
                        fontWeight: 'bold',
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
              </Box>

              <Typography variant='body2' color='text.secondary'>
                {isKalip
                  ? 'Kalıp Değişim Görevi'
                  : typeof checklist.kategori === 'string'
                    ? checklist.kategori
                    : 'Genel'}
              </Typography>
            </Box>
          </Box>

          {/* Description Section */}
          {checklist.aciklama && typeof checklist.aciklama === 'string' && (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{
                mb: 2,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                lineHeight: 1.4,
              }}
            >
              {checklist.aciklama}
            </Typography>
          )}

          {/* Footer Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'grey.100',
            }}
          >
            {/* Items Count Badge */}
            <Badge
              badgeContent={
                Array.isArray(checklist.maddeler)
                  ? checklist.maddeler.length
                  : 0
              }
              color='primary'
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  minWidth: 20,
                  height: 20,
                },
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                Maddeler
              </Typography>
            </Badge>

            {/* Estimated Time */}
            {checklist.tahminiSure &&
              typeof checklist.tahminiSure === 'number' && (
              <Chip
                label={`~${checklist.tahminiSure} dk`}
                size='small'
                variant='outlined'
                sx={{
                  borderColor: categoryColor,
                  color: categoryColor,
                  fontWeight: 500,
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
});

ChecklistCard.displayName = 'ChecklistCard';

/**
 * Main ChecklistGrid Component
 * AI Guide Pattern: Clean component structure with proper loading/error states
 */
const ChecklistGrid = ({ checklists, loading, onChecklistClick }) => {
  // Loading State - AI Guide: Centered loading indicators
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          minHeight: 200,
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Empty State - AI Guide: Informative empty states
  if (!checklists || checklists.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          p: 4,
          bgcolor: 'grey.50',
          borderRadius: 3,
          border: '2px dashed',
          borderColor: 'grey.300',
        }}
      >
        <Typography variant='h6' color='text.secondary' gutterBottom>
          Henüz checklist bulunmamaktadır
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Yöneticiniz tarafından checklist tanımlandığında burada görünecektir
        </Typography>
      </Box>
    );
  }

  // Main Grid - AI Guide: Responsive grid with proper spacing
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {checklists.map(checklist => (
        <ChecklistCard
          key={checklist._id}
          checklist={checklist}
          onClick={onChecklistClick}
        />
      ))}
    </Grid>
  );
};

export default memo(ChecklistGrid);
