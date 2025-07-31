const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');

const createSimpleTestMachines = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Admin kullanıcısını bul (kategori oluşturmak için)
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' });

    if (!adminUser) {
      console.log('❌ Admin kullanıcısı bulunamadı');
      return;
    }

    // Test makinaları (kategoriId olmadan)
    const testMachines = [
      {
        envanterKodu: 'PKT001',
        ad: 'Paketleme Makinası 1',
        kategori: 'Paketleme Makinaları',
        durum: 'aktif',
        olusturanKullanici: adminUser._id,
        dinamikAlanlar: {
          marka: 'Bosch',
          model: 'PKG-2000',
          yil: '2020',
        },
      },
      {
        envanterKodu: 'PKT002',
        ad: 'Paketleme Makinası 2',
        kategori: 'Paketleme Makinaları',
        durum: 'aktif',
        olusturanKullanici: adminUser._id,
        dinamikAlanlar: {
          marka: 'Siemens',
          model: 'PKG-3000',
          yil: '2021',
        },
      },
      {
        envanterKodu: 'PKT003',
        ad: 'Paketleme Makinası 3',
        kategori: 'Paketleme Makinaları',
        durum: 'aktif',
        olusturanKullanici: adminUser._id,
        dinamikAlanlar: {
          marka: 'ABB',
          model: 'PKG-4000',
          yil: '2022',
        },
      },
      {
        envanterKodu: 'ENJ001',
        ad: 'Enjeksiyon Makinası 1',
        kategori: 'Plastik Enjeksiyon Makinaları',
        durum: 'aktif',
        olusturanKullanici: adminUser._id,
        dinamikAlanlar: {
          marka: 'Arburg',
          model: 'ALLROUNDER 520C',
          yil: '2019',
        },
      },
      {
        envanterKodu: 'ENJ002',
        ad: 'Enjeksiyon Makinası 2',
        kategori: 'Plastik Enjeksiyon Makinaları',
        durum: 'aktif',
        olusturanKullanici: adminUser._id,
        dinamikAlanlar: {
          marka: 'Engel',
          model: 'VICTORY 330/80',
          yil: '2020',
        },
      },
    ];

    console.log('📋 Test makinaları oluşturuluyor...');

    for (const machineData of testMachines) {
      // Mevcut makina var mı kontrol et
      const existingMachine = await InventoryItem.findOne({
        envanterKodu: machineData.envanterKodu,
      });

      if (existingMachine) {
        console.log(`⚠️ Makina zaten mevcut: ${machineData.envanterKodu}`);
        continue;
      }

      const machine = new InventoryItem(machineData);
      await machine.save();
      console.log(
        `✅ Oluşturuldu: ${machineData.envanterKodu} - ${machineData.ad}`,
      );
    }

    console.log('\n📊 Oluşturulan makina kategorileri:');
    const machineCategories = await InventoryItem.distinct('kategori');
    machineCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat}`);
    });

    const totalMachines = await InventoryItem.countDocuments({
      durum: 'aktif',
    });
    console.log(`\n🎯 Toplam aktif makina: ${totalMachines} adet`);

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

createSimpleTestMachines();
