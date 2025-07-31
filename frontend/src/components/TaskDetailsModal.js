import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { myActivityAPI } from '../services/api';

const TaskDetailsModal = ({ open, onClose, taskId }) => {
  const [loading, setLoading] = useState(true);
  const [taskDetails, setTaskDetails] = useState(null);
  const [error, setError] = useState('');

  const loadTaskDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await myActivityAPI.getTaskDetails(taskId);
      setTaskDetails(response.data);
    } catch (error) {
      console.error('Task details yüklenirken hata:', error);
      setError('Görev detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      loadTaskDetails();
    }
  }, [loadTaskDetails, open, taskId]);

  const getMaddeColor = madde => {
    const kontrolPuan = madde.puan || madde.kontrolPuani || 0;
    const maxPuan = madde.maksimumPuan || madde.maxPuan || 1;
    if (kontrolPuan === 0) {
      return 'error';
    }
    if (kontrolPuan >= maxPuan * 0.8) {
      return 'success';
    }
    if (kontrolPuan >= maxPuan * 0.5) {
      return 'warning';
    }
    return 'error';
  };

  const getPercentage = (earned, max) => {
    if (max === 0) {
      return 0;
    }
    return Math.round((earned / max) * 100);
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '80vh' },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 2 }} />
          <Box
            component='span'
            sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}
          >
            Şablon Madde Detayları
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant='h6' sx={{ mt: 2 }}>
              Detaylar yükleniyor...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {taskDetails && !loading && !error && (
          <>
            {/* Header Info */}
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
                      {taskDetails.checklistAdi}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      <strong>Kategori:</strong> {taskDetails.kategori}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Makina:</strong> {taskDetails.makina}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant='h4'
                        sx={{ fontWeight: 'bold', color: 'success.main' }}
                      >
                        {taskDetails.kontrolToplamPuani || 0}
                        <Typography
                          component='span'
                          variant='h6'
                          color='text.secondary'
                        >
                          /
                          {taskDetails.maddeler.reduce(
                            (sum, m) =>
                              sum + (m.maksimumPuan || m.maxPuan || 0),
                            0,
                          )}{' '}
                          puan
                        </Typography>
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'flex-end',
                          mt: 1,
                        }}
                      >
                        <Chip
                          label={`Maksimum: ${taskDetails.maddeler.reduce(
                            (sum, m) => sum + m.maxPuan,
                            0,
                          )}`}
                          color='info'
                          size='small'
                        />
                        <Chip
                          label={`Alınan: ${taskDetails.kontrolToplamPuani || 0}`}
                          color='success'
                          size='small'
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Who & When */}
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant='body2'>
                        <strong>Tamamlandı:</strong>
                        <br />
                        {new Date(taskDetails.tamamlanmaTarihi).toLocaleString(
                          'tr-TR',
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  {taskDetails.kontroleden && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant='body2'>
                          <strong>Puanlayan:</strong>
                          <br />
                          {taskDetails.kontroleden.ad}{' '}
                          {taskDetails.kontroleden.soyad}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {taskDetails.onaylayan && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant='body2'>
                          <strong>Onaylayan:</strong>
                          <br />
                          {taskDetails.onaylayan.ad}{' '}
                          {taskDetails.onaylayan.soyad}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Maddeler */}
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>
              <span role='img' aria-label='şablon'>
                📋
              </span>{' '}
              Şablon Maddeleri ({taskDetails.maddeler.length})
            </Typography>

            {taskDetails.maddeler.map((madde, index) => (
              <Accordion key={index} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: `${getMaddeColor(madde)}.light`,
                    '&:hover': { bgcolor: `${getMaddeColor(madde)}.main` },
                  }}
                >
                  <Grid container spacing={2} alignItems='center'>
                    <Grid item xs={1}>
                      <Avatar
                        sx={{
                          bgcolor: `${getMaddeColor(madde)}.main`,
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem',
                        }}
                      >
                        {madde.sira}
                      </Avatar>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'bold' }}
                      >
                        {madde.baslik || madde.soru}
                      </Typography>
                    </Grid>

                    <Grid item xs={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {madde.cevap ? (
                          <CheckCircleIcon
                            sx={{ color: 'success.main', mr: 1 }}
                          />
                        ) : (
                          <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
                        )}
                        <Typography variant='body2'>
                          {madde.cevap ? 'Evet' : 'Hayır'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                          {madde.puan || madde.kontrolPuani || 0}/
                          {madde.maksimumPuan || madde.maxPuan}
                        </Typography>
                        <LinearProgress
                          variant='determinate'
                          value={getPercentage(
                            madde.puan || madde.kontrolPuani || 0,
                            madde.maksimumPuan || madde.maxPuan,
                          )}
                          color={getMaddeColor(madde)}
                          sx={{ width: 80, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionSummary>

                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Puan Detayları */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                          <Typography
                            variant='subtitle2'
                            sx={{ mb: 2, fontWeight: 'bold' }}
                          >
                            <span role='img' aria-label='istatistik'>
                              📊
                            </span>{' '}
                            Puanlama Bilgileri
                          </Typography>

                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 1,
                            }}
                          >
                            <Typography variant='body2'>
                              Maksimum Puan:
                            </Typography>
                            <Chip
                              label={madde.maksimumPuan || madde.maxPuan}
                              color='info'
                              size='small'
                            />
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 1,
                            }}
                          >
                            <Typography variant='body2'>
                              Verilen Puan:
                            </Typography>
                            <Chip
                              label={madde.puan || madde.kontrolPuani || 0}
                              color='success'
                              size='small'
                            />
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography
                              variant='subtitle2'
                              sx={{ fontWeight: 'bold' }}
                            >
                              Durum:
                            </Typography>
                            <Typography
                              variant='h6'
                              sx={{
                                fontWeight: 'bold',
                                color:
                                  madde.puan || madde.kontrolPuani
                                    ? 'success.main'
                                    : 'warning.main',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <StarIcon sx={{ mr: 0.5, fontSize: 20 }} />
                              {madde.puan || madde.kontrolPuani
                                ? 'Puanlandı'
                                : 'Bekliyor'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Yorumlar */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                          <Typography
                            variant='subtitle2'
                            sx={{ mb: 2, fontWeight: 'bold' }}
                          >
                            <span role='img' aria-label='yorumlar'>
                              💬
                            </span>{' '}
                            Yorumlar
                          </Typography>

                          {madde.yorum && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Açıklama:
                              </Typography>
                              <Typography variant='body2'>
                                {madde.yorum}
                              </Typography>
                            </Box>
                          )}

                          {madde.kontrolYorumu && (
                            <Box>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Puanlayan Yorumu:
                              </Typography>
                              <Typography variant='body2'>
                                {madde.kontrolYorumu}
                              </Typography>
                            </Box>
                          )}

                          {!madde.yorum && !madde.kontrolYorumu && (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ fontStyle: 'italic' }}
                            >
                              Yorum bulunmuyor
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Fotoğraflar */}
                    {(madde.resimUrl || madde.kontrolResimUrl) && (
                      <Grid item xs={12}>
                        <Typography
                          variant='subtitle2'
                          sx={{ mb: 2, fontWeight: 'bold' }}
                        >
                          <span role='img' aria-label='fotoğraflar'>
                            📸
                          </span>{' '}
                          Fotoğraflar
                        </Typography>
                        <Grid container spacing={2}>
                          {madde.resimUrl && (
                            <Grid item xs={12} sm={6}>
                              <Card>
                                <CardContent sx={{ p: 1 }}>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    Fotoğraf:
                                  </Typography>
                                  <Box
                                    component='img'
                                    src={madde.resimUrl}
                                    sx={{
                                      width: '100%',
                                      height: 200,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      mt: 1,
                                    }}
                                    alt='Görev fotoğrafı'
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                          )}

                          {madde.kontrolResimUrl && (
                            <Grid item xs={12} sm={6}>
                              <Card>
                                <CardContent sx={{ p: 1 }}>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    Puanlayan Fotoğrafı:
                                  </Typography>
                                  <Box
                                    component='img'
                                    src={madde.kontrolResimUrl}
                                    sx={{
                                      width: '100%',
                                      height: 200,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      mt: 1,
                                    }}
                                    alt='Kontrol fotoğrafı'
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant='contained' sx={{ minWidth: 120 }}>
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsModal;
