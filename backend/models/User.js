const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
  },
  soyad: {
    type: String,
    required: true,
  },
  kullaniciAdi: {
    type: String,
    required: true,
    unique: true,
  },
  sifreHash: {
    type: String,
    required: true,
  },
  roller: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
  ],
  departmanlar: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
  ],
  secilenMakinalar: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
    },
  ],
  durum: {
    type: String,
    enum: ['aktif', 'pasif'],
    default: 'aktif',
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

module.exports = mongoose.model('User', UserSchema);
