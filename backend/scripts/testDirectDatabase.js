const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function testDirectDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    console.log('\n🧪 Güncellenmiş makina endpoint logic test ediliyor...');

    // İlk önce regex ile makina kategorilerini bul
    const machineCategories = await InventoryCategory.find({
      ad: { $regex: /makina|makine|machine/i },
      aktif: true,
    }).select('_id');

    console.log(`🔧 Regex ile bulunan makina kategorileri: ${machineCategories.length}`);

    // Tüm makina kategorilerindeki envanter öğelerini getir
    let machines = [];

    if (machineCategories.length > 0) {
      const categoryIds = machineCategories.map(cat => cat._id);

      machines = await InventoryItem.find({
        kategoriId: { $in: categoryIds },
        aktif: true,
        durum: { $in: ['aktif', 'bakim'] },
      })
        .select('envanterKodu ad lokasyon kategoriId durum')
        .populate('kategoriId', 'ad')
        .sort({ envanterKodu: 1 });
    }

    console.log(`📦 Regex kategorilerden bulunan makinalar: ${machines.length}`);

    // Dinamik alanlarda bu anahtar kelimeler geçen öğeleri bul
    const additionalMachines = await InventoryItem.find({
      aktif: true,
      durum: { $in: ['aktif', 'bakim'] },
      $or: [
        // Envanter kodunda makina geçenler
        { envanterKodu: { $regex: /mak|machine/i } },
        // Ad'ında bu kelimeler geçenler
        { ad: { $regex: /plastic|plastik|injection|enjeksiyon|makina|makine|machine/i } },
        // Dinamik alanlarda bu kelimeler geçenler
        { 'dinamikAlanlar.Makine Adı': { $exists: true } },
        { 'dinamikAlanlar.Model Kodu / Tipi': { $exists: true } },
        { 'dinamikAlanlar.Üretici Firma': { $exists: true } },
        { 'dinamikAlanlar.Kapanma Kuvveti (kN / ton)': { $exists: true } },
      ],
    })
      .select('envanterKodu ad lokasyon kategoriId durum dinamikAlanlar')
      .populate('kategoriId', 'ad')
      .sort({ envanterKodu: 1 });

    console.log(`🔍 Ek arama ile bulunan makinalar: ${additionalMachines.length}`);

    // Detayları listele
    console.log('\n📋 Ek aramada bulunan makinalar:');
    additionalMachines.forEach((machine, index) => {
      console.log(`  ${index + 1}. ${machine.envanterKodu} - ${machine.ad}`);
      console.log(`     Kategori: ${machine.kategoriId?.ad || 'Yok'}`);
      console.log(`     Durum: ${machine.durum}`);

      if (machine.dinamikAlanlar) {
        const makinaAdi = machine.dinamikAlanlar.get('Makine Adı');
        const modelKodu = machine.dinamikAlanlar.get('Model Kodu / Tipi');
        if (makinaAdi) {
          console.log(`     Dinamik - Makine Adı: ${makinaAdi}`);
        }
        if (modelKodu) {
          console.log(`     Dinamik - Model: ${modelKodu}`);
        }
      }
      console.log('');
    });

    // Mevcut makina listesine ek makinaları da ekle (tekrarları önlemek için)
    const existingIds = machines.map(m => m._id.toString());
    const uniqueAdditionalMachines = additionalMachines.filter(
      m => !existingIds.includes(m._id.toString()),
    );

    const allMachines = [...machines, ...uniqueAdditionalMachines];
    console.log(`📋 Toplam makina sayısı: ${allMachines.length}`);

    // Final formatted response
    const formattedMachines = allMachines.map(machine => {
      // Makina adını dinamik alanlardan da al
      let displayName = machine.ad;
      if (machine.dinamikAlanlar && machine.dinamikAlanlar.get) {
        const makinaAdi = machine.dinamikAlanlar.get('Makine Adı');
        const modelKodu = machine.dinamikAlanlar.get('Model Kodu / Tipi');
        if (makinaAdi) {
          displayName = makinaAdi;
          if (modelKodu) {
            displayName += ` (${modelKodu})`;
          }
        }
      }

      return {
        _id: machine._id,
        kod: machine.envanterKodu,
        ad: displayName,
        originalAd: machine.ad,
        lokasyon: machine.lokasyon || '',
        kategori: machine.kategoriId?.ad || '',
        durum: machine.durum,
        name: `${machine.envanterKodu} - ${displayName}`,
        machineCode: machine.envanterKodu,
      };
    });

    console.log('\n🎯 Son formatted response:');
    formattedMachines.forEach(machine => {
      console.log(`  - ${machine.kod} | ${machine.ad} | Kat: ${machine.kategori}`);
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

testDirectDatabase();
