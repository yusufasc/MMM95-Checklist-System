const mongoose = require('mongoose');
const Role = require('../models/Role');

const fixPuanlayabilirToOnaylayabilir = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    console.log('🔍 Ortacı rolü checklist yetkileri:');
    ortaciRole.checklistYetkileri.forEach((yetki, index) => {
      console.log(
        `  ${index}: hedefRol=${yetki.hedefRol} gorebilir=${yetki.gorebilir} puanlayabilir=${yetki.puanlayabilir} onaylayabilir=${yetki.onaylayabilir}`,
      );
    });

    // Paketlemeci ve Usta için puanlayabilir'i onaylayabilir'e kopyala
    let updated = false;
    ortaciRole.checklistYetkileri.forEach(yetki => {
      if (yetki.puanlayabilir === true && yetki.onaylayabilir !== true) {
        yetki.onaylayabilir = true;
        updated = true;
        console.log(`✅ ${yetki.hedefRol} için puanlayabilir -> onaylayabilir kopyalandı`);
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
        console.log(
          `  ${index}: ${yetki.hedefRol.ad} - gorebilir=${yetki.gorebilir} onaylayabilir=${yetki.onaylayabilir}`,
        );
      });
    } else {
      console.log('ℹ️  Güncelleme gerekmedi');
    }

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
};

fixPuanlayabilirToOnaylayabilir();
