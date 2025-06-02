const mongoose = require('mongoose');
const Role = require('../models/Role');

async function fixRolePermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı: mmm-checklist');

    // Tüm rolleri al
    const allRoles = await Role.find({});
    console.log(`📋 ${allRoles.length} rol bulundu, checklist yetkileri düzeltiliyor...`);

    let updatedCount = 0;

    for (const role of allRoles) {
      let needsUpdate = false;
      const updatedChecklistYetkileri = role.checklistYetkileri.map(yetki => {
        const updated = { ...yetki.toObject() };

        // puanlayabilir alanı undefined ise false yap
        if (updated.puanlayabilir === undefined || updated.puanlayabilir === null) {
          updated.puanlayabilir = false;
          needsUpdate = true;
        }

        // onaylayabilir alanı yoksa false yap
        if (updated.onaylayabilir === undefined || updated.onaylayabilir === null) {
          updated.onaylayabilir = false;
          needsUpdate = true;
        }

        return updated;
      });

      if (needsUpdate) {
        await Role.findByIdAndUpdate(role._id, {
          checklistYetkileri: updatedChecklistYetkileri,
          guncellemeTarihi: new Date(),
        });

        console.log(`✅ ${role.ad} rolü güncellendi`);
        updatedCount++;
      } else {
        console.log(`ℹ️  ${role.ad} rolü zaten güncel`);
      }
    }

    console.log(`\n🎉 ${updatedCount} rol başarıyla güncellendi!`);

    // Ortacı rolünün Paketlemeci yetkisini özel olarak ayarla
    console.log('\n🔧 Ortacı rolüne Paketlemeci puanlama yetkisi veriliyor...');

    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });

    if (ortaciRole && paketlemeciRole) {
      // Paketlemeci yetkisini bul ve güncelle
      const checklistYetkileri = ortaciRole.checklistYetkileri.map(yetki => {
        if (yetki.hedefRol.toString() === paketlemeciRole._id.toString()) {
          return {
            ...yetki.toObject(),
            gorebilir: true,
            puanlayabilir: true, // 🎯 Bu kritik!
            onaylayabilir: false,
          };
        }
        return yetki.toObject();
      });

      await Role.findByIdAndUpdate(ortaciRole._id, {
        checklistYetkileri,
        guncellemeTarihi: new Date(),
      });

      console.log('✅ Ortacı rolüne Paketlemeci puanlama yetkisi verildi!');
    }

    // Kontrol et
    console.log('\n📋 Güncellenmiş yetkileri kontrol ediliyor...');
    const updatedOrtaciRole = await Role.findOne({ ad: 'Ortacı' }).populate(
      'checklistYetkileri.hedefRol',
      'ad',
    );

    const paketlemeciYetkisi = updatedOrtaciRole.checklistYetkileri.find(
      yetki => yetki.hedefRol.ad === 'Paketlemeci',
    );

    if (paketlemeciYetkisi) {
      console.log('📊 Ortacı -> Paketlemeci yetkisi:');
      console.log(`   └─ Görebilir: ${paketlemeciYetkisi.gorebilir}`);
      console.log(`   └─ Puanlayabilir: ${paketlemeciYetkisi.puanlayabilir}`);
      console.log(`   └─ Onaylayabilir: ${paketlemeciYetkisi.onaylayabilir}`);
    }
  } catch (error) {
    console.error('❌ Script hatası:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📱 MongoDB bağlantısı kapatıldı');
    }
  }
}

console.log('🚀 Rol yetkileri düzeltme scripti başlatılıyor...');
fixRolePermissions();
