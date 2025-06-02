const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function checkInventoryMachines() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Makina kategorilerini bul
    const machineCategories = await InventoryCategory.find({
      ad: { $regex: /makina|makine|machine/i },
      aktif: true,
    });

    console.log(`\n🏭 ${machineCategories.length} makina kategorisi bulundu:`);
    machineCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id})`);
    });

    if (machineCategories.length === 0) {
      console.log('❌ Hiç makina kategorisi bulunamadı!');
      await mongoose.disconnect();
      return;
    }

    // Her kategorideki makinaları listele
    for (const category of machineCategories) {
      const machines = await InventoryItem.find({
        kategoriId: category._id,
        aktif: true,
      }).select('envanterKodu ad durum lokasyon');

      console.log(`\n📋 ${category.ad} kategorisinde ${machines.length} makina:`);
      machines.forEach(machine => {
        console.log(
          `  - ${machine.envanterKodu} | ${machine.ad} | ${machine.durum} | ${machine.lokasyon || 'Lokasyon yok'}`,
        );
      });
    }

    // Toplam makina sayısı
    const totalMachines = await InventoryItem.countDocuments({
      kategoriId: { $in: machineCategories.map(c => c._id) },
      aktif: true,
    });

    console.log(`\n🎯 Toplam ${totalMachines} envanter makinası bulundu`);

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkInventoryMachines();
