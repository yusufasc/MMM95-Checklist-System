const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const seedData = require('./utils/seedData');
const taskScheduler = require('./services/taskScheduler');
const { createLogger, requestLogger, errorLogger, checkDebugMode } = require('./utils/debugLogger');
require('dotenv').config();

// Debug modunu başlat
const logger = createLogger('app');
checkDebugMode();

// HTTP header size limitlerini artır (431 hatası için)
process.env.UV_THREADPOOL_SIZE = 128;
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_OPTIONS = '--max-http-header-size=32768';
}

const app = express();

// NODE_ENV yoksa production olarak ayarla
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Request logging middleware (debug modunda)
if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
  app.use(requestLogger);
}

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors());

// JSON body parse - Fotoğraf upload için büyük limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Veritabanına bağlan
logger.info('Veritabanına bağlanılıyor...');
connectDB();

// Test verileri oluştur (sadece development ortamında VE açıkça istendiğinde)
if (process.env.NODE_ENV === 'development' && process.env.SEED_DATA === 'true') {
  // Sunucu başladıktan 2 saniye sonra seed verilerini oluştur
  setTimeout(async () => {
    await seedData();

    // Seed verilerinden sonra task scheduler'ı başlat
    setTimeout(() => {
      taskScheduler.start();
    }, 3000);
  }, 2000);
} else {
  // Production'da veya normal durumda sadece task scheduler'ı başlat
  setTimeout(() => {
    taskScheduler.start();
  }, 2000);
}

// Ana route
app.get('/', (req, res) => {
  res.json({
    message: 'MMM Checklist Sistemi API Çalışıyor!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/machines', require('./routes/machines'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/worktasks', require('./routes/worktasks'));
app.use('/api/quality-control', require('./routes/qualityControl'));
app.use('/api/hr-management', require('./routes/hr-management'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/my-activity', require('./routes/myActivity'));

const PORT = process.env.PORT || 5000;

// HTTP header size limitini artır (431 hatası için)
const server = require('http').createServer(app);
server.maxHeadersCount = 0; // Unlimited headers
server.headersTimeout = 60000; // 60 saniye timeout
server.requestTimeout = 120000; // 2 dakika timeout

// Error handling middleware (en sonda olmalı)
app.use(errorLogger);

server.listen(PORT, () => {
  logger.success(`🚀 Sunucu ${PORT} portunda çalışıyor!`);
  logger.info('Header size limitleri artırıldı');
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Debug mode: ${process.env.DEBUG ? 'Enabled' : 'Disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM alındı, sunucu kapatılıyor...');
  taskScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT alındı, sunucu kapatılıyor...');
  taskScheduler.stop();
  process.exit(0);
});
