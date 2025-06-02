// Frontend Debug Logger Utility
// Development modunda detaylı logging sağlar

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.REACT_APP_DEBUG === 'true' || isDevelopment;

// Console renkli logging (reserved for future use)
const _colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Performance timing
const performance = {
  timers: new Map(),

  start: (label) => {
    performance.timers.set(label, Date.now());
  },

  end: (label) => {
    const startTime = performance.timers.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      performance.timers.delete(label);
      return duration;
    }
    return 0;
  },
};

// Debug logger class
class DebugLogger {
  constructor(namespace) {
    this.namespace = namespace;
    this.enabled = isDebugEnabled;
  }

  log(level, message, data = null) {
    if (!this.enabled) {
      return;
    }

    const prefix = `[${this.namespace.toUpperCase()}]`;

    // Console'da renkli log
    switch (level) {
      case 'INFO':
        console.log(`%c${prefix} ${message}`, 'color: #2196F3; font-weight: bold');
        break;
      case 'SUCCESS':
        console.log(`%c${prefix} ✅ ${message}`, 'color: #4CAF50; font-weight: bold');
        break;
      case 'WARN':
        console.warn(`%c${prefix} ⚠️ ${message}`, 'color: #FF9800; font-weight: bold');
        break;
      case 'ERROR':
        console.error(`%c${prefix} ❌ ${message}`, 'color: #F44336; font-weight: bold');
        break;
      case 'DEBUG':
        console.log(`%c${prefix} 🐛 ${message}`, 'color: #9C27B0; font-weight: bold');
        break;
      default:
        console.log(`${prefix} ${message}`);
    }

    // Data varsa göster
    if (data) {
      console.log('%cData:', 'color: #666; font-size: 0.9em', data);
    }
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  success(message, data) {
    this.log('SUCCESS', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, error) {
    this.log('ERROR', message, error);

    // Error stack trace'i de göster
    if (error && error.stack) {
      console.error('%cStack Trace:', 'color: #F44336; font-size: 0.8em', error.stack);
    }
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  performance(label, startTime) {
    const duration = startTime ? Date.now() - startTime : performance.end(label);
    this.log('INFO', `⏱️ ${label} completed in ${duration}ms`);
    return duration;
  }

  // Component lifecycle logging
  componentMount(componentName, props = null) {
    this.debug(`🔄 Component mounted: ${componentName}`, props);
  }

  componentUnmount(componentName) {
    this.debug(`🔄 Component unmounted: ${componentName}`);
  }

  // API request logging
  apiRequest(method, url, data = null) {
    this.info(`📡 API Request: ${method} ${url}`, data);
  }

  apiResponse(method, url, status, data = null) {
    const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'SUCCESS';
    this.log(level, `📡 API Response: ${method} ${url} - ${status}`, data);
  }

  // State management logging
  stateChange(componentName, oldState, newState) {
    this.debug(`🔄 State change in ${componentName}`, {
      old: oldState,
      new: newState,
    });
  }

  // User interaction logging
  userAction(action, target, data = null) {
    this.info(`👤 User action: ${action} on ${target}`, data);
  }
}

// Logger factory
const createLogger = (namespace) => {
  return new DebugLogger(namespace);
};

// Pre-defined loggers
const loggers = {
  app: createLogger('app'),
  api: createLogger('api'),
  auth: createLogger('auth'),
  ui: createLogger('ui'),
  performance: createLogger('performance'),
  error: createLogger('error'),
  navigation: createLogger('navigation'),
  forms: createLogger('forms'),
  data: createLogger('data'),
};

// Global error handler
const setupGlobalErrorHandler = () => {
  window.addEventListener('error', (event) => {
    loggers.error.error('Uncaught Error', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    loggers.error.error('Unhandled Promise Rejection', event.reason);
  });
};

// React error boundary logger
const logReactError = (error, errorInfo) => {
  loggers.error.error('React Error Boundary', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  });
};

// Development modunda global handler'ı kur
if (isDebugEnabled) {
  setupGlobalErrorHandler();
  console.log('%c🐛 Frontend Debug Mode Aktif!', 'color: #4CAF50; font-size: 1.2em; font-weight: bold');
  console.log('%cDebug bilgileri console\'da görünecek.', 'color: #2196F3; font-size: 1em');
}

export {
  createLogger,
  loggers,
  performance,
  logReactError,
  isDebugEnabled,
  isDevelopment,
};

export default createLogger;
