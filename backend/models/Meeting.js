const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  baslik: {
    type: String,
    required: true,
    trim: true,
  },
  aciklama: {
    type: String,
    trim: true,
  },
  kategori: {
    type: String,
    enum: [
      'rutin',
      'proje',
      'acil',
      'kalite',
      'güvenlik',
      'performans',
      'vardiya',
      'kalip-degisim',
    ],
    default: 'rutin',
  },
  tarih: {
    type: Date,
    required: true,
  },
  baslangicSaati: {
    type: String, // Format: "14:30"
    required: true,
  },
  bitisSaati: {
    type: String, // Format: "15:30"
  },
  lokasyon: {
    type: String,
    trim: true,
  },
  durum: {
    type: String,
    enum: ['planlanıyor', 'bekliyor', 'devam-ediyor', 'tamamlandı', 'iptal'],
    default: 'planlanıyor',
  },
  oncelik: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'kritik'],
    default: 'normal',
  },
  organizator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  departman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  makina: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem', // MMM95 makina sistemi ile uyumlu
  },
  katilimcilar: [
    {
      kullanici: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      rol: {
        type: String,
        enum: ['katılımcı', 'sunucu', 'karar-verici', 'gözlemci'],
        default: 'katılımcı',
      },
      katilimDurumu: {
        type: String,
        enum: ['davetli', 'onaylandı', 'reddedildi', 'katıldı', 'katılmadı'],
        default: 'davetli',
      },
      davetTarihi: {
        type: Date,
        default: Date.now,
      },
      yanitTarihi: {
        type: Date,
      },
    },
  ],
  gundem: [
    {
      baslik: {
        type: String,
        required: true,
      },
      aciklama: {
        type: String,
      },
      siraNo: {
        type: Number,
        required: true,
      },
      sure: {
        type: Number, // Dakika cinsinden
        default: 10,
      },
      sorumlu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      durum: {
        type: String,
        enum: ['bekliyor', 'devam-ediyor', 'tartışıldı', 'karar-verildi', 'tamamlandı', 'ertelendi'],
        default: 'bekliyor',
      },
    },
  ],
  kararlar: [
    {
      baslik: {
        type: String,
        required: true,
      },
      aciklama: {
        type: String,
      },
      sorumlu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      teslimTarihi: {
        type: Date,
      },
      oncelik: {
        type: String,
        enum: ['düşük', 'normal', 'yüksek', 'kritik'],
        default: 'normal',
      },
      durum: {
        type: String,
        enum: ['yeni', 'devam-ediyor', 'tamamlandı', 'iptal'],
        default: 'yeni',
      },
      olusturmaTarihi: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  notlar: [
    {
      icerik: {
        type: String,
        required: true,
      },
      olusturan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      tarih: {
        type: Date,
        default: Date.now,
      },
      gizli: {
        type: Boolean,
        default: false, // Sadece organizator ve yöneticiler görebilir
      },
    },
  ],
  ekler: [
    {
      dosyaAdi: {
        type: String,
        required: true,
      },
      dosyaYolu: {
        type: String,
        required: true,
      },
      dosyaBoyutu: {
        type: Number,
      },
      mimeType: {
        type: String,
      },
      yukleyen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      yuklemeTarihi: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Tekrarlanan toplantılar için
  tekrarlamaAyarlari: {
    tip: {
      type: String,
      enum: ['yok', 'günlük', 'haftalık', 'aylık', 'özel'],
      default: 'yok',
    },
    aralik: {
      type: Number, // Kaç günde/haftada/ayda bir
      default: 1,
    },
    bitisTarihi: {
      type: Date,
    },
    tekrarSayisi: {
      type: Number,
    },
  },
  recurrentSeriesId: {
    type: String, // Tekrar eden toplantıları grup halinde yönetmek için
  },
  // Toplantı başladığında ve bittiğinde güncellenen alanlar
  gercekBaslangicSaati: {
    type: Date,
  },
  gercekBitisSaati: {
    type: Date,
  },
  toplamSure: {
    type: Number, // Dakika cinsinden
  },
  // MMM95 entegrasyon alanları
  ilgiliChecklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
  },
  olusuturulanGorevler: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  ],
  // Standard MMM95 tarih alanları
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
  silindiMi: {
    type: Boolean,
    default: false,
  },
  silen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  silmeTarihi: {
    type: Date,
  },
});

// Indexes for performance (MMM95 standard)
MeetingSchema.index({ tarih: 1, durum: 1 });
MeetingSchema.index({ organizator: 1, tarih: -1 });
MeetingSchema.index({ departman: 1, tarih: -1 });
MeetingSchema.index({ 'katilimcilar.kullanici': 1 });
MeetingSchema.index({ recurrentSeriesId: 1 });

// Pre-save hook - MMM95 pattern
MeetingSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();

  if (this.isModified('durum')) {
    console.log(`📅 Meeting ${this._id} durum değişikliği: ${this.durum}`);
  }

  // Auto-generate recurrentSeriesId for recurring meetings
  if (this.tekrarlamaAyarlari.tip !== 'yok' && !this.recurrentSeriesId) {
    this.recurrentSeriesId = new mongoose.Types.ObjectId().toString();
  }

  next();
});

// Pre-update hook - MMM95 pattern
MeetingSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  update.guncellemeTarihi = Date.now();

  if (update.durum) {
    console.log(`📅 Meeting güncelleme - Yeni durum: ${update.durum}`);
  }

  next();
});

// Virtual for meeting duration in readable format
MeetingSchema.virtual('toplamSureFormatli').get(function () {
  if (!this.toplamSure) {
    return null;
  }

  const saat = Math.floor(this.toplamSure / 60);
  const dakika = this.toplamSure % 60;

  return saat > 0 ? `${saat}s ${dakika}d` : `${dakika}d`;
});

// Virtual for participant count
MeetingSchema.virtual('katilimciSayisi').get(function () {
  return this.katilimcilar ? this.katilimcilar.length : 0;
});

// Static method for finding meetings by date range (MMM95 pattern)
MeetingSchema.statics.findByDateRange = function (
  baslangic,
  bitis,
  options = {},
) {
  const query = {
    tarih: {
      $gte: baslangic,
      $lte: bitis,
    },
    silindiMi: false,
  };

  if (options.durum) {
    query.durum = {
      $in: Array.isArray(options.durum) ? options.durum : [options.durum],
    };
  }

  if (options.departman) {
    query.departman = options.departman;
  }

  if (options.katilimci) {
    query['katilimcilar.kullanici'] = options.katilimci;
  }

  return this.find(query)
    .populate('organizator', 'ad soyad')
    .populate('departman', 'ad')
    .populate('katilimcilar.kullanici', 'ad soyad')
    .sort({ tarih: 1, baslangicSaati: 1 });
};

// Static method for recurring meetings
MeetingSchema.statics.findRecurringSeries = function (seriesId) {
  return this.find({
    recurrentSeriesId: seriesId,
    silindiMi: false,
  }).sort({ tarih: 1 });
};

module.exports = mongoose.model('Meeting', MeetingSchema);
