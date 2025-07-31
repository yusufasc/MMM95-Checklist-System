const mongoose = require('mongoose');

const ChecklistTemplateSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
  },
  tur: {
    type: String,
    enum: ['rutin', 'iseBagli', 'makina_ayarlari_1', 'makina_ayarlari_2'],
    required: true,
  },
  hedefRol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  hedefDepartman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  maddeler: [
    {
      soru: {
        type: String,
        required: true,
      },
      puan: {
        type: Number,
        required: true,
        default: 1,
      },
      resimUrl: {
        type: String,
        default: '',
      },
      aciklama: {
        type: String,
        default: '',
      },
      fotografGereklimi: {
        type: Boolean,
        default: false,
      },
      zorunlu: {
        type: Boolean,
        default: true,
      },
    },
  ],
  periyot: {
    type: String,
    enum: ['gunluk', 'haftalik', 'aylik', 'olayBazli'],
    required: true,
  },
  isTuru: {
    type: String,
    required: false, // İşe bağlı checklistler için (örn: "Kalıp Değişim", "Makine Arızası")
  },
  kategori: {
    type: String,
    enum: ['IK', 'Kalite', 'Checklist'],
    default: 'Checklist',
  },
  // Değerlendirme saatleri
  degerlendirmeSaatleri: [
    {
      saat: {
        type: String, // "08:00" formatında
        required: true,
      },
      aciklama: {
        type: String, // "Sabah Vardiyası", "Öğle Vardiyası" vb.
      },
    },
  ],
  // Değerlendirme periyodu (saat cinsinden)
  degerlendirmePeriyodu: {
    type: Number,
    default: 2, // Belirlenen saatten sonra kaç saat boyunca değerlendirme yapılabilir
    min: 1,
    max: 8,
  },
  // Haftalık değerlendirme günleri
  degerlendirmeGunleri: [
    {
      type: String,
      enum: [
        'Pazartesi',
        'Salı',
        'Çarşamba',
        'Perşembe',
        'Cuma',
        'Cumartesi',
        'Pazar',
      ],
    },
  ],
  // Değerlendirme sıklığı
  degerlendirmeSikligi: {
    type: String,
    enum: ['Günlük', 'Haftalık', 'Aylık', 'Özel'],
    default: 'Günlük',
  },
  // Değerlendirme yapabilecek roller
  degerlendirmeRolleri: [
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
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
