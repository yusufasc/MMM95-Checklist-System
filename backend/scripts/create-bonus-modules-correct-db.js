const mongoose = require('mongoose');
require('dotenv').config();
const Module = require('../models/Module');

// Backend ile aynı database'i kullan
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';

console.log('MongoDB URI:', MONGO_URI);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createBonusModules() {
  try {
    console.log(
      '🎯 Doğru database\'e Bonus Değerlendirme modülleri ekleniyor...',
    );

    // 1. Bonus Değerlendirme Yönetimi modülü (Admin)
    const managementModule = await Module.findOneAndUpdate(
      { ad: 'Bonus Değerlendirme Yönetimi' },
      {
        ad: 'Bonus Değerlendirme Yönetimi',
        aciklama:
          'Bonus değerlendirme şablonları yönetimi, personel bonus ölçütlerini tanımlama (/bonus-evaluation-management)',
        aktif: true,
        route: '/bonus-evaluation-management',
      },
      { upsert: true, new: true },
    );

    // 2. Bonus Değerlendirme modülü (Vardiya amiri/yöneticiler)
    const evaluationModule = await Module.findOneAndUpdate(
      { ad: 'Bonus Değerlendirme' },
      {
        ad: 'Bonus Değerlendirme',
        aciklama:
          'Personel bonus değerlendirmesi yapma, performans puanlama (/bonus-evaluation)',
        aktif: true,
        route: '/bonus-evaluation',
      },
      { upsert: true, new: true },
    );

    console.log('✅ Bonus modülleri oluşturuldu:');
    console.log(`  - ${managementModule.ad} (${managementModule._id})`);
    console.log(`  - ${evaluationModule.ad} (${evaluationModule._id})`);

    // 3. Mevcut modülları kontrol et
    const allModules = await Module.find({}, 'ad aktif');
    console.log(`\n📊 Toplam modül sayısı: ${allModules.length}`);

    console.log('\n📋 Tüm aktif modüller:');
    allModules.forEach((module, index) => {
      if (module.aktif) {
        console.log(`  ${index + 1}. ${module.ad}`);
      }
    });

    // 4. Bonus modüllerini kontrol et
    const bonusModules = allModules.filter(m => m.ad.includes('Bonus'));
    console.log(`\n🎯 Bonus modül sayısı: ${bonusModules.length}`);
    bonusModules.forEach(module => {
      console.log(`  ✅ ${module.ad}`);
    });

    console.log(
      '\n🔧 Bonus modüllerin rol yetkileri backend/scripts/create-bonus-evaluation-modules.js ile eklenebilir',
    );
    console.log(
      '📄 Test: http://localhost:3000/roles sayfasından kontrol edin',
    );
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Script'i çalıştır
createBonusModules();
