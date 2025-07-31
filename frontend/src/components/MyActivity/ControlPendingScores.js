import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatDate } from '../../utils/myActivityHelpers';

const ControlPendingScores = ({
  data,
  loading,
  error,
  title = 'Görev Puanlarım',
  emptyMessage = 'Henüz puanlanmış görev bulunamadı.',
  emptyDescription = '• /tasks sayfasından rutin checklistlerinizi tamamlayın',
}) => {
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' p={3}>
        <Typography>Kontrol bekleyen puanlar yükleniyor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color='error'>Hata: {error}</Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box p={3} sx={{ textAlign: 'center' }}>
        <Paper
          sx={{
            p: 4,
            background: title.includes('Checklist')
              ? 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <Typography variant='h5' sx={{ mb: 2 }}>
            <span role='img' aria-label='Clipboard'>
              📋
            </span>{' '}
            {title}
          </Typography>
          <Typography variant='body1' sx={{ mb: 2 }}>
            {emptyMessage}
          </Typography>
          <Typography variant='body2' sx={{ opacity: 0.9 }}>
            {emptyDescription}
            <br />
            • Tamamladığınız görevler /control-pending sayfasında puanlanır
            <br />• Puanlanan görevler burada detaylarıyla görünecek
          </Typography>
        </Paper>
      </Box>
    );
  }

  const getScoreColor = (score, maxScore) => {
    if (!maxScore) {
      return '#757575';
    }
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) {
      return '#4caf50';
    }
    if (percentage >= 70) {
      return '#ff9800';
    }
    return '#f44336';
  };

  const getStatusColor = status => {
    switch (status) {
      case 'onaylandi':
        return 'success';
      case 'beklemede':
        return 'warning';
      case 'tamamlandi':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTotalTasks = () => {
    return data.length;
  };

  const getTotalScore = () => {
    return data.reduce((sum, item) => sum + (item.puanlar?.toplam || 0), 0);
  };

  const getAverageScore = () => {
    const total = getTotalScore();
    const count = getTotalTasks();
    return count > 0 ? Math.round(total / count) : 0;
  };

  const getApprovedCount = () => {
    return data.filter(item => item.durum === 'onaylandi').length;
  };

  const getWorkTaskCount = () => {
    return data.filter(item => item.tip === 'worktask').length;
  };

  const getChecklistCount = () => {
    return data.filter(item => item.tip === 'checklist').length;
  };

  return (
    <Box>
      {/* Özet Kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Toplam Görev</Typography>
              <Typography variant='h4'>{getTotalTasks()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Rutin Görev</Typography>
              <Typography variant='h4'>{getChecklistCount()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #FECA57 0%, #FFA726 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>İşe Bağlı</Typography>
              <Typography variant='h4'>{getWorkTaskCount()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Toplam Puan</Typography>
              <Typography variant='h4'>{getTotalScore()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Ortalama</Typography>
              <Typography variant='h4'>{getAverageScore()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant='h6'>Onaylanan</Typography>
              <Typography variant='h4'>{getApprovedCount()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detaylı Liste */}
      {data.map((item, index) => (
        <Accordion
          key={`control-pending-${item._id || item.id || index}-${index}`}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 2,
              }}
            >
              <Typography variant='h6' sx={{ flexGrow: 1 }}>
                {item.checklistAdi}
              </Typography>
              <Chip
                label={
                  item.tip === 'worktask' ? 'İşe Bağlı Görev' : item.kategori
                }
                size='small'
                sx={{ backgroundColor: item.kategoriRengi, color: 'white' }}
              />
              <Chip
                label={item.durum}
                size='small'
                color={getStatusColor(item.durum)}
              />
              {item.tip === 'worktask' && (
                <Chip
                  label='WorkTask'
                  size='small'
                  sx={{ backgroundColor: '#FF9800', color: 'white' }}
                />
              )}
              <Typography
                variant='body2'
                sx={{
                  color: getScoreColor(
                    item.puanlar?.toplam,
                    item.puanlar?.maksimum,
                  ),
                  fontWeight: 'bold',
                }}
              >
                {item.puanlar?.toplam || 0}/{item.puanlar?.maksimum || 0}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Görev Bilgileri
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Makina:</strong> {item.makina}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Tarih:</strong> {formatDate(item.tamamlanmaTarihi)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Görev Tipi:</strong>{' '}
                    {item.tip === 'worktask'
                      ? 'İşe Bağlı Görev'
                      : 'Rutin Checklist'}
                  </Typography>
                  {item.kalip && (
                    <Typography variant='body2'>
                      <strong>Kalıp:</strong> {item.kalip}
                    </Typography>
                  )}
                  {item.hamade && (
                    <Typography variant='body2'>
                      <strong>Hammadde:</strong> {item.hamade}
                    </Typography>
                  )}
                  {item.tip === 'worktask' && (
                    <Typography
                      variant='body2'
                      sx={{ color: '#FF9800', fontWeight: 'bold' }}
                    >
                      <strong>
                        <span role='img' aria-label='Clipboard'>
                          📋
                        </span>{' '}
                        Kalıp Değişim Görevi
                      </strong>
                    </Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Puanlama Bilgileri
                  </Typography>
                  {item.puanlayanKullanici && (
                    <Typography variant='body2'>
                      <strong>Puanlayan:</strong> {item.puanlayanKullanici.ad}{' '}
                      {item.puanlayanKullanici.soyad}
                    </Typography>
                  )}
                  {item.onaylayan && (
                    <Typography variant='body2'>
                      <strong>Onaylayan:</strong> {item.onaylayan.ad}{' '}
                      {item.onaylayan.soyad}
                    </Typography>
                  )}
                  {item.puanlamaTarihi && (
                    <Typography variant='body2'>
                      <strong>Puanlama Tarihi:</strong>{' '}
                      {formatDate(item.puanlamaTarihi)}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              {item.aciklama && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant='subtitle2' gutterBottom>
                      Açıklama
                    </Typography>
                    <Typography variant='body2'>{item.aciklama}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ControlPendingScores;
