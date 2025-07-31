const mongoose = require('mongoose');
const Module = require('../models/Module');
const Role = require('../models/Role');

// MongoDB bağlantısı
const DB_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

async function createEquipmentModules() {
  try {
    console.log('🔧 Ekipman modülleri oluşturuluyor...');

    // 1. Ekipman Yönetimi modülü
    const equipmentModule = await Module.findOneAndUpdate(
      { ad: 'Ekipman Yönetimi' },
      {
        ad: 'Ekipman Yönetimi',
        aciklama:
          'Ekipman tanıtımı, zimmetleme ve talep yönetimi (/hr - Tab 6-8)',
        aktif: true,
        route: '/hr',
        ikon: 'Computer',
      },
      { upsert: true, new: true },
    );

    console.log('✅ Ekipman modülü oluşturuldu:');
    console.log(`  - ${equipmentModule.ad} (${equipmentModule._id})`);

    // 2. Admin rolüne Ekipman Yönetimi yetkisi ekle
    console.log('\n🔐 Admin rolüne Ekipman Yönetimi yetkisi ekleniyor...');

    const adminRole = await Role.findOne({ ad: 'Admin' });
    if (adminRole) {
      // Modül zaten var mı kontrol et
      const hasModule = adminRole.moduller.some(
        m => m.modul && m.modul.toString() === equipmentModule._id.toString(),
      );

      if (!hasModule) {
        adminRole.moduller.push({
          modul: equipmentModule._id,
          erisebilir: true,
          duzenleyebilir: true,
        });
        await adminRole.save();
        console.log('✅ Admin rolüne Ekipman Yönetimi yetkisi eklendi');
      } else {
        console.log('ℹ️ Admin rolünde Ekipman Yönetimi yetkisi zaten mevcut');
      }
    }

    // 3. İK personeli için de yetki ekle (eğer varsa)
    const ikRole = await Role.findOne({ ad: 'İK' });
    if (ikRole) {
      const hasModule = ikRole.moduller.some(
        m => m.modul && m.modul.toString() === equipmentModule._id.toString(),
      );

      if (!hasModule) {
        ikRole.moduller.push({
          modul: equipmentModule._id,
          erisebilir: true,
          duzenleyebilir: true,
        });
        await ikRole.save();
        console.log('✅ İK rolüne Ekipman Yönetimi yetkisi eklendi');
      }
    }

    // 4. Mevcut modülleri kontrol et
    const allModules = await Module.find({}, 'ad aktif').sort({ ad: 1 });
    console.log(`\n📊 Toplam modül sayısı: ${allModules.length}`);

    console.log('\n📋 Tüm aktif modüller:');
    allModules.forEach((module, index) => {
      if (module.aktif) {
        console.log(`  ${index + 1}. ${module.ad}`);
      }
    });

    console.log('\n🎯 Ekipman modülleri başarıyla oluşturuldu!');
    console.log('✅ Frontend\'te HR sayfası Tab 6-8 artık erişilebilir olacak');
  } catch (error) {
    console.error('❌ Ekipman modülleri oluşturma hatası:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Script'i çalıştır
(async () => {
  await connectDB();
  await createEquipmentModules();
})();
