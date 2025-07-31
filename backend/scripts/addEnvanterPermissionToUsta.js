const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addEnvanterPermissionToUsta = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    const ustaRole = await Role.findOne({ ad: 'Usta' });
    const envanterModule = await Module.findOne({ ad: 'Envanter Yönetimi' });

    if (!ustaRole) {
      console.log('❌ Usta rolü bulunamadı');
      return;
    }

    if (!envanterModule) {
      console.log('❌ Envanter Yönetimi modülü bulunamadı');
      return;
    }

    console.log('📋 Usta rolüne Envanter Yönetimi yetkisi ekleniyor...');

    // Mevcut yetki var mı kontrol et
    const existingPermission = ustaRole.moduller?.find(
      m => m.modul && m.modul.toString() === envanterModule._id.toString(),
    );

    if (existingPermission) {
      // Mevcut yetki varsa güncelle
      existingPermission.erisebilir = true;
      existingPermission.duzenleyebilir = false; // Sadece görüntüleme yetkisi
      console.log('✅ Mevcut Envanter Yönetimi yetkisi güncellendi');
    } else {
      // Yeni yetki ekle
      if (!ustaRole.moduller) {
        ustaRole.moduller = [];
      }

      ustaRole.moduller.push({
        modul: envanterModule._id,
        erisebilir: true,
        duzenleyebilir: false, // Sadece görüntüleme yetkisi
      });

      console.log('✅ Yeni Envanter Yönetimi yetkisi eklendi');
    }

    await ustaRole.save();

    console.log('\n🎯 Usta Rolü Envanter Yönetimi Yetkisi:');
    console.log('   - Erişebilir: ✅');
    console.log('   - Düzenleyebilir: ❌ (Sadece görüntüleme)');
    console.log('\n📝 Bu yetki ile Usta rolü:');
    console.log('   - Dashboard\'da makina durumunu görebilir');
    console.log('   - Envanter sayfasına erişebilir');
    console.log('   - Makina listesini görüntüleyebilir');

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

addEnvanterPermissionToUsta();
