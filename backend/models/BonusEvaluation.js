const mongoose = require('mongoose');

const bonusEvaluationSchema = new mongoose.Schema(
  {
    degerlendirilenKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    degerlendirenKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sablon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BonusEvaluationTemplate',
      required: true,
    },
    // Bonus evaluations don't need machine/kalip but can have department context
    departman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    // Değerlendirme dönemi
    degerlendirmeDonemi: {
      type: String,
      required: true, // "2025-01", "2025-Q1", "2025" formatında
    },
    degerlendirmeTarihi: {
      type: Date,
      default: Date.now,
    },
    puanlamalar: [
      {
        maddeId: {
          type: String,
          required: true,
        },
        maddeBaslik: {
          type: String,
          required: true,
        },
        puan: {
          type: Number,
          required: true,
          min: 0,
        },
        maksimumPuan: {
          type: Number,
          required: true,
        },
        aciklama: {
          type: String,
        },
        fotograflar: [
          {
            type: String, // Base64 encoded images
          },
        ],
      },
    ],
    toplamPuan: {
      type: Number,
      default: 0,
    },
    maksimumPuan: {
      type: Number,
      default: 0,
    },
    basariYuzdesi: {
      type: Number,
      default: 0,
    },
    // Bonus-specific fields
    bonusMiktari: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusOnayi: {
      type: String,
      enum: ['Beklemede', 'Onaylandı', 'Reddedildi'],
      default: 'Beklemede',
    },
    onaylayanKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    onayTarihi: {
      type: Date,
    },
    durum: {
      type: String,
      enum: ['Tamamlandı', 'Taslak'],
      default: 'Tamamlandı',
    },
    notlar: {
      type: String,
    },
    // Üretim müdürü yorumları
    yoneticiYorumu: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// İndeksler
bonusEvaluationSchema.index({
  degerlendirilenKullanici: 1,
  degerlendirmeTarihi: -1,
});
bonusEvaluationSchema.index({
  degerlendirenKullanici: 1,
  degerlendirmeTarihi: -1,
});
bonusEvaluationSchema.index({ departman: 1, degerlendirmeTarihi: -1 });
bonusEvaluationSchema.index({ basariYuzdesi: 1 });
bonusEvaluationSchema.index({ bonusOnayi: 1 });
bonusEvaluationSchema.index({ degerlendirmeDonemi: 1 });

// Toplam puan, başarı yüzdesi ve bonus miktarını hesapla
bonusEvaluationSchema.pre('save', function (next) {
  if (this.puanlamalar && this.puanlamalar.length > 0) {
    this.toplamPuan = this.puanlamalar.reduce(
      (sum, p) => sum + (p.puan || 0),
      0,
    );
    this.maksimumPuan = this.puanlamalar.reduce(
      (sum, p) => sum + (p.maksimumPuan || 0),
      0,
    );
    this.basariYuzdesi =
      this.maksimumPuan > 0
        ? Math.round((this.toplamPuan / this.maksimumPuan) * 100)
        : 0;
  }
  next();
});

module.exports = mongoose.model('BonusEvaluation', bonusEvaluationSchema);
