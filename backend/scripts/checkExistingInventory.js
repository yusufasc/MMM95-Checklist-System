const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function checkExistingInventory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Tüm kategorileri listele
    const allCategories = await InventoryCategory.find({});
    console.log(`\n📋 Toplam ${allCategories.length} kategori bulundu:`);
    allCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id})`);
    });

    // Tüm envanter öğelerini listele
    const allItems = await InventoryItem.find({})
      .populate('kategoriId', 'ad')
      .select('envanterKodu ad kategoriId durum lokasyon');

    console.log(`\n📦 Toplam ${allItems.length} envanter öğesi bulundu:`);
    allItems.forEach(item => {
      console.log(
        `  - ${item.envanterKodu} | ${item.ad} | Kategori: ${item.kategoriId?.ad || 'Kategori yok'} | ${item.durum}`,
      );
    });

    // mak-zf01 öğesini detaylı incele
    const specificItem = await InventoryItem.findOne({ envanterKodu: 'mak-zf01' }).populate(
      'kategoriId',
      'ad',
    );

    if (specificItem) {
      console.log('\n🔍 mak-zf01 detayları:');
      console.log(`  - Kategori: ${specificItem.kategoriId?.ad || 'Kategori yok'}`);
      console.log(`  - Kategori ID: ${specificItem.kategoriId?._id || 'ID yok'}`);
      console.log(`  - Ad: ${specificItem.ad}`);
      console.log(`  - Durum: ${specificItem.durum}`);
      console.log(`  - Lokasyon: ${specificItem.lokasyon}`);
    } else {
      console.log('\n❌ mak-zf01 bulunamadı');
    }

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkExistingInventory();
