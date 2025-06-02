const mongoose = require('mongoose');
const Module = require('../models/Module');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

const addMissingModules = async () => {
  try {
    console.log('🔄 Eksik modüller ekleniyor...');

    // Eksik modüller
    const missingModules = [
      { ad: 'Yaptım', ikon: 'Build', route: '/worktasks', aktif: true },
      {
        ad: 'Kalite Kontrol Yönetimi',
        ikon: 'AdminPanelSettings',
        route: '/quality-control-management',
        aktif: true,
      },
      { ad: 'İnsan Kaynakları', ikon: 'People', route: '/hr', aktif: true },
      {
        ad: 'İnsan Kaynakları Yönetimi',
        ikon: 'AdminPanelSettings',
        route: '/hr-management',
        aktif: true,
      },
    ];

    // Her modülü kontrol et ve yoksa ekle
    for (const moduleData of missingModules) {
      const existingModule = await Module.findOne({ ad: moduleData.ad });

      if (!existingModule) {
        const newModule = new Module(moduleData);
        await newModule.save();
        console.log(`✅ ${moduleData.ad} modülü eklendi`);
      } else {
        console.log(`ℹ️  ${moduleData.ad} modülü zaten mevcut`);
      }
    }

    console.log('🎉 Eksik modüller başarıyla eklendi!');

    // Tüm modülleri listele
    const allModules = await Module.find().sort({ ad: 1 });
    console.log('\n📋 Tüm modüller:');
    allModules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.ad} (${module.route})`);
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Script'i çalıştır
const runScript = async () => {
  await connectDB();
  await addMissingModules();
};

runScript();
