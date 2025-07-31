// const redis = require('redis'); // Redis kullanılmıyor şu anda

/**
 * 🚀 MMM Checklist System - Advanced Caching Service
 * Enterprise-grade API response caching with Redis
 *
 * Cache Strategies:
 * - SHORT: 5-15 minutes (dynamic data)
 * - MEDIUM: 30-60 minutes (semi-static data)
 * - LONG: 2-24 hours (static data)
 */

class CacheService {
  constructor() {
    this.client = null;
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
    };

    this.init();
  }

  init() {
    try {
      // Redis bağlantısını geçici olarak devre dışı bırak
      console.log('⚠️ Redis temporarily disabled, using memory cache only');
      this.isRedisAvailable = false;

      // // Redis bağlantısını dene
      // this.client = redis.createClient({
      //   host: process.env.REDIS_HOST || 'localhost',
      //   port: process.env.REDIS_PORT || 6379,
      //   password: process.env.REDIS_PASSWORD || undefined,
      //   retryDelayOnFailover: 100,
      //   maxRetriesPerRequest: 3,
      // });

      // await this.client.connect();
      // this.isRedisAvailable = true;
      // console.log('✅ Redis Cache Service initialized');
    } catch (error) {
      console.warn(
        '⚠️ Redis not available, falling back to memory cache:',
        error.message,
      );
      this.isRedisAvailable = false;
    }
  }

  /**
   * Cache TTL Constants (seconds)
   */
  static TTL = {
    // SHORT CACHE (5-15 minutes) - Dynamic data
    DASHBOARD_SUMMARY: 300, // 5 min - Dashboard özet verileri
    USER_TASKS: 300, // 5 min - Kullanıcı görevleri
    CONTROL_PENDING: 180, // 3 min - Kontrol bekleyen görevler
    MY_ACTIVITY_SUMMARY: 300, // 5 min - Kişisel aktivite özeti
    PERFORMANCE_DAILY: 600, // 10 min - Günlük performans

    // MEDIUM CACHE (30-60 minutes) - Semi-static data
    USERS_LIST: 1800, // 30 min - Kullanıcı listesi
    ROLES_LIST: 3600, // 60 min - Rol listesi
    DEPARTMENTS_LIST: 3600, // 60 min - Departman listesi
    MACHINES_LIST: 1800, // 30 min - Makina listesi
    INVENTORY_CATEGORIES: 3600, // 60 min - Envanter kategorileri
    CHECKLISTS_TEMPLATES: 1800, // 30 min - Checklist şablonları

    // LONG CACHE (2-24 hours) - Static data
    MODULES_LIST: 86400, // 24 hours - Modül listesi
    SYSTEM_SETTINGS: 7200, // 2 hours - Sistem ayarları
    FIELD_TEMPLATES: 7200, // 2 hours - Alan şablonları
    HR_TEMPLATES: 7200, // 2 hours - İK şablonları
    QUALITY_TEMPLATES: 7200, // 2 hours - Kalite kontrol şablonları
  };

  /**
   * Cache Key Patterns
   */
  static KEYS = {
    // Dashboard
    DASHBOARD_SUMMARY: userId => `dashboard:summary:${userId}`,
    DASHBOARD_ROLE: role => `dashboard:role:${role}`,

    // Users & Auth
    USER_PROFILE: userId => `user:profile:${userId}`,
    USER_PERMISSIONS: userId => `user:permissions:${userId}`,
    USERS_LIST: 'users:all',
    ACTIVE_WORKERS: 'users:active',

    // Roles & Permissions
    ROLES_LIST: 'roles:all',
    ROLE_PERMISSIONS: roleId => `role:permissions:${roleId}`,
    MY_PERMISSIONS: userId => `permissions:user:${userId}`,

    // Departments
    DEPARTMENTS_LIST: 'departments:all',

    // Tasks & WorkTasks
    USER_TASKS: (userId, machines) => `tasks:user:${userId}:${machines}`,
    CONTROL_PENDING: machines => `control:pending:${machines}`,
    WORKTASKS_CHECKLISTS: 'worktasks:checklists',

    // MyActivity
    MY_ACTIVITY_SUMMARY: userId => `activity:summary:${userId}`,
    MY_ACTIVITY_DETAILED: (userId, filters) =>
      `activity:detailed:${userId}:${JSON.stringify(filters)}`,
    MY_ACTIVITY_SCORES: (userId, type) => `activity:scores:${userId}:${type}`,
    MY_ACTIVITY_RANKING: userId => `activity:ranking:${userId}`,

    // Inventory
    INVENTORY_DASHBOARD: 'inventory:dashboard',
    INVENTORY_CATEGORIES: 'inventory:categories',
    INVENTORY_ITEMS: filters => `inventory:items:${JSON.stringify(filters)}`,
    MACHINES_LIST: source => `machines:${source || 'all'}`,
    KALIPS_LIST: 'inventory:kalips',

    // Checklists
    CHECKLISTS_LIST: 'checklists:all',
    CHECKLIST_DETAIL: id => `checklist:${id}`,

    // Quality Control
    QUALITY_TEMPLATES: 'quality:templates',
    QUALITY_EVALUATIONS: filters =>
      `quality:evaluations:${JSON.stringify(filters)}`,
    QUALITY_DASHBOARD: 'quality:dashboard',

    // HR
    HR_TEMPLATES: 'hr:templates:active',
    HR_SCORES: (userId, filters) =>
      `hr:scores:${userId}:${JSON.stringify(filters)}`,
    HR_PERMISSIONS: userId => `hr:permissions:${userId}`,

    // Performance
    PERFORMANCE_TREND: (userId, days) => `performance:trend:${userId}:${days}`,
    PERFORMANCE_RANKING: 'performance:ranking',
  };

  /**
   * Get data from cache
   */
  async get(key) {
    try {
      let data;

      if (this.isRedisAvailable) {
        data = await this.client.get(key);
      } else {
        const item = this.memoryCache.get(key);
        if (item && Date.now() < item.expiry) {
          data = item.value;
        } else if (item) {
          this.memoryCache.delete(key);
        }
      }

      if (data) {
        this.metrics.hits++;
        console.log(`📦 Cache HIT: ${key}`);
        return typeof data === 'string' ? JSON.parse(data) : data;
      }

      this.metrics.misses++;
      console.log(`🔍 Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.metrics.errors++;
      console.error(`❌ Cache GET error for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set data to cache
   */
  async set(key, value, ttl = CacheService.TTL.DASHBOARD_SUMMARY) {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.isRedisAvailable) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        const expiry = Date.now() + ttl * 1000;
        this.memoryCache.set(key, { value: serializedValue, expiry });
      }

      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.metrics.errors++;
      console.error(`❌ Cache SET error for ${key}:`, error.message);
    }
  }

  /**
   * Delete from cache
   */
  async del(key) {
    try {
      if (this.isRedisAvailable) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }

      console.log(`🗑️ Cache DEL: ${key}`);
    } catch (error) {
      this.metrics.errors++;
      console.error(`❌ Cache DEL error for ${key}:`, error.message);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    try {
      if (this.isRedisAvailable) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          console.log(`🗑️ Cache DEL Pattern: ${pattern} (${keys.length} keys)`);
        }
      } else {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      this.metrics.errors++;
      console.error(
        `❌ Cache DEL Pattern error for ${pattern}:`,
        error.message,
      );
    }
  }

  /**
   * Cache invalidation helpers
   */
  async invalidateUser(userId) {
    await this.delPattern(`*user:${userId}*`);
    await this.delPattern(`*activity:*:${userId}*`);
    await this.del('users:all');
  }

  async invalidateRole() {
    await this.delPattern('*role:*');
    await this.del('roles:all');
  }

  async invalidateDepartment() {
    await this.del('departments:all');
  }

  async invalidateInventory() {
    await this.delPattern('inventory:*');
    await this.delPattern('machines:*');
  }

  async invalidateChecklist() {
    await this.delPattern('checklists:*');
    await this.delPattern('worktasks:*');
  }

  async invalidateTasks() {
    await this.delPattern('tasks:*');
    await this.delPattern('control:*');
    await this.delPattern('activity:*');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate =
      total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      errors: this.metrics.errors,
      hitRate: `${hitRate}%`,
      isRedisAvailable: this.isRedisAvailable,
      memoryCacheSize: this.memoryCache.size,
    };
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isRedisAvailable) {
        await this.client.flushAll();
      } else {
        this.memoryCache.clear();
      }
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.error('❌ Cache clear error:', error.message);
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

// Export both instance and static properties
module.exports = cacheService;
module.exports.TTL = CacheService.TTL;
module.exports.KEYS = CacheService.KEYS;
