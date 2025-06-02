const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
    trim: true,
  },
  makinaNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  departman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  sorumluRoller: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
  ],
  durum: {
    type: String,
    enum: ['aktif', 'bakim', 'arizali', 'pasif'],
    default: 'aktif',
  },
  aciklama: {
    type: String,
    trim: true,
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
MachineSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

module.exports = mongoose.model('Machine', MachineSchema);
