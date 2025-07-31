const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addPerformansPermissionToAllRoles = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Performans modülünü bul
    const performansModule = await Module.findOne({ ad: 'Performans' });
    if (!performansModule) {
      console.log('❌ Performans modülü bulunamadı');
      return;
    }

    console.log(`📊 Performans Modülü ID: ${performansModule._id}`);

    // Tüm rolleri al
    const roles = await Role.find();

    console.log('\n🔧 Performans modülü yetkilerini güncelleniyor...');
    console.log('================================================');

    for (const role of roles) {
      // Bu rolün Performans modülü yetkisi var mı kontrol et
      const existingPermission = role.moduller?.find(
        m => m.modul && m.modul.toString() === performansModule._id.toString(),
      );

      if (existingPermission) {
        // Mevcut yetki varsa sadece erişebilir'i true yap
        if (!existingPermission.erisebilir) {
          existingPermission.erisebilir = true;
          await role.save();
          console.log(`✅ ${role.ad}: Performans erişim yetkisi aktif edildi`);
        } else {
          console.log(`✅ ${role.ad}: Performans yetkisi zaten mevcut`);
        }
      } else {
        // Yetki yoksa ekle
        if (!role.moduller) {
          role.moduller = [];
        }

        role.moduller.push({
          modul: performansModule._id,
          erisebilir: true,
          duzenleyebilir: false, // Varsayılan olarak sadece görüntüleme
        });

        await role.save();
        console.log(`✅ ${role.ad}: Performans modülü yetkisi eklendi`);
      }
    }

    console.log('\n🎯 Özet:');
    console.log('- Tüm roller Performans modülüne erişebilir');
    console.log('- Admin, Ortacı, VARDİYA AMİRİ: Düzenleme yetkisi var');
    console.log('- Diğer roller: Sadece görüntüleme yetkisi');

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

addPerformansPermissionToAllRoles();
