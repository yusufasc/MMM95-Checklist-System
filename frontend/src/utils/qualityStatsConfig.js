// Time filter options
export const TIME_FILTER_OPTIONS = [
  { value: '7days', label: 'Son 7 Gün' },
  { value: '30days', label: 'Son 30 Gün' },
  { value: '90days', label: 'Son 3 Ay' },
  { value: '1year', label: 'Son 1 Yıl' },
];

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 90,
  VERY_GOOD: 75,
  GOOD: 60,
};

// Performance colors
export const PERFORMANCE_COLORS = {
  EXCELLENT: '#4caf50',
  VERY_GOOD: '#2196f3',
  GOOD: '#ff9800',
  NEEDS_IMPROVEMENT: '#f44336',
};

// Performance labels
export const PERFORMANCE_LABELS = {
  EXCELLENT: 'Mükemmel',
  VERY_GOOD: 'Çok İyi',
  GOOD: 'İyi',
  NEEDS_IMPROVEMENT: 'Geliştirilmeli',
};

// Table pagination options
export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

// Default pagination
export const DEFAULT_ROWS_PER_PAGE = 10;

// Utility functions
export const getPerformanceColor = score => {
  if (score >= PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return PERFORMANCE_COLORS.EXCELLENT;
  }
  if (score >= PERFORMANCE_THRESHOLDS.VERY_GOOD) {
    return PERFORMANCE_COLORS.VERY_GOOD;
  }
  if (score >= PERFORMANCE_THRESHOLDS.GOOD) {
    return PERFORMANCE_COLORS.GOOD;
  }
  return PERFORMANCE_COLORS.NEEDS_IMPROVEMENT;
};

export const getPerformanceLabel = score => {
  if (score >= PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return PERFORMANCE_LABELS.EXCELLENT;
  }
  if (score >= PERFORMANCE_THRESHOLDS.VERY_GOOD) {
    return PERFORMANCE_LABELS.VERY_GOOD;
  }
  if (score >= PERFORMANCE_THRESHOLDS.GOOD) {
    return PERFORMANCE_LABELS.GOOD;
  }
  return PERFORMANCE_LABELS.NEEDS_IMPROVEMENT;
};

export const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = dateString => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatPercentage = value => {
  return `${Math.round(value || 0)}%`;
};

export const formatScore = (current, maximum) => {
  return `${current}/${maximum}`;
};

// Statistics card configurations
export const STATS_CARD_CONFIGS = [
  {
    key: 'toplamDegerlendirme',
    title: 'Toplam Değerlendirme',
    icon: 'Assessment',
    color: 'primary',
    formatter: value => value || 0,
  },
  {
    key: 'ortalamaBasariYuzdesi',
    title: 'Ortalama Başarı',
    icon: 'TrendingUp',
    color: 'success',
    formatter: value => formatPercentage(value),
  },
  {
    key: 'enIyiPerformansCount',
    title: 'Değerlendirilen Çalışan',
    icon: 'People',
    color: 'info',
    formatter: (value, statistics) => statistics.enIyiPerformans?.length || 0,
  },
  {
    key: 'filtrelenenKayit',
    title: 'Filtrelenen Kayıt',
    icon: 'CheckCircle',
    color: 'warning',
    formatter: (value, statistics, evaluations) => evaluations?.length || 0,
  },
];

// Table column configurations
export const TABLE_COLUMNS = [
  { id: 'tarih', label: 'Tarih', sortable: true, minWidth: 140 },
  {
    id: 'degerlendirilen',
    label: 'Değerlendirilen',
    sortable: true,
    minWidth: 160,
  },
  {
    id: 'degerlendiren',
    label: 'Değerlendiren',
    sortable: true,
    minWidth: 160,
  },
  { id: 'sablon', label: 'Şablon', sortable: false, minWidth: 140 },
  { id: 'makina', label: 'Makina', sortable: false, minWidth: 160 },
  { id: 'puan', label: 'Puan', sortable: true, minWidth: 80 },
  { id: 'basari', label: 'Başarı %', sortable: true, minWidth: 100 },
  { id: 'durum', label: 'Durum', sortable: false, minWidth: 120 },
  {
    id: 'detay',
    label: 'Detay',
    sortable: false,
    minWidth: 80,
    align: 'center',
  },
];

// Top performers medal configurations
export const MEDAL_CONFIGS = [
  {
    position: 1,
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    color: '#333',
    medal: '🥇',
  },
  {
    position: 2,
    background: 'linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%)',
    color: '#333',
    medal: '🥈',
  },
  {
    position: 3,
    background: 'linear-gradient(135deg, #cd7f32 0%, #daa520 100%)',
    color: 'white',
    medal: '🥉',
  },
];

// Status chip configurations
export const STATUS_CHIP_CONFIGS = {
  Tamamlandı: {
    color: 'success',
    variant: 'outlined',
  },
  'Devam Ediyor': {
    color: 'warning',
    variant: 'outlined',
  },
  İptal: {
    color: 'error',
    variant: 'outlined',
  },
  default: {
    color: 'default',
    variant: 'outlined',
  },
};

export const getStatusChipConfig = status => {
  return STATUS_CHIP_CONFIGS[status] || STATUS_CHIP_CONFIGS.default;
};

// Default empty states
export const EMPTY_STATISTICS = {
  toplamDegerlendirme: 0,
  ortalamaBasariYuzdesi: 0,
  rolBazliIstatistikler: [],
  enIyiPerformans: [],
};

export const EMPTY_FILTERS = {
  kullanici: '',
  tarihBaslangic: '',
  tarihBitis: '',
  durum: '',
};
