const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addEnvanterPermissionToVardiyaAmiri = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    const vardiyaAmiriRole = await Role.findOne({ ad: 'VARDİYA AMİRİ' });
    const envanterModule = await Module.findOne({ ad: 'Envanter Yönetimi' });

    if (!vardiyaAmiriRole) {
      console.log('❌ VARDİYA AMİRİ rolü bulunamadı');
      return;
    }

    if (!envanterModule) {
      console.log('❌ Envanter Yönetimi modülü bulunamadı');
      return;
    }

    console.log(
      '📋 VARDİYA AMİRİ rolüne Envanter Yönetimi yetkisi ekleniyor...',
    );

    // Mevcut yetki var mı kontrol et
    const existingPermission = vardiyaAmiriRole.moduller?.find(
      m => m.modul && m.modul.toString() === envanterModule._id.toString(),
    );

    if (existingPermission) {
      // Mevcut yetki varsa güncelle
      existingPermission.erisebilir = true;
      existingPermission.duzenleyebilir = false; // Sadece görüntüleme yetkisi
      console.log('✅ Mevcut Envanter Yönetimi yetkisi güncellendi');
    } else {
      // Yeni yetki ekle
      if (!vardiyaAmiriRole.moduller) {
        vardiyaAmiriRole.moduller = [];
      }

      vardiyaAmiriRole.moduller.push({
        modul: envanterModule._id,
        erisebilir: true,
        duzenleyebilir: false, // Sadece görüntüleme yetkisi
      });

      console.log('✅ Yeni Envanter Yönetimi yetkisi eklendi');
    }

    await vardiyaAmiriRole.save();

    console.log('\n🎯 VARDİYA AMİRİ Rolü Envanter Yönetimi Yetkisi:');
    console.log('   - Erişebilir: ✅');
    console.log('   - Düzenleyebilir: ❌ (Sadece görüntüleme)');
    console.log('\n📝 Bu yetki ile VARDİYA AMİRİ rolü:');
    console.log('   - Dashboard\'da makina durumunu görebilir');
    console.log('   - Envanter listelerini görüntüleyebilir');
    console.log('   - Makina seçimi yapabilir');

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

addEnvanterPermissionToVardiyaAmiri();
