const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addEnvanterToOrtaci = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    // Envanter Yönetimi modülünü bul
    const envanterModule = await Module.findOne({ ad: 'Envanter Yönetimi' });
    if (!envanterModule) {
      console.log('❌ Envanter Yönetimi modülü bulunamadı');
      return;
    }

    console.log('✅ Ortacı rolü bulundu:', ortaciRole.ad);
    console.log('✅ Envanter Yönetimi modülü bulundu:', envanterModule.ad);

    // Ortacı rolünde Envanter Yönetimi modülü var mı kontrol et
    const existingModule = ortaciRole.moduller.find(
      m => m.modul.toString() === envanterModule._id.toString(),
    );

    if (existingModule) {
      console.log('ℹ️  Ortacı rolünde Envanter Yönetimi modülü zaten mevcut');
    } else {
      // Envanter Yönetimi modülünü Ortacı rolüne ekle
      ortaciRole.moduller.push({
        modul: envanterModule._id,
        erisebilir: true,
        duzenleyebilir: true,
      });

      await ortaciRole.save();
      console.log('✅ Ortacı rolüne Envanter Yönetimi modülü eklendi');
    }

    // Ortacı rolünün güncel modüllerini listele
    const updatedRole = await Role.findOne({ ad: 'Ortacı' }).populate(
      'moduller.modul',
      'ad',
    );

    console.log('📦 Ortacı rolünün modülleri:');
    updatedRole.moduller.forEach((modulePermission, index) => {
      console.log(`📦 ${index + 1}. ${modulePermission.modul.ad}`);
      console.log(`   Erişebilir: ${modulePermission.erisebilir}`);
      console.log(`   Düzenleyebilir: ${modulePermission.duzenleyebilir}`);
    });

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
};

addEnvanterToOrtaci();
