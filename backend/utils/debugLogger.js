const debug = require('debug');

// Debug namespace'leri
const debuggers = {
  app: debug('mmm:app'),
  auth: debug('mmm:auth'),
  db: debug('mmm:database'),
  api: debug('mmm:api'),
  middleware: debug('mmm:middleware'),
  error: debug('mmm:error'),
  performance: debug('mmm:performance'),
  tasks: debug('mmm:tasks'),
  inventory: debug('mmm:inventory'),
  users: debug('mmm:users'),
  hr: debug('mmm:hr'),
  quality: debug('mmm:quality'),
  machines: debug('mmm:machines'),
  roles: debug('mmm:roles'),
  notifications: debug('mmm:notifications'),
};

// Console renkli logging
const colors = {
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

// Debug helper functions
const createLogger = namespace => {
  const log = debuggers[namespace] || debug(`mmm:${namespace}`);

  return {
    info: (message, data = null) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.cyan}[${namespace.toUpperCase()}]${colors.reset} ${message}`,
        );
        if (data) {
          console.log(`${colors.dim}`, data, colors.reset);
        }
      }
      log(`INFO: ${message}`, data);
    },

    success: (message, data = null) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.green}[${namespace.toUpperCase()}] ✅${colors.reset} ${message}`,
        );
        if (data) {
          console.log(`${colors.dim}`, data, colors.reset);
        }
      }
      log(`SUCCESS: ${message}`, data);
    },

    warn: (message, data = null) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.yellow}[${namespace.toUpperCase()}] ⚠️${colors.reset} ${message}`,
        );
        if (data) {
          console.log(`${colors.dim}`, data, colors.reset);
        }
      }
      log(`WARN: ${message}`, data);
    },

    error: (message, error = null) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.red}[${namespace.toUpperCase()}] ❌${colors.reset} ${message}`,
        );
        if (error) {
          console.log(
            `${colors.red}${colors.dim}`,
            error.stack || error,
            colors.reset,
          );
        }
      }
      log(`ERROR: ${message}`, error);
      debuggers.error(`[${namespace}] ${message}`, error);
    },

    debug: (message, data = null) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.magenta}[${namespace.toUpperCase()}] 🐛${colors.reset} ${message}`,
        );
        if (data) {
          console.log(`${colors.dim}`, data, colors.reset);
        }
      }
      log(`DEBUG: ${message}`, data);
    },

    performance: (label, startTime) => {
      const duration = Date.now() - startTime;
      const message = `${label} completed in ${duration}ms`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`${colors.blue}[PERFORMANCE] ⏱️${colors.reset} ${message}`);
      }
      debuggers.performance(message);
    },

    api: (method, path, statusCode, duration) => {
      const statusColor =
        statusCode >= 400
          ? colors.red
          : statusCode >= 300
            ? colors.yellow
            : colors.green;
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.blue}[API]${colors.reset} ${method} ${path} ${statusColor}${statusCode}${colors.reset} ${duration}ms`,
        );
      }
      debuggers.api(`${method} ${path} - ${statusCode} - ${duration}ms`);
    },
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, path, ip } = req;

  debuggers.api(`${method} ${path} - ${ip} - Started`);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logger = createLogger('api');
    logger.api(method, path, res.statusCode, duration);
  });

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const logger = createLogger('error');
  logger.error(`${req.method} ${req.path}`, err);
  next(err);
};

// Environment check
const checkDebugMode = () => {
  const isDebugMode =
    process.env.DEBUG || process.env.NODE_ENV === 'development';
  if (isDebugMode) {
    console.log(`${colors.green}🐛 Debug mode aktif!${colors.reset}`);
    console.log(
      `${colors.cyan}Environment: ${process.env.NODE_ENV}${colors.reset}`,
    );
    console.log(
      `${colors.cyan}Debug namespaces: ${process.env.DEBUG || 'All'}${colors.reset}`,
    );
  }
  return isDebugMode;
};

module.exports = {
  createLogger,
  requestLogger,
  errorLogger,
  checkDebugMode,
  debuggers,
  colors,
};
