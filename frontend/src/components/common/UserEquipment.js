import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Avatar,
  Fade,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  DirectionsCar as CarIcon,
  Engineering as EngineIcon,
  Checkroom as ClothingIcon,
  More as OtherIcon,
  RequestQuote as RequestIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { assignmentAPI, equipmentRequestAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserEquipment = ({ showSnackbar }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request dialog states
  const [requestDialog, setRequestDialog] = useState({
    open: false,
    assignment: null,
  });
  const [requestData, setRequestData] = useState({
    requestType: 'early_replacement',
    reason: '',
    requestedDate: '',
    priority: 'normal',
  });

  // Category icons mapping
  const categoryIcons = {
    Bilgisayar: ComputerIcon,
    Telefon: PhoneIcon,
    Araç: CarIcon,
    Kıyafet: ClothingIcon,
    Donanım: EngineIcon,
    Diğer: OtherIcon,
  };

  // Category colors mapping
  const categoryColors = {
    Bilgisayar: '#2196f3',
    Telefon: '#4caf50',
    Araç: '#ff9800',
    Kıyafet: '#9c27b0',
    Donanım: '#795548',
    Diğer: '#607d8b',
  };

  // Load user assignments
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getUserAssignments(user.id, {
        status: 'active',
      });
      setAssignments(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Ekipmanlar yüklenirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [loadAssignments, user]);

  // Calculate remaining days
  const getRemainingDays = expiryDate => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get remaining days color
  const getRemainingDaysColor = assignment => {
    const remainingDays = getRemainingDays(assignment.expiresAt);
    if (remainingDays <= 0) {
      return 'error';
    }
    if (remainingDays <= 7) {
      return 'warning';
    }
    if (remainingDays <= 30) {
      return 'info';
    }
    return 'success';
  };

  // Format remaining time text
  const formatRemainingTime = assignment => {
    const remainingDays = getRemainingDays(assignment.expiresAt);
    if (remainingDays < 0) {
      return `${Math.abs(remainingDays)} gün geçti`;
    } else if (remainingDays === 0) {
      return 'Bugün bitiyor';
    } else if (remainingDays === 1) {
      return 'Yarın bitiyor';
    } else {
      return `${remainingDays} gün kaldı`;
    }
  };

  // Handle early request
  const handleRequestEarly = assignment => {
    setRequestDialog({ open: true, assignment });

    // Default request date to tomorrow for early replacement
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setRequestData({
      requestType: 'early_replacement',
      reason: '',
      requestedDate: tomorrow.toISOString().split('T')[0],
      priority: 'normal',
    });
  };

  // Submit early request
  const handleSubmitRequest = async () => {
    try {
      const requestPayload = {
        assignmentId: requestDialog.assignment._id,
        equipmentId: requestDialog.assignment.equipmentId._id,
        requestType: requestData.requestType,
        reason: requestData.reason,
        requestedDate: new Date(requestData.requestedDate),
        priority: requestData.priority,
      };

      await equipmentRequestAPI.create(requestPayload);

      showSnackbar('Erken talep başarıyla gönderildi', 'success');
      setRequestDialog({ open: false, assignment: null });
      setRequestData({
        requestType: 'early_replacement',
        reason: '',
        requestedDate: '',
        priority: 'normal',
      });
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || 'Talep gönderilirken hata oluştu',
        'error',
      );
    }
  };

  // Get icon for category
  const getCategoryIcon = category => {
    const IconComponent = categoryIcons[category] || OtherIcon;
    return <IconComponent />;
  };

  // Get progress value for time remaining
  const getProgressValue = assignment => {
    const totalDays = assignment.defaultUsagePeriodDays || 365;
    const usedDays = Math.ceil(
      (new Date() - new Date(assignment.assignedAt)) / (1000 * 60 * 60 * 24),
    );
    return Math.min((usedDays / totalDays) * 100, 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity='error'
        action={
          <IconButton onClick={loadAssignments} size='small'>
            <RefreshIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Fade in={true} timeout={800}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant='h5' fontWeight='bold' gutterBottom>
            <span role='img' aria-label='alet'>
              🔧
            </span>{' '}
            Ekipmanlarım
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Size atanmış ekipmanları görüntüleyebilir ve erken talep
            edebilirsiniz
          </Typography>
        </Box>

        {/* Equipment Cards */}
        <Grid container spacing={3}>
          {assignments.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <EngineIcon
                    sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant='h6' color='text.secondary' gutterBottom>
                    Henüz size atanmış ekipman bulunmuyor
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    İK departmanı tarafından size ekipman atandığında burada
                    görünecektir
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            assignments.map(assignment => (
              <Grid item xs={12} md={6} lg={4} key={assignment._id}>
                <Card
                  sx={{
                    height: '100%',
                    border: '2px solid',
                    borderColor:
                      categoryColors[assignment.equipmentId.category] || '#ccc',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent>
                    {/* Equipment Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor:
                            categoryColors[assignment.equipmentId.category],
                          mr: 2,
                        }}
                      >
                        {getCategoryIcon(assignment.equipmentId.category)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='h6' fontWeight='bold'>
                          {assignment.equipmentId.name}
                        </Typography>
                        <Chip
                          label={assignment.equipmentId.category}
                          size='small'
                          sx={{
                            bgcolor:
                              categoryColors[assignment.equipmentId.category],
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Equipment Details */}
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemIcon>
                          <CalendarIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary='Atanma Tarihi'
                          secondary={new Date(
                            assignment.assignedAt,
                          ).toLocaleDateString('tr-TR')}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemIcon>
                          <CalendarIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary='Bitiş Tarihi'
                          secondary={new Date(
                            assignment.expiresAt,
                          ).toLocaleDateString('tr-TR')}
                        />
                      </ListItem>
                    </List>

                    {/* Time Progress */}
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2' color='text.secondary'>
                          Kullanım Süresi
                        </Typography>
                        <Chip
                          label={formatRemainingTime(assignment)}
                          size='small'
                          color={getRemainingDaysColor(assignment)}
                        />
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={getProgressValue(assignment)}
                        color={getRemainingDaysColor(assignment)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Description */}
                    {assignment.equipmentId.description && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {assignment.equipmentId.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Notes */}
                    {assignment.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant='caption' color='text.secondary'>
                          <strong>Notlar:</strong> {assignment.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                      <Button
                        variant='outlined'
                        startIcon={<RequestIcon />}
                        onClick={() => handleRequestEarly(assignment)}
                        size='small'
                        fullWidth
                      >
                        Erken Talep Et
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Early Request Dialog */}
        <Dialog
          open={requestDialog.open}
          onClose={() => setRequestDialog({ open: false, assignment: null })}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Erken Talep Gönder</DialogTitle>
          <DialogContent>
            {requestDialog.assignment && (
              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Ekipman:</strong>{' '}
                  {requestDialog.assignment.equipmentId.name}
                </Typography>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Mevcut Bitiş Tarihi:</strong>{' '}
                  {new Date(
                    requestDialog.assignment.expiresAt,
                  ).toLocaleDateString('tr-TR')}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Talep Tipi</InputLabel>
                  <Select
                    value={requestData.requestType}
                    onChange={e =>
                      setRequestData({
                        ...requestData,
                        requestType: e.target.value,
                      })
                    }
                    label='Talep Tipi'
                  >
                    <MenuItem value='early_replacement'>Erken Değişim</MenuItem>
                    <MenuItem value='damage'>Hasar</MenuItem>
                    <MenuItem value='loss'>Kayıp</MenuItem>
                    <MenuItem value='upgrade'>Güncelleme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Talep Edilen Tarih'
                  type='date'
                  value={requestData.requestedDate}
                  onChange={e =>
                    setRequestData({
                      ...requestData,
                      requestedDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Öncelik</InputLabel>
                  <Select
                    value={requestData.priority}
                    onChange={e =>
                      setRequestData({
                        ...requestData,
                        priority: e.target.value,
                      })
                    }
                    label='Öncelik'
                  >
                    <MenuItem value='low'>Düşük</MenuItem>
                    <MenuItem value='normal'>Normal</MenuItem>
                    <MenuItem value='high'>Yüksek</MenuItem>
                    <MenuItem value='urgent'>Acil</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Talep Sebebi'
                  value={requestData.reason}
                  onChange={e =>
                    setRequestData({ ...requestData, reason: e.target.value })
                  }
                  multiline
                  rows={3}
                  placeholder='Erken talep sebebinizi belirtin...'
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setRequestDialog({ open: false, assignment: null })
              }
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitRequest}
              variant='contained'
              disabled={!requestData.reason.trim()}
            >
              Talep Gönder
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default UserEquipment;
