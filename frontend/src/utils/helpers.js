import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PERFORMANCE_LEVELS,
  PERIOD_LABELS,
  CHECKLIST_TYPE_LABELS,
} from './constants';

/**
 * Görev durumuna göre etiket döndürür
 * @param {string} status - Görev durumu
 * @returns {string} - Türkçe etiket
 */
export const getTaskStatusLabel = status => {
  return TASK_STATUS_LABELS[status] || status;
};

/**
 * Görev durumuna göre renk döndürür
 * @param {string} status - Görev durumu
 * @returns {string} - MUI color
 */
export const getTaskStatusColor = status => {
  return TASK_STATUS_COLORS[status] || 'default';
};

/**
 * Performans puanına göre seviye döndürür
 * @param {number} score - Performans puanı
 * @returns {object} - Performans seviyesi bilgisi
 */
export const getPerformanceLevel = score => {
  if (score >= PERFORMANCE_LEVELS.EXCELLENT.min) {
    return PERFORMANCE_LEVELS.EXCELLENT;
  }
  if (score >= PERFORMANCE_LEVELS.VERY_GOOD.min) {
    return PERFORMANCE_LEVELS.VERY_GOOD;
  }
  if (score >= PERFORMANCE_LEVELS.GOOD.min) {
    return PERFORMANCE_LEVELS.GOOD;
  }
  if (score >= PERFORMANCE_LEVELS.AVERAGE.min) {
    return PERFORMANCE_LEVELS.AVERAGE;
  }
  return PERFORMANCE_LEVELS.NEEDS_IMPROVEMENT;
};

/**
 * Performans puanına göre renk döndürür
 * @param {number} score - Performans puanı
 * @returns {string} - MUI color
 */
export const getPerformanceColor = score => {
  return getPerformanceLevel(score).color;
};

/**
 * Tarih formatlar (Türkçe)
 * @param {string|Date} date - Tarih
 * @param {object} options - Intl.DateTimeFormat seçenekleri
 * @returns {string} - Formatlanmış tarih
 */
export const formatDate = (date, options = {}) => {
  if (!date) {
    return '-';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Date(date).toLocaleString('tr-TR', { ...defaultOptions, ...options });
};

/**
 * Sadece tarih formatlar (saat olmadan)
 * @param {string|Date} date - Tarih
 * @returns {string} - Formatlanmış tarih
 */
export const formatDateOnly = date => {
  return formatDate(date, { hour: undefined, minute: undefined });
};

/**
 * Sadece saat formatlar
 * @param {string|Date} date - Tarih
 * @returns {string} - Formatlanmış saat
 */
export const formatTimeOnly = date => {
  return formatDate(date, {
    year: undefined,
    month: undefined,
    day: undefined,
  });
};

/**
 * Periyot etiketini döndürür
 * @param {string} period - Periyot
 * @returns {string} - Türkçe etiket
 */
export const getPeriodLabel = period => {
  return PERIOD_LABELS[period] || period;
};

/**
 * Checklist tipi etiketini döndürür
 * @param {string} type - Checklist tipi
 * @returns {string} - Türkçe etiket
 */
export const getChecklistTypeLabel = type => {
  return CHECKLIST_TYPE_LABELS[type] || type;
};

/**
 * Sayıyı Türkçe formatla (binlik ayırıcı)
 * @param {number} number - Sayı
 * @returns {string} - Formatlanmış sayı
 */
export const formatNumber = number => {
  if (typeof number !== 'number') {
    return '0';
  }
  return number.toLocaleString('tr-TR');
};

/**
 * Yüzde formatlar
 * @param {number} value - Değer (0-100 arası)
 * @param {number} decimals - Ondalık basamak sayısı
 * @returns {string} - Formatlanmış yüzde
 */
export const formatPercentage = (value, decimals = 0) => {
  if (typeof value !== 'number') {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
};

/**
 * Puan formatlar
 * @param {number} score - Puan
 * @param {number} decimals - Ondalık basamak sayısı
 * @returns {string} - Formatlanmış puan
 */
export const formatScore = (score, decimals = 0) => {
  if (typeof score !== 'number') {
    return '0';
  }
  return score.toFixed(decimals);
};

/**
 * Kullanıcının tam adını döndürür
 * @param {object} user - Kullanıcı objesi
 * @returns {string} - Tam ad
 */
export const getUserFullName = user => {
  if (!user) {
    return 'Bilinmeyen Kullanıcı';
  }
  return `${user.ad || ''} ${user.soyad || ''}`.trim() || user.kullaniciAdi || 'Bilinmeyen';
};

/**
 * Kullanıcının departmanlarını string olarak döndürür
 * @param {object} user - Kullanıcı objesi
 * @returns {string} - Departman isimleri
 */
export const getUserDepartments = user => {
  if (!user || !user.departmanlar || user.departmanlar.length === 0) {
    return 'Departman atanmamış';
  }
  return user.departmanlar.map(dept => dept.ad).join(', ');
};

/**
 * Kullanıcının rollerini string olarak döndürür
 * @param {object} user - Kullanıcı objesi
 * @returns {string} - Rol isimleri
 */
export const getUserRoles = user => {
  if (!user || !user.roller || user.roller.length === 0) {
    return 'Rol atanmamış';
  }
  return user.roller.map(role => role.ad).join(', ');
};

/**
 * Tarih aralığı hesaplar
 * @param {string} period - Periyot ('today', 'thisWeek', 'thisMonth')
 * @param {Date} startDate - Özel başlangıç tarihi
 * @param {Date} endDate - Özel bitiş tarihi
 * @returns {object} - {start, end} tarihleri
 */
export const getDateRange = (period, startDate = null, endDate = null) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'thisWeek': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      start = startOfWeek;
      end = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'custom':
      start = startDate;
      end = endDate;
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  return { start, end };
};

/**
 * Dizi elemanlarını sayfa sayfa böler
 * @param {Array} array - Bölünecek dizi
 * @param {number} pageSize - Sayfa boyutu
 * @param {number} currentPage - Mevcut sayfa (0'dan başlar)
 * @returns {Array} - Sayfalanmış dizi
 */
export const paginateArray = (array, pageSize, currentPage) => {
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  return array.slice(startIndex, endIndex);
};

/**
 * Dizideki elemanları filtreler (arama)
 * @param {Array} array - Filtrelenecek dizi
 * @param {string} searchTerm - Arama terimi
 * @param {Array} searchFields - Aranacak alanlar
 * @returns {Array} - Filtrelenmiş dizi
 */
export const filterArray = (array, searchTerm, searchFields) => {
  if (!searchTerm) {
    return array;
  }

  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return searchFields.some(field => {
      const value = getNestedValue(item, field);
      return value && value.toString().toLowerCase().includes(term);
    });
  });
};

/**
 * Nested object değerini alır
 * @param {object} obj - Obje
 * @param {string} path - Yol (örn: 'user.name' veya 'user.department.name')
 * @returns {any} - Değer
 */
export const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Hata mesajını kullanıcı dostu hale getirir
 * @param {Error|string} error - Hata objesi veya mesajı
 * @returns {string} - Kullanıcı dostu hata mesajı
 */
export const getErrorMessage = error => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Beklenmeyen bir hata oluştu';
};

/**
 * Geliştirme ortamında hataları loglar
 * @param {string} operation - İşlem adı
 * @param {string} key - Storage anahtarı
 * @param {Error} error - Hata objesi
 */
const logStorageError = (operation, key, error) => {
  if (process.env.NODE_ENV === 'development') {
    // Burada ileride bir logger servisine geçiş yapılabilir

    console.error(`Storage ${operation} hatası (${key}):`, error);
  }
};

/**
 * Local storage'dan güvenli veri okur
 * @param {string} key - Anahtar
 * @param {any} defaultValue - Varsayılan değer
 * @returns {any} - Okunan değer
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logStorageError('okuma', key, error);
    return defaultValue;
  }
};

/**
 * Local storage'a güvenli veri yazar
 * @param {string} key - Anahtar
 * @param {any} value - Değer
 */
export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logStorageError('yazma', key, error);
  }
};

/**
 * Local storage'dan veri siler
 * @param {string} key - Anahtar
 */
export const removeFromStorage = key => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logStorageError('silme', key, error);
  }
};

/**
 * Debounce fonksiyonu
 * @param {Function} func - Çalıştırılacak fonksiyon
 * @param {number} delay - Gecikme süresi (ms)
 * @returns {Function} - Debounced fonksiyon
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Dizi elemanlarını belirli alana göre gruplar
 * @param {Array} array - Gruplandırılacak dizi
 * @param {string} key - Gruplama anahtarı
 * @returns {object} - Gruplandırılmış obje
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = getNestedValue(item, key);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};
