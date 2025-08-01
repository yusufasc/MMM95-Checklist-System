const mongoose = require('mongoose');

/**
 * 🔔 MMM95 In-App Notification Model
 * Real-time bildirim sistemi için notification şeması
 */
const NotificationSchema = new mongoose.Schema({
  // Notification recipient
  kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Notification content
  baslik: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },

  mesaj: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },

  // Notification type for styling and handling
  tip: {
    type: String,
    enum: [
      'meeting-invitation', // Toplantı daveti
      'meeting-reminder', // Toplantı hatırlatması
      'meeting-started', // Toplantı başladı
      'meeting-ended', // Toplantı bitti
      'task-assigned', // Görev atandı
      'task-overdue', // Görev süresi geçti
      'task-completed', // Görev tamamlandı
      'system', // Sistem bildirimi
      'general', // Genel bildirim
    ],
    required: true,
    index: true,
  },

  // Priority level
  oncelik: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'kritik'],
    default: 'normal',
    index: true,
  },

  // Read status
  okundu: {
    type: Boolean,
    default: false,
    index: true,
  },

  okunmaTarihi: {
    type: Date,
  },

  // Related document references (optional)
  ilgiliToplanti: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
  },

  ilgiliGorev: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },

  ilgiliKullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Action URL for navigation
  aksiyon: {
    type: {
      type: String,
      enum: ['navigate', 'modal', 'external', 'none'],
      default: 'none',
    },
    url: {
      type: String,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
  },

  // Metadata for frontend rendering
  metadata: {
    ikon: {
      type: String,
      default: 'NotificationsIcon',
    },
    renk: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
      default: 'primary',
    },
    otomatikKapat: {
      type: Boolean,
      default: true,
    },
    otomatikKapatSuresi: {
      type: Number,
      default: 5000, // 5 seconds
    },
  },

  // Delivery tracking
  gonderimDurumu: {
    type: String,
    enum: ['bekliyor', 'gonderildi', 'hata'],
    default: 'bekliyor',
    index: true,
  },

  gonderimTarihi: {
    type: Date,
  },

  hataDetayi: {
    type: String,
    trim: true,
  },

  // Retry mechanism
  yenidenelemeSayisi: {
    type: Number,
    default: 0,
  },

  maksYenideneme: {
    type: Number,
    default: 3,
  },

  // Expiration
  sonGecerlilikTarihi: {
    type: Date,
    index: true,
  },

  // Soft delete
  silindiMi: {
    type: Boolean,
    default: false,
    index: true,
  },

  silinmeTarihi: {
    type: Date,
  },

  // Timestamps
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
    index: true,
  },

  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

// ===== INDEXES =====
NotificationSchema.index({ kullanici: 1, okundu: 1 });
NotificationSchema.index({ kullanici: 1, tip: 1 });
NotificationSchema.index({ kullanici: 1, olusturmaTarihi: -1 });
NotificationSchema.index({ gonderimDurumu: 1, yenidenelemeSayisi: 1 });
NotificationSchema.index({ sonGecerlilikTarihi: 1 });
NotificationSchema.index({ silindiMi: 1, olusturmaTarihi: -1 });

// ===== MIDDLEWARE =====
// Update guncellemeTarihi on save
NotificationSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.guncellemeTarihi = new Date();
  }
  next();
});

// Set okunmaTarihi when okundu becomes true
NotificationSchema.pre('save', function (next) {
  if (this.isModified('okundu') && this.okundu && !this.okunmaTarihi) {
    this.okunmaTarihi = new Date();
  }
  next();
});

// Set sonGecerlilikTarihi if not provided (default: 30 days)
NotificationSchema.pre('save', function (next) {
  if (this.isNew && !this.sonGecerlilikTarihi) {
    this.sonGecerlilikTarihi = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

// ===== VIRTUALS =====
// Check if notification is expired
NotificationSchema.virtual('suresiGecmisMi').get(function () {
  return this.sonGecerlilikTarihi && new Date() > this.sonGecerlilikTarihi;
});

// Check if notification needs retry
NotificationSchema.virtual('yenidenenmesiGerekiyorMu').get(function () {
  return (
    this.gonderimDurumu === 'hata' &&
    this.yenidenelemeSayisi < this.maksYenideneme &&
    !this.suresiGecmisMi
  );
});

// Get age in hours
NotificationSchema.virtual('yasSaat').get(function () {
  return Math.floor((new Date() - this.olusturmaTarihi) / (1000 * 60 * 60));
});

// ===== STATIC METHODS =====

// Get unread count for user
NotificationSchema.statics.getUnreadCount = async function (kullaniciId) {
  return this.countDocuments({
    kullanici: kullaniciId,
    okundu: false,
    silindiMi: false,
    $or: [
      { sonGecerlilikTarihi: { $exists: false } },
      { sonGecerlilikTarihi: { $gt: new Date() } },
    ],
  });
};

// Get notifications for user with pagination
NotificationSchema.statics.getUserNotifications = async function (
  kullaniciId,
  options = {},
) {
  const {
    tip,
    okundu,
    limit = 20,
    page = 1,
    sortBy = 'olusturmaTarihi',
    sortOrder = -1,
  } = options;

  const query = {
    kullanici: kullaniciId,
    silindiMi: false,
    $or: [
      { sonGecerlilikTarihi: { $exists: false } },
      { sonGecerlilikTarihi: { $gt: new Date() } },
    ],
  };

  if (tip) {
    query.tip = tip;
  }
  if (typeof okundu === 'boolean') {
    query.okundu = okundu;
  }

  const notifications = await this.find(query)
    .populate('ilgiliToplanti', 'baslik tarih')
    .populate('ilgiliGorev', 'baslik teslimTarihi')
    .populate('ilgiliKullanici', 'ad soyad')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  const total = await this.countDocuments(query);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
};

// Mark multiple notifications as read
NotificationSchema.statics.markAsRead = async function (
  notificationIds,
  kullaniciId,
) {
  const result = await this.updateMany(
    {
      _id: { $in: notificationIds },
      kullanici: kullaniciId,
      okundu: false,
    },
    {
      $set: {
        okundu: true,
        okunmaTarihi: new Date(),
        guncellemeTarihi: new Date(),
      },
    },
  );
  return result;
};

// Clean expired notifications
NotificationSchema.statics.cleanExpired = async function () {
  const result = await this.deleteMany({
    sonGecerlilikTarihi: { $lt: new Date() },
  });
  return result;
};

// Get failed notifications for retry
NotificationSchema.statics.getFailedNotifications = async function () {
  return this.find({
    gonderimDurumu: 'hata',
    yenidenelemeSayisi: { $lt: this.maksYenideneme },
    $or: [
      { sonGecerlilikTarihi: { $exists: false } },
      { sonGecerlilikTarihi: { $gt: new Date() } },
    ],
  }).limit(100);
};

// ===== INSTANCE METHODS =====

// Mark notification as read
NotificationSchema.methods.markAsRead = async function () {
  if (!this.okundu) {
    this.okundu = true;
    this.okunmaTarihi = new Date();
    return this.save();
  }
  return this;
};

// Mark as delivered
NotificationSchema.methods.markAsDelivered = async function () {
  this.gonderimDurumu = 'gonderildi';
  this.gonderimTarihi = new Date();
  return this.save();
};

// Mark as failed and increment retry count
NotificationSchema.methods.markAsFailed = async function (errorMessage) {
  this.gonderimDurumu = 'hata';
  this.hataDetayi = errorMessage;
  this.yenidenelemeSayisi += 1;
  return this.save();
};

// Soft delete
NotificationSchema.methods.softDelete = async function () {
  this.silindiMi = true;
  this.silinmeTarihi = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
