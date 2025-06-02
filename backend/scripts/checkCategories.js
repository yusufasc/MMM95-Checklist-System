const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');

async function checkCategories() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const categories = await InventoryCategory.find({});
    console.log(`\n📋 Toplam ${categories.length} kategori bulundu:`);

    categories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id})`);
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkCategories();
