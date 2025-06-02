import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Alert,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Divider,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI } from '../services/api';

// Component'lar
import CategoryDialog from '../components/CategoryDialog';
import ItemDialog from '../components/ItemDialog';
import FieldTemplateDialog from '../components/FieldTemplateDialog';
import ExcelUploadDialog from '../components/ExcelUploadDialog';
import DashboardCards from '../components/DashboardCards';

const Inventory = () => {
  const { hasModulePermission } = useAuth();

  // State'ler
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [fieldTemplates, setFieldTemplates] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [dashboard] = useState(null);
  const [departments] = useState([]);
  const [users] = useState([]);

  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    kategori: '',
    durum: '',
    lokasyon: '',
    sorumluKisi: '',
    etiket: '',
    arama: '',
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'olusturmaTarihi',
    direction: 'desc',
  });

  // Dialog state'leri
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [excelUploadOpen, setExcelUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // UI state'leri
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedItems, setSelectedItems] = useState([]);
  const [view, setView] = useState('table'); // table, cards, dashboard
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Durum renk haritası
  const statusColors = {
    aktif: 'success',
    bakim: 'warning',
    arizali: 'error',
    hurda: 'default',
    yedek: 'info',
    kirada: 'secondary',
  };

  // Durum icon'ları
  const statusIcons = {
    aktif: <CheckCircleIcon />,
    bakim: <BuildIcon />,
    arizali: <WarningIcon />,
    hurda: <CancelIcon />,
    yedek: <InventoryIcon />,
    kirada: <ScheduleIcon />,
  };

  // İlk yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadCategories();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Veri yükleme hatası:', error);
        }
        setError('Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const params = {
        ...filters,
        sayfa: page + 1,
        limit: rowsPerPage,
        sirala: sortConfig.field,
        yon: sortConfig.direction,
      };

      // Boş filtreleri temizle
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await inventoryAPI.getItems(params);
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Envanter öğeleri yükleme hatası:', error);
      }
      setError('Envanter öğeleri yüklenirken hata oluştu');
    }
  }, [filters, page, rowsPerPage, sortConfig]);

  // Filtreleme ve sıralama değiştiğinde
  useEffect(() => {
    if (categories.length > 0) {
      loadItems();
    }
  }, [filters, sortConfig, page, rowsPerPage, categories.length, loadItems]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(0); // Filtreleme yapıldığında ilk sayfaya dön
  };

  const handleSort = field => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectItem = itemId => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId],
    );
  };

  const handleSelectAll = event => {
    if (event.target.checked) {
      setSelectedItems(items.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Excel işlemleri
  const handleExcelTemplateDownload = async categoryId => {
    if (!categoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    try {
      setActionLoading(true);
      const response = await inventoryAPI.downloadExcelTemplate(categoryId);

      // Blob'u dosya olarak indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const category = categories.find(c => c._id === categoryId);
      const fileName = `envanter_template_${category?.ad.replace(/[^a-zA-Z0-9]/g, '_') || 'kategori'}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`Excel şablonu başarıyla indirildi: ${fileName}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Excel şablon indirme hatası:', error);
      }

      let errorMessage = 'Excel şablonu indirilirken hata oluştu';
      if (error.response?.status === 404) {
        errorMessage = 'Kategori bulunamadı';
      } else if (error.response?.status === 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcelExport = async categoryId => {
    if (!categoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    try {
      setActionLoading(true);
      const response = await inventoryAPI.exportExcel(categoryId);

      // Blob'u dosya olarak indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const category = categories.find(c => c._id === categoryId);
      const today = new Date().toISOString().split('T')[0];
      const fileName = `envanter_${category?.ad.replace(/[^a-zA-Z0-9]/g, '_') || 'kategori'}_${today}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`Envanter verileri başarıyla export edildi: ${fileName}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Excel export hatası:', error);
      }

      let errorMessage = 'Excel export edilirken hata oluştu';
      if (error.response?.status === 404) {
        errorMessage = 'Kategori bulunamadı';
      } else if (error.response?.status === 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Dialog işlemleri
  const handleCategoryCreate = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleCategoryEdit = category => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const loadCategories = async () => {
    try {
      const response = await inventoryAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Kategoriler yükleme hatası:', error);
      }
      setError('Kategoriler yüklenirken hata oluştu');
    }
  };

  const handleCategoryDelete = async categoryId => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.deleteCategory(categoryId);
      setSuccess('Kategori başarıyla silindi');
      await loadCategories();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Kategori silme hatası:', error);
      }
      setError(error.response?.data?.message || 'Kategori silinirken hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  const loadFieldTemplates = async categoryId => {
    if (!categoryId) {
      setFieldTemplates([]);
      return;
    }

    try {
      const response = await inventoryAPI.getCategoryFields(categoryId);
      setFieldTemplates(response.data.fields || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Field template yükleme hatası:', error);
      }
      setFieldTemplates([]);
    }
  };

  const handleItemCreate = async () => {
    if (categories.length === 0) {
      setError('Önce en az bir kategori oluşturmalısınız');
      return;
    }
    setSelectedItem(null);
    setFieldTemplates([]);
    setItemDialogOpen(true);
  };

  const handleItemEdit = async item => {
    setSelectedItem(item);
    if (item.kategoriId) {
      await loadFieldTemplates(item.kategoriId);
    }
    setItemDialogOpen(true);
  };

  const handleItemDelete = async itemId => {
    if (!window.confirm('Bu envanter öğesini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.deleteItem(itemId);
      setSuccess('Envanter öğesi başarıyla silindi');
      await loadItems();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Envanter öğesi silme hatası:', error);
      }
      setError(error.response?.data?.message || 'Envanter öğesi silinirken hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFieldTemplateManagement = category => {
    setSelectedCategory(category);
    setFieldDialogOpen(true);
  };

  // Toplu işlemler
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      setError('Lütfen silinecek öğeleri seçin');
      return;
    }

    if (!window.confirm(`${selectedItems.length} öğeyi silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await Promise.all(selectedItems.map(id => inventoryAPI.deleteItem(id)));
      setSuccess(`${selectedItems.length} öğe başarıyla silindi`);
      setSelectedItems([]);
      await loadItems();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Toplu silme hatası:', error);
      }
      setError('Toplu silme işleminde hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  // Yetki kontrolleri
  const canEdit = hasModulePermission('Envanter Yönetimi', 'duzenleyebilir');
  const canView = hasModulePermission('Envanter Yönetimi');

  if (!canView) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz yok.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Backdrop Loading */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        open={actionLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Başlık ve Ana Kontroller */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <InventoryIcon sx={{ mr: 2, verticalAlign: 'middle', color: '#1976d2' }} />
            Envanter Yönetimi
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Ekipman ve envanter kayıtlarınızı yönetin
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Görünüm Seçici */}
          <Button
            variant={view === 'dashboard' ? 'contained' : 'outlined'}
            startIcon={<DashboardIcon />}
            onClick={() => setView('dashboard')}
            size="small"
          >
            Dashboard
          </Button>
          <Button
            variant={view === 'table' ? 'contained' : 'outlined'}
            startIcon={<InventoryIcon />}
            onClick={() => setView('table')}
            size="small"
          >
            Tablo
          </Button>
        </Box>
      </Box>

      {/* Alert'ler */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Dashboard Görünümü */}
      {view === 'dashboard' && (
        <DashboardCards
          dashboard={dashboard}
          categories={categories}
          onCategoryEdit={handleCategoryEdit}
          onCategoryDelete={handleCategoryDelete}
          onCategoryCreate={handleCategoryCreate}
          onFieldTemplateManagement={handleFieldTemplateManagement}
          onExcelTemplateDownload={handleExcelTemplateDownload}
          onExcelExport={handleExcelExport}
          canEdit={canEdit}
          loading={loading}
        />
      )}

      {/* Tablo Görünümü */}
      {view === 'table' && (
        <>
          {/* Filtreleme Araçları */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ara..."
                    value={filters.arama}
                    onChange={e => handleFilterChange('arama', e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={filters.kategori}
                      onChange={e => handleFilterChange('kategori', e.target.value)}
                      label="Kategori"
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      {categories.map(category => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.ad}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={filters.durum}
                      onChange={e => handleFilterChange('durum', e.target.value)}
                      label="Durum"
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      <MenuItem value="aktif">Aktif</MenuItem>
                      <MenuItem value="bakim">Bakımda</MenuItem>
                      <MenuItem value="arizali">Arızalı</MenuItem>
                      <MenuItem value="hurda">Hurda</MenuItem>
                      <MenuItem value="yedek">Yedek</MenuItem>
                      <MenuItem value="kirada">Kirada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Lokasyon"
                    value={filters.lokasyon}
                    onChange={e => handleFilterChange('lokasyon', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sorumlu</InputLabel>
                    <Select
                      value={filters.sorumluKisi}
                      onChange={e => handleFilterChange('sorumluKisi', e.target.value)}
                      label="Sorumlu"
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      {users.map(user => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.ad} {user.soyad}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => {
                      setFilters({
                        kategori: '',
                        durum: '',
                        lokasyon: '',
                        sorumluKisi: '',
                        etiket: '',
                        arama: '',
                      });
                    }}
                    size="small"
                  >
                    Temizle
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tablo */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              {/* Tablo Başlığı ve Toplu İşlemler */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="h6">Envanter Listesi ({pagination.totalItems})</Typography>
                  {selectedItems.length > 0 && (
                    <Typography variant="body2" color="primary">
                      {selectedItems.length} öğe seçildi
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedItems.length > 0 && canEdit && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleBulkDelete}
                      size="small"
                    >
                      Seçilenleri Sil
                    </Button>
                  )}
                </Box>
              </Box>

              <Divider />

              {loading ? (
                <Box sx={{ p: 3 }}>
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} variant="text" height={60} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              indeterminate={
                                selectedItems.length > 0 && selectedItems.length < items.length
                              }
                              checked={items.length > 0 && selectedItems.length === items.length}
                              onChange={handleSelectAll}
                            />
                          </TableCell>

                          <TableCell>
                            <TableSortLabel
                              active={sortConfig.field === 'envanterKodu'}
                              direction={sortConfig.direction}
                              onClick={() => handleSort('envanterKodu')}
                            >
                              Envanter Kodu
                            </TableSortLabel>
                          </TableCell>

                          <TableCell>
                            <TableSortLabel
                              active={sortConfig.field === 'ad'}
                              direction={sortConfig.direction}
                              onClick={() => handleSort('ad')}
                            >
                              Ad
                            </TableSortLabel>
                          </TableCell>

                          <TableCell>Kategori</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell>Lokasyon</TableCell>
                          <TableCell>Sorumlu</TableCell>

                          <TableCell>
                            <TableSortLabel
                              active={sortConfig.field === 'guncelDeger'}
                              direction={sortConfig.direction}
                              onClick={() => handleSort('guncelDeger')}
                            >
                              Değer
                            </TableSortLabel>
                          </TableCell>

                          <TableCell>
                            <TableSortLabel
                              active={sortConfig.field === 'olusturmaTarihi'}
                              direction={sortConfig.direction}
                              onClick={() => handleSort('olusturmaTarihi')}
                            >
                              Oluşturma
                            </TableSortLabel>
                          </TableCell>

                          <TableCell align="center">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {items.map(item => (
                          <TableRow
                            key={item._id}
                            hover
                            selected={selectedItems.includes(item._id)}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedItems.includes(item._id)}
                                onChange={() => handleSelectItem(item._id)}
                              />
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.envanterKodu}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.ad}
                                </Typography>
                                {item.aciklama && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.aciklama.length > 50
                                      ? item.aciklama.substring(0, 50) + '...'
                                      : item.aciklama}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>

                            <TableCell>
                              {item.kategoriId && (
                                <Chip
                                  label={item.kategoriId.ad}
                                  size="small"
                                  sx={{
                                    backgroundColor: item.kategoriId.renk + '20',
                                    color: item.kategoriId.renk,
                                    border: `1px solid ${item.kategoriId.renk}40`,
                                  }}
                                />
                              )}
                            </TableCell>

                            <TableCell>
                              <Chip
                                icon={statusIcons[item.durum]}
                                label={item.durum.charAt(0).toUpperCase() + item.durum.slice(1)}
                                color={statusColors[item.durum]}
                                size="small"
                              />
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">{item.lokasyon || '-'}</Typography>
                            </TableCell>

                            <TableCell>
                              {item.sorumluKisi ? (
                                <Typography variant="body2">
                                  {item.sorumluKisi.ad} {item.sorumluKisi.soyad}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.guncelDeger ? `₺${item.guncelDeger.toLocaleString()}` : '-'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">
                                {new Date(item.olusturmaTarihi).toLocaleDateString('tr-TR')}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Görüntüle">
                                  <IconButton size="small" onClick={() => handleItemEdit(item)}>
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {canEdit && (
                                  <>
                                    <Tooltip title="Düzenle">
                                      <IconButton size="small" onClick={() => handleItemEdit(item)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Sil">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleItemDelete(item._id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}

                        {items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                              <Typography variant="h6" color="text.secondary">
                                Envanter öğesi bulunamadı
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Filtreleri temizleyerek tekrar deneyin veya yeni envanter ekleyin
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={pagination.totalItems}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    labelRowsPerPage="Sayfa başına:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Speed Dial - Floating Action Button */}
      {canEdit && (
        <SpeedDial
          ariaLabel="Envanter İşlemleri"
          sx={{ position: 'fixed', bottom: 80, right: 32 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            key="add-item"
            icon={<AddIcon />}
            tooltipTitle="Yeni Envanter Ekle"
            onClick={handleItemCreate}
          />
          <SpeedDialAction
            key="add-category"
            icon={<CategoryIcon />}
            tooltipTitle="Kategori Yönetimi"
            onClick={handleCategoryCreate}
          />
          <SpeedDialAction
            key="excel-upload"
            icon={<UploadIcon />}
            tooltipTitle="Excel Yükle"
            onClick={() => setExcelUploadOpen(true)}
          />
        </SpeedDial>
      )}

      {/* Dialog'lar */}
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        category={selectedCategory}
        onSave={async categoryData => {
          if (selectedCategory) {
            await inventoryAPI.updateCategory(selectedCategory._id, categoryData);
          } else {
            await inventoryAPI.createCategory(categoryData);
          }
          await loadCategories();
          setSuccess(selectedCategory ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
        }}
      />

      <ItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        item={selectedItem}
        categories={categories}
        fieldTemplates={fieldTemplates}
        departments={departments}
        users={users}
        onCategoryChange={loadFieldTemplates}
        onSave={async itemData => {
          if (selectedItem) {
            await inventoryAPI.updateItem(selectedItem._id, itemData);
          } else {
            await inventoryAPI.createItem(itemData);
          }
          await loadItems();
          setSuccess(selectedItem ? 'Envanter güncellendi' : 'Envanter oluşturuldu');
        }}
      />

      <FieldTemplateDialog
        open={fieldDialogOpen}
        onClose={() => setFieldDialogOpen(false)}
        category={selectedCategory}
        categories={categories}
        onSave={async fieldData => {
          try {
            setActionLoading(true);
            await inventoryAPI.createCategoryField(selectedCategory._id, fieldData);
            setSuccess('Alan şablonu başarıyla oluşturuldu');
            // Seçili kategorinin field template'lerini yeniden yükle
            if (selectedCategory) {
              await loadFieldTemplates(selectedCategory._id);
            }
          } catch (error) {
            setError(error.response?.data?.message || 'Alan şablonu oluşturulurken hata oluştu');
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <ExcelUploadDialog
        open={excelUploadOpen}
        onClose={() => setExcelUploadOpen(false)}
        categories={categories}
        onUploadSuccess={result => {
          setSuccess(
            `${result.basariliSayisi} öğe başarıyla yüklendi. ${result.hataSayisi} hata oluştu.`,
          );
          // Verileri yeniden yükle
          loadCategories();
        }}
      />
    </Container>
  );
};

export default Inventory;
