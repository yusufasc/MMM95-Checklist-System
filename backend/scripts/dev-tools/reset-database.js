const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Department = require('./models/Department');
const Module = require('./models/Module');
const ChecklistTemplate = require('./models/ChecklistTemplate');
const Task = require('./models/Task');
const WorkTask = require('./models/WorkTask');

async function resetDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm');

    console.log('🗑️  Veritabanı temizleniyor...');

    // Tüm koleksiyonları temizle
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Module.deleteMany({}),
      ChecklistTemplate.deleteMany({}),
      Task.deleteMany({}),
      WorkTask.deleteMany({}),
    ]);

    console.log('✅ Veritabanı temizlendi!');
    console.log('📝 Şimdi seed data çalıştırılacak...');

    // Seed data çalıştır (currently commented out)
    // const seedData = require('./utils/seedData');

    await mongoose.disconnect();
    console.log('🔒 MongoDB bağlantısı kapatıldı.');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

resetDatabase();
