const mongoose = require('mongoose');

const hrScoreSchema = new mongoose.Schema({
  kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  donem: {
    yil: {
      type: Number,
      required: true,
    },
    ay: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
  },

  // Checklist Puanları
  checklistPuanlari: [
    {
      sablon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HRTemplate',
        required: true,
      },
      madde: {
        baslik: String,
        puan: Number,
      },
      periyot: {
        type: String,
        enum: ['gunluk', 'haftalik', 'aylik'],
      },
      tarih: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Fazla Mesai Kayıtları
  mesaiKayitlari: [
    {
      tarih: {
        type: Date,
        required: true,
      },
      saat: {
        type: Number,
        required: true,
        min: 0,
      },
      puan: {
        type: Number,
        required: true,
      },
      aciklama: String,
      olusturanKullanici: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],

  // Devamsızlık Kayıtları
  devamsizlikKayitlari: [
    {
      tarih: {
        type: Date,
        required: true,
      },
      tur: {
        type: String,
        enum: ['tam_gun', 'saat'],
        required: true,
      },
      miktar: {
        type: Number,
        required: true,
        min: 0,
      },
      puan: {
        type: Number,
        required: true,
      },
      aciklama: String,
      olusturanKullanici: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],

  // Diğer Modüllerden Gelen Puanlar
  digerModulPuanlari: [
    {
      modul: {
        type: String,
        enum: ['QualityControl', 'Task', 'WorkTask', 'Checklist'],
      },
      puan: Number,
      aciklama: String,
      tarih: {
        type: Date,
        default: Date.now,
      },
      kaynak: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'digerModulPuanlari.modul',
      },
    },
  ],

  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

// Toplam puanları hesaplayan virtual field
hrScoreSchema.virtual('toplamPuanlar').get(function () {
  const checklistPuani = this.checklistPuanlari.reduce(
    (total, item) => total + (item.madde.puan || 0),
    0,
  );
  const mesaiPuani = this.mesaiKayitlari.reduce((total, item) => total + (item.puan || 0), 0);
  const devamsizlikPuani = this.devamsizlikKayitlari.reduce(
    (total, item) => total + (item.puan || 0),
    0,
  );
  const digerModulPuani = this.digerModulPuanlari.reduce(
    (total, item) => total + (item.puan || 0),
    0,
  );

  return {
    checklistPuani,
    mesaiPuani,
    devamsizlikPuani,
    digerModulPuani,
    genelToplam: checklistPuani + mesaiPuani + devamsizlikPuani + digerModulPuani,
  };
});

// Virtual field'ları JSON'a dahil et
hrScoreSchema.set('toJSON', { virtuals: true });
hrScoreSchema.set('toObject', { virtuals: true });

// Update timestamp on save
hrScoreSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

// Compound index for unique user-period combination
hrScoreSchema.index({ kullanici: 1, 'donem.yil': 1, 'donem.ay': 1 }, { unique: true });

// Index for queries
hrScoreSchema.index({ 'donem.yil': 1, 'donem.ay': 1 });
hrScoreSchema.index({ kullanici: 1 });

module.exports = mongoose.model('HRScore', hrScoreSchema);
