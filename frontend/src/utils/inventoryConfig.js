// Durum renk haritası
export const STATUS_COLORS = {
  aktif: 'success',
  bakim: 'warning',
  arizali: 'error',
  hurda: 'default',
  yedek: 'info',
  kirada: 'secondary',
};

// Durum icon isimleri (JSX olmadan)
export const STATUS_ICON_NAMES = {
  aktif: 'CheckCircle',
  bakim: 'Build',
  arizali: 'Warning',
  hurda: 'Cancel',
  yedek: 'Inventory',
  kirada: 'Schedule',
};

// Durum çevirileri
export const STATUS_LABELS = {
  aktif: 'Aktif',
  bakim: 'Bakımda',
  arizali: 'Arızalı',
  hurda: 'Hurda',
  yedek: 'Yedek',
  kirada: 'Kirada',
};

// Durum seçenekleri
export const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'bakim', label: 'Bakımda' },
  { value: 'arizali', label: 'Arızalı' },
  { value: 'hurda', label: 'Hurda' },
  { value: 'yedek', label: 'Yedek' },
  { value: 'kirada', label: 'Kirada' },
];

// Sayfa başına satır seçenekleri
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Tablo sütun konfigürasyonu
export const TABLE_COLUMNS = [
  { id: 'envanterKodu', label: 'Envanter Kodu', sortable: true },
  { id: 'ad', label: 'Ad', sortable: true },
  { id: 'kategori', label: 'Kategori', sortable: false },
  { id: 'durum', label: 'Durum', sortable: false },
  { id: 'lokasyon', label: 'Lokasyon', sortable: false },
  { id: 'sorumlu', label: 'Sorumlu', sortable: false },
  { id: 'guncelDeger', label: 'Değer', sortable: true },
  { id: 'olusturmaTarihi', label: 'Oluşturma', sortable: true },
  { id: 'actions', label: 'İşlemler', sortable: false },
];

// Utility functions
export const formatCurrency = amount => {
  if (!amount) {
    return '-';
  }
  return `₺${amount.toLocaleString()}`;
};

export const formatDate = date => {
  if (!date) {
    return '-';
  }
  return new Date(date).toLocaleDateString('tr-TR');
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) {
    return '-';
  }
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const getStatusLabel = status => {
  return STATUS_LABELS[status] || status;
};

export const getStatusColor = status => {
  return STATUS_COLORS[status] || 'default';
};

export const getStatusIconName = status => {
  return STATUS_ICON_NAMES[status] || 'Inventory';
};

// Excel dosya adı oluşturma
export const generateExcelFileName = (categoryName, type = 'export') => {
  const sanitizedName =
    categoryName?.replace(/[^a-zA-Z0-9]/g, '_') || 'kategori';
  const today = new Date().toISOString().split('T')[0];

  if (type === 'template') {
    return `envanter_template_${sanitizedName}.xlsx`;
  }

  return `envanter_${sanitizedName}_${today}.xlsx`;
};

// Filtre temizleme
export const INITIAL_FILTERS = {
  kategori: '',
  durum: '',
  lokasyon: '',
  sorumluKisi: '',
  etiket: '',
  arama: '',
};

// Sıralama konfigürasyonu
export const INITIAL_SORT_CONFIG = {
  field: 'olusturmaTarihi',
  direction: 'desc',
};
