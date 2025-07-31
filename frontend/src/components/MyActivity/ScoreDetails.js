import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { myActivityAPI } from '../../services/api';

const ScoreDetails = ({ filters, onShowTaskDetails }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('tarih');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadScoreData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await myActivityAPI.getScoresDetail({
        ...filters,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      });
      setScoreData(response.data);
    } catch (error) {
      console.error('Puan detayları yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sortBy, sortOrder]);

  useEffect(() => {
    loadScoreData();
  }, [loadScoreData]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Puan detayları yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (!scoreData || !scoreData.scoreDetails) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          Puan detayı bulunamadı
        </Typography>
      </Box>
    );
  }

  const { scoreDetails, sayfalama } = scoreData;

  // Özet istatistikler
  const totalScores = scoreDetails.reduce(
    (sum, score) => sum + (score.puan || 0),
    0,
  );
  const avgScore =
    scoreDetails.length > 0
      ? (totalScores / scoreDetails.length).toFixed(1)
      : 0;
  const highestScore = Math.max(...scoreDetails.map(s => s.puan || 0));
  const lowestScore = Math.min(...scoreDetails.map(s => s.puan || 0));

  function getScoreColor(score) {
    if (score >= 90) {
      return '#4CAF50';
    }
    if (score >= 70) {
      return '#FF9800';
    }
    return '#F44336';
  }

  function getTaskTypeIcon(type) {
    const icons = {
      checklist: <AssignmentIcon />,
      worktask: <CheckCircleIcon />,
      quality_control: <StarIcon />,
      hr_evaluation: <PersonIcon />,
    };
    return icons[type] || <AssignmentIcon />;
  }

  function getTaskTypeName(type) {
    const names = {
      checklist: 'Checklist',
      worktask: 'İşe Bağlı Görev',
      quality_control: 'Kalite Kontrol',
      hr_evaluation: 'İK Değerlendirme',
    };
    return names[type] || type;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <Box>
      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <StarIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {totalScores}
                </Typography>
              </Box>
              <Typography variant='h6'>Toplam Puan</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                {scoreDetails.length} değerlendirme
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {avgScore}
                </Typography>
              </Box>
              <Typography variant='h6'>Ortalama Puan</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Değerlendirme başına
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {highestScore}
                </Typography>
              </Box>
              <Typography variant='h6'>En Yüksek</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Tek seferde alınan
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                  {lowestScore}
                </Typography>
              </Box>
              <Typography variant='h6'>En Düşük</Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Gelişim alanı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtre ve Sıralama */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sıralama</InputLabel>
                <Select
                  value={sortBy}
                  label='Sıralama'
                  onChange={e => setSortBy(e.target.value)}
                >
                  <MenuItem value='tarih'>Tarihe Göre</MenuItem>
                  <MenuItem value='puan'>Puana Göre</MenuItem>
                  <MenuItem value='gorevTuru'>Görev Türüne Göre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sıra</InputLabel>
                <Select
                  value={sortOrder}
                  label='Sıra'
                  onChange={e => setSortOrder(e.target.value)}
                >
                  <MenuItem value='desc'>Azalan</MenuItem>
                  <MenuItem value='asc'>Artan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Puan Detayları Tablosu */}
      <Card>
        <CardContent>
          <Typography
            variant='h6'
            sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
          >
            <StarIcon sx={{ mr: 1, color: '#FF9800' }} />
            Puan Detayları ({sayfalama?.toplamKayit || 0} kayıt)
          </Typography>

          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Görev Türü</TableCell>
                  <TableCell>Görev Adı</TableCell>
                  <TableCell align='center'>Puan</TableCell>
                  <TableCell align='center'>Değerlendiren</TableCell>
                  <TableCell align='center'>Yorum</TableCell>
                  <TableCell align='center'>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scoreDetails.map((score, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDate(score.tarih)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            mr: 1,
                            bgcolor: '#e3f2fd',
                          }}
                        >
                          {getTaskTypeIcon(score.gorevTuru)}
                        </Avatar>
                        <Typography variant='body2'>
                          {getTaskTypeName(score.gorevTuru)}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant='subtitle2'>
                        {score.gorevAdi || 'Görev Adı'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {score.makina && `Makina: ${score.makina}`}
                      </Typography>
                    </TableCell>

                    <TableCell align='center'>
                      <Chip
                        label={score.puan || 0}
                        sx={{
                          backgroundColor: getScoreColor(score.puan || 0),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>

                    <TableCell align='center'>
                      <Box>
                        <Typography variant='body2'>
                          {score.degerlendiren?.ad} {score.degerlendiren?.soyad}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {score.degerlendiren?.rol}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align='center'>
                      {score.yorum ? (
                        <Tooltip title={score.yorum} arrow>
                          <Chip
                            label='Yorum Var'
                            size='small'
                            color='info'
                            variant='outlined'
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          Yorum yok
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align='center'>
                      <Tooltip title='Detayları Görüntüle'>
                        <IconButton
                          size='small'
                          onClick={() => onShowTaskDetails(score.gorevId)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {sayfalama && sayfalama.toplamSayfa > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={sayfalama.toplamSayfa}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color='primary'
                size='large'
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ScoreDetails;
