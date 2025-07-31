import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Chip,
  IconButton,
  Alert,
  Paper,
  Tooltip,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  KeyboardReturn as ReturnIcon,
  Schedule as ExtendIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentAPI, equipmentAPI, hrAPI } from '../../services/api';

const AssignmentManagement = ({ onSuccess }) => {
  const { hasModulePermission } = useAuth();

  // State management
  const [assignments, setAssignments] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [assignDialog, setAssignDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [extendDialog, setExtendDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Form data
  const [assignForm, setAssignForm] = useState({
    equipmentId: '',
    userId: '',
    notes: '',
    condition: 'perfect',
  });

  const [returnForm, setReturnForm] = useState({
    notes: '',
    condition: 'perfect',
  });

  const [extendForm, setExtendForm] = useState({
    additionalDays: 30,
    notes: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    userId: '',
    equipmentId: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 AssignmentManagement - Loading data...');

      const [assignmentsRes, equipmentRes, usersRes] = await Promise.all([
        assignmentAPI.getAll(filters),
        equipmentAPI.getAll({ status: 'active' }),
        hrAPI.getUsers({ forManualEntry: 'true' }),
      ]);

      console.log('📊 AssignmentManagement - Data loaded:', {
        assignments: assignmentsRes.data?.length || 0,
        equipment: equipmentRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        usersData:
          usersRes.data?.map(u => ({
            id: u._id,
            name: `${u.ad} ${u.soyad}`,
          })) || [],
      });

      setAssignments(assignmentsRes.data);
      setEquipment(equipmentRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('❌ AssignmentManagement - Loading error:', err);
      setError(
        err.response?.data?.message || 'Veriler yüklenirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (hasModulePermission('Ekipman Yönetimi')) {
      loadData();
    }
  }, [hasModulePermission, loadData]);

  // Assignment operations
  const handleAssign = async () => {
    try {
      await assignmentAPI.create(assignForm);
      if (onSuccess) {
        onSuccess('Ekipman başarıyla atandı', 'success');
      }
      setAssignDialog(false);
      setAssignForm({
        equipmentId: '',
        userId: '',
        notes: '',
        condition: 'perfect',
      });
      loadData();
    } catch (err) {
      if (onSuccess) {
        onSuccess(
          err.response?.data?.message || 'Atama işlemi sırasında hata oluştu',
          'error',
        );
      }
    }
  };

  const handleReturn = async () => {
    try {
      await assignmentAPI.returnEquipment(selectedAssignment._id, returnForm);
      if (onSuccess) {
        onSuccess('Ekipman başarıyla iade edildi', 'success');
      }
      setReturnDialog(false);
      setReturnForm({ notes: '', condition: 'perfect' });
      loadData();
    } catch (err) {
      if (onSuccess) {
        onSuccess(
          err.response?.data?.message || 'İade işlemi sırasında hata oluştu',
          'error',
        );
      }
    }
  };

  const handleExtend = async () => {
    try {
      await assignmentAPI.extendAssignment(selectedAssignment._id, extendForm);
      if (onSuccess) {
        onSuccess('Atama süresi uzatıldı', 'success');
      }
      setExtendDialog(false);
      setExtendForm({ additionalDays: 30, notes: '' });
      loadData();
    } catch (err) {
      if (onSuccess) {
        onSuccess(
          err.response?.data?.message || 'Uzatma işlemi sırasında hata oluştu',
          'error',
        );
      }
    }
  };

  // Helper functions
  const getStatusColor = (status, expiresAt) => {
    if (status === 'returned') {
      return 'default';
    }
    if (status === 'expired') {
      return 'error';
    }

    const now = new Date();
    const expires = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return 'error';
    }
    if (daysUntilExpiry <= 7) {
      return 'warning';
    }
    return 'success';
  };

  const getStatusText = (status, expiresAt) => {
    if (status === 'returned') {
      return 'İade Edildi';
    }
    if (status === 'expired') {
      return 'Süresi Doldu';
    }

    const now = new Date();
    const expires = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return 'Süresi Doldu';
    }
    if (daysUntilExpiry <= 7) {
      return `${daysUntilExpiry} Gün Kaldı`;
    }
    return 'Aktif';
  };

  const formatDate = date => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  if (!hasModulePermission('Ekipman Yönetimi')) {
    return (
      <Alert severity='warning'>
        Ekipman zimmetleme sayfasını görüntüleme yetkisine sahip değilsiniz.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant='h6' fontWeight='bold'>
            <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Ekipman Zimmetleme
          </Typography>
          {hasModulePermission('Ekipman Yönetimi', 'duzenleyebilir') && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => setAssignDialog(true)}
            >
              Yeni Atama
            </Button>
          )}
        </Box>

        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.status}
                onChange={e =>
                  setFilters({ ...filters, status: e.target.value })
                }
                label='Durum'
              >
                <MenuItem value='all'>Tüm Durumlar</MenuItem>
                <MenuItem value='active'>Aktif</MenuItem>
                <MenuItem value='returned'>İade Edildi</MenuItem>
                <MenuItem value='expired'>Süresi Doldu</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              size='small'
              options={users}
              getOptionLabel={user => (user ? `${user.ad} ${user.soyad}` : '')}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={users.find(u => u._id === filters.userId) || null}
              onChange={(_, user) =>
                setFilters({ ...filters, userId: user?._id || '' })
              }
              renderInput={params => (
                <TextField {...params} label='Personel Filtrele' />
              )}
              renderOption={(props, user) => (
                <li {...props} key={user._id}>
                  {user ? `${user.ad} ${user.soyad}` : ''}
                </li>
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              size='small'
              options={equipment}
              getOptionLabel={eq => (eq ? eq.name || '' : '')}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={equipment.find(e => e._id === filters.equipmentId) || null}
              onChange={(_, eq) =>
                setFilters({ ...filters, equipmentId: eq?._id || '' })
              }
              renderInput={params => (
                <TextField {...params} label='Ekipman Filtrele' />
              )}
              renderOption={(props, eq) => (
                <li {...props} key={eq._id}>
                  {eq ? eq.name || '' : ''}
                </li>
              )}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Assignments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Personel</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ekipman</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Atama Tarihi</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Bitiş Tarihi</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Durumu</TableCell>
              {hasModulePermission('Ekipman Yönetimi', 'duzenleyebilir') && (
                <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map(assignment => (
              <TableRow key={assignment._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color='primary' />
                    <Box>
                      <Typography variant='subtitle2'>
                        {assignment.userId?.ad} {assignment.userId?.soyad}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {assignment.userId?.departmanlar?.[0]?.ad ||
                          'Departman Yok'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ComputerIcon color='secondary' />
                    <Box>
                      <Typography variant='subtitle2'>
                        {assignment.equipmentId?.name}
                      </Typography>
                      <Chip
                        label={assignment.equipmentId?.category}
                        size='small'
                        variant='outlined'
                      />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                <TableCell>{formatDate(assignment.expiresAt)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(
                      assignment.status,
                      assignment.expiresAt,
                    )}
                    color={getStatusColor(
                      assignment.status,
                      assignment.expiresAt,
                    )}
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      assignment.condition === 'perfect'
                        ? 'Mükemmel'
                        : assignment.condition === 'good'
                          ? 'İyi'
                          : assignment.condition === 'fair'
                            ? 'Orta'
                            : 'Kötü'
                    }
                    size='small'
                    variant='outlined'
                  />
                </TableCell>
                {hasModulePermission('Ekipman Yönetimi', 'duzenleyebilir') && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title='Detayları Gör'>
                        <IconButton
                          size='small'
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setViewDialog(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {assignment.status === 'active' && (
                        <>
                          <Tooltip title='İade Et'>
                            <IconButton
                              size='small'
                              color='warning'
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setReturnDialog(true);
                              }}
                            >
                              <ReturnIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Süre Uzat'>
                            <IconButton
                              size='small'
                              color='info'
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setExtendDialog(true);
                              }}
                            >
                              <ExtendIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {assignments.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant='h6' color='text.secondary' gutterBottom>
            Henüz atama bulunamadı
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Yeni bir atama oluşturmak için "Yeni Atama" butonunu kullanın.
          </Typography>
        </Box>
      )}

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Yeni Ekipman Ataması</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={user =>
                  user ? `${user.ad} ${user.soyad}` : ''
                }
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                value={users.find(u => u._id === assignForm.userId) || null}
                onChange={(_, user) =>
                  setAssignForm({ ...assignForm, userId: user?._id || '' })
                }
                renderInput={params => (
                  <TextField {...params} label='Personel Seçin' required />
                )}
                renderOption={(props, user) => (
                  <li {...props} key={user._id}>
                    {user ? `${user.ad} ${user.soyad}` : ''}
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={equipment}
                getOptionLabel={eq =>
                  eq ? `${eq.name || ''} (${eq.category || ''})` : ''
                }
                isOptionEqualToValue={(option, value) =>
                  option._id === value._id
                }
                value={
                  equipment.find(e => e._id === assignForm.equipmentId) || null
                }
                onChange={(_, eq) =>
                  setAssignForm({ ...assignForm, equipmentId: eq?._id || '' })
                }
                renderInput={params => (
                  <TextField {...params} label='Ekipman Seçin' required />
                )}
                renderOption={(props, eq) => (
                  <li {...props} key={eq._id}>
                    {eq ? `${eq.name || ''} (${eq.category || ''})` : ''}
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={assignForm.condition}
                  onChange={e =>
                    setAssignForm({ ...assignForm, condition: e.target.value })
                  }
                  label='Durum'
                >
                  <MenuItem value='perfect'>Mükemmel</MenuItem>
                  <MenuItem value='good'>İyi</MenuItem>
                  <MenuItem value='fair'>Orta</MenuItem>
                  <MenuItem value='poor'>Kötü</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Notlar'
                value={assignForm.notes}
                onChange={e =>
                  setAssignForm({ ...assignForm, notes: e.target.value })
                }
                multiline
                rows={3}
                placeholder='Atama ile ilgili notlar...'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>İptal</Button>
          <Button
            onClick={handleAssign}
            variant='contained'
            disabled={!assignForm.userId || !assignForm.equipmentId}
          >
            Ata
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog
        open={returnDialog}
        onClose={() => setReturnDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Ekipman İadesi</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                <strong>
                  {selectedAssignment?.userId?.ad}{' '}
                  {selectedAssignment?.userId?.soyad}
                </strong>{' '}
                - {selectedAssignment?.equipmentId?.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>İade Durumu</InputLabel>
                <Select
                  value={returnForm.condition}
                  onChange={e =>
                    setReturnForm({ ...returnForm, condition: e.target.value })
                  }
                  label='İade Durumu'
                >
                  <MenuItem value='perfect'>Mükemmel</MenuItem>
                  <MenuItem value='good'>İyi</MenuItem>
                  <MenuItem value='fair'>Orta</MenuItem>
                  <MenuItem value='poor'>Kötü</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='İade Notları'
                value={returnForm.notes}
                onChange={e =>
                  setReturnForm({ ...returnForm, notes: e.target.value })
                }
                multiline
                rows={3}
                placeholder='İade durumu ve notlar...'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>İptal</Button>
          <Button onClick={handleReturn} variant='contained' color='warning'>
            İade Et
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog
        open={extendDialog}
        onClose={() => setExtendDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Atama Süresini Uzat</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                <strong>
                  {selectedAssignment?.userId?.ad}{' '}
                  {selectedAssignment?.userId?.soyad}
                </strong>{' '}
                - {selectedAssignment?.equipmentId?.name}
                <br />
                Mevcut bitiş tarihi:{' '}
                {selectedAssignment && formatDate(selectedAssignment.expiresAt)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Uzatma Süresi (Gün)'
                type='number'
                value={extendForm.additionalDays}
                onChange={e =>
                  setExtendForm({
                    ...extendForm,
                    additionalDays: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Uzatma Nedeni'
                value={extendForm.notes}
                onChange={e =>
                  setExtendForm({ ...extendForm, notes: e.target.value })
                }
                multiline
                rows={3}
                placeholder='Süre uzatma nedeni...'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendDialog(false)}>İptal</Button>
          <Button
            onClick={handleExtend}
            variant='contained'
            disabled={
              !extendForm.additionalDays || extendForm.additionalDays < 1
            }
          >
            Uzat
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Atama Detayları</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' gutterBottom>
                  Personel Bilgileri
                </Typography>
                <Typography variant='body2'>
                  <strong>Ad Soyad:</strong> {selectedAssignment.userId?.ad}{' '}
                  {selectedAssignment.userId?.soyad}
                </Typography>
                <Typography variant='body2'>
                  <strong>Departman:</strong>{' '}
                  {selectedAssignment.userId?.departmanlar?.[0]?.ad ||
                    'Departman Yok'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' gutterBottom>
                  Ekipman Bilgileri
                </Typography>
                <Typography variant='body2'>
                  <strong>Ekipman:</strong>{' '}
                  {selectedAssignment.equipmentId?.name}
                </Typography>
                <Typography variant='body2'>
                  <strong>Kategori:</strong>{' '}
                  {selectedAssignment.equipmentId?.category}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' gutterBottom>
                  Atama Bilgileri
                </Typography>
                <Typography variant='body2'>
                  <strong>Atama Tarihi:</strong>{' '}
                  {formatDate(selectedAssignment.assignedAt)}
                </Typography>
                <Typography variant='body2'>
                  <strong>Bitiş Tarihi:</strong>{' '}
                  {formatDate(selectedAssignment.expiresAt)}
                </Typography>
                <Typography variant='body2'>
                  <strong>Durum:</strong>{' '}
                  {getStatusText(
                    selectedAssignment.status,
                    selectedAssignment.expiresAt,
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' gutterBottom>
                  Durumu
                </Typography>
                <Typography variant='body2'>
                  <strong>Kondisyon:</strong>{' '}
                  {selectedAssignment.condition === 'perfect'
                    ? 'Mükemmel'
                    : selectedAssignment.condition === 'good'
                      ? 'İyi'
                      : selectedAssignment.condition === 'fair'
                        ? 'Orta'
                        : 'Kötü'}
                </Typography>
                {selectedAssignment.returnedAt && (
                  <Typography variant='body2'>
                    <strong>İade Tarihi:</strong>{' '}
                    {formatDate(selectedAssignment.returnedAt)}
                  </Typography>
                )}
              </Grid>
              {selectedAssignment.notes && (
                <Grid item xs={12}>
                  <Typography variant='subtitle2' gutterBottom>
                    Notlar
                  </Typography>
                  <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedAssignment.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentManagement;
