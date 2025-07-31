import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { STATS_CARD_CONFIGS } from '../../../utils/qualityStatsConfig';

// Icon mapping
const iconComponents = {
  Assessment: AssessmentIcon,
  TrendingUp: TrendingUpIcon,
  People: PeopleIcon,
  CheckCircle: CheckCircleIcon,
};

const QualityStatsCards = ({ statistics, evaluations, loading }) => {
  const getCardValue = config => {
    return config.formatter(statistics[config.key], statistics, evaluations);
  };

  const getIconComponent = iconName => {
    const IconComponent = iconComponents[iconName];
    return IconComponent ? <IconComponent /> : <AssessmentIcon />;
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {STATS_CARD_CONFIGS.map(config => {
        const value = getCardValue(config);

        return (
          <Grid item xs={12} sm={6} md={3} key={config.key}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${config.color}.main`,
                      mr: 2,
                    }}
                  >
                    {getIconComponent(config.icon)}
                  </Avatar>
                  <Box>
                    <Typography
                      variant='h4'
                      fontWeight='bold'
                      color={loading ? 'text.disabled' : 'text.primary'}
                    >
                      {loading ? '...' : value}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {config.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

QualityStatsCards.propTypes = {
  statistics: PropTypes.shape({
    toplamDegerlendirme: PropTypes.number,
    ortalamaBasariYuzdesi: PropTypes.number,
    enIyiPerformans: PropTypes.array,
  }).isRequired,
  evaluations: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default QualityStatsCards;
