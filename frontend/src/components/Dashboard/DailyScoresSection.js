import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  LinearProgress,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import CountUp from 'react-countup';
import { createScoreCardData } from '../../utils/dashboardConfig';

const DailyScoresSection = ({ dailyScores }) => {
  const scoreData = createScoreCardData(dailyScores);

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StarIcon sx={{ fontSize: 30, color: '#ffa726', mr: 2 }} />
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Bugünkü Puanlarım
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {scoreData.map(item => (
          <Grid size={{ xs: 6, md: 4 }} key={item.key}>
            <Card
              sx={{
                p: 2,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                border: `2px solid ${item.color}40`,
              }}
            >
              <Typography
                variant='h4'
                sx={{ fontWeight: 'bold', color: item.color }}
              >
                <CountUp end={item.score} duration={1.5} />
              </Typography>
              <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                {item.label}
              </Typography>
              <LinearProgress
                variant='determinate'
                value={item.percentage}
                sx={{
                  mt: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: `${item.color}30`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: item.color,
                  },
                }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default DailyScoresSection;
