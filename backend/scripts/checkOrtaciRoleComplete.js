const mongoose = require('mongoose');
const Role = require('../models/Role');

const checkOrtaciRoleComplete = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const ortaciRole = await Role.findOne({ ad: 'Ortacı' }).populate(
      'checklistYetkileri.hedefRol',
      'ad',
    );

    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    console.log('🔍 Ortacı rolü tam checklist yetkileri:');
    console.log('📋 Toplam yetki sayısı:', ortaciRole.checklistYetkileri.length);

    ortaciRole.checklistYetkileri.forEach((yetki, index) => {
      console.log(`  ${index + 1}: ${yetki.hedefRol.ad}`);
      console.log(`     ➡️ gorebilir: ${yetki.gorebilir}`);
      console.log(`     ➡️ onaylayabilir: ${yetki.onaylayabilir}`);
      console.log('     ---');
    });

    // Tüm rolleri listele
    console.log('\n🌍 Sistemdeki tüm roller:');
    const allRoles = await Role.find({}, 'ad').sort({ ad: 1 });
    allRoles.forEach(role => {
      console.log(`  - ${role.ad} (${role._id})`);
    });

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
};

checkOrtaciRoleComplete();
