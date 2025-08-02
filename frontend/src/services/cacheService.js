/**
 * 🚀 Frontend Cache Service
 * Browser-based caching for API responses
 * Supports localStorage and sessionStorage
 */

class FrontendCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.isLocalStorageAvailable = this.checkLocalStorage();
    this.isSessionStorageAvailable = this.checkSessionStorage();

    // Cache TTL in milliseconds
    this.TTL = {
      // SHORT CACHE (1-5 minutes)
      DASHBOARD: 2 * 60 * 1000, // 2 min
      USER_TASKS: 2 * 60 * 1000, // 2 min
      CONTROL_PENDING: 1 * 60 * 1000, // 1 min
      MY_ACTIVITY: 3 * 60 * 1000, // 3 min

      // MEDIUM CACHE (5-15 minutes)
      USERS_LIST: 10 * 60 * 1000, // 10 min
      ROLES_LIST: 15 * 60 * 1000, // 15 min
      DEPARTMENTS: 15 * 60 * 1000, // 15 min
      MACHINES: 10 * 60 * 1000, // 10 min
      INVENTORY: 10 * 60 * 1000, // 10 min

      // LONG CACHE (15-60 minutes)
      TEMPLATES: 30 * 60 * 1000, // 30 min
      SETTINGS: 60 * 60 * 1000, // 60 min
    };

    // Cache key prefixes
    this.KEYS = {
      // Dashboard
      DASHBOARD_SUMMARY: userId => `dashboard_summary_${userId}`,
      DASHBOARD_ROLE: role => `dashboard_role_${role}`,

      // Users & Auth
      USER_PROFILE: userId => `user_profile_${userId}`,
      USERS_LIST: 'users_list',

      // Roles & Permissions
      ROLES_LIST: 'roles_list',
      MY_PERMISSIONS: userId => `my_permissions_${userId}`,

      // Departments
      DEPARTMENTS_LIST: 'departments_list',

      // Tasks
      USER_TASKS: userId => `user_tasks_${userId}`,
      CONTROL_PENDING: userId => `control_pending_${userId}`,

      // MyActivity
      MY_ACTIVITY_SUMMARY: userId => `my_activity_summary_${userId}`,
      MY_ACTIVITY_DETAILED: (userId, page) =>
        `my_activity_detailed_${userId}_${page}`,
      MY_ACTIVITY_SCORES: (userId, type) =>
        `my_activity_scores_${userId}_${type}`,
      MY_ACTIVITY_RANKING: userId => `my_activity_ranking_${userId}`,

      // Inventory
      INVENTORY_DASHBOARD: 'inventory_dashboard',
      INVENTORY_CATEGORIES: 'inventory_categories',
      INVENTORY_ITEMS: filters =>
        `inventory_items_${this.hashFilters(filters)}`,
      MACHINES_LIST: source => `machines_list_${source || 'all'}`,

      // Quality Control
      QUALITY_TEMPLATES: 'quality_templates',
      QUALITY_EVALUATIONS: filters =>
        `quality_evaluations_${this.hashFilters(filters)}`,

      // HR
      HR_TEMPLATES: 'hr_templates',
      HR_SCORES: userId => `hr_scores_${userId}`,
    };
  }

  checkLocalStorage() {
    try {
      const test = '__cache_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  checkSessionStorage() {
    try {
      const test = '__cache_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  hashFilters(filters) {
    if (!filters || typeof filters !== 'object') {
      return 'none';
    }
    return btoa(JSON.stringify(filters))
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10);
  }

  /**
   * Get data from cache
   */
  get(key, storage = 'memory') {
    try {
      let data = null;

      if (storage === 'localStorage' && this.isLocalStorageAvailable) {
        data = localStorage.getItem(key);
      } else if (
        storage === 'sessionStorage' &&
        this.isSessionStorageAvailable
      ) {
        data = sessionStorage.getItem(key);
      } else {
        // Memory cache
        const item = this.memoryCache.get(key);
        if (item && Date.now() < item.expiry) {
          return item.data;
        } else if (item) {
          this.memoryCache.delete(key);
        }
        return null;
      }

      if (data) {
        const parsed = JSON.parse(data);
        if (Date.now() < parsed.expiry) {
          // Cache HIT log removed for production
          return parsed.data;
        } else {
          // Expired, remove it
          this.del(key, storage);
        }
      }

      // Cache MISS log removed for production
      return null;
    } catch (error) {
      console.error(`❌ Frontend Cache GET error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data to cache
   */
  set(key, data, ttl = this.TTL.DASHBOARD, storage = 'memory') {
    try {
      const expiry = Date.now() + ttl;
      const cacheItem = { data, expiry };

      if (storage === 'localStorage' && this.isLocalStorageAvailable) {
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } else if (
        storage === 'sessionStorage' &&
        this.isSessionStorageAvailable
      ) {
        sessionStorage.setItem(key, JSON.stringify(cacheItem));
      } else {
        // Memory cache
        this.memoryCache.set(key, cacheItem);
      }

      // Cache SET log removed for production
    } catch (error) {
      console.error(`❌ Frontend Cache SET error for ${key}:`, error);
    }
  }

  /**
   * Delete from cache
   */
  del(key, storage = 'memory') {
    try {
      if (storage === 'localStorage' && this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      } else if (
        storage === 'sessionStorage' &&
        this.isSessionStorageAvailable
      ) {
        sessionStorage.removeItem(key);
      } else {
        this.memoryCache.delete(key);
      }

      // Cache DEL log removed for production
    } catch (error) {
      console.error(`❌ Frontend Cache DEL error for ${key}:`, error);
    }
  }

  /**
   * Clear cache by pattern
   */
  clearPattern(pattern, storage = 'memory') {
    try {
      if (storage === 'localStorage' && this.isLocalStorageAvailable) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        });
      } else if (
        storage === 'sessionStorage' &&
        this.isSessionStorageAvailable
      ) {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.includes(pattern)) {
            sessionStorage.removeItem(key);
          }
        });
      } else {
        // Memory cache
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern)) {
            this.memoryCache.delete(key);
          }
        }
      }

      // Cache CLEAR Pattern log removed for production
    } catch (error) {
      console.error(
        `❌ Frontend Cache CLEAR Pattern error for ${pattern}:`,
        error,
      );
    }
  }

  /**
   * Cache invalidation helpers
   */
  invalidateUser(userId) {
    // Memory cache temizle
    this.clearPattern(`user_${userId}`);
    this.clearPattern('users_list');

    // SessionStorage cache temizle
    this.clearPattern(`user_${userId}`, 'sessionStorage');
    this.clearPattern('users_list', 'sessionStorage');

    // LocalStorage cache temizle
    this.clearPattern(`user_${userId}`, 'localStorage');
    this.clearPattern('users_list', 'localStorage');
  }

  invalidateRoles() {
    // Memory cache temizle
    this.clearPattern('roles_');
    this.clearPattern('permissions_');

    // SessionStorage cache temizle
    this.clearPattern('roles_', 'sessionStorage');
    this.clearPattern('permissions_', 'sessionStorage');

    // LocalStorage cache temizle
    this.clearPattern('roles_', 'localStorage');
    this.clearPattern('permissions_', 'localStorage');
  }

  invalidateDepartments() {
    // Memory cache temizle
    this.del(this.KEYS.DEPARTMENTS_LIST);

    // SessionStorage cache temizle
    this.del(this.KEYS.DEPARTMENTS_LIST, 'sessionStorage');

    // LocalStorage cache temizle
    this.del(this.KEYS.DEPARTMENTS_LIST, 'localStorage');
  }

  invalidateInventory() {
    // Memory cache temizle
    this.clearPattern('inventory_');
    this.clearPattern('machines_');

    // SessionStorage cache temizle
    this.clearPattern('inventory_', 'sessionStorage');
    this.clearPattern('machines_', 'sessionStorage');

    // LocalStorage cache temizle
    this.clearPattern('inventory_', 'localStorage');
    this.clearPattern('machines_', 'localStorage');
  }

  invalidateTasks(userId) {
    // Memory cache temizle
    this.clearPattern(`tasks_${userId}`);
    this.clearPattern(`control_pending_${userId}`);
    this.clearPattern(`my_activity_${userId}`);

    // SessionStorage cache temizle
    this.clearPattern(`tasks_${userId}`, 'sessionStorage');
    this.clearPattern(`control_pending_${userId}`, 'sessionStorage');
    this.clearPattern(`my_activity_${userId}`, 'sessionStorage');

    // LocalStorage cache temizle
    this.clearPattern(`tasks_${userId}`, 'localStorage');
    this.clearPattern(`control_pending_${userId}`, 'localStorage');
    this.clearPattern(`my_activity_${userId}`, 'localStorage');
  }

  /**
   * Clear all cache
   */
  clearAll() {
    try {
      // Memory cache
      this.memoryCache.clear();

      // localStorage
      if (this.isLocalStorageAvailable) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('mmm_cache_')) {
            localStorage.removeItem(key);
          }
        });
      }

      // sessionStorage
      if (this.isSessionStorageAvailable) {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('mmm_cache_')) {
            sessionStorage.removeItem(key);
          }
        });
      }

      // Frontend Cache cleared log removed for production
    } catch (error) {
      console.error('❌ Frontend Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    if (this.isLocalStorageAvailable) {
      const keys = Object.keys(localStorage);
      localStorageSize = keys.filter(key =>
        key.startsWith('mmm_cache_'),
      ).length;
    }

    if (this.isSessionStorageAvailable) {
      const keys = Object.keys(sessionStorage);
      sessionStorageSize = keys.filter(key =>
        key.startsWith('mmm_cache_'),
      ).length;
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize,
      sessionStorageSize,
      isLocalStorageAvailable: this.isLocalStorageAvailable,
      isSessionStorageAvailable: this.isSessionStorageAvailable,
    };
  }
}

// Singleton instance
const frontendCache = new FrontendCacheService();

export default frontendCache;
