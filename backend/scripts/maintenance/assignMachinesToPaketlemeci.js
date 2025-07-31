const mongoose = require('mongoose');
const User = require('../models/User');
const Machine = require('../models/Machine');

const assignMachinesToPaketlemeci = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Paketlemeci test kullanıcısını bul
    const paketlemeciUser = await User.findOne({
      kullaniciAdi: 'paketleme.test',
    });

    if (!paketlemeciUser) {
      console.log('❌ Paketlemeci test kullanıcısı bulunamadı');
      return;
    }

    // Mevcut makinaları listele
    const machines = await Machine.find({
      durum: 'aktif',
    }).limit(5);

    console.log(`📋 ${machines.length} makina bulundu:`);
    machines.forEach((machine, index) => {
      console.log(`  ${index + 1}. ${machine.makinaNo} - ${machine.ad}`);
    });

    if (machines.length === 0) {
      console.log('❌ Atanabilecek makina bulunamadı');
      return;
    }

    // İlk 3 makinayı ata
    const selectedMachines = machines.slice(0, 3);
    const machineIds = selectedMachines.map(m => m._id);

    paketlemeciUser.secilenMakinalar = machineIds;
    await paketlemeciUser.save();

    console.log('\n✅ Paketlemeci kullanıcısına makinalar atandı:');
    selectedMachines.forEach((machine, index) => {
      console.log(`  ${index + 1}. ${machine.makinaNo} - ${machine.ad}`);
    });

    console.log(
      '\n🎯 Paketlemeci artık dashboard\'da makina verilerini görebilir!',
    );
    console.log('👤 Kullanıcı: paketleme.test');
    console.log('🔑 Şifre: paket123');
    console.log(`🏭 Atanan Makina Sayısı: ${selectedMachines.length}`);

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

assignMachinesToPaketlemeci();
