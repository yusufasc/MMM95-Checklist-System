const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const Department = require('../models/Department');

const createTestMachinesWithDepartment = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Önce departmanları oluştur
    const departments = [
      {
        ad: 'Paketleme',
        aciklama: 'Paketleme departmanı',
        durum: 'aktif',
      },
      {
        ad: 'Üretim',
        aciklama: 'Üretim departmanı',
        durum: 'aktif',
      },
    ];

    console.log('📋 Departmanlar oluşturuluyor...');
    const createdDepartments = {};

    for (const deptData of departments) {
      let department = await Department.findOne({ ad: deptData.ad });

      if (!department) {
        department = new Department(deptData);
        await department.save();
        console.log(`✅ Departman oluşturuldu: ${deptData.ad}`);
      } else {
        console.log(`⚠️ Departman zaten mevcut: ${deptData.ad}`);
      }

      createdDepartments[deptData.ad] = department._id;
    }

    // Test makinaları
    const testMachines = [
      {
        ad: 'Paketleme Makinası 1',
        makinaNo: 'PKT001',
        durum: 'aktif',
        departman: createdDepartments['Paketleme'],
        aciklama: 'Paketleme işlemleri için kullanılan makina',
      },
      {
        ad: 'Paketleme Makinası 2',
        makinaNo: 'PKT002',
        durum: 'aktif',
        departman: createdDepartments['Paketleme'],
        aciklama: 'Paketleme işlemleri için kullanılan makina',
      },
      {
        ad: 'Paketleme Makinası 3',
        makinaNo: 'PKT003',
        durum: 'aktif',
        departman: createdDepartments['Paketleme'],
        aciklama: 'Paketleme işlemleri için kullanılan makina',
      },
      {
        ad: 'Enjeksiyon Makinası 1',
        makinaNo: 'ENJ001',
        durum: 'aktif',
        departman: createdDepartments['Üretim'],
        aciklama: 'Plastik enjeksiyon kalıplama makinası',
      },
      {
        ad: 'Enjeksiyon Makinası 2',
        makinaNo: 'ENJ002',
        durum: 'aktif',
        departman: createdDepartments['Üretim'],
        aciklama: 'Plastik enjeksiyon kalıplama makinası',
      },
    ];

    console.log('\n📋 Test makinaları oluşturuluyor...');

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

createTestMachinesWithDepartment();
