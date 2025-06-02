const mongoose = require('mongoose');
const Module = require('../models/Module');

const addEnvanterModule = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Envanter Yönetimi modülü var mı kontrol et
    const existingModule = await Module.findOne({ ad: 'Envanter Yönetimi' });

    if (existingModule) {
      console.log('ℹ️  Envanter Yönetimi modülü zaten mevcut');
    } else {
      // Yeni modül oluştur
      const envanterModule = new Module({
        ad: 'Envanter Yönetimi',
        aciklama: 'Envanter ve stok yönetimi',
        aktif: true,
      });

      await envanterModule.save();
      console.log('✅ Envanter Yönetimi modülü başarıyla eklendi');
      console.log('📦 ID:', envanterModule._id);
    }

    // Tüm modülleri listele
    const modules = await Module.find({});
    console.log('📦 Güncel modül sayısı:', modules.length);

    modules.forEach((module, index) => {
      console.log(`📦 ${index + 1}. ${module.ad} (ID: ${module._id})`);
    });

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
};

addEnvanterModule();
