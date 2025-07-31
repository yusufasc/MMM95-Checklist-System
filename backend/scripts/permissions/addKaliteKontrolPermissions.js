const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addKaliteKontrolPermissions = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    const kaliteKontrolRole = await Role.findOne({ ad: 'Kalite Kontrol' });

    if (!kaliteKontrolRole) {
      console.log('❌ Kalite Kontrol rolü bulunamadı');
      return;
    }

    // Kalite Kontrol için gerekli modüller
    const requiredModules = [
      { name: 'Dashboard', canEdit: true },
      { name: 'Kalite Kontrol', canEdit: true },
      { name: 'Kalite Kontrol Yönetimi', canEdit: true },
      { name: 'Performans', canEdit: true },
      { name: 'Kontrol Bekleyenler', canEdit: false }, // Sadece görüntüleme
      { name: 'Checklist Yönetimi', canEdit: false }, // Sadece görüntüleme
      { name: 'Envanter Yönetimi', canEdit: false }, // Sadece görüntüleme
    ];

    for (const moduleInfo of requiredModules) {
      const module = await Module.findOne({ ad: moduleInfo.name });
      if (!module) {
        console.log(`❌ ${moduleInfo.name} modülü bulunamadı`);
        continue;
      }

      const existingPermission = kaliteKontrolRole.moduller.find(
        m => m.modul.toString() === module._id.toString(),
      );

      if (existingPermission) {
        // Mevcut yetkiyi güncelle
        existingPermission.erisebilir = true;
        existingPermission.duzenleyebilir = moduleInfo.canEdit;
        console.log(
          `🔄 ${moduleInfo.name} yetkisi güncellendi (Düzenleme: ${moduleInfo.canEdit})`,
        );
      } else {
        // Yeni yetki ekle
        kaliteKontrolRole.moduller.push({
          modul: module._id,
          erisebilir: true,
          duzenleyebilir: moduleInfo.canEdit,
        });
        console.log(
          `➕ ${moduleInfo.name} yetkisi eklendi (Düzenleme: ${moduleInfo.canEdit})`,
        );
      }
    }

    await kaliteKontrolRole.save();
    console.log('\n✅ Kalite Kontrol rolü yetkileri başarıyla güncellendi');

    // Güncellenmiş yetkileri göster
    const updatedRole = await Role.findOne({ ad: 'Kalite Kontrol' }).populate(
      'moduller.modul',
      'ad',
    );
    console.log('\n📋 Güncellenmiş Kalite Kontrol Yetkileri:');
    updatedRole.moduller.forEach((permission, index) => {
      if (permission.erisebilir) {
        console.log(
          `  ${index + 1}. ${permission.modul.ad}: ${permission.duzenleyebilir ? 'Tam Yetki' : 'Sadece Görüntüleme'}`,
        );
      }
    });

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

addKaliteKontrolPermissions();
