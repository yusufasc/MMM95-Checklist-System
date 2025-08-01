import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
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
  Avatar,
  Tooltip,
  Grid,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Person as PersonIcon,
  Engineering as EngineIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { equipmentRequestAPI } from '../../services/api';

const EquipmentRequestManagement = ({ onSuccess }) => {
  const { hasModulePermission } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    requestType: 'all',
  });

  // Dialog states
  const [actionDialog, setActionDialog] = useState({
    open: false,
    request: null,
    action: null, // 'approve' | 'reject'
  });
  const [actionData, setActionData] = useState({
    responseNote: '',
    newExpiryDate: '',
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    request: null,
  });

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      };

      const response = await equipmentRequestAPI.getAll(params);

      // Ensure we have valid data structure
      if (response.data) {
        setRequests(response.data.requests || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        // Fallback for old API format
        setRequests(Array.isArray(response.data) ? response.data : []);
        setTotalCount(Array.isArray(response.data) ? response.data.length : 0);
      }
    } catch (err) {
      console.error('Equipment requests load error:', err);
      setError(
        err.response?.data?.message || 'Talepler yüklenirken hata oluştu',
      );
      // Ensure requests is always an array even on error
      setRequests([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(0); // Reset page when filtering
  };

  // Action handlers
  const handleAction = (request, action) => {
    setActionDialog({ open: true, request, action });
    setActionData({
      responseNote: '',
      newExpiryDate:
        action === 'approve' && request.requestedDate
          ? new Date(request.requestedDate).toISOString().split('T')[0]
          : '',
    });
  };

  // Detail handlers
  const handleRowClick = request => {
    setDetailDialog({ open: true, request });
  };

  const handleActionSubmit = async () => {
    try {
      const { request, action } = actionDialog;
      const endpoint =
        action === 'approve'
          ? equipmentRequestAPI.approve
          : equipmentRequestAPI.reject;

      const data = {
        responseNote: actionData.responseNote,
        ...(action === 'approve' &&
          actionData.newExpiryDate && {
          newExpiryDate: new Date(actionData.newExpiryDate),
        }),
      };

      await endpoint(request._id, data);

      onSuccess(
        `Talep ${action === 'approve' ? 'onaylandı' : 'reddedildi'}`,
        'success',
      );
      setActionDialog({ open: false, request: null, action: null });
      loadRequests();
    } catch (err) {
      onSuccess(
        err.response?.data?.message || 'İşlem sırasında hata oluştu',
        'error',
      );
    }
  };

  // Status configurations
  const statusConfig = {
    pending: { label: 'Bekliyor', color: 'warning' },
    approved: { label: 'Onaylandı', color: 'success' },
    rejected: { label: 'Reddedildi', color: 'error' },
  };

  const priorityConfig = {
    low: { label: 'Düşük', color: 'default' },
    normal: { label: 'Normal', color: 'primary' },
    high: { label: 'Yüksek', color: 'warning' },
    urgent: { label: 'Acil', color: 'error' },
  };

  const requestTypeConfig = {
    early_replacement: { label: 'Erken Değişim', color: 'info' },
    damage: { label: 'Hasar', color: 'error' },
    loss: { label: 'Kayıp', color: 'warning' },
    upgrade: { label: 'Güncelleme', color: 'primary' },
  };

  const formatDate = date => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getRemainingDays = expiryDate => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!hasModulePermission('Ekipman Yönetimi')) {
    return (
      <Alert severity='warning'>
        Ekipman talep sayfasını görüntüleme yetkisine sahip değilsiniz.
      </Alert>
    );
  }

  return (
    <Fade in={true} timeout={800}>
      <Box>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant='h6' fontWeight='bold'>
            <span role='img' aria-label='form'>
              📋
            </span>{' '}
            Ekipman Talep Bildirimleri
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    label='Durum'
                  >
                    <MenuItem value='all'>Tüm Durumlar</MenuItem>
                    <MenuItem value='pending'>Bekliyor</MenuItem>
                    <MenuItem value='approved'>Onaylandı</MenuItem>
                    <MenuItem value='rejected'>Reddedildi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Öncelik</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={e =>
                      handleFilterChange('priority', e.target.value)
                    }
                    label='Öncelik'
                  >
                    <MenuItem value='all'>Tüm Öncelikler</MenuItem>
                    <MenuItem value='low'>Düşük</MenuItem>
                    <MenuItem value='normal'>Normal</MenuItem>
                    <MenuItem value='high'>Yüksek</MenuItem>
                    <MenuItem value='urgent'>Acil</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Talep Tipi</InputLabel>
                  <Select
                    value={filters.requestType}
                    onChange={e =>
                      handleFilterChange('requestType', e.target.value)
                    }
                    label='Talep Tipi'
                  >
                    <MenuItem value='all'>Tüm Tipler</MenuItem>
                    <MenuItem value='early_replacement'>Erken Değişim</MenuItem>
                    <MenuItem value='damage'>Hasar</MenuItem>
                    <MenuItem value='loss'>Kayıp</MenuItem>
                    <MenuItem value='upgrade'>Güncelleme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Requests Table */}
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Talep Eden</TableCell>
                      <TableCell>Ekipman</TableCell>
                      <TableCell>Talep Tipi</TableCell>
                      <TableCell>Öncelik</TableCell>
                      <TableCell>Mevcut Bitiş</TableCell>
                      <TableCell>Talep Edilen</TableCell>
                      <TableCell>Kalan Süre</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Talep Tarihi</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(requests || []).map(request => (
                      <TableRow
                        key={request._id}
                        onClick={() => handleRowClick(request)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {request.userId?.ad} {request.userId?.soyad}
                              </Typography>
                              {request.userId?.departmanlar?.[0] && (
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {request.userId.departmanlar[0]}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1, bgcolor: 'info.main' }}>
                              <EngineIcon />
                            </Avatar>
                            <Box>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                {request.equipmentId?.name}
                              </Typography>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                {request.equipmentId?.category}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              requestTypeConfig[request.requestType]?.label
                            }
                            size='small'
                            color={
                              requestTypeConfig[request.requestType]?.color
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={priorityConfig[request.priority]?.label}
                            size='small'
                            color={priorityConfig[request.priority]?.color}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {formatDate(request.currentExpiryDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {request.requestedDate
                              ? formatDate(request.requestedDate)
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const remainingDays = getRemainingDays(
                              request.currentExpiryDate,
                            );
                            return (
                              <Chip
                                label={
                                  remainingDays > 0
                                    ? `${remainingDays} gün`
                                    : `${Math.abs(remainingDays)} gün geçti`
                                }
                                size='small'
                                color={
                                  remainingDays > 7
                                    ? 'success'
                                    : remainingDays > 0
                                      ? 'warning'
                                      : 'error'
                                }
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig[request.status]?.label}
                            size='small'
                            color={statusConfig[request.status]?.color}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {formatDate(request.requestDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {request.status === 'pending' &&
                              hasModulePermission(
                                'Ekipman Yönetimi',
                                'duzenleyebilir',
                              ) && (
                              <>
                                <Tooltip title='Onayla'>
                                  <IconButton
                                    size='small'
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleAction(request, 'approve');
                                    }}
                                    color='success'
                                  >
                                    <ApproveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Reddet'>
                                  <IconButton
                                    size='small'
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleAction(request, 'reject');
                                    }}
                                    color='error'
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!requests || requests.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={10} align='center' sx={{ py: 4 }}>
                          <Typography color='text.secondary'>
                            Henüz talep bulunmuyor
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage='Sayfa başına satır:'
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
                }
              />
            </Card>
          </>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={detailDialog.open}
          onClose={() => setDetailDialog({ open: false, request: null })}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              Talep Detayları
            </Box>
          </DialogTitle>
          <DialogContent>
            {detailDialog.request && (
              <Box sx={{ mt: 1 }}>
                {/* Talep Eden Bilgileri */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      <span role='img' aria-label='Person'>
                        👤
                      </span>{' '}
                      Talep Eden
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Ad Soyad
                        </Typography>
                        <Typography variant='body1' fontWeight='bold'>
                          {detailDialog.request.userId?.ad}{' '}
                          {detailDialog.request.userId?.soyad}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Departman
                        </Typography>
                        <Typography variant='body1'>
                          {detailDialog.request.userId?.departmanlar?.[0] ||
                            'Belirtilmemiş'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Ekipman Bilgileri */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      <span role='img' aria-label='Wrench'>
                        🔧
                      </span>{' '}
                      Ekipman Bilgileri
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Ekipman Adı
                        </Typography>
                        <Typography variant='body1' fontWeight='bold'>
                          {detailDialog.request.equipmentId?.name ||
                            'Belirtilmemiş'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Kategori
                        </Typography>
                        <Typography variant='body1'>
                          {detailDialog.request.equipmentId?.category ||
                            'Belirtilmemiş'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Talep Detayları */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom color='primary'>
                      <span role='img' aria-label='Clipboard'>
                        📋
                      </span>{' '}
                      Talep Detayları
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Talep Tipi
                        </Typography>
                        <Chip
                          label={
                            requestTypeConfig[detailDialog.request.requestType]
                              ?.label
                          }
                          size='small'
                          color={
                            requestTypeConfig[detailDialog.request.requestType]
                              ?.color
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Öncelik
                        </Typography>
                        <Chip
                          label={
                            priorityConfig[detailDialog.request.priority]?.label
                          }
                          size='small'
                          color={
                            priorityConfig[detailDialog.request.priority]?.color
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Durum
                        </Typography>
                        <Chip
                          label={
                            statusConfig[detailDialog.request.status]?.label
                          }
                          size='small'
                          color={
                            statusConfig[detailDialog.request.status]?.color
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Talep Tarihi
                        </Typography>
                        <Typography variant='body1'>
                          {formatDate(detailDialog.request.requestDate)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Açıklama */}
                {(detailDialog.request.reason ||
                  detailDialog.request.justification ||
                  detailDialog.request.customDescription) && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom color='primary'>
                        <span role='img' aria-label='Speech balloon'>
                          💬
                        </span>{' '}
                        Açıklama
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{
                          backgroundColor: 'grey.50',
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                        }}
                      >
                        {detailDialog.request.reason ||
                          detailDialog.request.justification ||
                          detailDialog.request.customDescription ||
                          'Açıklama belirtilmemiş'}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Yanıt (Eğer işlenmiş ise) */}
                {detailDialog.request.status !== 'pending' && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom color='primary'>
                        <span role='img' aria-label='Memo'>
                          📝
                        </span>{' '}
                        İK Yanıtı
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant='body2' color='text.secondary'>
                            İşleyen Kişi
                          </Typography>
                          <Typography variant='body1'>
                            {detailDialog.request.processedBy?.ad}{' '}
                            {detailDialog.request.processedBy?.soyad}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant='body2' color='text.secondary'>
                            İşlem Tarihi
                          </Typography>
                          <Typography variant='body1'>
                            {formatDate(detailDialog.request.processedAt)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant='body2' color='text.secondary'>
                            Yanıt Notu
                          </Typography>
                          <Typography
                            variant='body1'
                            sx={{
                              backgroundColor:
                                detailDialog.request.status === 'approved'
                                  ? 'success.50'
                                  : 'error.50',
                              p: 2,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor:
                                detailDialog.request.status === 'approved'
                                  ? 'success.200'
                                  : 'error.200',
                            }}
                          >
                            {detailDialog.request.responseNote ||
                              'Yanıt notu belirtilmemiş'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDetailDialog({ open: false, request: null })}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Dialog */}
        <Dialog
          open={actionDialog.open}
          onClose={() =>
            setActionDialog({ open: false, request: null, action: null })
          }
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>
            {actionDialog.action === 'approve'
              ? 'Talebi Onayla'
              : 'Talebi Reddet'}
          </DialogTitle>
          <DialogContent>
            {actionDialog.request && (
              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Talep Eden:</strong>{' '}
                  {actionDialog.request.userId?.isim}{' '}
                  {actionDialog.request.userId?.soyisim}
                </Typography>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Ekipman:</strong>{' '}
                  {actionDialog.request.equipmentId?.name}
                </Typography>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Sebep:</strong> {actionDialog.request.reason}
                </Typography>
              </Box>
            )}

            {actionDialog.action === 'approve' && (
              <TextField
                fullWidth
                label='Yeni Bitiş Tarihi'
                type='date'
                value={actionData.newExpiryDate}
                onChange={e =>
                  setActionData({
                    ...actionData,
                    newExpiryDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              label='Yanıt Notu'
              value={actionData.responseNote}
              onChange={e =>
                setActionData({ ...actionData, responseNote: e.target.value })
              }
              multiline
              rows={3}
              placeholder={
                actionDialog.action === 'approve'
                  ? 'Onay sebebini belirtin...'
                  : 'Red sebebini belirtin...'
              }
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setActionDialog({ open: false, request: null, action: null })
              }
            >
              İptal
            </Button>
            <Button
              onClick={handleActionSubmit}
              variant='contained'
              color={actionDialog.action === 'approve' ? 'success' : 'error'}
            >
              {actionDialog.action === 'approve' ? 'Onayla' : 'Reddet'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default EquipmentRequestManagement;
