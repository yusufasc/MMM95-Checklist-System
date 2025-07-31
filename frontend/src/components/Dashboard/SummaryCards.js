import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  RateReview as ReviewIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import CountUp from 'react-countup';
import { SUMMARY_CARDS } from '../../utils/dashboardConfig';

const iconMap = {
  AssignmentIcon,
  ReviewIcon,
  StarIcon,
  TrophyIcon,
};

const SummaryCards = ({ data }) => {
  const { myTasksCount, controlTasksCount, dailyAverage, userRanking } = data;

  const values = {
    myTasksCount,
    controlTasksCount,
    dailyAverage,
    userRanking,
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {SUMMARY_CARDS.map(card => {
        const IconComponent = iconMap[card.icon];
        const value = values[card.dataKey] || 0;

        return (
          <Grid item xs={12} sm={6} md={3} key={card.id}>
            <Card
              sx={{
                background: card.gradient,
                color: 'white',
                borderRadius: 2,
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
                  <IconComponent sx={{ fontSize: 40 }} />
                  <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                    <CountUp end={value} duration={1} />
                  </Typography>
                </Box>
                <Typography variant='h6' gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default SummaryCards;
