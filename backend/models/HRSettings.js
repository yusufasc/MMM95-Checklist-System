const mongoose = require('mongoose');

const hrSettingsSchema = new mongoose.Schema({
  // Mesai Puanlama Ayarları
  mesaiPuanlama: {
    aktif: {
      type: Boolean,
      default: true,
    },
    saatBasinaPuan: {
      type: Number,
      default: 3, // +1 saat mesai = +3 puan
    },
    gunlukMaksimumSaat: {
      type: Number,
      default: 4, // Günlük max 4 saat mesai puanlanır
    },
  },

  // Devamsızlık Puanlama Ayarları
  devamsizlikPuanlama: {
    aktif: {
      type: Boolean,
      default: true,
    },
    gunBasinaPuan: {
      type: Number,
      default: -5, // 1 gün devamsızlık = -5 puan
    },
    saatBasinaPuan: {
      type: Number,
      default: -1, // 1 saat devamsızlık = -1 puan
    },
  },

  // Rol Yetkileri
  rolYetkileri: [
    {
      rol: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
      },
      yetkiler: {
        kullaniciAcabilir: {
          type: Boolean,
          default: false,
        },
        acabildigiRoller: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
          },
        ],
        kullaniciSilebilir: {
          type: Boolean,
          default: false,
        },
        silebildigiRoller: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
          },
        ],
        puanlamaYapabilir: {
          type: Boolean,
          default: false,
        },
        excelYukleyebilir: {
          type: Boolean,
          default: false,
        },
        raporGorebilir: {
          type: Boolean,
          default: false,
        },
      },
    },
  ],

  // Modül Erişim Yetkileri (İK sayfasına kimler erişebilir)
  modulErisimYetkileri: [
    {
      kullanici: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rol: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
      },
      erisimDurumu: {
        type: String,
        enum: ['aktif', 'pasif'],
        default: 'pasif',
      },
    },
  ],

  guncelleyenKullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
hrSettingsSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

// Singleton pattern - sadece 1 settings kaydı olmalı
hrSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('HRSettings', hrSettingsSchema);
