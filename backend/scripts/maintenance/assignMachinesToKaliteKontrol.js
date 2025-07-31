const mongoose = require('mongoose');
const User = require('../models/User');
const InventoryItem = require('../models/InventoryItem');

const assignMachinesToKaliteKontrol = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Kalite kontrol kullanıcısını bul
    const kaliteUser = await User.findOne({ kullaniciAdi: 'kalite.test' });
    if (!kaliteUser) {
      console.log('❌ Kalite kontrol kullanıcısı bulunamadı');
      return;
    }

    // Mevcut makinaları getir (kategori olmadığı için ilk 3 öğeyi al)
    const machines = await InventoryItem.find().limit(3);

    if (machines.length === 0) {
      console.log('❌ Makina bulunamadı');
      return;
    }

    // Makina ID'lerini kullanıcıya ata
    const machineIds = machines.map(m => m._id);
    await User.findByIdAndUpdate(kaliteUser._id, {
      secilenMakinalar: machineIds,
    });

    console.log('✅ Kalite kontrol kullanıcısına makinalar atandı:');
    machines.forEach((machine, index) => {
      console.log(`  ${index + 1}. ${machine.ad} (${machine.envanterKodu})`);
    });

    await mongoose.connection.close();
    console.log('\n🎯 Makina ataması tamamlandı!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

assignMachinesToKaliteKontrol();
