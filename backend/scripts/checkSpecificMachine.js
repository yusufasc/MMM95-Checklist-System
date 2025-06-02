const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function checkSpecificMachine() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // mak-zf01 makinesini detaylı incele
    const specificMachine = await InventoryItem.findOne({
      envanterKodu: 'mak-zf01',
    }).populate('kategoriId', 'ad');

    if (specificMachine) {
      console.log('\n🔍 mak-zf01 makine detayları:');
      console.log(`  - ID: ${specificMachine._id}`);
      console.log(`  - Envanter Kodu: ${specificMachine.envanterKodu}`);
      console.log(`  - Ad: ${specificMachine.ad}`);
      console.log(`  - Kategori: ${specificMachine.kategoriId?.ad || 'Kategori yok'}`);
      console.log(`  - Kategori ID: ${specificMachine.kategoriId?._id || 'ID yok'}`);
      console.log(`  - Durum: ${specificMachine.durum}`);
      console.log(`  - Aktif: ${specificMachine.aktif}`);
      console.log(`  - Lokasyon: ${specificMachine.lokasyon || 'Yok'}`);

      // Dinamik alanları da kontrol et
      if (specificMachine.dinamikAlanlar) {
        console.log('\n📋 Dinamik Alanlar:');
        Object.keys(specificMachine.dinamikAlanlar).forEach(key => {
          console.log(`  - ${key}: ${specificMachine.dinamikAlanlar[key]}`);
        });
      }
    } else {
      console.log('\n❌ mak-zf01 makinesi bulunamadı');
    }

    // Tüm kategorileri listele
    console.log('\n📂 Tüm kategoriler:');
    const allCategories = await InventoryCategory.find({});
    allCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id}) - Aktif: ${cat.aktif}`);
    });

    // Makina kategorilerini bul
    const machineCategories = await InventoryCategory.find({
      ad: { $regex: /makina|makine|machine/i },
      aktif: true,
    });

    console.log(`\n🔧 Makina kategorisi regex ile bulananlar (${machineCategories.length}):`);
    machineCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id})`);
    });

    // Test endpoint logic
    if (machineCategories.length > 0) {
      const categoryIds = machineCategories.map(cat => cat._id);

      const machines = await InventoryItem.find({
        kategoriId: { $in: categoryIds },
        aktif: true,
        durum: { $in: ['aktif', 'bakim'] },
      }).select('envanterKodu ad lokasyon kategoriId durum');

      console.log(`\n🎯 Endpoint logic sonucu (${machines.length} makina):`);
      machines.forEach(machine => {
        console.log(`  - ${machine.envanterKodu} | ${machine.ad} | ${machine.durum}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkSpecificMachine();
