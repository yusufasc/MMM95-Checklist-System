const mongoose = require('mongoose');

const InventoryFieldTemplateSchema = new mongoose.Schema({
  kategoriId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCategory',
    required: true,
  },
  alanAdi: {
    type: String,
    required: true,
    trim: true,
  },
  alanTipi: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'boolean', 'textarea', 'email', 'url'],
    default: 'text',
  },
  zorunlu: {
    type: Boolean,
    default: false,
  },
  varsayilanDeger: {
    type: String,
    trim: true,
  },
  secenekler: [
    {
      type: String,
      trim: true,
    },
  ], // select tipindeki alanlar için
  siraNo: {
    type: Number,
    default: 0,
  },
  grup: {
    type: String,
    trim: true,
    default: 'Genel Bilgiler',
  },
  aktif: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    trim: true,
  },
  validasyon: {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String,
  },
  olusturanKullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

// Unique index - aynı kategoride aynı alan adı olmasın
InventoryFieldTemplateSchema.index({ kategoriId: 1, alanAdi: 1 }, { unique: true });

// Güncelleme tarihini otomatik ayarla
InventoryFieldTemplateSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

module.exports = mongoose.model('InventoryFieldTemplate', InventoryFieldTemplateSchema);
