import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ScoresList = ({
  scoreDetails,
  loading,
  pagination,
  onLoadData,
  _filters,
  onFilterChange,
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    puanTuru: 'all',
    tarihAraligi: '30',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    if (onLoadData) {
      onLoadData(localFilters);
    }
  }, [localFilters, onLoadData]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));

    if (onFilterChange) {
      onFilterChange({ ...localFilters, [key]: value });
    }
  };

  const getScoreIcon = type => {
    const iconMap = {
      'Görev Puanı': <AssignmentIcon />,
      'Kalıp Değişim': <TrendingUpIcon />,
      'Kalite Kontrolü': <StarIcon />,
      default: <PersonIcon />,
    };
    return iconMap[type] || iconMap.default;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography
          variant='h6'
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <FilterIcon color='primary' />
          Filtreleme ve Arama
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label='Arama'
              placeholder='Görev adı veya açıklama...'
              value={localFilters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Puan Türü</InputLabel>
              <Select
                value={localFilters.puanTuru}
                label='Puan Türü'
                onChange={e => handleFilterChange('puanTuru', e.target.value)}
              >
                <MenuItem value='all'>Tümü</MenuItem>
                <MenuItem value='Görev Puanı'>Görev Puanı</MenuItem>
                <MenuItem value='Kalıp Değişim'>Kalıp Değişim</MenuItem>
                <MenuItem value='Kalite Kontrolü'>Kalite Kontrolü</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tarih Aralığı</InputLabel>
              <Select
                value={localFilters.tarihAraligi}
                label='Tarih Aralığı'
                onChange={e =>
                  handleFilterChange('tarihAraligi', e.target.value)
                }
              >
                <MenuItem value='7'>Son 7 Gün</MenuItem>
                <MenuItem value='30'>Son 30 Gün</MenuItem>
                <MenuItem value='90'>Son 3 Ay</MenuItem>
                <MenuItem value='365'>Son 1 Yıl</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant='outlined'
              onClick={() => {
                setLocalFilters({
                  search: '',
                  puanTuru: 'all',
                  tarihAraligi: '30',
                  page: 1,
                  limit: 10,
                });
              }}
            >
              Filtreleri Temizle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {!scoreDetails || scoreDetails.length === 0 ? (
        <Alert severity='info'>
          Seçilen kriterlere uygun puan detayı bulunamadı.
        </Alert>
      ) : (
        <>
          <Paper
            sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'primary.light' }}
          >
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='h4' fontWeight='bold' color='primary.main'>
                  {scoreDetails.length}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Toplam Puanlama
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant='h4' fontWeight='bold' color='success.main'>
                  {scoreDetails.reduce(
                    (sum, score) => sum + (score.alinanPuan || 0),
                    0,
                  )}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Toplam Alınan Puan
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            {scoreDetails.map((score, index) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={`score-list-${score._id || score.id || index}-${score.puanTuru || 'unknown'}-${score.degerlendirmeTarihi || Date.now()}-${index}`}
              >
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      transition: 'all 0.3s ease',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {getScoreIcon(score.puanTuru)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant='h6'
                          sx={{ fontWeight: 'bold', mb: 0.5 }}
                        >
                          {score.gorevAdi || 'Görev'}
                        </Typography>
                        <Chip
                          label={score.puanTuru || 'Genel'}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant='h3'
                        fontWeight='bold'
                        color='primary.main'
                      >
                        {score.alinanPuan || 0}
                      </Typography>
                      <Typography variant='body1' color='text.secondary'>
                        / {score.maksimumPuan || 0} puan
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 1 }}
                      >
                        <strong>Değerlendiren:</strong>{' '}
                        {score.degerlendiren || 'Sistem'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        <strong>Tarih:</strong>{' '}
                        {score.degerlendirmeTarihi
                          ? format(
                              new Date(score.degerlendirmeTarihi),
                              'dd MMMM yyyy',
                              { locale: tr },
                            )
                          : 'Belirtilmemiş'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pagination && pagination.toplamSayfa > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.toplamSayfa || 1}
                page={localFilters.page}
                onChange={(e, page) => handleFilterChange('page', page)}
                color='primary'
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ScoresList;
