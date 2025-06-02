const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function findMakZf01() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // mak-zf01 makinesini bul
    const machine = await InventoryItem.findOne({
      envanterKodu: 'mak-zf01',
    }).populate('kategoriId', 'ad');

    if (machine) {
      console.log('\n🔍 mak-zf01 bulundu:');
      console.log(`  - Envanter Kodu: ${machine.envanterKodu}`);
      console.log(`  - Ad: ${machine.ad}`);
      console.log(`  - Durum: ${machine.durum}`);
      console.log(`  - Aktif: ${machine.aktif}`);
      console.log(`  - Kategori: ${machine.kategoriId?.ad || 'Kategori yok'}`);
      console.log(`  - Kategori ID: ${machine.kategoriId?._id || 'ID yok'}`);

      // Bu kategoriyi ayrıntılı incele
      if (machine.kategoriId) {
        const category = await InventoryCategory.findById(machine.kategoriId._id);
        console.log('\n📂 Kategori detayları:');
        console.log(`  - Ad: ${category.ad}`);
        console.log(`  - Aktif: ${category.aktif}`);
        console.log(`  - Açıklama: ${category.aciklama || 'Yok'}`);

        // Bu kategorinin regex'e uyup uymadığını test et
        const regexTest = /makina|makine|machine/i.test(category.ad);
        console.log(`  - Regex eşleşmesi: ${regexTest}`);
      }
    } else {
      console.log('\n❌ mak-zf01 bulunamadı');
    }

    // Tüm envanter items'ı kontrol et
    const allItems = await InventoryItem.find({})
      .populate('kategoriId', 'ad')
      .select('envanterKodu ad kategoriId durum aktif');

    console.log(`\n📦 Tüm envanter öğeleri (${allItems.length}):`);
    allItems.forEach(item => {
      console.log(
        `  - ${item.envanterKodu} | ${item.ad} | Kat: ${item.kategoriId?.ad || 'Yok'} | ${item.durum} | Aktif: ${item.aktif}`,
      );
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

findMakZf01();
