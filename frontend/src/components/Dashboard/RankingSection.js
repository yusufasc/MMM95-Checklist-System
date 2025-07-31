import React from 'react';
import { Paper, Typography, Box, Card, Button } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  MESSAGES,
  BUTTON_LABELS,
  ROUTES,
  formatUserName,
  getRankingCardStyle,
} from '../../utils/dashboardConfig';

const RankingSection = ({ ranking, user }) => {
  const navigate = useNavigate();

  const handleViewPerformance = () => {
    navigate(ROUTES.PERFORMANCE);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrophyIcon sx={{ fontSize: 30, color: '#f57c00', mr: 2 }} />
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Usta Sıralaması
        </Typography>
      </Box>

      {ranking.length === 0 ? (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ textAlign: 'center' }}
        >
          {MESSAGES.NO_RANKING}
        </Typography>
      ) : (
        <Box>
          {ranking.map((person, index) => {
            const isMe = person.user._id === user?._id;
            const cardStyle = getRankingCardStyle(index, isMe);

            return (
              <Card
                key={person.user._id}
                sx={{
                  mb: 2,
                  p: 2,
                  ...cardStyle,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor:
                        isMe || index <= 2
                          ? 'rgba(255,255,255,0.2)'
                          : '#f5f5f5',
                      mr: 2,
                    }}
                  >
                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                      #{index + 1}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                      {formatUserName(person.user, isMe ? ' (Sen)' : '')}
                    </Typography>
                    <Typography variant='body2' sx={{ opacity: 0.8 }}>
                      {person.totalScore} puan
                    </Typography>
                  </Box>

                  {index <= 2 && (
                    <TrophyIcon
                      sx={{
                        fontSize: index === 0 ? 30 : 25,
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    />
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      <Button
        variant='outlined'
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleViewPerformance}
        startIcon={<SpeedIcon />}
      >
        {BUTTON_LABELS.DETAILED_PERFORMANCE}
      </Button>
    </Paper>
  );
};

export default RankingSection;
