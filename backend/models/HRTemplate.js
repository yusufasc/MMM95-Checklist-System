const mongoose = require('mongoose');

const hrTemplateSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
    trim: true,
  },
  aciklama: {
    type: String,
    trim: true,
  },
  maddeler: [
    {
      baslik: {
        type: String,
        required: true,
      },
      aciklama: String,
      puan: {
        type: Number,
        required: true,
        default: 0, // + veya - değer olabilir
      },
      periyot: {
        type: String,
        enum: ['gunluk', 'haftalik', 'aylik'],
        required: true,
        default: 'aylik',
      },
      aktif: {
        type: Boolean,
        default: true,
      },
      siraNo: {
        type: Number,
        default: 0,
      },
    },
  ],
  hedefRoller: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
  ],
  // Kontrol puanı - Bu şablonu puanlayan kişiye verilecek puan
  kontrolPuani: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  aktif: {
    type: Boolean,
    default: true,
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

// Update timestamp on save
hrTemplateSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();
  next();
});

module.exports = mongoose.model('HRTemplate', hrTemplateSchema);
