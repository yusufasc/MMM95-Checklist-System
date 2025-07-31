const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const seedData = require('./utils/seedData');

// 🚀 Services Import - Tüm servisler aktif
const taskScheduler = require('./services/taskScheduler');
const slackService = require('./services/slackService');
const cacheService = require('./services/cacheService');
const excelService = require('./services/excelService');
const myActivityService = require('./services/myActivityService');
const myActivityHelpers = require('./services/myActivityHelpers');

const {
  createLogger,
  requestLogger,
  errorLogger,
  checkDebugMode,
} = require('./utils/debugLogger');
require('dotenv').config();

// Debug modunu başlat
const logger = createLogger('app');
checkDebugMode();

// HTTP header size limitlerini artır (431 hatası için)
process.env.UV_THREADPOOL_SIZE = '128';
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

// CORS ayarları - localhost:3000'den gelen isteklere izin ver
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.120.74:3000',
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-auth-token',
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Güvenlik middleware'leri - CORS'dan sonra
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// JSON body parse - Fotoğraf upload için büyük limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔧 Services Middleware - Global erişim için
app.use((req, res, next) => {
  req.services = {
    slack: slackService,
    cache: cacheService,
    excel: excelService,
    myActivity: myActivityService,
    myActivityHelpers: myActivityHelpers,
    taskScheduler: taskScheduler,
  };
  next();
});

// Manuel CORS header'ları ekle (fallback)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.120.74:3000',
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-auth-token, Cache-Control, Pragma, Expires',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Veritabanına bağlan
logger.info('Veritabanına bağlanılıyor...');
connectDB();

// 🚀 Services Initialization
const initializeServices = async () => {
  try {
    logger.info('🔧 Servisler başlatılıyor...');

    // 1. Cache Service başlat
    logger.info('📦 Cache Service başlatılıyor...');
    // CacheService constructor'da otomatik başlar

    // 2. Slack Service test et
    logger.info('💬 Slack Service test ediliyor...');
    await slackService.sendSystemStatus('up', {
      port: process.env.PORT || 5000,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      uptime: `${Math.round(process.uptime())}s`,
    });

    // 3. Task Scheduler başlat
    logger.info('⏰ Task Scheduler başlatılıyor...');
    taskScheduler.start();

    // 4. Excel Service test et
    logger.info('📊 Excel Service hazır...');

    // 5. MyActivity Services hazır
    logger.info('📈 MyActivity Services hazır...');

    logger.success('✅ Tüm servisler başarıyla başlatıldı!');
  } catch (error) {
    logger.error('❌ Servis başlatma hatası:', error);
    await slackService.sendError(error, { context: 'Service Initialization' });
  }
};

// Test verileri oluştur (sadece development ortamında VE açıkça istendiğinde)
if (
  process.env.NODE_ENV === 'development' &&
  process.env.SEED_DATA === 'true'
) {
  // Sunucu başladıktan 2 saniye sonra seed verilerini oluştur
  setTimeout(async () => {
    await seedData();

    // Seed verilerinden sonra servisleri başlat
    setTimeout(async () => {
      await initializeServices();
    }, 3000);
  }, 2000);
} else {
  // Production'da veya normal durumda servisleri başlat
  setTimeout(async () => {
    await initializeServices();
  }, 2000);
}

// Ana route - Servis durumları ile
app.get('/', async (req, res) => {
  try {
    const cacheStats = cacheService.getStats();

    res.json({
      message: 'MMM Checklist Sistemi API Çalışıyor!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        taskScheduler: {
          status: taskScheduler.isRunning ? 'active' : 'inactive',
          name: 'Task Scheduler',
        },
        slackService: {
          status: slackService.enabled ? 'active' : 'disabled',
          name: 'Slack Integration',
        },
        cacheService: {
          status: 'active',
          name: 'Cache Service',
          stats: cacheStats,
        },
        excelService: {
          status: 'active',
          name: 'Excel Service',
        },
        myActivityService: {
          status: 'active',
          name: 'MyActivity Service',
        },
      },
      system: {
        uptime: `${Math.round(process.uptime())}s`,
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    logger.error('Ana route hatası:', error);
    res.status(500).json({
      message: 'Servis durumu alınamadı',
      error: error.message,
    });
  }
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
app.use('/api/bonus-evaluation', require('./routes/bonusEvaluation'));
app.use(
  '/api/kalip-degisim-evaluation',
  require('./routes/kalip-degisim-evaluation'),
);

app.use('/api/hr', require('./routes/hr'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/my-activity', require('./routes/myActivity'));
app.use('/api/personnel-tracking', require('./routes/personnel-tracking'));
app.use('/api/control-scores', require('./routes/controlScores'));
app.use('/api', require('./routes/tasks-control'));

// Equipment Management Routes
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/equipment-requests', require('./routes/equipmentRequests'));

// Cache management routes
app.use('/api/cache', require('./routes/cache'));

// Services test routes
app.use('/api/services', require('./routes/services-test'));

const PORT = process.env.PORT || 3001;

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

// 🛑 Graceful Shutdown - Tüm servisler
const gracefulShutdown = async signal => {
  try {
    logger.info(`${signal} alındı, servisler kapatılıyor...`);

    // Slack'e shutdown bildirimi gönder
    await slackService.sendSystemStatus('down', {
      reason: `Graceful shutdown (${signal})`,
      uptime: `${Math.round(process.uptime())}s`,
    });

    // Task Scheduler'ı durdur
    taskScheduler.stop();

    // Cache'i temizle
    await cacheService.clear();

    logger.success('✅ Tüm servisler başarıyla kapatıldı');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Shutdown hatası:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
