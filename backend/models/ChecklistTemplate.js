const mongoose = require('mongoose');

const ChecklistTemplateSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
  },
  tur: {
    type: String,
    enum: ['rutin', 'iseBagli'],
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
