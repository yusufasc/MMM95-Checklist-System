import axios from 'axios';
import frontendCache from './cacheService';

// Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekte timestamp ekle
api.interceptors.request.use(
  config => {
    // Token'ı ekle
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cache-busting için timestamp ekle
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - 401 durumunda logout yap
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/**
 * 🚀 Cache Wrapper Function
 * API çağrılarını cache ile sarmalayan yardımcı fonksiyon
 */
const withCache = (
  apiCall,
  cacheKey,
  ttl = frontendCache.TTL.DASHBOARD,
  storage = 'memory',
) => {
  return async (...args) => {
    // Cache'den kontrol et
    const cachedData = frontendCache.get(cacheKey, storage);
    if (cachedData) {
      return { data: cachedData };
    }

    // Cache miss - API çağrısı yap
    const response = await apiCall(...args);

    // Başarılı response'u cache'le
    if (response.data) {
      frontendCache.set(cacheKey, response.data, ttl, storage);
    }

    return response;
  };
};

// Auth API
export const authAPI = {
  login: credentials => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: withCache(
    () => api.get('/users'),
    frontendCache.KEYS.USERS_LIST,
    frontendCache.TTL.USERS_LIST,
    'sessionStorage',
  ), // 🚀 CACHE: 10 dakika
  getActiveWorkers: () => api.get('/users/active-workers'),
  create: userData => {
    // Cache'i temizle
    frontendCache.invalidateUser();
    return api.post('/users', userData);
  },
  update: (id, userData) => {
    // Cache'i temizle
    frontendCache.invalidateUser(id);
    return api.put(`/users/${id}`, userData);
  },
  delete: id => {
    // Cache'i temizle
    frontendCache.invalidateUser(id);
    return api.delete(`/users/${id}`);
  },
};

// Roles API
export const rolesAPI = {
  getAll: withCache(
    () => api.get('/roles'),
    frontendCache.KEYS.ROLES_LIST,
    frontendCache.TTL.ROLES_LIST,
    'sessionStorage',
  ), // 🚀 CACHE: 15 dakika
  getById: id => api.get(`/roles/${id}`),
  getMyPermissions: () => api.get('/roles/my-permissions'),
  create: roleData => {
    frontendCache.invalidateRoles();
    return api.post('/roles', roleData);
  },
  update: (id, roleData) => {
    frontendCache.invalidateRoles();
    return api.put(`/roles/${id}`, roleData);
  },
  delete: id => {
    frontendCache.invalidateRoles();
    return api.delete(`/roles/${id}`);
  },
  // Cache temizleme için yardımcı fonksiyon
  clearCache: () => {
    // Axios cache'ini temizle (eğer varsa)
    if (api.defaults.cache) {
      api.defaults.cache.clear();
    }
    // Browser cache'ini temizle
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('roles')) {
            caches.delete(name);
          }
        });
      });
    }
  },
};

// Departments API
export const departmentsAPI = {
  getAll: withCache(
    () => api.get('/departments'),
    frontendCache.KEYS.DEPARTMENTS_LIST,
    frontendCache.TTL.DEPARTMENTS,
    'sessionStorage',
  ), // 🚀 CACHE: 15 dakika
  create: deptData => {
    frontendCache.invalidateDepartments();
    return api.post('/departments', deptData);
  },
  update: (id, deptData) => {
    frontendCache.invalidateDepartments();
    return api.put(`/departments/${id}`, deptData);
  },
  delete: id => {
    frontendCache.invalidateDepartments();
    return api.delete(`/departments/${id}`);
  },
};

// Modules API
export const modulesAPI = {
  getAll: () => api.get('/modules'),
  create: moduleData => api.post('/modules', moduleData),
  update: (id, moduleData) => api.put(`/modules/${id}`, moduleData),
  delete: id => api.delete(`/modules/${id}`),
};

// Checklists API
export const checklistsAPI = {
  getAll: () => api.get('/checklists'),
  create: checklistData => api.post('/checklists', checklistData),
  update: (id, checklistData) => api.put(`/checklists/${id}`, checklistData),
  delete: id => api.delete(`/checklists/${id}`),
  forceDelete: id => api.delete(`/checklists/${id}/force`),
};

// Machines API
export const machinesAPI = {
  getAll: () => api.get('/machines'),
  getMyAccessible: () => api.get('/machines/my-accessible'),
  create: machineData => api.post('/machines', machineData),
  update: (id, machineData) => api.put(`/machines/${id}`, machineData),
  delete: id => api.delete(`/machines/${id}`),
};

// Tasks API
export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  getMy: () => api.get('/tasks/my'),
  getMyByMachine: () => api.get('/tasks/my-by-machine'),
  getPending: () => api.get('/tasks/pending'),
  getControlPending: (selectedMachines = null) => {
    // Makina bilgisi varsa params olarak gönder
    const params = {};
    if (selectedMachines && selectedMachines.length > 0) {
      params.machines = selectedMachines.map(m => m._id || m.id).join(',');
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `/tasks/control-pending${queryString ? `?${queryString}` : ''}`;

    console.log('🔍 Frontend API - URL gönderiliyor:', url);
    console.log('🔍 Frontend API - Params:', params);

    return api.get(url);
  },
  selectMachines: selectedMachines =>
    api.post('/tasks/select-machines', { selectedMachines }),
  getMySelectedMachines: () => api.get('/tasks/my-selected-machines'),
  getInventoryMachines: () => api.get('/inventory/machines?source=all'),
  create: taskData => api.post('/tasks', taskData),
  createForAllUsers: taskData =>
    api.post('/tasks', { ...taskData, tumKullanicilar: true }),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  start: (id, startData) => api.put(`/tasks/${id}/start`, startData),
  complete: (id, completionData) =>
    api.put(`/tasks/${id}/complete`, completionData),
  scoreItems: (id, scoringData) =>
    api.put(`/tasks/${id}/score-items`, scoringData),
  approve: (id, approvalData) => api.put(`/tasks/${id}/approve`, approvalData),
  reject: (id, rejectionData) => api.put(`/tasks/${id}/reject`, rejectionData),

  // Vardiya bazlı makina seçimi
  getCurrentShift: () => api.get('/tasks/current-shift'),
  endShift: () => api.post('/tasks/end-shift'),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: id => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Inventory API
export const inventoryAPI = {
  // Dashboard
  getDashboard: () => api.get('/inventory/dashboard'),

  // Categories
  getCategories: () => api.get('/inventory/categories'),
  createCategory: categoryData =>
    api.post('/inventory/categories', categoryData),
  updateCategory: (id, categoryData) =>
    api.put(`/inventory/categories/${id}`, categoryData),
  deleteCategory: id => api.delete(`/inventory/categories/${id}`),

  // Field Templates
  getCategoryFields: categoryId =>
    api.get(`/inventory/categories/${categoryId}/fields`),
  createCategoryField: (categoryId, fieldData) =>
    api.post(`/inventory/categories/${categoryId}/fields`, fieldData),
  updateField: (id, fieldData) => api.put(`/inventory/fields/${id}`, fieldData),
  deleteField: id => api.delete(`/inventory/fields/${id}`),

  // Items
  getItems: params => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/inventory/items${queryString ? `?${queryString}` : ''}`);
  },
  getItem: id => api.get(`/inventory/items/${id}`),
  createItem: itemData => api.post('/inventory/items', itemData),
  updateItem: (id, itemData) => api.put(`/inventory/items/${id}`, itemData),
  deleteItem: id => api.delete(`/inventory/items/${id}`),

  // Excel operations
  downloadExcelTemplate: categoryId => {
    return api.get(`/inventory/categories/${categoryId}/excel-template`, {
      responseType: 'blob',
    });
  },
  importExcel: (categoryId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(
      `/inventory/categories/${categoryId}/excel-import`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      },
    );
  },
  exportExcel: categoryId => {
    return api.get(`/inventory/categories/${categoryId}/excel-export`, {
      responseType: 'blob',
    });
  },

  // 🎯 STANDARDIZED MACHINE API - Tek birleştirilmiş endpoint
  getMachines: (source = 'all') =>
    api.get(`/inventory/machines?source=${source}`),
  getMachineDetail: id => api.get(`/inventory/machines/${id}`),

  // 🔧 KALIP API
  getKalips: () => api.get('/inventory/kalips'),
  getKalipsForTasks: () => api.get('/inventory/kalips-for-tasks'),
};

// WorkTasks API
export const workTasksAPI = {
  // İşe bağlı checklistleri getir
  getChecklists: () => api.get('/worktasks/checklists'),

  // Yeni iş görevi oluştur
  create: workTaskData => api.post('/worktasks', workTaskData),

  // Kullanıcının görevlerini getir (Dashboard için alias)
  getMy: () => api.get('/worktasks/my-tasks'),

  // Kullanıcının görevlerini getir
  getMyTasks: () => api.get('/worktasks/my-tasks'),

  // Kullanıcının tamamladığı görevlerini getir
  getMyCompletedTasks: () => api.get('/worktasks/my-completed'),

  // Tek bir görev detayı
  getTask: id => api.get(`/worktasks/${id}`),

  // Checklist maddelerini güncelle
  updateItems: (id, items) => api.put(`/worktasks/${id}/items`, items),

  // Görevi tamamla
  complete: id => api.put(`/worktasks/${id}/complete`),

  // WorkTask kontrol bekleyenler (sadece işe bağlı görevler)
  getControlPending: () => api.get('/worktasks/control-pending'),

  // WorkTask puanlama ve onaylama (Kontrol Bekleyenler için)
  scoreItems: (id, scoringData) =>
    api.put(`/worktasks/${id}/score-items`, scoringData),
  approve: (id, approvalData) =>
    api.put(`/worktasks/${id}/approve`, approvalData),
  reject: (id, rejectionData) =>
    api.put(`/worktasks/${id}/reject`, rejectionData),
};

// Bonus Evaluation API
export const bonusEvaluationAPI = {
  // Templates
  getTemplates: () => api.get('/bonus-evaluation/templates'),
  getActiveTemplates: () => api.get('/bonus-evaluation/templates/active'),
  getTemplate: id => api.get(`/bonus-evaluation/templates/${id}`),
  createTemplate: templateData =>
    api.post('/bonus-evaluation/templates', templateData),
  updateTemplate: (id, templateData) =>
    api.put(`/bonus-evaluation/templates/${id}`, templateData),
  deleteTemplate: id => api.delete(`/bonus-evaluation/templates/${id}`),

  // Template Workers - Gelişmiş personel listesi (periyot kontrolü ile)
  getTemplateWorkers: templateId =>
    api.get(`/bonus-evaluation/template-workers/${templateId}`),

  // Period Check
  checkPeriod: (templateId, userId) =>
    api.get(`/bonus-evaluation/period-check/${templateId}/${userId}`),

  // User Evaluations History
  getUserEvaluations: (userId, templateId) =>
    api.get(`/bonus-evaluation/user-evaluations/${userId}/${templateId}`),

  // Evaluations
  getEvaluations: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/bonus-evaluation/evaluations${queryString ? `?${queryString}` : ''}`,
    );
  },
  createEvaluation: evaluationData =>
    api.post('/bonus-evaluation/evaluations', evaluationData),
  updateEvaluation: (id, evaluationData) =>
    api.put(`/bonus-evaluation/evaluations/${id}`, evaluationData),
  deleteEvaluation: id => api.delete(`/bonus-evaluation/evaluations/${id}`),

  // Dashboard data
  getDashboard: () => api.get('/bonus-evaluation/dashboard/stats'),
};

// Quality Control API
export const qualityControlAPI = {
  // Şablonlar
  getTemplates: () => api.get('/quality-control/templates'),
  getActiveTemplates: () => api.get('/quality-control/templates/active'),
  getTemplate: id => api.get(`/quality-control/templates/${id}`),
  getTemplateByRole: roleId =>
    api.get(`/quality-control/templates/role/${roleId}`),
  createTemplate: templateData =>
    api.post('/quality-control/templates', templateData),
  updateTemplate: (id, templateData) =>
    api.put(`/quality-control/templates/${id}`, templateData),
  deleteTemplate: (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.force) {
      params.append('force', 'true');
    }
    const queryString = params.toString();
    return api.delete(
      `/quality-control/templates/${id}${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Aktif çalışanlar
  getActiveWorkers: () => api.get('/quality-control/active-workers'),
  getActiveWorkersByTemplate: templateId =>
    api.get(`/quality-control/active-workers/${templateId}`),

  // Değerlendirmeler
  getEvaluations: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/quality-control/evaluations${queryString ? `?${queryString}` : ''}`,
    );
  },
  getEvaluation: id => api.get(`/quality-control/evaluations/${id}`),
  createEvaluation: evaluationData =>
    api.post('/quality-control/evaluations', evaluationData),

  // İstatistikler
  getStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/quality-control/statistics${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Debug - şablon durumunu kontrol et
  getDebugInfo: () => api.get('/quality-control/templates/debug'),

  // Dashboard API'leri
  getDashboardSummary: () => api.get('/quality-control/dashboard/summary'),
  getRecentEvaluations: () =>
    api.get('/quality-control/dashboard/recent-evaluations'),
  getPerformanceTrend: () =>
    api.get('/quality-control/dashboard/performance-trend'),
  getDepartmentPerformance: () =>
    api.get('/quality-control/dashboard/department-performance'),
};

// HR Management API (Admin)
export const hrManagementAPI = {
  // İK Şablonları
  getTemplates: () => api.get('/hr/templates'),
  getTemplate: id => api.get(`/hr/templates/${id}`),
  createTemplate: templateData => api.post('/hr/templates', templateData),
  updateTemplate: (id, templateData) =>
    api.put(`/hr/templates/${id}`, templateData),
  deleteTemplate: id => api.delete(`/hr/templates/${id}`),

  // İK Ayarları
  getSettings: () => api.get('/hr/settings'),
  updateSettings: settingsData => api.put('/hr/settings', settingsData),
  updateRolePermissions: (roleId, permissions) =>
    api.post('/hr/settings/role-permissions', {
      rolId: roleId,
      yetkiler: permissions,
    }),
  updateModuleAccess: accessData =>
    api.post('/hr/settings/module-access', accessData),

  // Roller ve Kullanıcılar
  getRoles: () => api.get('/roles'),
  getUsers: () => api.get('/users'),
  createUser: userData => api.post('/hr/users', userData),
  updateUser: (id, userData) => api.put(`/hr/users/${id}`, userData),
  deleteUser: id => api.delete(`/hr/users/${id}`),

  // Puanlama ve Raporlar
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr/scores${queryString ? `?${queryString}` : ''}`);
  },
  getUserScores: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/hr/scores/user/${userId}${queryString ? `?${queryString}` : ''}`,
    );
  },
  getSummaryReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/hr/reports/summary${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Excel işlemleri
  downloadExcel: () => api.get('/hr/excel/download', { responseType: 'blob' }),
  uploadExcel: formData =>
    api.post('/hr/excel/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Module access toggle helper
  toggleModuleAccess: (item, type) =>
    api.post('/hr/settings/module-access', {
      itemId: item._id,
      itemType: type,
      action: 'toggle',
    }),
};

// HR API (İK Personeli)
export const hrAPI = {
  // Aktif şablonlar
  getActiveTemplates: () => api.get('/hr/templates/active'),

  // Yetki bilgileri
  getPermissions: () => api.get('/hr/permissions'),

  // Roller (HR yetkisi olan kullanıcılar için)
  getRoles: () => api.get('/hr/roles'),

  // Kullanıcının kendi HR puanları (MyActivity için)
  getMyScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr/my-scores${queryString ? `?${queryString}` : ''}`);
  },

  // Kullanıcı yönetimi
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr/users${queryString ? `?${queryString}` : ''}`);
  },
  createUser: userData => api.post('/hr/users', userData),
  deleteUser: id => api.delete(`/hr/users/${id}`),

  // Puanlama
  createScore: scoreData => api.post('/hr/scores', scoreData),
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr/scores${queryString ? `?${queryString}` : ''}`);
  },
  getUserScores: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/hr/scores/user/${userId}${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Excel işlemleri
  downloadExcel: () => api.get('/hr/excel/download', { responseType: 'blob' }),
  uploadExcel: formData =>
    api.post('/hr/excel/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Raporlar
  getSummaryReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/hr/reports/summary${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Yeni değerlendirme sistemi
  createEvaluation: evaluationData =>
    api.post('/hr/evaluations', evaluationData),
  getEvaluatedUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/hr/evaluated-users${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Fazla mesai ve devamsızlık yönetimi
  getSettings: () => api.get('/hr/settings'),
  createManualEntry: entryData => api.post('/hr/manual-entry', entryData),
  getManualEntries: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/hr/manual-entries/${userId}${queryString ? `?${queryString}` : ''}`,
    );
  },
};

// Performance API
export const performanceAPI = {
  // Performans skorlarını getir
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(
      `/performance/scores${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Kullanıcı performans geçmişi
  getUserPerformance: (userId, days = 30) =>
    api.get(`/performance/user/${userId}?days=${days}`),
};

// WorkTasks API - Görev Yönetimi
export const worktasksAPI = {
  // Mevcut görevler
  getMyTasks: () => api.get('/worktasks/my-tasks'),
  getAvailableChecklists: () => api.get('/worktasks/checklists'),
  getCompletedTasks: () => api.get('/worktasks/my-completed'),

  // Görev işlemleri
  createTask: taskData => api.post('/worktasks', taskData),
  updateTask: (id, taskData) => api.put(`/worktasks/${id}`, taskData),
  completeTask: (id, completionData) =>
    api.put(`/worktasks/${id}/complete`, completionData),
  getTask: id => api.get(`/worktasks/${id}`),

  // Checklist işlemleri
  updateItems: (taskId, items) =>
    api.put(`/worktasks/${taskId}/items`, { items }),
  complete: (taskId, data) => api.put(`/worktasks/${taskId}/complete`, data),

  // Kalıp değişim wizard
  createKalipTask: taskData => api.post('/worktasks/kalip-task', taskData),
  updateKalipProgress: (taskId, stepData) =>
    api.put(`/worktasks/${taskId}/kalip-progress`, stepData),
};

// My Activity API - Kişisel Performans
export const myActivityAPI = {
  // Test endpoint
  test: () => api.get('/my-activity/test'),

  // Kullanıcının kendi aktivite özeti
  getSummary: (days = 30) => api.get(`/my-activity/summary?days=${days}`),

  // Kullanıcının detaylı aktivite geçmişi
  getDetailed: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(
      `/my-activity/detailed${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Kullanıcının aldığı puanların detaylı listesi
  getScoresDetail: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(
      `/my-activity/scores-detail${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Günlük performans grafiği
  getDailyPerformance: (days = 30) =>
    api.get(`/my-activity/daily-performance?days=${days}`),

  // Puan breakdown - kimden ne kadar puan aldığını detaylarıyla gösterir
  getScoreBreakdown: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(`/my-activity/score-breakdown?${queryString}`);
  },

  // Görev detaylarını getir (şablon maddeleri ile)
  getTaskDetails: taskId => api.get(`/my-activity/task-details/${taskId}`),

  // Role-based ranking
  getRanking: (days = 30) => api.get(`/my-activity/ranking?days=${days}`),

  // Kalite kontrol madde bazlı analiz
  getQualityCriteriaBreakdown: (month, year) => {
    const params = new URLSearchParams();
    if (month) {
      params.append('month', month);
    }
    if (year) {
      params.append('year', year);
    }
    return api.get(
      `/my-activity/quality-criteria-breakdown?${params.toString()}`,
    );
  },

  // Aylık toplam puanları kategorize ederek getir
  getMonthlyTotals: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(
      `/my-activity/monthly-totals${queryString ? `?${queryString}` : ''}`,
    );
  },
};

// Personnel Tracking API
export const personnelTrackingAPI = {
  // Ana personel verisi - refactoring sonrası eklendi
  getPersonnelData: () => api.get('/personnel-tracking/data'),

  getCurrentStatus: () => api.get('/personnel-tracking/current-status'),
  getMachineBasedData: roleFilter =>
    api.get(
      `/personnel-tracking/machine-based${roleFilter ? `?roleFilter=${roleFilter}` : ''}`,
    ),

  // Kalıp değişim takibi
  getKalipDegisimData: () => api.get('/personnel-tracking/kalip-degisim'),
  getKalipDegisimHistory: (machineId, limit = 10) =>
    api.get(
      `/personnel-tracking/kalip-degisim/${machineId}/history?limit=${limit}`,
    ),
};

// Equipment Management API
export const equipmentAPI = {
  // Equipment CRUD
  getAll: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(`/equipment${queryString ? `?${queryString}` : ''}`);
  },
  getById: id => api.get(`/equipment/${id}`),
  create: data => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: id => api.delete(`/equipment/${id}`),
  getCategories: () => api.get('/equipment/categories/list'),

  // Public endpoints for equipment requests (no module permission required)
  getPublicCategories: () => api.get('/equipment/public/categories'),
  getPublicEquipment: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(
      `/equipment/public/list${queryString ? `?${queryString}` : ''}`,
    );
  },
};

// Assignment Management API
export const assignmentAPI = {
  // Assignment CRUD
  getAll: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(`/assignments${queryString ? `?${queryString}` : ''}`);
  },
  getById: id => api.get(`/assignments/${id}`),
  getUserAssignments: (userId, filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(
      `/assignments/user/${userId}${queryString ? `?${queryString}` : ''}`,
    );
  },
  create: data => api.post('/assignments', data),
  returnEquipment: (id, data) => api.put(`/assignments/${id}/return`, data),
  extendAssignment: (id, data) => api.put(`/assignments/${id}/extend`, data),
  getStats: () => api.get('/assignments/dashboard/stats'),
};

// Equipment Request API
export const equipmentRequestAPI = {
  // Request CRUD
  getAll: (filters = {}) => {
    const queryString = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return api.get(
      `/equipment-requests${queryString ? `?${queryString}` : ''}`,
    );
  },
  getById: id => api.get(`/equipment-requests/${id}`),
  getUserRequests: userId => api.get(`/equipment-requests/user/${userId}`),
  getMyRequests: () => api.get('/equipment-requests/my-requests'),
  create: data => api.post('/equipment-requests', data),
  createNewEquipment: data =>
    api.post('/equipment-requests/new-equipment', data),
  process: (id, data) => api.put(`/equipment-requests/${id}/process`, data),
  approve: (id, data) => api.put(`/equipment-requests/${id}/approve`, data),
  reject: (id, data) => api.put(`/equipment-requests/${id}/reject`, data),
  cancel: id => api.delete(`/equipment-requests/${id}`),
  getStats: () => api.get('/equipment-requests/dashboard/stats'),
};

// API Service - Main export for components
export const apiService = {
  // Auth
  login: authAPI.login,
  getMe: authAPI.getMe,

  // Tasks - WorkTasks için gerekli endpoint'ler
  getAssignedTasks: () => tasksAPI.getMy(),
  getMyWorkTasks: () => workTasksAPI.getMyTasks(),
  getCompletedWorkTasks: () => workTasksAPI.getMyCompletedTasks(),
  getWorkTask: id => workTasksAPI.getTask(id),
  completeWorkTask: (id, data) => workTasksAPI.complete(id, data),
  updateWorkTaskItems: (id, items) => workTasksAPI.updateItems(id, items),

  // 🎯 STANDARDIZED MACHINES API - Tek birleştirilmiş endpoint kullan
  getAllMachines: () => inventoryAPI.getMachines('all'),
  getMyAccessibleMachines: () => inventoryAPI.getMachines('all'),
  getMachinesForTasks: () => inventoryAPI.getMachines('all'),

  // Inventory - Kalıp seçimi için
  getInventoryKalips: () => inventoryAPI.getKalipsForTasks(),

  // Users
  getUsers: usersAPI.getAll,
  createUser: usersAPI.create,
  updateUser: usersAPI.update,
  deleteUser: usersAPI.delete,

  // Roles
  getRoles: rolesAPI.getAll,
  createRole: rolesAPI.create,
  updateRole: rolesAPI.update,
  deleteRole: rolesAPI.delete,

  // Departments
  getDepartments: departmentsAPI.getAll,
  createDepartment: departmentsAPI.create,
  updateDepartment: departmentsAPI.update,
  deleteDepartment: departmentsAPI.delete,

  // Checklists
  getChecklists: checklistsAPI.getAll,
  createChecklist: checklistsAPI.create,
  updateChecklist: checklistsAPI.update,
  deleteChecklist: checklistsAPI.delete,

  // Notifications
  getNotifications: notificationsAPI.getAll,
  markNotificationAsRead: notificationsAPI.markAsRead,
  markAllNotificationsAsRead: notificationsAPI.markAllAsRead,

  // MyActivity endpoints
  myActivity: {
    test: () => api.get('/my-activity/test'),

    // Activity summary
    getSummary: (days = 30) => api.get(`/my-activity/summary?days=${days}`),

    // Detailed activities with filters
    getDetailed: (filters = {}) => {
      const queryString = Object.entries(filters)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return api.get(
        `/my-activity/detailed${queryString ? `?${queryString}` : ''}`,
      );
    },

    // Score details
    getScoresDetail: (filters = {}) => {
      const queryString = Object.entries(filters)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return api.get(
        `/my-activity/scores-detail${queryString ? `?${queryString}` : ''}`,
      );
    },

    // Daily performance
    getDailyPerformance: (days = 30) =>
      api.get(`/my-activity/daily-performance?days=${days}`),

    // Score breakdown (existing endpoint)
    getScoreBreakdown: (filters = {}) => {
      const queryString = Object.entries(filters)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return api.get(`/my-activity/score-breakdown?${queryString}`);
    },

    // Task details
    getTaskDetails: taskId => api.get(`/my-activity/task-details/${taskId}`),

    // Role-based ranking
    getRanking: (days = 30) => api.get(`/my-activity/ranking?days=${days}`),

    // Kalite kontrol madde bazlı analiz
    getQualityCriteriaBreakdown: (month, year) => {
      const params = new URLSearchParams();
      if (month) {
        params.append('month', month);
      }
      if (year) {
        params.append('year', year);
      }
      return api.get(
        `/my-activity/quality-criteria-breakdown?${params.toString()}`,
      );
    },

    // Aylık toplam puanları kategorize ederek getir
    getMonthlyTotals: (filters = {}) => {
      const queryString = Object.entries(filters)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return api.get(
        `/my-activity/monthly-totals${queryString ? `?${queryString}` : ''}`,
      );
    },
  },
};

export default {
  ...api,
  myActivity: myActivityAPI,
};
