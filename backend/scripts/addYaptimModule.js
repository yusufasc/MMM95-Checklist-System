const mongoose = require('mongoose');
const Module = require('../models/Module');

async function addYaptimModule() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Yaptım modülü var mı kontrol et
    const existingModule = await Module.findOne({ ad: 'Yaptım' });
    if (existingModule) {
      console.log('ℹ️  Yaptım modülü zaten mevcut');
      mongoose.disconnect();
      return;
    }

    // Yeni modül oluştur
    const yaptimModule = new Module({
      ad: 'Yaptım',
      aciklama: 'İşe bağlı checklistleri doldurma ve tamamlama modülü',
      aktif: true,
    });

    await yaptimModule.save();
    console.log('✅ Yaptım modülü başarıyla eklendi');

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

addYaptimModule();
