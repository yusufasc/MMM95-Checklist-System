const mongoose = require('mongoose');
require('dotenv').config();
const Module = require('../models/Module');

const DB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist';

console.log('MongoDB URI:', DB_URI);

mongoose
  .connect(DB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createMissingModules() {
  try {
    console.log('🎯 Eksik modüller oluşturuluyor...');

    const missingModules = [
      {
        ad: 'Bonus Değerlendirme Yönetimi',
        aciklama:
          'Bonus değerlendirme şablonları yönetimi, personel bonus ölçütlerini tanımlama (/bonus-evaluation-management)',
        route: '/bonus-evaluation-management',
        aktif: true,
      },
      {
        ad: 'Bonus Değerlendirme',
        aciklama:
          'Personel bonus değerlendirmesi yapma, performans puanlama (/bonus-evaluation)',
        route: '/bonus-evaluation',
        aktif: true,
      },
      {
        ad: 'Kişisel Aktivite',
        aciklama:
          'Kullanıcının kişisel aktivite ve performans takibi (/my-activity)',
        route: '/my-activity',
        aktif: true,
      },
      {
        ad: 'Ekipman Yönetimi',
        aciklama:
          'Ekipman tanıtımı, zimmetleme ve talep yönetimi (/equipment-management)',
        route: '/equipment-management',
        aktif: true,
      },
    ];

    console.log('\n📋 Eksik modüller oluşturuluyor...');
    let createdCount = 0;
    let existingCount = 0;

    for (const moduleData of missingModules) {
      const existingModule = await Module.findOne({ ad: moduleData.ad });

      if (!existingModule) {
        const module = new Module(moduleData);
        await module.save();
        console.log(`✅ Modül oluşturuldu: ${moduleData.ad}`);
        createdCount++;
      } else {
        console.log(`⏭️ Modül mevcut: ${moduleData.ad}`);
        existingCount++;
      }
    }

    // Tüm modülleri listele
    const allModules = await Module.find({ aktif: true }).select('ad route');
    console.log('\n📋 Aktif modüller:');
    allModules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.ad} → ${module.route}`);
    });

    // Toplam sonuç
    const totalModules = await Module.countDocuments();
    const activeModules = await Module.countDocuments({ aktif: true });

    console.log('\n🎉 Eksik modüller tamamlandı!');
    console.log(`📊 Yeni oluşturulan: ${createdCount}`);
    console.log(`📁 Zaten mevcut: ${existingCount}`);
    console.log(`📊 Toplam modül: ${totalModules}`);
    console.log(`✅ Aktif modül: ${activeModules}`);

    console.log('\n🔗 Yeni eklenen route\'lar:');
    console.log('- Bonus Yönetimi: /bonus-evaluation-management');
    console.log('- Bonus Değerlendirme: /bonus-evaluation');
    console.log('- Kişisel Aktivite: /my-activity');
    console.log('- Ekipman Yönetimi: /equipment-management');

    console.log('\n📄 Test URL\'leri:');
    console.log('- Rol Yönetimi: http://localhost:3000/roles');
    console.log(
      '- Bonus Yönetimi: http://localhost:3000/bonus-evaluation-management',
    );
    console.log(
      '- Bonus Değerlendirme: http://localhost:3000/bonus-evaluation',
    );
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Script'i çalıştır
createMissingModules();
