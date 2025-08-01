/**
 * API Configuration - güvenlik için centralized endpoint management
 * Tüm API endpoint'ler tek yerden yönetiliyor
 * Environment variables ile override edilebilir
 */

const API_BASE_URL = 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Authentication & Authorization
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    selectMachines: `${API_BASE_URL}/api/auth/select-machines`,
    profile: `${API_BASE_URL}/api/auth/profile`,
  },

  // Dashboard
  dashboard: {
    tasks: `${API_BASE_URL}/api/my-activity/tasks`,
    controlTasks: `${API_BASE_URL}/api/control-pending`,
    scores: `${API_BASE_URL}/api/hr/daily-scores`,
    rankings: `${API_BASE_URL}/api/hr/rankings`,
    summary: `${API_BASE_URL}/api/my-activity/summary`,
  },

  // CRUD Resources
  users: `${API_BASE_URL}/api/users`,
  roles: `${API_BASE_URL}/api/roles`,
  departments: `${API_BASE_URL}/api/departments`,
  machines: `${API_BASE_URL}/api/machines`,
  checklists: `${API_BASE_URL}/api/checklists`,
  inventory: `${API_BASE_URL}/api/inventory`,

  // HR Management
  hr: {
    evaluations: `${API_BASE_URL}/api/hr/evaluations`,
    templates: `${API_BASE_URL}/api/hr/templates`,
    reports: `${API_BASE_URL}/api/hr/reports`,
    scoring: `${API_BASE_URL}/api/hr/scoring`,
    settings: `${API_BASE_URL}/api/hr/settings`,
  },

  // Quality Control
  quality: {
    control: `${API_BASE_URL}/api/quality-control`,
    templates: `${API_BASE_URL}/api/quality/templates`,
    evaluations: `${API_BASE_URL}/api/quality/evaluations`,
    statistics: `${API_BASE_URL}/api/quality/statistics`,
  },

  // Tasks & Activities
  tasks: {
    list: `${API_BASE_URL}/api/tasks`,
    pending: `${API_BASE_URL}/api/tasks/pending`,
    completed: `${API_BASE_URL}/api/tasks/completed`,
    control: `${API_BASE_URL}/api/tasks/control`,
  },
};

// Helper function to get endpoint by path
export const getApiEndpoint = path => {
  const keys = path.split('.');
  let endpoint = API_ENDPOINTS;

  for (const key of keys) {
    endpoint = endpoint[key];
    if (!endpoint) {
      console.warn(`API endpoint not found for path: ${path}`);
      return null;
    }
  }

  return endpoint;
};

// Environment-specific configurations
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Security headers
export const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

export default API_ENDPOINTS;
