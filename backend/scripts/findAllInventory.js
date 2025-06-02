const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function findAllInventory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Tüm kategorileri listele
    const allCategories = await InventoryCategory.find({});
    console.log('\n📂 Tüm kategoriler:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id}) - Aktif: ${cat.aktif}`);
    });

    // Tüm envanter öğelerini ara - özellikle mak- ile başlayanları
    const allInventoryItems = await InventoryItem.find({})
      .populate('kategoriId', 'ad')
      .select('envanterKodu ad kategoriId durum aktif dinamikAlanlar');

    console.log(`\n📦 Toplam envanter öğesi: ${allInventoryItems.length}`);

    // mak- ile başlayanları filtrele
    const makItems = allInventoryItems.filter(
      item =>
        item.envanterKodu.toLowerCase().includes('mak') ||
        item.ad.toLowerCase().includes('zf') ||
        item.ad.toLowerCase().includes('230'),
    );

    console.log(`\n🔍 'mak' veya 'zf' veya '230' içeren öğeler (${makItems.length}):`);
    makItems.forEach(item => {
      console.log(
        `  - ${item.envanterKodu} | ${item.ad} | Kat: ${item.kategoriId?.ad || 'Yok'} | ${item.durum} | Aktif: ${item.aktif}`,
      );

      // Dinamik alanları da göster
      if (item.dinamikAlanlar) {
        const makinaAdi = item.dinamikAlanlar.get('Makine Adı');
        const modelKodu = item.dinamikAlanlar.get('Model Kodu / Tipi');
        if (makinaAdi || modelKodu) {
          console.log(`    └─ Dinamik: Makine=${makinaAdi || 'Yok'}, Model=${modelKodu || 'Yok'}`);
        }
      }
    });

    // Özel olarak kullanıcının verdiği category ID'sini kontrol et
    const userCategoryId = '68380aa8b945226655fd3a9b';
    const itemsInUserCategory = await InventoryItem.find({
      kategoriId: userCategoryId,
    }).populate('kategoriId', 'ad');

    console.log(
      `\n🎯 Kullanıcının kategori ID'sinde (${userCategoryId}) ${itemsInUserCategory.length} öğe:`,
    );
    itemsInUserCategory.forEach(item => {
      console.log(`  - ${item.envanterKodu} | ${item.ad} | ${item.durum} | Aktif: ${item.aktif}`);
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

findAllInventory();
