import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { myActivityAPI } from '../../services/api';

const RankingBoard = ({ user, filters }) => {
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankingData();
  }, [filters]);

  const loadRankingData = async () => {
    try {
      setLoading(true);
      const response = await myActivityAPI.getRanking(30);
      setRankingData(response.data);
    } catch (error) {
      console.error('Sıralama verisi yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Sıralama verileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (!rankingData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Sıralama verisi bulunamadı
        </Typography>
      </Box>
    );
  }

  const {
    siralamalar = [],
    mevcutKullanici,
    toplamKullanici = 0,
  } = rankingData;

  function getRankColor(rank) {
    if (rank === 1) {
      return '#FFD700';
    } // Gold
    if (rank === 2) {
      return '#C0C0C0';
    } // Silver
    if (rank === 3) {
      return '#CD7F32';
    } // Bronze
    return '#9E9E9E'; // Default
  }

  function getRankIcon(rank) {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank) }} />;
    }
    return <PersonIcon />;
  }

  function getScoreColor(score) {
    if (score >= 90) {
      return '#4CAF50';
    }
    if (score >= 70) {
      return '#FF9800';
    }
    return '#F44336';
  }

  return (
    <Box>
      {/* Kişisel Sıralama Kartı */}
      {mevcutKullanici && (
        <Card
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2rem',
                    }}
                  >
                    {mevcutKullanici.sira || 'N/A'}
                  </Avatar>
                  <Typography variant='h6'>Sıralamanız</Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9 }}>
                    {toplamKullanici || 0} kişi arasında
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='h5' sx={{ mb: 1 }}>
                  {mevcutKullanici.kullanici.ad}{' '}
                  {mevcutKullanici.kullanici.soyad}
                </Typography>
                <Typography variant='body1' sx={{ mb: 2, opacity: 0.9 }}>
                  {user?.roller?.[0]?.ad || 'Kullanıcı'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${mevcutKullanici.toplamPuan || 0} Puan`}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                  />
                  <Chip
                    label={`${mevcutKullanici.toplamGorev || 0} Görev`}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                  />
                  <Chip
                    label={`${mevcutKullanici.ortalamaPuan || 0} Ortalama`}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  {getRankIcon(mevcutKullanici.sira)}
                  <Typography variant='h4' sx={{ mt: 1 }}>
                    {mevcutKullanici.sira <= 3
                      ? ['🥇', '🥈', '🥉'][mevcutKullanici.sira - 1]
                      : '🏅'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Sıralama Tablosu */}
      <Card>
        <CardContent>
          <Typography
            variant='h6'
            sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
          >
            <TrophyIcon sx={{ mr: 1, color: '#FFD700' }} />
            Rol Bazlı Sıralama - {user?.roller?.[0]?.ad || 'Kullanıcı'}
          </Typography>

          {siralamalar.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary' sx={{ mb: 2 }}>
                <span role='img' aria-label='empty'>
                  📊
                </span>
              </Typography>
              <Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>
                Henüz sıralama verisi bulunmuyor
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Bu rol için henüz yeterli veri toplanmamış. Görevlerinizi
                tamamladıkça sıralama oluşacaktır.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Sıra</TableCell>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell align='center'>Toplam Puan</TableCell>
                    <TableCell align='center'>Toplam Görev</TableCell>
                    <TableCell align='center'>Ortalama</TableCell>
                    <TableCell align='center'>Performans</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {siralamalar.map(ranking => (
                    <TableRow
                      key={ranking.kullanici.id}
                      sx={{
                        backgroundColor: ranking.kullanici.isCurrentUser
                          ? '#e3f2fd'
                          : 'inherit',
                        '&:hover': {
                          backgroundColor: ranking.kullanici.isCurrentUser
                            ? '#bbdefb'
                            : '#f5f5f5',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: getRankColor(ranking.sira),
                              color: ranking.sira <= 3 ? '#000' : '#fff',
                              mr: 1,
                              fontSize: '0.875rem',
                            }}
                          >
                            {ranking.sira}
                          </Avatar>
                          {ranking.sira <= 3 && (
                            <Typography variant='body2'>
                              {['🥇', '🥈', '🥉'][ranking.sira - 1]}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{
                              fontWeight: ranking.kullanici.isCurrentUser
                                ? 'bold'
                                : 'normal',
                              color: ranking.kullanici.isCurrentUser
                                ? '#1976d2'
                                : 'inherit',
                            }}
                          >
                            {ranking.kullanici.ad} {ranking.kullanici.soyad}
                            {ranking.kullanici.isCurrentUser && (
                              <Chip
                                label='Siz'
                                size='small'
                                color='primary'
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            @{ranking.kullanici.kullaniciAdi}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align='center'>
                        <Chip
                          label={ranking.toplamPuan || 0}
                          color='primary'
                          variant='outlined'
                          icon={<StarIcon />}
                        />
                      </TableCell>

                      <TableCell align='center'>
                        <Chip
                          label={ranking.toplamGorev || 0}
                          color='secondary'
                          variant='outlined'
                          icon={<AssignmentIcon />}
                        />
                      </TableCell>

                      <TableCell align='center'>
                        <Typography
                          variant='body2'
                          sx={{
                            fontWeight: 'bold',
                            color: getScoreColor(
                              parseFloat(ranking.ortalamaPuan) || 0,
                            ),
                          }}
                        >
                          {ranking.ortalamaPuan || 0}
                        </Typography>
                      </TableCell>

                      <TableCell align='center'>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant='determinate'
                            value={Math.min(
                              ((ranking.toplamPuan || 0) /
                                (siralamalar[0]?.toplamPuan || 1)) *
                                100,
                              100,
                            )}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getScoreColor(
                                  parseFloat(ranking.ortalamaPuan) || 0,
                                ),
                              },
                            }}
                          />
                          <Typography variant='caption' color='text.secondary'>
                            %
                            {Math.round(
                              ((ranking.toplamPuan || 0) /
                                (siralamalar[0]?.toplamPuan || 1)) *
                                100,
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* İstatistikler */}
          <Box
            sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h6' color='primary'>
                    {toplamKullanici || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Toplam Katılımcı
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h6' color='primary'>
                    {siralamalar.length > 0
                      ? Math.round(
                        siralamalar.reduce(
                          (sum, r) => sum + (r.toplamPuan || 0),
                          0,
                        ) / siralamalar.length,
                      )
                      : 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Ortalama Puan
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h6' color='primary'>
                    {siralamalar.length > 0
                      ? siralamalar[0]?.toplamPuan || 0
                      : 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    En Yüksek Puan
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RankingBoard;
