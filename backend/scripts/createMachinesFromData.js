const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function createMachinesFromData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Makina kategorisini bul
    const machineCategory = await InventoryCategory.findOne({ ad: 'Makina' });

    if (!machineCategory) {
      console.log('❌ Makina kategorisi bulunamadı!');
      return;
    }

    console.log('✅ Makina kategorisi bulundu:', machineCategory.ad);

    // Kullanıcının verdiği makina bilgileri
    const machineData = [
      {
        _id: '683759c0adac5eaae8227867',
        ad: 'zf101',
        makinaNo: '01',
        durum: 'aktif',
      },
      {
        _id: '683759d4adac5eaae82278da',
        ad: 'zf02',
        makinaNo: '02',
        durum: 'aktif',
      },
      {
        _id: '683774907b8cf9002aeae398',
        ad: 'ZF03',
        makinaNo: '03',
        durum: 'aktif',
      },
      {
        _id: '683774b47b8cf9002aeae46e',
        ad: 'ZF04',
        makinaNo: '04',
        durum: 'aktif',
      },
    ];

    let createdCount = 0;
    for (const machine of machineData) {
      // Aynı makina no ile envanter kaydı var mı kontrol et
      const existingInventoryItem = await InventoryItem.findOne({
        $or: [
          { envanterKodu: `MAK-${machine.makinaNo}` },
          { envanterKodu: machine.makinaNo },
          { ad: machine.ad },
        ],
      });

      if (!existingInventoryItem) {
        const inventoryItem = new InventoryItem({
          kategoriId: machineCategory._id,
          envanterKodu: `MAK-${machine.makinaNo}`,
          ad: machine.ad,
          aciklama: `${machine.ad} - Makina No: ${machine.makinaNo}`,
          durum: machine.durum,
          lokasyon: 'Fabrika',
          dinamikAlanlar: {
            'Makina No': machine.makinaNo,
            Açıklama: `${machine.ad} - Fabrika makinası`,
            Departman: 'Üretim',
            'Sorumlu Roller': 'Operatör, Teknisyen',
          },
          alisFiyati: 100000,
          guncelDeger: 90000,
          oncelikSeviyesi: 'yuksek',
          etiketler: ['fabrika', 'uretim', 'makina'],
          aktif: true,
          olusturanKullanici: '507f1f77bcf86cd799439011',
        });

        inventoryItem.hesaplaDataKalitesiSkoru();
        await inventoryItem.save();

        console.log(
          `  ✅ ${machine.makinaNo} - ${machine.ad} oluşturuldu (${inventoryItem.envanterKodu})`,
        );
        createdCount++;
      } else {
        console.log(`  ℹ️  ${machine.makinaNo} - ${machine.ad} zaten mevcut`);
      }
    }

    console.log(`\n🎉 ${createdCount} makina başarıyla oluşturuldu`);

    // Kontrol için envanter makinalarını listele
    const inventoryMachines = await InventoryItem.find({
      kategoriId: machineCategory._id,
      aktif: true,
    }).select('envanterKodu ad durum lokasyon');

    console.log(`\n📋 Envanterdeki makinalar (${inventoryMachines.length} adet):`);
    inventoryMachines.forEach(machine => {
      console.log(
        `  - ${machine.envanterKodu} | ${machine.ad} | ${machine.durum} | ${machine.lokasyon}`,
      );
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

createMachinesFromData();
