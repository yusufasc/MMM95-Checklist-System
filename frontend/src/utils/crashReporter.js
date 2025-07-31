// Crash Reporter - Browser crash ve freeze tespiti için
class CrashReporter {
  constructor() {
    this.isInitialized = false;
    this.heartbeatInterval = null;
    this.lastHeartbeat = Date.now();
    this.crashThreshold = 10000; // 10 saniye
    this.memoryThreshold = 0.9; // %90 memory usage
    this.listeners = [];

    this.init();
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    console.log('🛡️ CrashReporter initialized');

    // Global error listeners
    this.setupGlobalErrorHandlers();

    // Memory monitoring
    this.setupMemoryMonitoring();

    // Heartbeat mechanism
    this.setupHeartbeat();

    // Browser events
    this.setupBrowserEvents();

    this.isInitialized = true;
  }

  setupGlobalErrorHandlers() {
    // Uncaught JavaScript errors
    window.addEventListener('error', event => {
      this.reportCrash({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.reportCrash({
        type: 'promise_rejection',
        reason: event.reason,
        timestamp: Date.now(),
      });
    });

    // React error boundary backup
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (
        errorMessage.includes('React') ||
        errorMessage.includes('component')
      ) {
        this.reportCrash({
          type: 'react_error',
          message: errorMessage,
          timestamp: Date.now(),
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  setupMemoryMonitoring() {
    if (!performance.memory) {
      return;
    }

    setInterval(() => {
      const memory = performance.memory;
      const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usagePercent > this.memoryThreshold) {
        this.reportCrash({
          type: 'memory_critical',
          memoryUsage: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (usagePercent * 100).toFixed(1),
          },
          timestamp: Date.now(),
        });
      }
    }, 5000);
  }

  setupHeartbeat() {
    // Heartbeat her 2 saniyede bir
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
    }, 2000);

    // Freeze detection
    setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;

      if (timeSinceLastHeartbeat > this.crashThreshold) {
        this.reportCrash({
          type: 'application_freeze',
          freezeDuration: timeSinceLastHeartbeat,
          timestamp: Date.now(),
        });
      }
    }, 5000);
  }

  setupBrowserEvents() {
    // Page visibility change (tab switch detection)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reportEvent({
          type: 'page_hidden',
          timestamp: Date.now(),
        });
      } else {
        this.reportEvent({
          type: 'page_visible',
          timestamp: Date.now(),
        });
      }
    });

    // Before unload (unexpected page close)
    window.addEventListener('beforeunload', () => {
      this.reportEvent({
        type: 'page_unload',
        timestamp: Date.now(),
      });
    });

    // Resource errors (CSS, JS, images)
    window.addEventListener(
      'error',
      event => {
        if (event.target !== window) {
          this.reportCrash({
            type: 'resource_error',
            tagName: event.target.tagName,
            source: event.target.src || event.target.href,
            timestamp: Date.now(),
          });
        }
      },
      true,
    );
  }

  reportCrash(crashData) {
    const report = {
      ...crashData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: this.getMemoryInfo(),
      performance: this.getPerformanceInfo(),
    };

    // Console log
    console.error('🚨 CRASH DETECTED:', report);

    // LocalStorage'a kaydet
    this.saveCrashReport(report);

    // Event listeners'a bildir
    this.notifyListeners(report);

    // Production'da server'a gönder
    this.sendToServer(report);
  }

  reportEvent(eventData) {
    console.log('📊 Event:', eventData);
  }

  getMemoryInfo() {
    if (!performance.memory) {
      return null;
    }

    const memory = performance.memory;
    return {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      percentage: (
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) *
        100
      ).toFixed(1),
    };
  }

  getPerformanceInfo() {
    return {
      now: performance.now(),
      timeOrigin: performance.timeOrigin,
      navigation: performance.navigation
        ? {
            type: performance.navigation.type,
            redirectCount: performance.navigation.redirectCount,
          }
        : null,
    };
  }

  saveCrashReport(report) {
    try {
      const existingReports = JSON.parse(
        localStorage.getItem('crashReports') || '[]',
      );
      existingReports.unshift(report);

      // Son 10 raporu sakla
      const reportsToKeep = existingReports.slice(0, 10);
      localStorage.setItem('crashReports', JSON.stringify(reportsToKeep));
    } catch (error) {
      console.error('Failed to save crash report:', error);
    }
  }

  sendToServer(report) {
    // Production'da backend'e gönder
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production'
    ) {
      fetch('/api/crash-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      }).catch(error => {
        console.error('Failed to send crash report to server:', error);
      });
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners(report) {
    this.listeners.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Crash report listener error:', error);
      }
    });
  }

  getCrashReports() {
    try {
      return JSON.parse(localStorage.getItem('crashReports') || '[]');
    } catch (error) {
      console.error('Failed to get crash reports:', error);
      return [];
    }
  }

  clearCrashReports() {
    localStorage.removeItem('crashReports');
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.isInitialized = false;
    console.log('🛡️ CrashReporter destroyed');
  }
}

// Singleton instance
const crashReporter = new CrashReporter();

export default crashReporter;
