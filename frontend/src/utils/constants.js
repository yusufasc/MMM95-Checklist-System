// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  USERS: '/api/users',
  ROLES: '/api/roles',
  DEPARTMENTS: '/api/departments',
  MODULES: '/api/modules',
  CHECKLISTS: '/api/checklists',
  TASKS: '/api/tasks',
};

// Task Status
export const TASK_STATUS = {
  WAITING: 'bekliyor',
  COMPLETED: 'tamamlandi',
  APPROVED: 'onaylandi',
  REJECTED: 'iadeEdildi',
};

// Task Status Labels
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.WAITING]: 'Bekliyor',
  [TASK_STATUS.COMPLETED]: 'Tamamlandı',
  [TASK_STATUS.APPROVED]: 'Onaylandı',
  [TASK_STATUS.REJECTED]: 'İade Edildi',
};

// Task Status Colors
export const TASK_STATUS_COLORS = {
  [TASK_STATUS.WAITING]: 'warning',
  [TASK_STATUS.COMPLETED]: 'info',
  [TASK_STATUS.APPROVED]: 'success',
  [TASK_STATUS.REJECTED]: 'error',
};

// Checklist Types
export const CHECKLIST_TYPES = {
  ROUTINE: 'rutin',
  EVENT_BASED: 'iseBagli',
};

// Checklist Type Labels
export const CHECKLIST_TYPE_LABELS = {
  [CHECKLIST_TYPES.ROUTINE]: 'Rutin',
  [CHECKLIST_TYPES.EVENT_BASED]: 'İşe Bağlı',
};

// Periods
export const PERIODS = {
  DAILY: 'gunluk',
  WEEKLY: 'haftalik',
  MONTHLY: 'aylik',
  EVENT_BASED: 'olayBazli',
};

// Period Labels
export const PERIOD_LABELS = {
  [PERIODS.DAILY]: 'Günlük',
  [PERIODS.WEEKLY]: 'Haftalık',
  [PERIODS.MONTHLY]: 'Aylık',
  [PERIODS.EVENT_BASED]: 'Olay Bazlı',
};

// Performance Levels
export const PERFORMANCE_LEVELS = {
  EXCELLENT: { min: 90, label: 'Mükemmel', color: 'success' },
  VERY_GOOD: { min: 80, label: 'Çok İyi', color: 'success' },
  GOOD: { min: 70, label: 'İyi', color: 'warning' },
  AVERAGE: { min: 60, label: 'Orta', color: 'warning' },
  NEEDS_IMPROVEMENT: { min: 0, label: 'Geliştirilmeli', color: 'error' },
};

// Date Filter Options
export const DATE_FILTER_OPTIONS = {
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  CUSTOM: 'custom',
};

// Date Filter Labels
export const DATE_FILTER_LABELS = {
  [DATE_FILTER_OPTIONS.TODAY]: 'Bugün',
  [DATE_FILTER_OPTIONS.THIS_WEEK]: 'Bu Hafta',
  [DATE_FILTER_OPTIONS.THIS_MONTH]: 'Bu Ay',
  [DATE_FILTER_OPTIONS.CUSTOM]: 'Özel Tarih',
};

// Modules - seedData.js ile senkronize edildi (15 modül)
export const MODULES = {
  DASHBOARD: 'Dashboard',
  USER_MANAGEMENT: 'Kullanıcı Yönetimi',
  ROLE_MANAGEMENT: 'Rol Yönetimi',
  DEPARTMENT_MANAGEMENT: 'Departman Yönetimi',
  CHECKLIST_MANAGEMENT: 'Checklist Yönetimi',
  TASK_MANAGEMENT: 'Görev Yönetimi',
  YAPTIM: 'Yaptım',
  INVENTORY_MANAGEMENT: 'Envanter Yönetimi',
  QUALITY_CONTROL: 'Kalite Kontrol',
  QUALITY_CONTROL_MANAGEMENT: 'Kalite Kontrol Yönetimi',
  HR: 'İnsan Kaynakları',
  HR_MANAGEMENT: 'İnsan Kaynakları Yönetimi',
  CONTROL_PENDING: 'Kontrol Bekleyenler',
  PERFORMANCE: 'Performans',
  MY_ACTIVITY: 'Kişisel Aktivite',
  // Yeni modül için hazırlık
  MEETING_MANAGEMENT: 'Toplantı Yönetimi', // PLANLANIYOR
};

// Permission Types
export const PERMISSION_TYPES = {
  ACCESS: 'erisebilir',
  EDIT: 'duzenleyebilir',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmuyor.',
  SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
  VALIDATION_ERROR: 'Girilen bilgiler geçersiz.',
  NOT_FOUND: 'Aranan kayıt bulunamadı.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Kayıt başarıyla oluşturuldu.',
  UPDATED: 'Kayıt başarıyla güncellendi.',
  DELETED: 'Kayıt başarıyla silindi.',
  COMPLETED: 'İşlem başarıyla tamamlandı.',
  APPROVED: 'Onaylama işlemi başarıyla tamamlandı.',
  REJECTED: 'Reddetme işlemi başarıyla tamamlandı.',
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  NAME_MIN_LENGTH: 2,
};

// Table Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
};
