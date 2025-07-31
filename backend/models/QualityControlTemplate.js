const mongoose = require('mongoose');

const qualityControlTemplateSchema = new mongoose.Schema(
  {
    ad: {
      type: String,
      required: true,
      trim: true,
    },
    rol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    maddeler: [
      {
        baslik: {
          type: String,
          required: true,
        },
        aciklama: {
          type: String,
        },
        maksimumPuan: {
          type: Number,
          default: 10,
          min: 1,
          max: 100,
        },
        zorunlu: {
          type: Boolean,
          default: true,
        },
        fotografGereklimi: {
          type: Boolean,
          default: false,
        },
        siraNo: {
          type: Number,
          required: true,
        },
      },
    ],
    aktif: {
      type: Boolean,
      default: true,
    },
    // Kontrol puanı - Bu şablonu puanlayan kişiye verilecek puan
    kontrolPuani: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Değerlendirme saatleri
    degerlendirmeSaatleri: [
      {
        saat: {
          type: String, // "08:00" formatında
          required: true,
        },
        aciklama: {
          type: String, // "Sabah Vardiyası", "Öğle Vardiyası" vb.
        },
      },
    ],
    // Değerlendirme periyodu (saat cinsinden)
    degerlendirmePeriyodu: {
      type: Number,
      default: 2, // Belirlenen saatten sonra kaç saat boyunca değerlendirme yapılabilir
      min: 1,
      max: 8,
    },
    // Haftalık değerlendirme günleri
    degerlendirmeGunleri: [
      {
        type: String,
        enum: [
          'Pazartesi',
          'Salı',
          'Çarşamba',
          'Perşembe',
          'Cuma',
          'Cumartesi',
          'Pazar',
        ],
      },
    ],
    // Değerlendirme sıklığı
    degerlendirmeSikligi: {
      type: String,
      enum: ['Günlük', 'Haftalık', 'Aylık', 'Özel'],
      default: 'Günlük',
    },
    olusturanKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guncelleyenKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

// İndeksler
qualityControlTemplateSchema.index({ rol: 1, aktif: 1 });
qualityControlTemplateSchema.index({ ad: 'text' });

module.exports = mongoose.model(
  'QualityControlTemplate',
  qualityControlTemplateSchema,
);
