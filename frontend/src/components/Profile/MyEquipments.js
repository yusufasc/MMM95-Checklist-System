import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Extension as ExtensionIcon,
} from '@mui/icons-material';

const MyEquipments = ({ assignments, onRefresh }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = date => {
    if (!date) {
      return 'Belirtilmemiş';
    }
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDaysRemaining = expiresAt => {
    if (!expiresAt) {
      return null;
    }
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateUsageDuration = (assignedAt, returnedAt = null) => {
    const start = new Date(assignedAt);
    const end = returnedAt ? new Date(returnedAt) : new Date();
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = assignment => {
    const daysRemaining = calculateDaysRemaining(assignment.expiresAt);

    if (assignment.status === 'returned') {
      return {
        color: 'default',
        icon: <CheckCircleIcon />,
        text: 'İade Edildi',
        description: `${formatDate(assignment.returnedAt)} tarihinde iade edildi`,
      };
    }

    if (
      assignment.status === 'expired' ||
      (daysRemaining !== null && daysRemaining <= 0)
    ) {
      return {
        color: 'error',
        icon: <CloseIcon />,
        text: 'Süresi Doldu',
        description: `${Math.abs(daysRemaining)} gün önce süresi dolmuş`,
      };
    }

    if (daysRemaining !== null && daysRemaining <= 7) {
      return {
        color: 'warning',
        icon: <WarningIcon />,
        text: `${daysRemaining} Gün Kaldı`,
        description: 'Süre dolmak üzere, lütfen iade işlemini unutmayın',
      };
    }

    return {
      color: 'success',
      icon: <CheckCircleIcon />,
      text: 'Aktif',
      description: daysRemaining
        ? `${daysRemaining} gün kullanım hakkınız var`
        : 'Süresiz kullanım',
    };
  };

  const getUsageProgress = (assignedAt, expiresAt) => {
    if (!expiresAt) {
      return 0;
    }

    const start = new Date(assignedAt);
    const end = new Date(expiresAt);
    const now = new Date();

    const totalDuration = end - start;
    const usedDuration = now - start;

    return Math.min((usedDuration / totalDuration) * 100, 100);
  };

  const handleShowDetails = assignment => {
    setSelectedAssignment(assignment);
    setDetailDialog(true);
  };

  const handleRequestExtension = async assignmentId => {
    try {
      setLoading(true);
      // Bu fonksiyon talep sistemi ile entegre edilebilir
      console.log('Süre uzatma talebi:', assignmentId);
      // await assignmentAPI.requestExtension(assignmentId);
      alert(
        'Süre uzatma talebi gönderildi! İK departmanı tarafından değerlendirilecektir.',
      );
    } catch (error) {
      console.error('Süre uzatma talebi hatası:', error);
      alert('Talep gönderilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (assignments.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant='h6' color='text.secondary' gutterBottom>
          Henüz Size Atanmış Ekipman Bulunmuyor
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          Ekipman ihtiyaçlarınız için talep oluşturabilirsiniz
        </Typography>
        <Button
          variant='contained'
          onClick={onRefresh}
          startIcon={<ExtensionIcon />}
        >
          Yenile
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h6' fontWeight='bold'>
          <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Zimmetli Ekipmanlarım ({assignments.length})
        </Typography>
        <Button
          variant='outlined'
          startIcon={<ExtensionIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          Yenile
        </Button>
      </Box>

      <Grid container spacing={3}>
        {assignments.map(assignment => {
          const statusInfo = getStatusInfo(assignment);
          const usageDays = calculateUsageDuration(
            assignment.assignedAt,
            assignment.returnedAt,
          );
          const usageProgress = getUsageProgress(
            assignment.assignedAt,
            assignment.expiresAt,
          );

          return (
            <Grid item xs={12} md={6} lg={4} key={assignment._id}>
              <Card
                sx={{
                  height: '100%',
                  border:
                    statusInfo.color === 'error'
                      ? '2px solid #f44336'
                      : statusInfo.color === 'warning'
                        ? '2px solid #ff9800'
                        : 'none',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <CardContent>
                  {/* Ekipman Başlığı */}
                  <Typography variant='h6' fontWeight='bold' gutterBottom>
                    {assignment.equipmentId?.name || 'Bilinmeyen Ekipman'}
                  </Typography>

                  {/* Durum Chip'i */}
                  <Chip
                    icon={statusInfo.icon}
                    label={statusInfo.text}
                    color={statusInfo.color}
                    size='small'
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ my: 2 }} />

                  {/* Kullanım Süresi */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      <ExtensionIcon
                        sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
                      />
                      Kullanım Süresi: {usageDays} gün
                    </Typography>

                    {assignment.status !== 'returned' &&
                      assignment.expiresAt && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant='determinate'
                          value={usageProgress}
                          color={statusInfo.color}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant='caption' color='text.secondary'>
                            %{Math.round(usageProgress)} kullanıldı
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Tarih Bilgileri */}
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    <CalendarIcon
                      sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
                    />
                    Atanma: {formatDate(assignment.assignedAt)}
                  </Typography>

                  {assignment.expiresAt && (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Son Kullanım: {formatDate(assignment.expiresAt)}
                    </Typography>
                  )}

                  {/* Durum Açıklaması */}
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mt: 1 }}
                  >
                    {statusInfo.description}
                  </Typography>

                  {/* Eylem Butonları */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<InfoIcon />}
                      onClick={() => handleShowDetails(assignment)}
                    >
                      Detaylar
                    </Button>

                    {assignment.status === 'active' &&
                      statusInfo.color === 'warning' && (
                      <Button
                        size='small'
                        variant='contained'
                        color='warning'
                        onClick={() => handleRequestExtension(assignment._id)}
                        disabled={loading}
                      >
                          Süre Uzat
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Detay Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Ekipman Detayları</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Ekipman Adı
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedAssignment.equipmentId?.name}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Kategori
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedAssignment.equipmentId?.category || 'Belirtilmemiş'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Atanma Tarihi
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {formatDate(selectedAssignment.assignedAt)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Son Kullanım Tarihi
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {formatDate(selectedAssignment.expiresAt)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Atama Notları
                </Typography>
                <Typography variant='body1' gutterBottom>
                  {selectedAssignment.notes || 'Not bulunmuyor'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Ekipman Durumu
                </Typography>
                <Typography variant='body1'>
                  {selectedAssignment.condition === 'perfect'
                    ? 'Mükemmel'
                    : selectedAssignment.condition === 'good'
                      ? 'İyi'
                      : selectedAssignment.condition === 'fair'
                        ? 'Orta'
                        : 'Kötü'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyEquipments;
