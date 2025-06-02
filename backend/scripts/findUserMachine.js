const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function findUserMachine() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Kullanıcının gösterdiği kategori ID'si
    const userCategoryId = '68380aa8b945226655fd3a9b';

    console.log(`\n🔍 Kategori ID ${userCategoryId} araştırılıyor...`);

    // Bu kategoriyi bul
    const category = await InventoryCategory.findById(userCategoryId);

    if (category) {
      console.log('\n📂 Kategori bulundu:');
      console.log(`  - Ad: ${category.ad}`);
      console.log(`  - Aktif: ${category.aktif}`);
      console.log(`  - Açıklama: ${category.aciklama || 'Yok'}`);

      // Regex test
      const regexTest = /makina|makine|machine/i.test(category.ad);
      console.log(`  - Regex eşleşmesi (makina/makine/machine): ${regexTest}`);

      // Bu kategorideki tüm öğeleri bul
      const items = await InventoryItem.find({
        kategoriId: userCategoryId,
      }).select('envanterKodu ad durum aktif lokasyon');

      console.log(`\n📦 Bu kategorideki envanter öğeleri (${items.length}):`);
      items.forEach(item => {
        console.log(`  - ${item.envanterKodu} | ${item.ad} | ${item.durum} | Aktif: ${item.aktif}`);
      });
    } else {
      console.log('\n❌ Bu kategori ID bulunamadı');
    }

    // Tüm kategorileri listele
    console.log('\n📋 Tüm kategoriler:');
    const allCategories = await InventoryCategory.find({});
    allCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id}) - Aktif: ${cat.aktif}`);
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

findUserMachine();
