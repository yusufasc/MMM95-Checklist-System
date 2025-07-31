const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');

async function clearInventoryItems() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📊 MongoDB bağlantısı başarılı');

    // Plastik Enjeksiyon Makinası kategorisindeki tüm items'ları sil
    const result = await InventoryItem.deleteMany({});

    console.log(`🗑️ ${result.deletedCount} inventory item silindi`);
    console.log('✅ Inventory items temizlendi');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

clearInventoryItems();
