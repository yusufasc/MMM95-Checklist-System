const mongoose = require('mongoose');
const Role = require('./models/Role');

async function createRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm');

    console.log('🔧 Roller oluşturuluyor...');

    // Admin Rolü
    const adminRole = new Role({
      ad: 'Admin',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Kullanıcı Yönetimi', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Rol Yönetimi', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Departman Yönetimi', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Checklist Yönetimi', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Görev Yönetimi', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Yaptım', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Envanter Yönetimi', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Kontrol Bekleyenler', gorebilir: true, duzenleyebilir: true },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: true },
      ],
      checklistYetkileri: [],
    });

    // Usta Rolü
    const ustaRole = new Role({
      ad: 'Usta',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Görev Yönetimi', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Yaptım', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Kontrol Bekleyenler', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Envanter Yönetimi', gorebilir: true, duzenleyebilir: false },
      ],
      checklistYetkileri: [],
    });

    // Paketlemeci Rolü
    const paketlemeciRole = new Role({
      ad: 'Paketlemeci',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Görev Yönetimi', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Yaptım', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Kontrol Bekleyenler', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: false },
      ],
      checklistYetkileri: [],
    });

    // Rolleri kaydet
    await Role.deleteMany({}); // Önce temizle
    const savedRoles = await Role.insertMany([adminRole, ustaRole, paketlemeciRole]);

    console.log('✅ Roller başarıyla oluşturuldu:');
    savedRoles.forEach(role => {
      console.log(`  - ${role.ad} (ID: ${role._id})`);
      console.log(`    Modül sayısı: ${role.modulePermissions.length}`);
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 MongoDB bağlantısı kapatıldı.');
  }
}

createRoles();
