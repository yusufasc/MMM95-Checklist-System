const mongoose = require('mongoose');
const Role = require('./models/Role');

async function listAllRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm');

    console.log('📋 Sistemdeki tüm roller:');

    const roles = await Role.find({}).select('ad modulePermissions');

    if (roles.length === 0) {
      console.log('❌ Hiç rol bulunamadı!');
      return;
    }

    roles.forEach((role, index) => {
      console.log(`\n${index + 1}. ${role.ad} (ID: ${role._id})`);
      console.log('   Modül yetkileri:');
      if (role.modulePermissions && role.modulePermissions.length > 0) {
        role.modulePermissions.forEach(permission => {
          console.log(
            `     - ${permission.moduleName}: görme=${permission.gorebilir}, düzenleme=${permission.duzenleyebilir}`,
          );
        });
      } else {
        console.log('     - Hiç modül yetkisi yok');
      }
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 MongoDB bağlantısı kapatıldı.');
  }
}

listAllRoles();
