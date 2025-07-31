const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

const addKisiselAktivitePermission = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    const ortaciRole = await Role.findOne({ ad: 'Ortacı' }).populate(
      'moduller.modul',
      'ad',
    );
    const kisiselAktiviteModule = await Module.findOne({ ad: 'Performans' });

    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    if (!kisiselAktiviteModule) {
      console.log('❌ Performans modülü bulunamadı');
      return;
    }

    console.log('📋 Ortacı rolünün Performans yetkisi kontrol ediliyor...');
    const kisiselAktiviteYetkisi = ortaciRole.moduller?.find(
      m => m.modul?.ad === 'Performans',
    );

    if (kisiselAktiviteYetkisi) {
      console.log('✅ Performans yetkisi zaten var');
      console.log(
        `   - Erişebilir: ${kisiselAktiviteYetkisi.erisebilir ? '✅' : '❌'}`,
      );
      console.log(
        `   - Düzenleyebilir: ${kisiselAktiviteYetkisi.duzenleyebilir ? '✅' : '❌'}`,
      );
    } else {
      console.log('❌ Performans yetkisi yok - Ekleniyor...');

      await Role.findByIdAndUpdate(ortaciRole._id, {
        $push: {
          moduller: {
            modul: kisiselAktiviteModule._id,
            erisebilir: true,
            duzenleyebilir: false,
          },
        },
      });

      console.log('✅ Performans modülü yetkisi eklendi!');
      console.log('   - Erişebilir: ✅');
      console.log('   - Düzenleyebilir: ❌');
    }

    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

addKisiselAktivitePermission();
