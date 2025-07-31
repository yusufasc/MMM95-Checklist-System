const mongoose = require('mongoose');
const Machine = require('../models/Machine');

const createTestMachinesSimple = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Test makinaları
    const testMachines = [
      {
        ad: 'Paketleme Makinası 1',
        makinaNo: 'PKT001',
        durum: 'aktif',
        departman: 'Paketleme',
        aciklama: 'Paketleme işlemleri için kullanılan makina',
      },
      {
        ad: 'Paketleme Makinası 2',
        makinaNo: 'PKT002',
        durum: 'aktif',
        departman: 'Paketleme',
        aciklama: 'Paketleme işlemleri için kullanılan makina',
      },
      {
        ad: 'Paketleme Makinası 3',
        makinaNo: 'PKT003',
        durum: 'aktif',
        departman: 'Paketleme',
        aciklama: 'Paketleme işlemleri için kullanılan makina',
      },
      {
        ad: 'Enjeksiyon Makinası 1',
        makinaNo: 'ENJ001',
        durum: 'aktif',
        departman: 'Üretim',
        aciklama: 'Plastik enjeksiyon kalıplama makinası',
      },
      {
        ad: 'Enjeksiyon Makinası 2',
        makinaNo: 'ENJ002',
        durum: 'aktif',
        departman: 'Üretim',
        aciklama: 'Plastik enjeksiyon kalıplama makinası',
      },
    ];

    console.log('📋 Test makinaları oluşturuluyor...');

    for (const machineData of testMachines) {
      // Mevcut makina var mı kontrol et
      const existingMachine = await Machine.findOne({
        makinaNo: machineData.makinaNo,
      });

      if (existingMachine) {
        console.log(`⚠️ Makina zaten mevcut: ${machineData.makinaNo}`);
        continue;
      }

      const machine = new Machine(machineData);
      await machine.save();
      console.log(
        `✅ Oluşturuldu: ${machineData.makinaNo} - ${machineData.ad}`,
      );
    }

    const totalMachines = await Machine.countDocuments({ durum: 'aktif' });
    console.log(`\n🎯 Toplam aktif makina: ${totalMachines} adet`);

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

createTestMachinesSimple();
