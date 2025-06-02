const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function testInventoryEndpoint() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Test inventory/machines-for-tasks endpoint logic
    console.log('\n🧪 /api/inventory/machines-for-tasks endpoint logic test ediliyor...');

    // 1. Makina kategorilerini bul
    const machineCategories = await InventoryCategory.find({
      ad: { $regex: /makina|makine|machine/i },
      aktif: true,
    }).select('_id');

    console.log(`📋 ${machineCategories.length} makina kategorisi bulundu`);
    machineCategories.forEach(cat => console.log(`   - ID: ${cat._id}`));

    if (machineCategories.length === 0) {
      console.log('❌ Hiç makina kategorisi bulunamadı!');
      await mongoose.disconnect();
      return;
    }

    const categoryIds = machineCategories.map(cat => cat._id);

    // 2. Makina kategorilerindeki aktif envanter öğelerini getir
    const machines = await InventoryItem.find({
      kategoriId: { $in: categoryIds },
      aktif: true,
      durum: { $in: ['aktif', 'bakim'] },
    })
      .select('envanterKodu ad lokasyon kategoriId durum')
      .populate('kategoriId', 'ad')
      .sort({ envanterKodu: 1 });

    console.log(`\n🔧 ${machines.length} makina bulundu:`);

    // 3. Response format'ı tasks modülü için uygun hale getir
    const formattedMachines = machines.map(machine => ({
      _id: machine._id,
      kod: machine.envanterKodu,
      ad: machine.ad,
      lokasyon: machine.lokasyon || '',
      kategori: machine.kategoriId?.ad || '',
      durum: machine.durum,
      // Tasks modülü için uyumluluk
      name: `${machine.envanterKodu} - ${machine.ad}`,
      machineCode: machine.envanterKodu,
    }));

    console.log('\n📊 Formatted machines for tasks:');
    formattedMachines.forEach(machine => {
      console.log(`   - ${machine.kod} | ${machine.ad} | ${machine.durum} | ${machine.name}`);
    });

    console.log('\n✅ Endpoint logic başarıyla test edildi!');
    console.log(`   Response: ${formattedMachines.length} makina döndürülecek`);

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

testInventoryEndpoint();
