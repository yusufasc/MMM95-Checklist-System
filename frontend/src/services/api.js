import axios from 'axios';

// Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Makina seçimi API çağrılarını logla (sadece POST için)
    if (config.url?.includes('select-machines') && config.method?.toLowerCase() === 'post') {
      // API çağrısı yapılıyor
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

// Auth API
export const authAPI = {
  login: credentials => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getActiveWorkers: () => api.get('/users/active-workers'),
  create: userData => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: id => api.delete(`/users/${id}`),
};

// Roles API
export const rolesAPI = {
  getAll: () => api.get('/roles'),
  getById: id => api.get(`/roles/${id}`),
  create: roleData => api.post('/roles', roleData),
  update: (id, roleData) => api.put(`/roles/${id}`, roleData),
  delete: id => api.delete(`/roles/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  create: deptData => api.post('/departments', deptData),
  update: (id, deptData) => api.put(`/departments/${id}`, deptData),
  delete: id => api.delete(`/departments/${id}`),
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
  getControlPending: () => api.get('/tasks/control-pending'),
  selectMachines: selectedMachines => api.post('/tasks/select-machines', { selectedMachines }),
  getMySelectedMachines: () => api.get('/tasks/my-selected-machines'),
  getInventoryMachines: () => api.get('/tasks/inventory-machines'),
  create: taskData => api.post('/tasks', taskData),
  createForAllUsers: taskData => api.post('/tasks', { ...taskData, tumKullanicilar: true }),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  complete: (id, completionData) => api.put(`/tasks/${id}/complete`, completionData),
  scoreItems: (id, scoringData) => api.put(`/tasks/${id}/score-items`, scoringData),
  approve: (id, approvalData) => api.put(`/tasks/${id}/approve`, approvalData),
  reject: (id, rejectionData) => api.put(`/tasks/${id}/reject`, rejectionData),
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

  // Kategoriler
  getCategories: () => api.get('/inventory/categories'),
  createCategory: categoryData => api.post('/inventory/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/inventory/categories/${id}`, categoryData),
  deleteCategory: id => api.delete(`/inventory/categories/${id}`),

  // Alan şablonları
  getCategoryFields: categoryId => api.get(`/inventory/categories/${categoryId}/fields`),
  createCategoryField: (categoryId, fieldData) =>
    api.post(`/inventory/categories/${categoryId}/fields`, fieldData),
  updateField: (id, fieldData) => api.put(`/inventory/fields/${id}`, fieldData),
  deleteField: id => api.delete(`/inventory/fields/${id}`),

  // Envanter öğeleri
  getItems: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/inventory/items${queryString ? `?${queryString}` : ''}`);
  },
  getItem: id => api.get(`/inventory/items/${id}`),
  createItem: itemData => api.post('/inventory/items', itemData),
  updateItem: (id, itemData) => api.put(`/inventory/items/${id}`, itemData),
  deleteItem: id => api.delete(`/inventory/items/${id}`),

  // Excel işlemleri
  downloadExcelTemplate: categoryId => {
    return api.get(`/inventory/categories/${categoryId}/excel-template`, {
      responseType: 'blob',
    });
  },
  importExcel: (categoryId, formData) => {
    return api.post(`/inventory/categories/${categoryId}/excel-import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadExcel: (categoryId, formData) => {
    return api.post(`/inventory/categories/${categoryId}/excel-import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportExcel: categoryId => {
    return api.get(`/inventory/categories/${categoryId}/excel-export`, {
      responseType: 'blob',
    });
  },

  // Makina listesi (Tasks modülü için)
  getMachinesForTasks: () => api.get('/inventory/machines-for-tasks'),

  // Kalıp listesi (WorkTasks modülü için)
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
  updateItems: (id, items) => api.put(`/worktasks/${id}/items`, { maddeler: items }),

  // Görevi tamamla
  complete: id => api.put(`/worktasks/${id}/complete`),

  // WorkTask puanlama ve onaylama (Kontrol Bekleyenler için)
  scoreItems: (id, scoringData) => api.put(`/worktasks/${id}/score-items`, scoringData),
  approve: (id, approvalData) => api.put(`/worktasks/${id}/approve`, approvalData),
  reject: (id, rejectionData) => api.put(`/worktasks/${id}/reject`, rejectionData),
};

// Quality Control API
export const qualityControlAPI = {
  // Şablonlar
  getTemplates: () => api.get('/quality-control/templates'),
  getActiveTemplates: () => api.get('/quality-control/templates/active'),
  getTemplate: id => api.get(`/quality-control/templates/${id}`),
  getTemplateByRole: roleId => api.get(`/quality-control/templates/role/${roleId}`),
  createTemplate: templateData => api.post('/quality-control/templates', templateData),
  updateTemplate: (id, templateData) => api.put(`/quality-control/templates/${id}`, templateData),
  deleteTemplate: (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.force) {
      params.append('force', 'true');
    }
    const queryString = params.toString();
    return api.delete(`/quality-control/templates/${id}${queryString ? `?${queryString}` : ''}`);
  },

  // Aktif çalışanlar
  getActiveWorkers: () => api.get('/quality-control/active-workers'),
  getActiveWorkersByTemplate: templateId =>
    api.get(`/quality-control/active-workers/${templateId}`),

  // Değerlendirmeler
  getEvaluations: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/quality-control/evaluations${queryString ? `?${queryString}` : ''}`);
  },
  getEvaluation: id => api.get(`/quality-control/evaluations/${id}`),
  createEvaluation: evaluationData => api.post('/quality-control/evaluations', evaluationData),

  // İstatistikler
  getStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/quality-control/statistics${queryString ? `?${queryString}` : ''}`);
  },

  // Debug - şablon durumunu kontrol et
  getDebugInfo: () => api.get('/quality-control/templates/debug'),
};

// HR Management API (Admin)
export const hrManagementAPI = {
  // İK Şablonları
  getTemplates: () => api.get('/hr-management/templates'),
  getTemplate: id => api.get(`/hr-management/templates/${id}`),
  createTemplate: templateData => api.post('/hr-management/templates', templateData),
  updateTemplate: (id, templateData) => api.put(`/hr-management/templates/${id}`, templateData),
  deleteTemplate: id => api.delete(`/hr-management/templates/${id}`),

  // İK Ayarları
  getSettings: () => api.get('/hr-management/settings'),
  updateSettings: settingsData => api.put('/hr-management/settings', settingsData),
  updateRolePermissions: (roleId, permissions) =>
    api.post('/hr-management/settings/role-permissions', { rolId: roleId, yetkiler: permissions }),
  updateModuleAccess: accessData => api.post('/hr-management/settings/module-access', accessData),

  // Roller ve Kullanıcılar
  getRoles: () => api.get('/hr-management/roles'),
  getUsers: () => api.get('/hr-management/users'),
  createUser: userData => api.post('/hr-management/users', userData),
  updateUser: (id, userData) => api.put(`/hr-management/users/${id}`, userData),
  deleteUser: id => api.delete(`/hr-management/users/${id}`),

  // Puanlama ve Raporlar
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr-management/scores${queryString ? `?${queryString}` : ''}`);
  },
  getUserScores: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr-management/scores/user/${userId}${queryString ? `?${queryString}` : ''}`);
  },
  getSummaryReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr-management/reports/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Excel işlemleri
  downloadExcel: () => api.get('/hr-management/excel/download', { responseType: 'blob' }),
  uploadExcel: formData =>
    api.post('/hr-management/excel/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// HR API (İK Personeli)
export const hrAPI = {
  // Aktif şablonlar
  getActiveTemplates: () => api.get('/hr/templates/active'),

  // Yetki bilgileri
  getPermissions: () => api.get('/hr/permissions'),

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
    return api.get(`/hr/scores/user/${userId}${queryString ? `?${queryString}` : ''}`);
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
    return api.get(`/hr/reports/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Yeni değerlendirme sistemi
  createEvaluation: evaluationData => api.post('/hr/evaluations', evaluationData),
  getEvaluatedUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/hr/evaluated-users${queryString ? `?${queryString}` : ''}`);
  },
};

// Performance API
export const performanceAPI = {
  // Performans skorlarını getir
  getScores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/performance/scores${queryString ? `?${queryString}` : ''}`);
  },

  // Kullanıcı performans geçmişi
  getUserPerformance: (userId, days = 30) => api.get(`/performance/user/${userId}?days=${days}`),
};

// My Activity API - Kişisel Performans
export const myActivityAPI = {
  // Test endpoint
  test: () => api.get('/my-activity/test'),

  // Kullanıcının kendi aktivite özeti
  getSummary: (days = 30) => api.get(`/my-activity/summary?days=${days}`),

  // Kullanıcının detaylı aktivite geçmişi
  getDetailed: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/my-activity/detailed${queryString ? `?${queryString}` : ''}`);
  },

  // Kullanıcının aldığı puanların detaylı listesi
  getScoresDetail: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/my-activity/scores-detail${queryString ? `?${queryString}` : ''}`);
  },

  // Günlük performans grafiği
  getDailyPerformance: (days = 30) => api.get(`/my-activity/daily-performance?days=${days}`),
};

export default api;
