import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
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
  Avatar,
  Alert,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneIcon,
  DirectionsCar as CarIcon,
  Checkroom as ClotesIcon,
  Build as ToolIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { equipmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const categoryIcons = {
  Bilgisayar: <ComputerIcon />,
  Telefon: <PhoneIcon />,
  Araç: <CarIcon />,
  Kıyafet: <ClotesIcon />,
  Donanım: <ToolIcon />,
  Diğer: <CategoryIcon />,
};

const categoryColors = {
  Bilgisayar: '#2196F3',
  Telefon: '#4CAF50',
  Araç: '#FF9800',
  Kıyafet: '#9C27B0',
  Donanım: '#F44336',
  Diğer: '#607D8B',
};

const EquipmentManagement = ({ onSuccess }) => {
  const { hasModulePermission } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultUsagePeriodDays: 30,
    category: '',
    imageUrl: '',
    isActive: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [equipmentRes, categoriesRes] = await Promise.all([
        equipmentAPI.getAll(filters),
        equipmentAPI.getCategories(),
      ]);

      setEquipment(equipmentRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Veriler yüklenirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      defaultUsagePeriodDays: 30,
      category: '',
      imageUrl: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = item => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      defaultUsagePeriodDays: item.defaultUsagePeriodDays,
      category: item.category,
      imageUrl: item.imageUrl || '',
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await equipmentAPI.update(editingItem._id, formData);
        if (onSuccess) {
          onSuccess('Ekipman başarıyla güncellendi', 'success');
        }
      } else {
        await equipmentAPI.create(formData);
        if (onSuccess) {
          onSuccess('Ekipman başarıyla oluşturuldu', 'success');
        }
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      if (onSuccess) {
        onSuccess(
          err.response?.data?.message || 'İşlem sırasında hata oluştu',
          'error',
        );
      }
    }
  };

  const handleDelete = async item => {
    if (
      window.confirm(
        `"${item.name}" ekipmanını silmek istediğinizden emin misiniz?`,
      )
    ) {
      try {
        await equipmentAPI.delete(item._id);
        if (onSuccess) {
          onSuccess('Ekipman başarıyla silindi', 'success');
        }
        loadData();
      } catch (err) {
        if (onSuccess) {
          onSuccess(
            err.response?.data?.message || 'Silme işlemi sırasında hata oluştu',
            'error',
          );
        }
      }
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!hasModulePermission('Ekipman Yönetimi')) {
    return (
      <Alert severity='warning'>
        Ekipman yönetimi sayfasını görüntüleme yetkisine sahip değilsiniz.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header and Filters */}
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
            Ekipman Tanıtımı
          </Typography>
          {hasModulePermission('Ekipman Yönetimi', 'duzenleyebilir') && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              Yeni Ekipman Ekle
            </Button>
          )}
        </Box>

        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size='small'
              label='Ekipman Ara'
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size='small'>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={filters.category}
                onChange={e => handleFilterChange('category', e.target.value)}
                label='Kategori'
              >
                <MenuItem value='all'>Tüm Kategoriler</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size='small'>
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                label='Durum'
              >
                <MenuItem value='all'>Tüm Durumlar</MenuItem>
                <MenuItem value='active'>Aktif</MenuItem>
                <MenuItem value='inactive'>Pasif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Equipment Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Yükleniyor...</Typography>
        </Box>
      ) : error ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Ekipman</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Kullanım Süresi
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Aktif Atama</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Oluşturan</TableCell>
                {hasModulePermission('Ekipman Yönetimi', 'duzenleyebilir') && (
                  <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map(item => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: categoryColors[item.category],
                          width: 40,
                          height: 40,
                        }}
                      >
                        {categoryIcons[item.category] || <CategoryIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant='subtitle2' fontWeight='bold'>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant='body2' color='text.secondary'>
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.category}
                      size='small'
                      sx={{
                        bgcolor: categoryColors[item.category],
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {item.defaultUsagePeriodDays} gün
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${item.totalAssigned || 0} adet`}
                      size='small'
                      color={item.totalAssigned > 0 ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isActive ? 'Aktif' : 'Pasif'}
                      size='small'
                      color={item.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {item.createdBy?.isim} {item.createdBy?.soyisim}
                    </Typography>
                  </TableCell>
                  {hasModulePermission(
                    'Ekipman Yönetimi',
                    'duzenleyebilir',
                  ) && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title='Düzenle'>
                          <IconButton
                            size='small'
                            onClick={() => handleEdit(item)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Sil'>
                          <IconButton
                            size='small'
                            onClick={() => handleDelete(item)}
                            color='error'
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Ekipman Düzenle' : 'Yeni Ekipman Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Ekipman Adı'
                value={formData.name}
                onChange={e => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category}
                  onChange={e => handleFormChange('category', e.target.value)}
                  label='Kategori'
                >
                  {Object.keys(categoryIcons).map(category => (
                    <MenuItem key={category} value={category}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {categoryIcons[category]}
                        {category}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama'
                value={formData.description}
                onChange={e => handleFormChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Standart Kullanım Süresi (Gün)'
                type='number'
                value={formData.defaultUsagePeriodDays}
                onChange={e =>
                  handleFormChange(
                    'defaultUsagePeriodDays',
                    parseInt(e.target.value),
                  )
                }
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Resim URL (Opsiyonel)'
                value={formData.imageUrl}
                onChange={e => handleFormChange('imageUrl', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e =>
                      handleFormChange('isActive', e.target.checked)
                    }
                  />
                }
                label='Aktif'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            onClick={handleSave}
            variant='contained'
            disabled={!formData.name || !formData.category}
          >
            {editingItem ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipmentManagement;
