const debug = require('debug');

// Logger seviyeleri
const info = debug('app:info');
const warn = debug('app:warn');
const error = debug('app:error');
const success = debug('app:success');

// Renkleri ayarla
info.color = 6; // cyan
warn.color = 3; // yellow
error.color = 1; // red
success.color = 2; // green

class Logger {
  static info(message, data = null) {
    if (data) {
      info(message, data);
    } else {
      info(message);
    }
  }

  static warn(message, data = null) {
    if (data) {
      warn(message, data);
    } else {
      warn(message);
    }
  }

  static error(message, data = null) {
    console.error(`❌ ${message}`, data || '');
    if (data) {
      error(message, data);
    } else {
      error(message);
    }
  }

  static success(message, data = null) {
    if (data) {
      success(message, data);
    } else {
      success(message);
    }
  }

  static debug(namespace, message, data = null) {
    const debugLogger = debug(namespace);
    if (data) {
      debugLogger(message, data);
    } else {
      debugLogger(message);
    }
  }
}

module.exports = Logger;
