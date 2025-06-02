const mongoose = require('mongoose');

const WorkTaskSchema = new mongoose.Schema({
  kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
    required: true,
  },
  makina: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  // Kalıp değişim bilgileri
  indirilenKalip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  baglananHamade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  makinaDurmaSaati: {
    type: Date,
    required: true,
  },
  yeniKalipAktifSaati: {
    type: Date,
    required: true,
  },
  // Bakım bilgileri
  bakimaGitsinMi: {
    type: Boolean,
    default: false,
  },
  bakimSebebi: {
    type: String,
  },
  bakimResimUrl: {
    type: String,
  },
  // Checklist maddeleri
  maddeler: [
    {
      maddeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      soru: String,
      yapildi: {
        type: Boolean,
        default: false,
      },
      yapilmaTarihi: Date,
      puan: {
        type: Number,
        default: 0,
      },
      maxPuan: {
        type: Number,
        default: 0,
      },
      // Kontrol alanları
      kontrolPuani: {
        type: Number,
        default: null,
      },
      kontrolYorumu: {
        type: String,
        default: '',
      },
      kontrolResimUrl: {
        type: String,
        default: '',
      },
      // Kullanıcı yorumu ve resmi
      yorum: {
        type: String,
        default: '',
      },
      resimUrl: {
        type: String,
        default: '',
      },
    },
  ],
  // Task durumu
  durum: {
    type: String,
    enum: ['bekliyor', 'tamamlandi', 'onaylandi', 'reddedildi'],
    default: 'bekliyor',
  },
  toplamPuan: {
    type: Number,
    default: 0,
  },
  // Onay bilgileri
  onaylayanKullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  onayTarihi: Date,
  onayNotu: String,
  // Tarihler
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  tamamlanmaTarihi: Date,
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp middleware
WorkTaskSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

module.exports = mongoose.model('WorkTask', WorkTaskSchema);
