const mongoose = require('mongoose');

const InventoryCategorySchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  aciklama: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    default: 'inventory',
  },
  renk: {
    type: String,
    default: '#1976d2',
  },
  aktif: {
    type: Boolean,
    default: true,
  },
  siraNo: {
    type: Number,
    default: 0,
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

// Güncelleme tarihini otomatik ayarla
InventoryCategorySchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

module.exports = mongoose.model('InventoryCategory', InventoryCategorySchema);
