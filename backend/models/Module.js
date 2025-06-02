const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
    unique: true,
  },
  aciklama: {
    type: String,
    required: false,
  },
  ikon: {
    type: String,
    required: false,
  },
  route: {
    type: String,
    required: false,
  },
  aktif: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model('Module', ModuleSchema);
