const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');

async function migrateMachinesToInventory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // 1. Makina kategorisi oluştur
    let machineCategory = await InventoryCategory.findOne({ ad: 'Makina' });

    if (!machineCategory) {
      machineCategory = new InventoryCategory({
        ad: 'Makina',
        aciklama: 'Fabrika makinaları',
        icon: 'precision_manufacturing',
        renk: '#2196F3',
        siraNo: 1,
        aktif: true,
        olusturanKullanici: '507f1f77bcf86cd799439011', // Dummy ObjectId
      });
      await machineCategory.save();
      console.log('✅ Makina kategorisi oluşturuldu');
    } else {
      console.log('ℹ️  Makina kategorisi zaten mevcut');
    }

    // 2. Makina field template'leri oluştur
    const fieldTemplates = [
      { ad: 'Makina No', tip: 'text', gerekli: true, siraNo: 1, grup: 'Temel Bilgiler' },
      { ad: 'Açıklama', tip: 'textarea', gerekli: false, siraNo: 2, grup: 'Temel Bilgiler' },
      { ad: 'Departman', tip: 'text', gerekli: false, siraNo: 3, grup: 'Organizasyon' },
      { ad: 'Sorumlu Roller', tip: 'text', gerekli: false, siraNo: 4, grup: 'Organizasyon' },
    ];

    for (const template of fieldTemplates) {
      const existingTemplate = await InventoryFieldTemplate.findOne({
        kategoriId: machineCategory._id,
        alanAdi: template.ad,
      });

      if (!existingTemplate) {
        const fieldTemplate = new InventoryFieldTemplate({
          kategoriId: machineCategory._id,
          alanAdi: template.ad,
          alanTipi: template.tip,
          zorunlu: template.gerekli,
          siraNo: template.siraNo,
          grup: template.grup,
          aktif: true,
          olusturanKullanici: '507f1f77bcf86cd799439011',
        });
        await fieldTemplate.save();
        console.log(`✅ ${template.ad} field template'i oluşturuldu`);
      }
    }

    // 3. Eski makinaları al ve envantere ekle
    const oldMachines = await Machine.find({ durum: 'aktif' })
      .populate('departman', 'ad')
      .populate('sorumluRoller', 'ad');

    console.log(`\n🔄 ${oldMachines.length} makina envantere aktarılıyor...`);

    let migratedCount = 0;
    for (const machine of oldMachines) {
      // Aynı makina no ile envanter kaydı var mı kontrol et
      const existingInventoryItem = await InventoryItem.findOne({
        envanterKodu: `MAK-${machine.makinaNo}`,
      });

      if (!existingInventoryItem) {
        const inventoryItem = new InventoryItem({
          kategoriId: machineCategory._id,
          envanterKodu: `MAK-${machine.makinaNo}`,
          ad: machine.ad,
          aciklama: machine.aciklama || '',
          durum: machine.durum === 'aktif' ? 'aktif' : 'pasif',
          lokasyon: '',
          departman: machine.departman?._id,
          dinamikAlanlar: {
            'Makina No': machine.makinaNo,
            Açıklama: machine.aciklama || '',
            Departman: machine.departman?.ad || '',
            'Sorumlu Roller': machine.sorumluRoller.map(r => r.ad).join(', '),
          },
          alisFiyati: 0,
          guncelDeger: 0,
          oncelikSeviyesi: 'orta',
          etiketler: ['migrate', 'machine'],
          aktif: true,
          olusturanKullanici: '507f1f77bcf86cd799439011',
        });

        inventoryItem.hesaplaDataKalitesiSkoru();
        await inventoryItem.save();

        console.log(`  ✅ ${machine.makinaNo} - ${machine.ad} aktarıldı`);
        migratedCount++;
      } else {
        console.log(`  ℹ️  ${machine.makinaNo} zaten envanterde mevcut`);
      }
    }

    console.log(`\n🎉 ${migratedCount} makina başarıyla envantere aktarıldı`);

    // 4. Kontrol için envanter makinalarını listele
    const inventoryMachines = await InventoryItem.find({
      kategoriId: machineCategory._id,
      aktif: true,
    }).select('envanterKodu ad durum');

    console.log(`\n📋 Envanterdeki makinalar (${inventoryMachines.length} adet):`);
    inventoryMachines.forEach(machine => {
      console.log(`  - ${machine.envanterKodu} | ${machine.ad} | ${machine.durum}`);
    });

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

migrateMachinesToInventory();
