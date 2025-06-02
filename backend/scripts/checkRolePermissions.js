const mongoose = require('mongoose');
const Role = require('../models/Role');

async function checkRolePermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı: mmm-checklist');

    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' }).populate(
      'checklistYetkileri.hedefRol',
      'ad',
    );

    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    console.log(`📋 Ortacı rolü (ID: ${ortaciRole._id}):`);
    console.log(`  - Ad: ${ortaciRole.ad}`);
    console.log(`  - Checklist yetkileri sayısı: ${ortaciRole.checklistYetkileri?.length || 0}`);

    if (ortaciRole.checklistYetkileri && ortaciRole.checklistYetkileri.length > 0) {
      console.log('\n📋 Checklist yetkileri detayı:');
      ortaciRole.checklistYetkileri.forEach((yetki, index) => {
        console.log(
          `  ${index + 1}. Hedef Rol: ${yetki.hedefRol?.ad || 'Bilinmeyen'} (ID: ${yetki.hedefRol?._id})`,
        );
        console.log(`     └─ Görebilir: ${yetki.gorebilir}`);
        console.log(`     └─ Puanlayabilir: ${yetki.puanlayabilir}`);
        console.log(`     └─ Onaylayabilir: ${yetki.onaylayabilir || 'undefined'}`);
      });
    } else {
      console.log('❌ Checklist yetkileri boş!');
    }

    // Paketlemeci rolünü de kontrol et
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    if (paketlemeciRole) {
      console.log(`\n📋 Paketlemeci rol ID: ${paketlemeciRole._id}`);

      // Ortacı'nın Paketlemeci'yi görebilir mi kontrol et
      const paketlemeciYetkisi = ortaciRole.checklistYetkileri?.find(
        yetki => yetki.hedefRol?._id.toString() === paketlemeciRole._id.toString(),
      );

      if (paketlemeciYetkisi) {
        console.log('✅ Ortacı\'nın Paketlemeci yetkisi var:');
        console.log(`   └─ Görebilir: ${paketlemeciYetkisi.gorebilir}`);
        console.log(`   └─ Puanlayabilir: ${paketlemeciYetkisi.puanlayabilir}`);
      } else {
        console.log('❌ Ortacı\'nın Paketlemeci yetkisi YOK!');
      }
    }

    // Tüm rolleri listele
    console.log('\n📋 Sistemdeki tüm roller:');
    const allRoles = await Role.find({}).select('ad _id');
    allRoles.forEach(role => {
      console.log(`  - ${role.ad} (ID: ${role._id})`);
    });
  } catch (error) {
    console.error('❌ Script hatası:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📱 MongoDB bağlantısı kapatıldı');
    }
  }
}

console.log('🚀 Rol yetkileri kontrol scripti başlatılıyor...');
checkRolePermissions();
