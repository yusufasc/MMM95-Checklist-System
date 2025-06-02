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

const checkModules = async () => {
  try {
    console.log('📋 Veritabanındaki modüller kontrol ediliyor...\n');

    const modules = await Module.find().sort({ ad: 1 });

    console.log(`📊 Toplam modül sayısı: ${modules.length}\n`);

    console.log('📋 Modül listesi:');
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.ad}`);
      console.log(`   Route: ${module.route || 'Tanımsız'}`);
      console.log(`   İkon: ${module.ikon || 'Tanımsız'}`);
      console.log(`   Aktif: ${module.aktif ? 'Evet' : 'Hayır'}`);
      console.log('');
    });

    // Beklenen modüller
    const expectedModules = [
      'Dashboard',
      'Kullanıcı Yönetimi',
      'Rol Yönetimi',
      'Departman Yönetimi',
      'Checklist Yönetimi',
      'Görev Yönetimi',
      'Yaptım',
      'Envanter Yönetimi',
      'Kalite Kontrol',
      'Kalite Kontrol Yönetimi',
      'İnsan Kaynakları',
      'İnsan Kaynakları Yönetimi',
      'Kontrol Bekleyenler',
      'Performans',
    ];

    console.log('🔍 Eksik modül kontrolü:');
    const existingModuleNames = modules.map(m => m.ad);
    const missingModules = expectedModules.filter(name => !existingModuleNames.includes(name));

    if (missingModules.length === 0) {
      console.log('✅ Tüm beklenen modüller mevcut!');
    } else {
      console.log('❌ Eksik modüller:');
      missingModules.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Script'i çalıştır
const runScript = async () => {
  await connectDB();
  await checkModules();
};

runScript();
