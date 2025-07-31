import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { equipmentRequestAPI, equipmentAPI } from '../../services/api';

const EquipmentRequests = ({ requests, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('existing'); // 'existing' or 'custom'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [_categories, setCategories] = useState([]);
  const [_equipmentList, setEquipmentList] = useState([]);
  const [formData, setFormData] = useState({
    requestType: 'equipment',
    equipmentId: '',
    customDescription: '',
    priority: 'normal',
    justification: '',
    selectedEquipmentId: '',
  });

  const formatDate = date => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const getPriorityText = priority => {
    switch (priority) {
      case 'low':
        return 'Düşük';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Yüksek';
      case 'urgent':
        return 'Acil';
      default:
        return priority;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const requestData = {
        requestType: requestType === 'existing' ? 'equipment' : 'custom',
        priority: formData.priority,
        justification: formData.justification,
      };

      if (requestType === 'existing' && formData.selectedEquipmentId) {
        requestData.equipmentId = formData.selectedEquipmentId;
      } else if (requestType === 'custom') {
        requestData.customDescription = formData.customDescription;
      }

      await equipmentRequestAPI.createNewEquipment(requestData);

      // Form'u temizle
      setFormData({
        requestType: 'equipment',
        equipmentId: '',
        customDescription: '',
        priority: 'normal',
        justification: '',
        selectedEquipmentId: '',
      });
      setRequestType('existing');
      setSelectedCategory('');
      setOpen(false);

      // Listeyi yenile - parent component'e haber ver
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Talep oluşturulurken hata:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, equipmentRes] = await Promise.all([
        equipmentAPI.getPublicCategories(),
        equipmentAPI.getPublicEquipment(),
      ]);

      setCategories(categoriesRes.data);
      setEquipmentList(equipmentRes.data);
    } catch (error) {
      console.error('Form verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadFormData();
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      requestType: 'equipment',
      equipmentId: '',
      customDescription: '',
      priority: 'normal',
      justification: '',
      selectedEquipmentId: '',
    });
    setRequestType('existing');
    setSelectedCategory('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleViewDetails = request => {
    setSelectedRequest(request);
    setDetailDialog(true);
  };

  const getFilteredEquipment = () => {
    if (!selectedCategory || selectedCategory === 'all') {
      return _equipmentList;
    }
    return _equipmentList.filter(item => item.category === selectedCategory);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // Kategorileri ve ekipmanları yükle
        const [categoriesResponse, equipmentResponse] = await Promise.all([
          equipmentAPI.getPublicCategories(),
          equipmentAPI.getPublicEquipment(),
        ]);

        setCategories(categoriesResponse.data);
        setEquipmentList(equipmentResponse.data);
      } catch (error) {
        console.error('Form verileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Sadece component mount olduğunda çalışsın

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h6'>Ekipman Taleplerim</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Yeni Talep Oluştur
        </Button>
      </Box>

      {requests.length === 0 ? (
        <Alert severity='info'>Henüz ekipman talebiniz bulunmamaktadır.</Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Talep Türü</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Öncelik</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Talep Tarihi</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map(request => (
                <TableRow key={request._id}>
                  <TableCell>
                    {request.equipmentId ? 'Mevcut Ekipman' : 'Özel Talep'}
                  </TableCell>
                  <TableCell>
                    {request.equipmentId
                      ? request.equipmentId.name
                      : request.customDescription}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPriorityText(request.priority)}
                      size='small'
                      color={
                        request.priority === 'high' ||
                        request.priority === 'urgent'
                          ? 'error'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(request.status)}
                      color={getStatusColor(request.status)}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size='small'
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(request)}
                    >
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Yeni Talep Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>Yeni Ekipman Talebi</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Talep Türü Seçimi */}
              <FormControl component='fieldset' sx={{ mb: 3 }}>
                <Typography variant='subtitle1' sx={{ mb: 1 }}>
                  Talep Türü
                </Typography>
                <RadioGroup
                  value={requestType}
                  onChange={e => setRequestType(e.target.value)}
                  row
                >
                  <FormControlLabel
                    value='existing'
                    control={<Radio />}
                    label='Mevcut Ekipmanlardan Seç'
                  />
                  <FormControlLabel
                    value='custom'
                    control={<Radio />}
                    label='Özel Talep'
                  />
                </RadioGroup>
              </FormControl>

              {requestType === 'existing' && (
                <Box sx={{ mb: 3 }}>
                  {/* Kategori Seçimi */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      label='Kategori'
                    >
                      <MenuItem value=''>Tüm Kategoriler</MenuItem>
                      {_categories.map(category => (
                        <MenuItem key={category.name} value={category.name}>
                          {category.name} ({category.count})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Ekipman Seçimi */}
                  <Autocomplete
                    options={getFilteredEquipment()}
                    getOptionLabel={option =>
                      `${option.name} (${option.category})`
                    }
                    value={
                      _equipmentList.find(
                        item => item._id === formData.selectedEquipmentId,
                      ) || null
                    }
                    onChange={(event, newValue) => {
                      handleInputChange(
                        'selectedEquipmentId',
                        newValue ? newValue._id : '',
                      );
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Ekipman Seçin'
                        fullWidth
                        required
                      />
                    )}
                  />
                </Box>
              )}

              {requestType === 'custom' && (
                <TextField
                  fullWidth
                  label='Talep Açıklaması'
                  multiline
                  rows={3}
                  value={formData.customDescription}
                  onChange={e =>
                    handleInputChange('customDescription', e.target.value)
                  }
                  sx={{ mb: 3 }}
                  required
                />
              )}

              {/* Öncelik */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Öncelik</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={e => handleInputChange('priority', e.target.value)}
                  label='Öncelik'
                >
                  <MenuItem value='low'>Düşük</MenuItem>
                  <MenuItem value='normal'>Normal</MenuItem>
                  <MenuItem value='high'>Yüksek</MenuItem>
                  <MenuItem value='urgent'>Acil</MenuItem>
                </Select>
              </FormControl>

              {/* Gerekçe */}
              <TextField
                fullWidth
                label='Gerekçe'
                multiline
                rows={3}
                value={formData.justification}
                onChange={e =>
                  handleInputChange('justification', e.target.value)
                }
                placeholder='Neden bu ekipmana ihtiyacınız var?'
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            disabled={submitting || loading}
          >
            {submitting ? <CircularProgress size={20} /> : 'Talep Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detay Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Talep Detayları</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Talep Türü
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {selectedRequest.equipmentId ? 'Mevcut Ekipman' : 'Özel Talep'}
              </Typography>

              <Typography variant='body2' color='text.secondary' gutterBottom>
                Açıklama
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {selectedRequest.equipmentId
                  ? selectedRequest.equipmentId.name
                  : selectedRequest.customDescription}
              </Typography>

              <Typography variant='body2' color='text.secondary' gutterBottom>
                Öncelik
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {getPriorityText(selectedRequest.priority)}
              </Typography>

              <Typography variant='body2' color='text.secondary' gutterBottom>
                Durum
              </Typography>
              <Chip
                label={getStatusText(selectedRequest.status)}
                color={getStatusColor(selectedRequest.status)}
                sx={{ mb: 2 }}
              />

              <Typography variant='body2' color='text.secondary' gutterBottom>
                Talep Tarihi
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {formatDate(selectedRequest.createdAt)}
              </Typography>

              {selectedRequest.justification && (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Gerekçe
                  </Typography>
                  <Typography variant='body1' sx={{ mb: 2 }}>
                    {selectedRequest.justification}
                  </Typography>
                </>
              )}

              {selectedRequest.processedAt && (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    İşlem Tarihi
                  </Typography>
                  <Typography variant='body1' sx={{ mb: 2 }}>
                    {formatDate(selectedRequest.processedAt)}
                  </Typography>
                </>
              )}

              {selectedRequest.processedBy && (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    İşlem Yapan
                  </Typography>
                  <Typography variant='body1' sx={{ mb: 2 }}>
                    {selectedRequest.processedBy.isim}{' '}
                    {selectedRequest.processedBy.soyisim}
                  </Typography>
                </>
              )}

              {selectedRequest.notes && (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Notlar
                  </Typography>
                  <Typography variant='body1'>
                    {selectedRequest.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EquipmentRequests;
