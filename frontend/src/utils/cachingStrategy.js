/**
 * Advanced Caching Strategy
 * Browser cache, localStorage ve service worker optimizasyonu
 */

// LocalStorage cache manager
export class LocalCacheManager {
  constructor(prefix = 'mmm_cache_') {
    this.prefix = prefix;
    this.ttl = 5 * 60 * 1000; // 5 dakika default TTL
  }

  set(key, data, customTTL = null) {
    const ttl = customTTL || this.ttl;
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('LocalStorage cache error:', error);
      this.clearOldCache(); // Storage full ise eski cache'leri temizle
    }
  }

  get(key) {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      if (!cached) {
        return null;
      }

      const { data, timestamp, ttl } = JSON.parse(cached);

      // TTL check
      if (Date.now() - timestamp > ttl) {
        this.remove(key);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('LocalStorage read error:', error);
      return null;
    }
  }

  remove(key) {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clearOldCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (Date.now() - cached.timestamp > cached.ttl) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key); // Corrupted data'yı sil
        }
      }
    });
  }

  clearAll() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// API Response cache with memory fallback
export class APICache {
  constructor() {
    this.memoryCache = new Map();
    this.localCache = new LocalCacheManager('api_');
  }

  generateKey(url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${url}_${btoa(paramString)}`;
  }

  async get(url, params = {}) {
    const key = this.generateKey(url, params);

    // 1. Memory cache'den kontrol et (en hızlı)
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (Date.now() - cached.timestamp < 60000) {
        // 1 dakika memory TTL
        console.log('📱 Memory cache hit:', url);
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // 2. LocalStorage cache'den kontrol et
    const localCached = this.localCache.get(key);
    if (localCached) {
      console.log('💾 LocalStorage cache hit:', url);
      // Memory cache'e de ekle
      this.memoryCache.set(key, {
        data: localCached,
        timestamp: Date.now(),
      });
      return localCached;
    }

    return null;
  }

  async set(url, data, params = {}, ttl = 5 * 60 * 1000) {
    const key = this.generateKey(url, params);

    // Memory cache'e ekle
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // LocalStorage cache'e ekle
    this.localCache.set(key, data, ttl);

    console.log('💾 Data cached:', url);
  }

  clearCache() {
    this.memoryCache.clear();
    this.localCache.clearAll();
    console.log('🗑️ All cache cleared');
  }
}

// Service Worker registration
export const registerServiceWorker = () => {
  if (
    'serviceWorker' in navigator &&
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'production'
  ) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('🔧 Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  }
};

// Image lazy loading utility
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Critical resource preloader
export const preloadCriticalResources = () => {
  // Critical API endpoints
  const criticalEndpoints = [
    '/api/auth/me',
    '/api/modules',
    '/api/dashboard/summary',
  ];

  // DNS prefetch for external resources
  const externalDomains = ['//cdn.jsdelivr.net', '//fonts.googleapis.com'];

  // Preload critical scripts
  criticalEndpoints.forEach(endpoint => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = endpoint;
    document.head.appendChild(link);
  });

  // DNS prefetch
  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Cache strategy initialization
export const initCacheStrategy = () => {
  // Service Worker
  registerServiceWorker();

  // Preload critical resources
  preloadCriticalResources();

  // Image lazy loading
  setTimeout(lazyLoadImages, 1000);

  // Clear old cache on app start
  const localCache = new LocalCacheManager();
  localCache.clearOldCache();

  console.log('🚀 Cache strategy initialized');
};

// Export cache instances
export const apiCache = new APICache();
export const localCache = new LocalCacheManager();

/**
 * Kullanım örnekleri:
 *
 * // API caching:
 * const cachedData = await apiCache.get('/api/tasks');
 * if (!cachedData) {
 *   const freshData = await fetch('/api/tasks');
 *   await apiCache.set('/api/tasks', freshData);
 * }
 *
 * // Local data caching:
 * localCache.set('user_preferences', preferences, 24 * 60 * 60 * 1000); // 24 saat
 * const preferences = localCache.get('user_preferences');
 *
 * // App başlangıcında:
 * initCacheStrategy();
 */
