const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addPaketlemeciPermissions = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });

    if (!paketlemeciRole) {
      console.log('❌ Paketlemeci rolü bulunamadı');
      return;
    }

    // Paketlemeci için gerekli modüller
    const requiredModules = [
      { name: 'Dashboard', canEdit: true },
      { name: 'Görev Yönetimi', canEdit: true },
      { name: 'Kontrol Bekleyenler', canEdit: true },
      { name: 'Performans', canEdit: true },
      { name: 'Yaptım', canEdit: true },
      { name: 'Envanter Yönetimi', canEdit: false },
    ];

    console.log('📋 Paketlemeci için gerekli modüller ekleniyor...');

    for (const moduleConfig of requiredModules) {
      const module = await Module.findOne({ ad: moduleConfig.name });
      if (!module) {
        console.log(`⚠️ Modül bulunamadı: ${moduleConfig.name}`);
        continue;
      }

      // Mevcut yetki var mı kontrol et
      const existingPermission = paketlemeciRole.moduller.find(
        m => m.modul.toString() === module._id.toString(),
      );

      if (existingPermission) {
        // Mevcut yetkiyi güncelle
        existingPermission.erisebilir = true;
        existingPermission.duzenleyebilir = moduleConfig.canEdit;
        console.log(
          `🔄 Güncellendi: ${moduleConfig.name} (${moduleConfig.canEdit ? 'Tam Yetki' : 'Sadece Görüntüleme'})`,
        );
      } else {
        // Yeni yetki ekle
        paketlemeciRole.moduller.push({
          modul: module._id,
          erisebilir: true,
          duzenleyebilir: moduleConfig.canEdit,
        });
        console.log(
          `➕ Eklendi: ${moduleConfig.name} (${moduleConfig.canEdit ? 'Tam Yetki' : 'Sadece Görüntüleme'})`,
        );
      }
    }

    await paketlemeciRole.save();
    console.log('✅ Paketlemeci rol yetkileri güncellendi');

    // Güncellenmiş yetkileri göster
    console.log('\n📋 Güncellenmiş Paketlemeci Yetkileri:');
    const updatedRole = await Role.findOne({ ad: 'Paketlemeci' }).populate(
      'moduller.modul',
      'ad',
    );

    requiredModules.forEach(moduleConfig => {
      const permission = updatedRole.moduller.find(
        m => m.modul?.ad === moduleConfig.name,
      );

      if (permission) {
        console.log(
          `✅ ${moduleConfig.name}: ${permission.erisebilir ? 'Erişebilir' : 'Erişemez'} (${permission.duzenleyebilir ? 'Düzenleyebilir' : 'Sadece Görüntüleme'})`,
        );
      } else {
        console.log(`❌ ${moduleConfig.name}: Yetki bulunamadı`);
      }
    });

    await mongoose.connection.close();
    console.log('\n🎯 Paketlemeci dashboard artık tam erişim sağlayabilir!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

addPaketlemeciPermissions();
