const mongoose = require('mongoose');
const Module = require('../models/Module');

const updatePerformansModule = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Performans modülünü bul ve güncelle
    const performansModule = await Module.findOneAndUpdate(
      { ad: 'Performans' },
      {
        aciklama:
          'Kişisel performans raporları ve aktivite takibi (/my-activity)',
        route: '/my-activity',
        guncellemeTarihi: new Date(),
      },
      { new: true },
    );

    if (performansModule) {
      console.log('✅ Performans modülü güncellendi:');
      console.log(`   📝 Yeni açıklama: ${performansModule.aciklama}`);
      console.log(`   🔗 Yeni route: ${performansModule.route}`);
    } else {
      console.log('❌ Performans modülü bulunamadı');
    }

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

updatePerformansModule();
