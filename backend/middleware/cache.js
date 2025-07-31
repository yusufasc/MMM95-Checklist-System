const cacheService = require('../services/cacheService');

/**
 * 🚀 MMM Cache Middleware
 * API route'larında cache kontrolü için middleware
 */

/**
 * Cache middleware factory
 * @param {string|function} keyGenerator - Cache key string veya function
 * @param {number} ttl - Time to live (seconds)
 * @param {object} options - Cache options
 */
const cache = (keyGenerator, ttl = 300, options = {}) => {
  return async (req, res, next) => {
    try {
      // Cache key oluştur
      let cacheKey;
      if (typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        cacheKey = keyGenerator;
      }

      // User ID'yi key'e ekle (user-specific cache için)
      if (options.userSpecific && req.user?.id) {
        cacheKey = `${cacheKey}:user:${req.user.id}`;
      }

      // Query parameters'ı key'e ekle
      if (options.includeQuery && Object.keys(req.query).length > 0) {
        const queryString = JSON.stringify(req.query);
        cacheKey = `${cacheKey}:query:${Buffer.from(queryString).toString('base64')}`;
      }

      // Cache'den veri al
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        // Cache hit - veriyi döndür
        return res.json(cachedData);
      }

      // Cache miss - response'u intercept et
      const originalJson = res.json;
      res.json = function (data) {
        // Başarılı response'ları cache'le
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            console.error('Cache set error:', err);
          });
        }

        // Orijinal response'u gönder
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Cache hatası olursa devam et
    }
  };
};

/**
 * Predefined cache middlewares for common patterns
 */

// Dashboard cache
const dashboardCache = (ttl = 300) => {
  return cache(
    req => {
      const role = req.user?.roller?.[0]?.ad || 'unknown';
      return `dashboard:role:${role}`;
    },
    ttl,
    { userSpecific: true },
  );
};

// User list cache
const usersListCache = () => {
  return cache('users:all', 1800);
};

// Roles list cache
const rolesListCache = () => {
  return cache('roles:all', 3600);
};

// Departments list cache
const departmentsListCache = () => {
  return cache('departments:all', 3600);
};

// Machines list cache
const machinesListCache = () => {
  return cache(
    req => {
      const source = req.query.source || 'all';
      return `machines:${source}`;
    },
    1800,
    { includeQuery: true },
  );
};

// Inventory cache
const inventoryCache = (type = 'items') => {
  return cache(
    req => {
      if (type === 'dashboard') {
        return 'inventory:dashboard';
      } else if (type === 'categories') {
        return 'inventory:categories';
      } else {
        return `inventory:items:${JSON.stringify(req.query)}`;
      }
    },
    type === 'dashboard' ? 300 : 3600,
    { includeQuery: type === 'items' },
  );
};

// Checklists cache
const checklistsCache = () => {
  return cache('checklists:all', 1800);
};

// User tasks cache
const userTasksCache = () => {
  return cache(
    req => {
      const machines =
        req.user?.secilenMakinalar?.map(m => m._id).join(',') || 'none';
      return `tasks:user:${req.user.id}:${machines}`;
    },
    300,
    { userSpecific: true },
  );
};

// Control pending cache
const controlPendingCache = () => {
  return cache(
    req => {
      const machines =
        req.user?.secilenMakinalar?.map(m => m._id).join(',') || 'none';
      return `control:pending:${machines}`;
    },
    180,
    { userSpecific: true },
  );
};

// MyActivity cache
const myActivityCache = (type = 'summary') => {
  return cache(
    req => {
      const userId = req.user.id;
      switch (type) {
      case 'summary':
        return `activity:summary:${userId}`;
      case 'detailed':
        return `activity:detailed:${userId}:${JSON.stringify(req.query)}`;
      case 'scores':
        return `activity:scores:${userId}:${req.query.tip}`;
      case 'ranking':
        return `activity:ranking:${userId}`;
      default:
        return `activity:${type}:${userId}`;
      }
    },
    300,
    { includeQuery: true },
  );
};

// Quality Control cache
const qualityControlCache = (type = 'templates') => {
  return cache(
    req => {
      if (type === 'templates') {
        return 'quality:templates';
      } else if (type === 'evaluations') {
        return `quality:evaluations:${JSON.stringify(req.query)}`;
      } else if (type === 'dashboard') {
        return 'quality:dashboard';
      }
    },
    7200,
    { includeQuery: type === 'evaluations' },
  );
};

// HR cache
const hrCache = (type = 'templates') => {
  return cache(
    req => {
      if (type === 'templates') {
        return 'hr:templates:active';
      } else if (type === 'scores') {
        return `hr:scores:${req.user.id}:${JSON.stringify(req.query)}`;
      } else if (type === 'permissions') {
        return `hr:permissions:${req.user.id}`;
      }
    },
    7200,
    { userSpecific: type !== 'templates' },
  );
};

/**
 * Cache invalidation middleware
 * Veri değişikliklerinde cache'i temizler
 */
const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = async function (data) {
      // Başarılı response'lardan sonra cache'i temizle
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const patternPromises = patterns.map(pattern => {
            if (typeof pattern === 'function') {
              return pattern(req, data);
            } else {
              return cacheService.delPattern(pattern);
            }
          });
          await Promise.all(patternPromises);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache statistics endpoint middleware
 */
const cacheStats = () => {
  return (req, res) => {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  };
};

/**
 * Cache clear endpoint middleware
 */
const cacheClear = () => {
  return async (req, res) => {
    try {
      await cacheService.clear();
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: error.message,
      });
    }
  };
};

module.exports = {
  // Generic cache middleware
  cache,

  // Predefined cache middlewares
  dashboardCache,
  usersListCache,
  rolesListCache,
  departmentsListCache,
  machinesListCache,
  inventoryCache,
  checklistsCache,
  userTasksCache,
  controlPendingCache,
  myActivityCache,
  qualityControlCache,
  hrCache,

  // Cache management
  invalidateCache,
  cacheStats,
  cacheClear,

  // Cache service access
  cacheService,
};
