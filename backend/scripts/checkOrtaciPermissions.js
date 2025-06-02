const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const checkOrtaciPermissions = async () => {
  try {
    // MongoDB'a bağlan
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' }).populate('moduller.modul', 'ad');

    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    console.log(`📋 Ortacı Rolü: ${ortaciRole.ad}`);
    console.log(`📋 Modül Yetkileri (${ortaciRole.moduller?.length || 0} adet):`);

    if (ortaciRole.moduller && ortaciRole.moduller.length > 0) {
      ortaciRole.moduller.forEach((modulYetkisi, index) => {
        console.log(`  ${index + 1}. ${modulYetkisi.modul?.ad || 'Modül bulunamadı'}`);
        console.log(`     - Erişebilir: ${modulYetkisi.erisebilir ? '✅' : '❌'}`);
        console.log(`     - Düzenleyebilir: ${modulYetkisi.duzenleyebilir ? '✅' : '❌'}`);
      });
    } else {
      console.log('  ❌ Hiç modül yetkisi yok!');
    }

    // Görev Yönetimi modülünü özel olarak kontrol et
    const gorevYonetimiYetkisi = ortaciRole.moduller?.find(m => m.modul?.ad === 'Görev Yönetimi');

    console.log('\n🎯 Görev Yönetimi Modülü Kontrolü:');
    if (gorevYonetimiYetkisi) {
      console.log('✅ Görev Yönetimi modülü yetkisi var');
      console.log(`   - Erişebilir: ${gorevYonetimiYetkisi.erisebilir ? '✅' : '❌'}`);
      console.log(`   - Düzenleyebilir: ${gorevYonetimiYetkisi.duzenleyebilir ? '✅' : '❌'}`);
    } else {
      console.log('❌ Görev Yönetimi modülü yetkisi YOK!');
      console.log('💡 Bu yüzden makina seçimi API\'lerine erişemiyor olabilir.');

      // Görev Yönetimi modülünü bul ve ekle
      const gorevYonetimiModule = await Module.findOne({ ad: 'Görev Yönetimi' });
      if (gorevYonetimiModule) {
        console.log('\n🔧 Görev Yönetimi modülü yetkisi ekleniyor...');

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
      } else {
        console.log('❌ Görev Yönetimi modülü bulunamadı');
      }
    }

    // Tüm modülleri listele (referans için)
    console.log('\n📋 Sistemdeki Tüm Modüller:');
    const allModules = await Module.find({}).select('ad');
    allModules.forEach((module, index) => {
      console.log(`  ${index + 1}. ${module.ad}`);
    });
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

checkOrtaciPermissions().catch(console.error);
