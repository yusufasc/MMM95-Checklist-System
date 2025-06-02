const mongoose = require('mongoose');
const Role = require('../models/Role');

async function addPuanlayabilirField() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    console.log('🔍 Ortacı rolünü güncelleniyor...');
    console.log('📋 Mevcut checklistYetkileri sayısı:', ortaciRole.checklistYetkileri.length);

    // Her checklistYetkisi için puanlayabilir field'ını ekle
    let updated = false;
    ortaciRole.checklistYetkileri.forEach(yetki => {
      if (yetki.puanlayabilir === undefined) {
        // Eğer onaylayabilir true ise puanlayabilir'i de true yap
        yetki.puanlayabilir = yetki.onaylayabilir === true;
        updated = true;
        console.log(`✅ ${yetki.hedefRol} için puanlayabilir=${yetki.puanlayabilir} eklendi`);
      }
    });

    if (updated) {
      await ortaciRole.save();
      console.log('💾 Değişiklikler kaydedildi');

      // Kontrol et
      const updatedRole = await Role.findOne({ ad: 'Ortacı' }).populate(
        'checklistYetkileri.hedefRol',
        'ad',
      );

      console.log('🔍 Güncellenmiş yetkileri:');
      updatedRole.checklistYetkileri.forEach((yetki, index) => {
        console.log(`  ${index + 1}: ${yetki.hedefRol.ad}`);
        console.log(`     ➡️ gorebilir: ${yetki.gorebilir}`);
        console.log(`     ➡️ puanlayabilir: ${yetki.puanlayabilir}`);
        console.log(`     ➡️ onaylayabilir: ${yetki.onaylayabilir}`);
      });
    } else {
      console.log('ℹ️  Güncelleme gerekmedi, tüm alanlar zaten mevcut');
    }

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

addPuanlayabilirField();
