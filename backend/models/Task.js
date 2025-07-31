const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
    required: true,
  },
  makina: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: false, // Eski görevler için zorunlu değil
  },
  maddeler: [
    {
      soru: {
        type: String,
        required: true,
      },
      cevap: {
        type: Boolean,
        default: false,
      },
      puan: {
        type: Number,
        default: 0,
      },
      maxPuan: {
        type: Number,
        default: 0,
      },
      kontrolPuani: {
        type: Number,
        default: null, // Kontrol eden kişinin verdiği puan
      },
      yorum: {
        type: String,
        default: '',
      },
      resimUrl: {
        type: String,
        default: '',
      },
      kontrolYorumu: {
        type: String,
        default: '',
      },
      kontrolResimUrl: {
        type: String,
        default: '',
      },
    },
  ],
  durum: {
    type: String,
    enum: ['bekliyor', 'baslatildi', 'tamamlandi', 'onaylandi', 'iadeEdildi'],
    default: 'bekliyor',
  },
  ustRol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: false,
  },
  ustDepartman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
  },
  toplamPuan: {
    type: Number,
    default: 0,
  },
  kontrolToplamPuani: {
    type: Number,
    default: null, // Kontrol eden kişinin verdiği toplam puan
  },
  kontrolTarihi: {
    type: Date,
  },
  kontrolNotu: {
    type: String,
    default: '',
  },
  kontroleden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  puanlayanKullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Periyodik görevler için eklenen alanlar
  periyot: {
    type: String,
    enum: ['gunluk', 'haftalik', 'aylik', 'olayBazli'],
    required: true,
  },
  hedefTarih: {
    type: Date,
    required: true,
  },
  sonTamamlanmaTarihi: {
    type: Date,
    required: false,
  },
  otomatikOlusturuldu: {
    type: Boolean,
    default: false,
  },
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  baslamaTarihi: {
    type: Date,
  },
  tamamlanmaTarihi: {
    type: Date,
  },
  onayTarihi: {
    type: Date,
  },
  onayNotu: {
    type: String,
  },
  onaylayan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  redTarihi: {
    type: Date,
  },
  redNotu: {
    type: String,
  },
  reddeden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Pre-save hook - durum değişikliklerini logla
TaskSchema.pre('save', function (next) {
  if (this.isModified('durum')) {
    console.log(`📝 Task ${this._id} durum değişikliği: ${this.durum}`);
  }
  next();
});

// Pre-update hook - durum değişikliklerini logla
TaskSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.durum) {
    console.log(`📝 Task güncelleme - Yeni durum: ${update.durum}`);
  }
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
