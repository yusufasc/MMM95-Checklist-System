import { useCallback, useEffect, useState } from 'react';
import { inventoryAPI } from '../services/api';

export const useInventoryData = () => {
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

  // UI state'leri
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedItems, setSelectedItems] = useState([]);
  const [view, setView] = useState('table');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Categories API
  const loadCategories = useCallback(async () => {
    try {
      console.log('🔄 Categories API çağrılıyor...');
      const response = await inventoryAPI.getCategories();
      console.log('✅ Categories API yanıt:', response.data.length, 'kategori');
      setCategories(response.data);
    } catch (error) {
      console.error('❌ Categories API hatası:', error);
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Kategoriler yükleme hatası:', error);
      }
      setError('Kategoriler yüklenirken hata oluştu');
    }
  }, []);

  // Items API
  const loadItems = useCallback(async () => {
    try {
      // Frontend-Backend parameter mapping fix
      const params = {
        kategoriId: filters.kategori, // kategori -> kategoriId
        search: filters.arama, // arama -> search
        durum: filters.durum,
        lokasyon: filters.lokasyon,
        sorumluKisi: filters.sorumluKisi,
        sayfa: page + 1,
        limit: rowsPerPage,
        sirala: sortConfig.field,
        yon: sortConfig.direction,
      };

      // Boş filtreleri temizle
      Object.keys(params).forEach(key => {
        if (
          params[key] === '' ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      console.log('🔄 Items API çağrılıyor, params:', params);
      const response = await inventoryAPI.getItems(params);
      console.log(
        '✅ Items API yanıt:',
        response.data.items?.length || 0,
        'item',
      );
      console.log('📋 Pagination:', response.data.pagination);
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('❌ Items API hatası:', error);
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Envanter öğeleri yükleme hatası:', error);
      }
      setError('Envanter öğeleri yüklenirken hata oluştu');
    }
  }, [filters, page, rowsPerPage, sortConfig]);

  // Field Templates API
  const loadFieldTemplates = useCallback(async categoryId => {
    console.log(
      '🚀 ENTERED loadFieldTemplates function with categoryId:',
      categoryId,
    );
    console.log('🔍 CategoryId type:', typeof categoryId);
    console.log('🔍 CategoryId value:', categoryId);

    if (!categoryId) {
      console.log('❌ No categoryId provided to loadFieldTemplates');
      setFieldTemplates([]);
      return;
    }

    try {
      console.log('🔧 Loading field templates for categoryId:', categoryId);
      console.log(
        '🌐 Making API call to:',
        `/api/inventory/categories/${categoryId}/fields`,
      );

      const response = await inventoryAPI.getCategoryFields(categoryId);

      console.log('✅ Field templates response received');
      console.log('📊 Response status:', response.status);
      console.log('📦 Response data:', response.data);
      console.log('🔢 Templates count:', response.data?.length || 0);

      if (response.data && response.data.length > 0) {
        console.log('🔍 First template:', response.data[0]);
        console.log('🔍 Sample template fields:', {
          ad: response.data[0]?.ad,
          tip: response.data[0]?.tip,
          gerekli: response.data[0]?.gerekli,
          kategoriId: response.data[0]?.kategoriId,
        });
      }

      setFieldTemplates(response.data || []); // response.data direkt array
    } catch (error) {
      console.error('❌ Field template yükleme hatası:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });

      if (error.response?.status === 404) {
        console.error(
          "🚫 Endpoint bulunamadı - backend'de /categories/:id/fields endpoint'i eksik olabilir",
        );
      }

      setFieldTemplates([]);
    }
  }, []);

  // İlk yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadCategories();
      } catch (error) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.error('Veri yükleme hatası:', error);
        }
        setError('Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadCategories]);

  // Filtreleme ve sıralama değiştiğinde
  useEffect(() => {
    if (categories.length > 0) {
      loadItems();
    }
  }, [filters, sortConfig, page, rowsPerPage, categories.length, loadItems]);

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      kategori: '',
      durum: '',
      lokasyon: '',
      sorumluKisi: '',
      etiket: '',
      arama: '',
    });
  };

  // Sort handlers
  const handleSort = field => {
    setSortConfig(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Pagination handlers
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Selection handlers
  const handleSelectItem = itemId => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleSelectAll = event => {
    if (event.target.checked) {
      setSelectedItems(items.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Category CRUD operations
  const createCategory = async categoryData => {
    try {
      setActionLoading(true);
      await inventoryAPI.createCategory(categoryData);
      await loadCategories();
      setSuccess('Kategori oluşturuldu');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Kategori oluşturulurken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    try {
      setActionLoading(true);
      await inventoryAPI.updateCategory(categoryId, categoryData);
      await loadCategories();
      setSuccess('Kategori güncellendi');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Kategori güncellenirken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCategory = async categoryId => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.deleteCategory(categoryId);
      setSuccess('Kategori başarıyla silindi');
      await loadCategories();
    } catch (error) {
      setError(
        error.response?.data?.message || 'Kategori silinirken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Item CRUD operations
  const createItem = async itemData => {
    try {
      setActionLoading(true);
      await inventoryAPI.createItem(itemData);
      await loadItems();
      setSuccess('Envanter oluşturuldu');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Envanter oluşturulurken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateItem = async (itemId, itemData) => {
    try {
      setActionLoading(true);
      await inventoryAPI.updateItem(itemId, itemData);
      await loadItems();
      setSuccess('Envanter güncellendi');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Envanter güncellenirken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteItem = async itemId => {
    if (
      !window.confirm('Bu envanter öğesini silmek istediğinizden emin misiniz?')
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.deleteItem(itemId);
      setSuccess('Envanter öğesi başarıyla silindi');
      await loadItems();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Envanter öğesi silinirken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      setError('Lütfen silinecek öğeleri seçin');
      return;
    }

    if (
      !window.confirm(
        `${selectedItems.length} öğeyi silmek istediğinizden emin misiniz?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await Promise.all(selectedItems.map(id => inventoryAPI.deleteItem(id)));
      setSuccess(`${selectedItems.length} öğe başarıyla silindi`);
      setSelectedItems([]);
      await loadItems();
    } catch (error) {
      setError('Toplu silme işleminde hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  // Excel operations
  const downloadExcelTemplate = async categoryId => {
    if (!categoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    try {
      setActionLoading(true);

      // Direkt indirme linki oluştur
      const category = categories.find(c => c._id === categoryId);
      const fileName = `envanter_template_${category?.ad.replace(/[^a-zA-Z0-9]/g, '_') || 'kategori'}.xlsx`;

      // Yeni pencerede aç - /api kısmı REACT_APP_API_URL'de zaten var
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/inventory/categories/${categoryId}/excel-template`;

      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }

      // Fetch ile indirme
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Blob oluştur ve indir
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`Excel şablonu başarıyla indirildi: ${fileName}`);
    } catch (error) {
      let errorMessage = 'Excel şablonu indirilirken hata oluştu';
      if (error.message.includes('404')) {
        errorMessage = 'Kategori bulunamadı';
      } else if (error.message.includes('500')) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (
        error.message.includes('401') ||
        error.message.includes('403')
      ) {
        errorMessage = 'Bu işlem için yetkiniz yok';
      } else {
        errorMessage = error.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const exportExcel = async categoryId => {
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

  // Field Template operations
  const createFieldTemplate = async (categoryId, fieldData) => {
    try {
      setActionLoading(true);
      await inventoryAPI.createCategoryField(categoryId, fieldData);
      setSuccess('Alan şablonu başarıyla oluşturuldu');
      await loadFieldTemplates(categoryId);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Alan şablonu oluşturulurken hata oluştu',
      );
    } finally {
      setActionLoading(false);
    }
  };

  return {
    // State
    loading,
    categories,
    items,
    fieldTemplates,
    pagination,
    dashboard,
    departments,
    users,
    filters,
    sortConfig,
    page,
    rowsPerPage,
    selectedItems,
    view,
    error,
    success,
    actionLoading,

    // Setters
    setView,
    setError,
    setSuccess,

    // Data loading
    loadCategories,
    loadItems,
    loadFieldTemplates,

    // Filter handlers
    handleFilterChange,
    clearFilters,

    // Sort handlers
    handleSort,

    // Pagination handlers
    handlePageChange,
    handleRowsPerPageChange,

    // Selection handlers
    handleSelectItem,
    handleSelectAll,

    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,

    // Item operations
    createItem,
    updateItem,
    deleteItem,
    handleBulkDelete,

    // Excel operations
    downloadExcelTemplate,
    exportExcel,

    // Field Template operations
    createFieldTemplate,
  };
};
