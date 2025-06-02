const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');

async function updateTestTaskMachine() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    // Test görevini bul
    const testTaskId = '683cbc475bdbf08f089c6270';
    const testTask = await Task.findById(testTaskId);

    if (!testTask) {
      console.log('❌ Test görevi bulunamadı');
      process.exit(1);
    }

    console.log(`✅ Test görevi bulundu: ${testTask._id}`);
    console.log(`   Mevcut makina: ${testTask.makina || 'YOK'}`);

    // Makina ataması yap
    const machineId = '6838670fb8ef045a7e54fbe8'; // Ortacı'nın seçtiği makina
    testTask.makina = machineId;
    await testTask.save();

    console.log(`✅ Test görevine makina atandı: ${machineId}`);
    console.log(`   Yeni makina: ${testTask.makina}`);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

updateTestTaskMachine();
