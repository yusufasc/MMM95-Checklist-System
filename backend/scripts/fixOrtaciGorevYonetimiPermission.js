const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const fixOrtaciGorevYonetimiPermission = async () => {
  try {
    // MongoDB'a bağlan
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    // Görev Yönetimi modülünü bul
    const gorevYonetimiModule = await Module.findOne({ ad: 'Görev Yönetimi' });
    if (!gorevYonetimiModule) {
      console.log('❌ Görev Yönetimi modülü bulunamadı');
      return;
    }

    console.log(`📋 Ortacı Rolü: ${ortaciRole.ad}`);
    console.log(`📋 Görev Yönetimi Modülü: ${gorevYonetimiModule.ad}`);

    // Mevcut Görev Yönetimi yetkisini kontrol et
    const existingPermission = ortaciRole.moduller.find(
      m => m.modul.toString() === gorevYonetimiModule._id.toString(),
    );

    if (existingPermission) {
      console.log('\n🔧 Mevcut Görev Yönetimi yetkisi güncelleniyor...');
      console.log(
        `   Mevcut - Erişebilir: ${existingPermission.erisebilir}, Düzenleyebilir: ${existingPermission.duzenleyebilir}`,
      );

      // Mevcut yetkiyi güncelle
      await Role.updateOne(
        {
          _id: ortaciRole._id,
          'moduller.modul': gorevYonetimiModule._id,
        },
        {
          $set: {
            'moduller.$.erisebilir': true,
            'moduller.$.duzenleyebilir': false,
          },
        },
      );

      console.log('✅ Görev Yönetimi modülü yetkisi güncellendi!');
      console.log('   Yeni - Erişebilir: ✅, Düzenleyebilir: ❌');
    } else {
      console.log('\n🔧 Görev Yönetimi modülü yetkisi ekleniyor...');

      // Yeni yetki ekle
      await Role.findByIdAndUpdate(ortaciRole._id, {
        $push: {
          moduller: {
            modul: gorevYonetimiModule._id,
            erisebilir: true,
            duzenleyebilir: false,
          },
        },
      });

      console.log('✅ Görev Yönetimi modülü yetkisi eklendi!');
      console.log('   Erişebilir: ✅, Düzenleyebilir: ❌');
    }

    // Sonucu doğrula
    const updatedRole = await Role.findOne({ ad: 'Ortacı' }).populate('moduller.modul', 'ad');

    const gorevYonetimiYetkisi = updatedRole.moduller.find(m => m.modul?.ad === 'Görev Yönetimi');

    console.log('\n✅ Doğrulama:');
    if (gorevYonetimiYetkisi) {
      console.log(
        `   Görev Yönetimi - Erişebilir: ${gorevYonetimiYetkisi.erisebilir ? '✅' : '❌'}`,
      );
      console.log(
        `   Görev Yönetimi - Düzenleyebilir: ${gorevYonetimiYetkisi.duzenleyebilir ? '✅' : '❌'}`,
      );
    } else {
      console.log('   ❌ Hala yetki bulunamadı!');
    }

    console.log('\n💡 Artık Ortacı kullanıcıları makina seçimi yapabilir!');
    console.log('🔄 Frontend\'i yenileyin ve tekrar deneyin.');
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

fixOrtaciGorevYonetimiPermission().catch(console.error);
