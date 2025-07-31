const mongoose = require('mongoose');
const seedData = require('../utils/seedData');
require('dotenv').config();

const createTestData = async () => {
  try {
    console.log('🔧 Test verisi oluşturma scripti başlatılıyor...');

    // MongoDB'ye bağlan
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log('✅ MongoDB bağlantısı başarılı!');

    // NODE_ENV'i geçici olarak development'a çevir
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Seed data'yı çalıştır
    await seedData();

    // NODE_ENV'i eski haline getir
    process.env.NODE_ENV = originalNodeEnv;

    console.log('✅ Test verileri başarıyla oluşturuldu!');
  } catch (error) {
    console.error('❌ Test verisi oluşturulurken hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Script'i çalıştır
createTestData();
