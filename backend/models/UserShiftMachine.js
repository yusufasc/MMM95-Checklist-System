const mongoose = require('mongoose');

const UserShiftMachineSchema = new mongoose.Schema({
  kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  secilenMakinalar: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
    },
  ],
  vardiyaBaslangic: {
    type: Date,
    required: true,
  },
  vardiyaBitis: {
    type: Date,
    required: true,
  },
  vardiyaTipi: {
    type: String,
    enum: ['Gunduz', 'Gece'],
    required: true,
  },
  aktif: {
    type: Boolean,
    default: true,
  },
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
});

// Index'ler
UserShiftMachineSchema.index({ kullanici: 1, vardiyaBaslangic: 1 });
UserShiftMachineSchema.index({ kullanici: 1, aktif: 1 });

// Vardiya türünü otomatik belirleyen static method
UserShiftMachineSchema.statics.belirleVardiyaTipi = function (saat) {
  // 08:00 - 20:00 arası Gündüz vardiyası
  // 20:00 - 08:00 arası Gece vardiyası
  return saat >= 8 && saat < 20 ? 'Gunduz' : 'Gece';
};

// Aktif vardiya getiren static method
UserShiftMachineSchema.statics.getAktifVardiya = async function (kullaniciId) {
  const simdi = new Date();

  return await this.findOne({
    kullanici: kullaniciId,
    vardiyaBaslangic: { $lte: simdi },
    vardiyaBitis: { $gte: simdi },
    aktif: true,
  }).populate('secilenMakinalar');
};

// Yeni vardiya oluşturan static method
UserShiftMachineSchema.statics.olusturVardiya = async function (
  kullaniciId,
  makinalar,
) {
  const simdi = new Date();
  const saat = simdi.getHours();

  let vardiyaBaslangic, vardiyaBitis;

  if (saat >= 8 && saat < 20) {
    // Gündüz vardiyası: 08:00 - 20:00
    vardiyaBaslangic = new Date(simdi);
    vardiyaBaslangic.setHours(8, 0, 0, 0);

    vardiyaBitis = new Date(simdi);
    vardiyaBitis.setHours(20, 0, 0, 0);
  } else {
    // Gece vardiyası: 20:00 - 08:00 (ertesi gün)
    if (saat >= 20) {
      // Akşam 20:00'dan sonra
      vardiyaBaslangic = new Date(simdi);
      vardiyaBaslangic.setHours(20, 0, 0, 0);

      vardiyaBitis = new Date(simdi);
      vardiyaBitis.setDate(vardiyaBitis.getDate() + 1);
      vardiyaBitis.setHours(8, 0, 0, 0);
    } else {
      // Gece yarısından sonra sabah 08:00'e kadar
      vardiyaBaslangic = new Date(simdi);
      vardiyaBaslangic.setDate(vardiyaBaslangic.getDate() - 1);
      vardiyaBaslangic.setHours(20, 0, 0, 0);

      vardiyaBitis = new Date(simdi);
      vardiyaBitis.setHours(8, 0, 0, 0);
    }
  }

  const vardiyaTipi = this.belirleVardiyaTipi(saat);

  // Mevcut aktif vardiyayı pasif yap
  await this.updateMany(
    { kullanici: kullaniciId, aktif: true },
    { aktif: false },
  );

  // Yeni vardiya oluştur
  return await this.create({
    kullanici: kullaniciId,
    secilenMakinalar: makinalar,
    vardiyaBaslangic,
    vardiyaBitis,
    vardiyaTipi,
    aktif: true,
  });
};

module.exports = mongoose.model('UserShiftMachine', UserShiftMachineSchema);
