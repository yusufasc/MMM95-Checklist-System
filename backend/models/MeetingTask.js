const mongoose = require('mongoose');

const MeetingTaskSchema = new mongoose.Schema({
  // Meeting referansı
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  },
  
  // Gündem maddesi referansı (Meeting model'inde gundem array'inin index'i)
  gundemMaddesiId: {
    type: String, // gundem maddesinin _id'si
    required: true,
  },
  
  // Görev başlığı (gündem maddesinden alınır)
  baslik: {
    type: String,
    required: true,
    trim: true,
  },
  
  // Görev açıklaması
  aciklama: {
    type: String,
    trim: true,
  },
  
  // Sorumlu kişi
  sorumlu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Görevin durumu
  durum: {
    type: String,
    enum: [
      'atandi',           // Görev yeni atandı
      'devam-ediyor',     // Üzerinde çalışılıyor
      'kismen-tamamlandi', // Kısmen tamamlandı
      'tamamlandi',       // Tamamen tamamlandı
      'iptal',            // İptal edildi
      'ertelendi'         // Ertelendi
    ],
    default: 'atandi',
  },
  
  // Öncelik seviyesi
  oncelik: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'kritik'],
    default: 'normal',
  },
  
  // Teslim tarihi
  teslimTarihi: {
    type: Date,
  },
  
  // Görevin progress'i (0-100 arası)
  tamamlanmaYuzdesi: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  
  // Sorumlu kişinin yazdığı notlar
  calismaNotalari: [
    {
      icerik: {
        type: String,
        required: true,
      },
      tarih: {
        type: Date,
        default: Date.now,
      },
      durum: {
        type: String,
        enum: ['progress', 'completed', 'blocked', 'info'],
        default: 'progress',
      },
    }
  ],
  
  // Diğer katılımcıların yorumları
  yorumlar: [
    {
      yorum: {
        type: String,
        required: true,
      },
      yazan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      tarih: {
        type: Date,
        default: Date.now,
      },
      tip: {
        type: String,
        enum: ['yorum', 'oneri', 'soru', 'uyari'],
        default: 'yorum',
      },
    }
  ],
  
  // Ek dosyalar
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
      yukleyenKisi: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      yuklemeTarihi: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  
  // Alt görevler (checklist tarzı)
  altGorevler: [
    {
      baslik: {
        type: String,
        required: true,
      },
      tamamlandi: {
        type: Boolean,
        default: false,
      },
      tamamlanmaTarihi: {
        type: Date,
      },
    }
  ],
  
  // Tekrarlayan toplantılar için geçmiş referansı
  oncekiGorevReferansi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MeetingTask',
  },
  
  // Görev atanma tarihi
  atanmaTarihi: {
    type: Date,
    default: Date.now,
  },
  
  // Görev tamamlanma tarihi
  tamamlanmaTarihi: {
    type: Date,
  },
  
  // Son güncelleme tarihi
  sonGuncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
  
  // Görevin görünürlüğü
  gorunurluk: {
    type: String,
    enum: ['katilimcilara', 'herkese', 'sadece-sorumlu'],
    default: 'katilimcilara',
  },
  
  // Silindi mi
  silindiMi: {
    type: Boolean,
    default: false,
  },
  
}, {
  timestamps: true, // createdAt ve updatedAt otomatik eklenir
});

// Indexes
MeetingTaskSchema.index({ meeting: 1, sorumlu: 1 });
MeetingTaskSchema.index({ sorumlu: 1, durum: 1 });
MeetingTaskSchema.index({ meeting: 1, gundemMaddesiId: 1 });
MeetingTaskSchema.index({ teslimTarihi: 1 });

// Virtual field - sorumlu kişinin tamamladığı görev sayısı
MeetingTaskSchema.virtual('sorumluTamamlananGorevSayisi', {
  ref: 'MeetingTask',
  localField: 'sorumlu',
  foreignField: 'sorumlu',
  count: true,
  match: { durum: 'tamamlandi' }
});

// Pre-save middleware - son güncelleme tarihini güncelle
MeetingTaskSchema.pre('save', function(next) {
  this.sonGuncellemeTarihi = new Date();
  
  // Eğer durum tamamlandı olarak değiştirildiyse
  if (this.isModified('durum') && this.durum === 'tamamlandi') {
    this.tamamlanmaTarihi = new Date();
    this.tamamlanmaYuzdesi = 100;
  }
  
  next();
});

// Static method - meeting'deki tüm görevleri getir
MeetingTaskSchema.statics.getMeetingTasks = function(meetingId) {
  return this.find({ meeting: meetingId, silindiMi: false })
    .populate('sorumlu', 'ad soyad email rol')
    .populate('meeting', 'baslik tarih')
    .populate('yorumlar.yazan', 'ad soyad')
    .sort({ atanmaTarihi: -1 });
};

// Static method - kullanıcının görevlerini getir
MeetingTaskSchema.statics.getUserTasks = function(userId, options = {}) {
  const query = { 
    sorumlu: userId, 
    silindiMi: false 
  };
  
  if (options.durum) {
    query.durum = options.durum;
  }
  
  if (options.meetingId) {
    query.meeting = options.meetingId;
  }
  
  return this.find(query)
    .populate('meeting', 'baslik tarih durum')
    .populate('yorumlar.yazan', 'ad soyad')
    .sort({ teslimTarihi: 1, atanmaTarihi: -1 });
};

// Instance method - görev progress güncelle
MeetingTaskSchema.methods.updateProgress = function(percentage, note) {
  this.tamamlanmaYuzdesi = Math.min(100, Math.max(0, percentage));
  
  if (note) {
    this.calismaNotalari.push({
      icerik: note,
      durum: percentage === 100 ? 'completed' : 'progress'
    });
  }
  
  // Durum otomatik güncelleme
  if (percentage === 0) {
    this.durum = 'atandi';
  } else if (percentage === 100) {
    this.durum = 'tamamlandi';
  } else if (percentage >= 50) {
    this.durum = 'kismen-tamamlandi';
  } else {
    this.durum = 'devam-ediyor';
  }
  
  return this.save();
};

// Instance method - yorum ekle
MeetingTaskSchema.methods.addComment = function(userId, comment, type = 'yorum') {
  this.yorumlar.push({
    yorum: comment,
    yazan: userId,
    tip: type
  });
  
  return this.save();
};

module.exports = mongoose.model('MeetingTask', MeetingTaskSchema);