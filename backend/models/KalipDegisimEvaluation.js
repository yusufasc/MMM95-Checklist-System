const mongoose = require('mongoose');

const KalipDegisimEvaluationSchema = new mongoose.Schema({
  // WorkTask referansı (kalıp değişim işlemi)
  workTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkTask',
    required: true,
  },
  // Değerlendirme şablonu
  checklistTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
    required: true,
  },
  // Değerlendiren kişi
  degerlendiren: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Ana çalışan (kalıp değişimini yapan)
  anaCalisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Buddy çalışan (yardımcı)
  buddyCalisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  // Makina
  makina: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  // Değerlendirme maddeleri
  maddeler: [
    {
      maddeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      soru: {
        type: String,
        required: true,
      },
      maxPuan: {
        type: Number,
        required: true,
      },
      verilenPuan: {
        type: Number,
        required: true,
        min: 0,
      },
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
  // Puanlama bilgileri
  anaCalısanToplamPuan: {
    type: Number,
    required: true,
    default: 0,
  },
  buddyToplamPuan: {
    type: Number,
    default: 0,
  },
  maxToplamPuan: {
    type: Number,
    required: true,
  },
  // Değerlendirme bilgileri
  degerlendirmeTarihi: {
    type: Date,
    default: Date.now,
  },
  genelYorum: {
    type: String,
    default: '',
  },
  // Değerlendirme tipi (hangi şablon - 1 veya 2)
  degerlendirmeTipi: {
    type: String,
    enum: ['DEGERLENDIRME_1', 'DEGERLENDIRME_2'],
    required: true,
  },
  aktif: {
    type: Boolean,
    default: true,
  },
});

// Unique constraint: Aynı WorkTask için aynı degerlendirmeTipi sadece 1 kere
KalipDegisimEvaluationSchema.index(
  { workTask: 1, degerlendirmeTipi: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  'KalipDegisimEvaluation',
  KalipDegisimEvaluationSchema,
);
