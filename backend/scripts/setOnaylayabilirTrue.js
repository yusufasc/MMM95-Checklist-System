const mongoose = require('mongoose');
const Role = require('../models/Role');

const setOnaylayabilirTrue = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    const paketlemeciId = '6837446d342f89c51d006418';
    const ustaId = '6837446d342f89c51d006413';

    console.log('🔍 Ortacı rolü mevcut checklist yetkileri:');
    ortaciRole.checklistYetkileri.forEach((yetki, _index) => {
      console.log(
        `  ${_index}: hedefRol=${yetki.hedefRol} gorebilir=${yetki.gorebilir} onaylayabilir=${yetki.onaylayabilir}`,
      );
    });

    // Paketlemeci ve Usta için onaylayabilir'i true yap
    let updated = false;
    ortaciRole.checklistYetkileri.forEach(yetki => {
      if (yetki.hedefRol.toString() === paketlemeciId || yetki.hedefRol.toString() === ustaId) {
        if (yetki.gorebilir === true && yetki.onaylayabilir !== true) {
          yetki.onaylayabilir = true;
          updated = true;
          console.log(`✅ ${yetki.hedefRol} için onaylayabilir = true yapıldı`);
        }
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
      updatedRole.checklistYetkileri.forEach((yetki, _index) => {
        if (yetki.hedefRol.ad === 'Paketlemeci' || yetki.hedefRol.ad === 'Usta') {
          console.log(
            `✅ ${yetki.hedefRol.ad} - gorebilir=${yetki.gorebilir} onaylayabilir=${yetki.onaylayabilir}`,
          );
        }
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

setOnaylayabilirTrue();
