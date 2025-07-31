const mongoose = require('mongoose');

const controlScoreSchema = new mongoose.Schema(
  {
    // ✅ Puanlama yapan kullanıcı (VARDİYA AMİRİ, Usta vb.)
    // Bu kişi kontrol puanını alır (my-activity → kontrol puanlarım)
    puanlayanKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Puanlanan görev (Task veya WorkTask)
    puanlananTask: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Görev tipi
    gorevTipi: {
      type: String,
      enum: [
        'Task',
        'WorkTask',
        'WorkTask-Buddy',
        'Task-Checklist',
        'Task-Control',
      ],
      required: true,
    },

    // Checklist şablonu
    sablon: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Şablon tipi
    sablonTipi: {
      type: String,
      enum: ['ChecklistTemplate', 'HRTemplate', 'QualityControlTemplate'],
      required: true,
    },

    // Kontrol puanı (puanlama yapan kişiye verilen puan)
    kontrolPuani: {
      type: Number,
      required: true,
      min: 0,
    },

    // Puanlama tarihi
    puanlamaTarihi: {
      type: Date,
      default: Date.now,
    },

    // Açıklama
    aciklama: {
      type: String,
      default: '',
    },

    // Şablon adı (hızlı erişim için)
    sablonAdi: {
      type: String,
      required: true,
    },

    // ✅ DÜZELTME: Bu field artık puanlama yapan kişiyi gösteriyor
    // Kontrol puanını alan kişi (puanlayanKullanici ile aynı)
    // Backward compatibility için korunuyor
    puanlananKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Aktif durum
    aktif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index'ler
controlScoreSchema.index({ puanlayanKullanici: 1, puanlamaTarihi: -1 });
controlScoreSchema.index({ puanlananTask: 1 });
controlScoreSchema.index({ sablon: 1 });

module.exports = mongoose.model('ControlScore', controlScoreSchema);
