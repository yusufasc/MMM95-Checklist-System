const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

async function giveYaptimPermission() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Yaptım modülünü bul
    const yaptimModule = await Module.findOne({ ad: 'Yaptım' });
    if (!yaptimModule) {
      console.log('❌ Yaptım modülü bulunamadı');
      return;
    }

    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    // Yaptım modülü yetkisi var mı kontrol et
    const existingPermission = ortaciRole.moduller.find(
      m => m.modul.toString() === yaptimModule._id.toString(),
    );

    if (existingPermission) {
      console.log('ℹ️  Ortacı rolünde Yaptım modülü yetkisi zaten var');
      existingPermission.erisebilir = true;
      existingPermission.duzenleyebilir = true;
    } else {
      // Yeni yetki ekle
      ortaciRole.moduller.push({
        modul: yaptimModule._id,
        erisebilir: true,
        duzenleyebilir: true,
      });
      console.log('✅ Ortacı rolüne Yaptım modülü yetkisi eklendi');
    }

    await ortaciRole.save();
    console.log('💾 Değişiklikler kaydedildi');

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

giveYaptimPermission();
