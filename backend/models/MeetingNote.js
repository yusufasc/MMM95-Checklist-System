const mongoose = require('mongoose');

const MeetingNoteSchema = new mongoose.Schema({
  toplanti: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  },
  olusturan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  icerik: {
    type: String,
    required: true,
    trim: true,
  },
  tip: {
    type: String,
    enum: ['not', 'karar', 'aksiyon', 'önemli', 'soru'],
    default: 'not',
  },
  etiketler: [
    {
      type: String,
      trim: true,
    },
  ],
  // Real-time collaboration fields
  siraNo: {
    type: Number,
    required: true,
  },
  gundemMaddesi: {
    type: String, // Hangi gündem maddesine ait
  },
  alintiliMetin: {
    type: String, // Alıntılanan kısım
  },
  yanit: {
    hedefNot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MeetingNote',
    },
    icerik: {
      type: String,
    },
  },
  duzenlemeler: [
    {
      eskiIcerik: {
        type: String,
      },
      yeniIcerik: {
        type: String,
      },
      duzenleyen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      duzenlemeTarihi: {
        type: Date,
        default: Date.now,
      },
      neden: {
        type: String,
      },
    },
  ],
  reaksiyonlar: [
    {
      kullanici: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      tip: {
        type: String,
        enum: ['beğeni', 'katılıyorum', 'katılmıyorum', 'önemli', 'soru'],
      },
      tarih: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Visibility and permissions
  gorunurluk: {
    type: String,
    enum: ['herkese-açık', 'katılımcılara', 'yöneticilere', 'özel'],
    default: 'katılımcılara',
  },
  izinVerilenKullanicilar: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // Status and workflow
  durum: {
    type: String,
    enum: ['taslak', 'yayınlandı', 'düzenleniyor', 'silindi'],
    default: 'yayınlandı',
  },
  onayGerektirenMi: {
    type: Boolean,
    default: false,
  },
  onaylayan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  onayTarihi: {
    type: Date,
  },
  // Meeting-specific metadata
  toplantıZamaniSaati: {
    type: Date, // Note'un toplantı sırasında ne zaman alındığı
  },
  konusanKisi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sesKaydi: {
    dosyaYolu: {
      type: String,
    },
    baslamaSuresi: {
      type: Number, // Saniye cinsinden
    },
    bitisSuresi: {
      type: Number,
    },
  },
  // Standard MMM95 fields
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
  silinmeTarihi: {
    type: Date,
  },
});

// Indexes for real-time performance
MeetingNoteSchema.index({ toplanti: 1, siraNo: 1 });
MeetingNoteSchema.index({ toplanti: 1, olusturmaTarihi: 1 });
MeetingNoteSchema.index({ olusturan: 1, olusturmaTarihi: -1 });
MeetingNoteSchema.index({ tip: 1, durum: 1 });

// Pre-save hook
MeetingNoteSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();

  // Auto-increment siraNo for new notes
  if (this.isNew && !this.siraNo) {
    this.constructor
      .countDocuments({ toplanti: this.toplanti })
      .then(count => {
        this.siraNo = count + 1;
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Static method for real-time note retrieval
MeetingNoteSchema.statics.findByMeetingRealtime = function (
  meetingId,
  lastNoteId = null,
) {
  const query = {
    toplanti: meetingId,
    silindiMi: false,
    durum: { $ne: 'silindi' },
  };

  if (lastNoteId) {
    query._id = { $gt: lastNoteId };
  }

  return this.find(query)
    .populate('olusturan', 'ad soyad')
    .populate('konusanKisi', 'ad soyad')
    .populate('yanit.hedefNot')
    .sort({ siraNo: 1 });
};

// Static method for note types summary
MeetingNoteSchema.statics.getNoteSummary = function (meetingId) {
  return this.aggregate([
    {
      $match: {
        toplanti: new mongoose.Types.ObjectId(meetingId),
        silindiMi: false,
      },
    },
    {
      $group: {
        _id: '$tip',
        count: { $sum: 1 },
        lastUpdate: { $max: '$guncellemeTarihi' },
      },
    },
  ]);
};

// Virtual for note length
MeetingNoteSchema.virtual('icerikUzunlugu').get(function () {
  return this.icerik ? this.icerik.length : 0;
});

// Virtual for reaction counts
MeetingNoteSchema.virtual('reaksiyonSayilari').get(function () {
  if (!this.reaksiyonlar || this.reaksiyonlar.length === 0) {
    return {};
  }

  return this.reaksiyonlar.reduce((acc, reaksiyon) => {
    acc[reaksiyon.tip] = (acc[reaksiyon.tip] || 0) + 1;
    return acc;
  }, {});
});

module.exports = mongoose.model('MeetingNote', MeetingNoteSchema);
