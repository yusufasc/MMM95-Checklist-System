const mongoose = require('mongoose');

const bonusEvaluationTemplateSchema = new mongoose.Schema(
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
    // Bonus kategorisi
    bonusKategorisi: {
      type: String,
      enum: [
        'Performans',
        'İnovasyon',
        'Takım Çalışması',
        'Liderlik',
        'Özel Başarı',
        'Performans Bonusu',
        'Verimlilik Bonusu',
        'Günlük Bonus',
      ],
      default: 'Performans',
    },
    // Bonus çarpanı
    bonusCarpani: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 5.0,
    },
    // Değerlendirme periyodu (gün olarak)
    degerlendirmePeriyodu: {
      type: Number,
      default: 30, // 30 gün = Aylık
      min: 1,
      max: 365,
    },
    // Minimum puan şartı
    minimumPuan: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    // Değerlendirme sıklığı
    degerlendirmeSikligi: {
      type: String,
      enum: ['Aylık', 'Üç Aylık', 'Altı Aylık', 'Yıllık'],
      default: 'Aylık',
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
bonusEvaluationTemplateSchema.index({ rol: 1, aktif: 1 });
bonusEvaluationTemplateSchema.index({ ad: 'text' });
bonusEvaluationTemplateSchema.index({ bonusKategorisi: 1 });

module.exports = mongoose.model(
  'BonusEvaluationTemplate',
  bonusEvaluationTemplateSchema,
);
