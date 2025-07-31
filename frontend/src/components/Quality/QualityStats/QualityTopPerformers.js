import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  getPerformanceColor,
  getPerformanceLabel,
  MEDAL_CONFIGS,
} from '../../../utils/qualityStatsConfig';

const QualityTopPerformers = ({ statistics }) => {
  if (!statistics.enIyiPerformans || statistics.enIyiPerformans.length === 0) {
    return null;
  }

  const topPerformers = statistics.enIyiPerformans.slice(0, 3);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant='h6' sx={{ mb: 3 }}>
        En İyi Performans Gösteren Çalışanlar
      </Typography>

      <Grid container spacing={2}>
        {topPerformers.map((worker, index) => {
          const medalConfig = MEDAL_CONFIGS[index] || MEDAL_CONFIGS[2];

          return (
            <Grid item xs={12} md={4} key={worker._id}>
              <Card
                sx={{
                  background: medalConfig.background,
                  color: medalConfig.color,
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <CardContent>
                  {/* Medal Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      fontSize: '2rem',
                      background: 'white',
                      borderRadius: '50%',
                      width: 50,
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2,
                    }}
                  >
                    {medalConfig.medal}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.1)',
                        color: 'inherit',
                        fontWeight: 'bold',
                        mr: 2,
                        fontSize: '1.25rem',
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant='h6' fontWeight='bold'>
                        {worker.kullanici.ad} {worker.kullanici.soyad}
                      </Typography>
                      <Chip
                        label={getPerformanceLabel(worker.ortalamaBasari)}
                        size='small'
                        sx={{
                          backgroundColor: getPerformanceColor(
                            worker.ortalamaBasari,
                          ),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant='determinate'
                      value={worker.ortalamaBasari}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getPerformanceColor(
                            worker.ortalamaBasari,
                          ),
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Typography
                    variant='h4'
                    fontWeight='bold'
                    textAlign='center'
                    sx={{ mb: 1 }}
                  >
                    {Math.round(worker.ortalamaBasari)}%
                  </Typography>
                  <Typography
                    variant='body2'
                    textAlign='center'
                    sx={{ opacity: 0.8 }}
                  >
                    {worker.sayac} değerlendirme
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

QualityTopPerformers.propTypes = {
  statistics: PropTypes.shape({
    enIyiPerformans: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        kullanici: PropTypes.shape({
          ad: PropTypes.string.isRequired,
          soyad: PropTypes.string.isRequired,
        }).isRequired,
        ortalamaBasari: PropTypes.number.isRequired,
        sayac: PropTypes.number.isRequired,
      }),
    ).isRequired,
  }).isRequired,
};

export default QualityTopPerformers;
