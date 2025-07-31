const mongoose = require('mongoose');

const qualityControlEvaluationSchema = new mongoose.Schema(
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
      ref: 'QualityControlTemplate',
      required: true,
    },
    makina: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: false,
    },
    kalip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
    },
    hammadde: {
      type: String,
      trim: true,
    },
    vardiya: {
      type: String,
      enum: ['Sabah', 'Öğle', 'Akşam', 'Gece'],
      required: true,
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
    durum: {
      type: String,
      enum: ['Tamamlandı', 'Taslak'],
      default: 'Tamamlandı',
    },
    notlar: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// İndeksler
qualityControlEvaluationSchema.index({
  degerlendirilenKullanici: 1,
  degerlendirmeTarihi: -1,
});
qualityControlEvaluationSchema.index({
  degerlendirenKullanici: 1,
  degerlendirmeTarihi: -1,
});
qualityControlEvaluationSchema.index({ makina: 1, degerlendirmeTarihi: -1 });
qualityControlEvaluationSchema.index({ basariYuzdesi: 1 });

// Toplam puan ve başarı yüzdesini hesapla
qualityControlEvaluationSchema.pre('save', function (next) {
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

module.exports = mongoose.model(
  'QualityControlEvaluation',
  qualityControlEvaluationSchema,
);
