const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function createSampleMachines() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📱 MongoDB bağlantısı başarılı');

    // Plastik Enjeksiyon Makinası kategorisini bul
    const machineCategory = await InventoryCategory.findOne({
      ad: 'Plastik Enjeksiyon Makinası',
    });

    if (!machineCategory) {
      console.log('❌ Plastik Enjeksiyon Makinası kategorisi bulunamadı');
      return;
    }

    console.log('✅ Kategori bulundu:', machineCategory.ad);

    // Örnek makina verileri
    const sampleMachines = [
      {
        kategoriId: machineCategory._id,
        envanterKodu: 'PEM-001',
        ad: 'HAITIAN MA-2000',
        aciklama: 'Ana üretim hattı plastik enjeksiyon makinası',
        durum: 'aktif',
        lokasyon: 'Fabrika/Hat-1',
        dinamikAlanlar: {
          'Makine Adı': 'HAITIAN MA-2000',
          'Seri No': 'HTN-2000-001',
          'Üretici Firma': 'Haitian',
          'Model Kodu / Tipi': 'MA-2000',
          'Üretim Yılı': 2020,
          'Lokasyon / Hat / Alan': 'Fabrika/Hat-1',
          'Motor Gücü (kW)': 45,
          'Rezistans Gücü (Toplam W)': 12000,
          'Mengene Açılma Mesafesi (mm)': 450,
          'Enjeksiyon Hacmi (cm³)': 850,
          'Enjeksiyon Basıncı (bar)': 1800,
          'Vida Çapı (mm)': 65,
          'Kapanma Kuvveti (kN / ton)': 200,
          'Kontrol Paneli Türü': 'KEBA',
        },
        alisFiyati: 180000,
        guncelDeger: 160000,
        tedarikci: 'Haitian Türkiye',
        oncelikSeviyesi: 'kritik',
        etiketler: ['ana-hat', 'plastik', 'uretim'],
        aktif: true,
      },
      {
        kategoriId: machineCategory._id,
        envanterKodu: 'PEM-002',
        ad: 'ARBURG ALLROUNDER 520',
        aciklama: 'Yedek üretim hattı enjeksiyon makinası',
        durum: 'aktif',
        lokasyon: 'Fabrika/Hat-2',
        dinamikAlanlar: {
          'Makine Adı': 'ARBURG ALLROUNDER 520',
          'Seri No': 'ARB-520-002',
          'Üretici Firma': 'Arburg',
          'Model Kodu / Tipi': 'ALLROUNDER 520',
          'Üretim Yılı': 2019,
          'Lokasyon / Hat / Alan': 'Fabrika/Hat-2',
          'Motor Gücü (kW)': 35,
          'Rezistans Gücü (Toplam W)': 9000,
          'Mengene Açılma Mesafesi (mm)': 380,
          'Enjeksiyon Hacmi (cm³)': 650,
          'Enjeksiyon Basıncı (bar)': 1600,
          'Vida Çapı (mm)': 55,
          'Kapanma Kuvveti (kN / ton)': 150,
          'Kontrol Paneli Türü': 'Siemens',
        },
        alisFiyati: 150000,
        guncelDeger: 135000,
        tedarikci: 'Arburg Almanya',
        oncelikSeviyesi: 'yuksek',
        etiketler: ['yedek-hat', 'plastik', 'uretim'],
        aktif: true,
      },
      {
        kategoriId: machineCategory._id,
        envanterKodu: 'PEM-003',
        ad: 'DEMAG IntElect 1000',
        aciklama: 'Elektrikli enjeksiyon makinası - özel parçalar',
        durum: 'bakim',
        lokasyon: 'Fabrika/Hat-3',
        dinamikAlanlar: {
          'Makine Adı': 'DEMAG IntElect 1000',
          'Seri No': 'DMG-1000-003',
          'Üretici Firma': 'Demag',
          'Model Kodu / Tipi': 'IntElect 1000',
          'Üretim Yılı': 2021,
          'Lokasyon / Hat / Alan': 'Fabrika/Hat-3',
          'Motor Gücü (kW)': 28,
          'Rezistans Gücü (Toplam W)': 7500,
          'Mengene Açılma Mesafesi (mm)': 320,
          'Enjeksiyon Hacmi (cm³)': 480,
          'Enjeksiyon Basıncı (bar)': 1400,
          'Vida Çapı (mm)': 45,
          'Kapanma Kuvveti (kN / ton)': 100,
          'Kontrol Paneli Türü': 'B&R',
        },
        alisFiyati: 120000,
        guncelDeger: 115000,
        tedarikci: 'Demag Plastiks Machinery',
        oncelikSeviyesi: 'orta',
        etiketler: ['elektrikli', 'ozel-parca', 'plastik'],
        aktif: true,
      },
      {
        kategoriId: machineCategory._id,
        envanterKodu: 'PEM-004',
        ad: 'ENGEL e-motion 440',
        aciklama: 'Hibrit teknoloji enjeksiyon makinası',
        durum: 'aktif',
        lokasyon: 'Fabrika/Hat-4',
        dinamikAlanlar: {
          'Makine Adı': 'ENGEL e-motion 440',
          'Seri No': 'ENG-440-004',
          'Üretici Firma': 'Engel',
          'Model Kodu / Tipi': 'e-motion 440',
          'Üretim Yılı': 2022,
          'Lokasyon / Hat / Alan': 'Fabrika/Hat-4',
          'Motor Gücü (kW)': 32,
          'Rezistans Gücü (Toplam W)': 8500,
          'Mengene Açılma Mesafesi (mm)': 400,
          'Enjeksiyon Hacmi (cm³)': 580,
          'Enjeksiyon Basıncı (bar)': 1500,
          'Vida Çapı (mm)': 50,
          'Kapanma Kuvveti (kN / ton)': 120,
          'Kontrol Paneli Türü': 'Fanuc',
        },
        alisFiyati: 140000,
        guncelDeger: 138000,
        tedarikci: 'Engel Austria',
        oncelikSeviyesi: 'yuksek',
        etiketler: ['hibrit', 'enerji-verimli', 'plastik'],
        aktif: true,
      },
    ];

    // Mevcut makinaları kontrol et ve ekle
    let createdCount = 0;
    for (const machineData of sampleMachines) {
      const existingMachine = await InventoryItem.findOne({
        envanterKodu: machineData.envanterKodu,
      });

      if (!existingMachine) {
        const machine = new InventoryItem({
          ...machineData,
          olusturanKullanici: '507f1f77bcf86cd799439011', // Dummy ObjectId for system
        });

        machine.hesaplaDataKalitesiSkoru();
        await machine.save();

        console.log(`✅ ${machineData.envanterKodu} - ${machineData.ad} eklendi`);
        createdCount++;
      } else {
        console.log(`ℹ️  ${machineData.envanterKodu} zaten mevcut`);
      }
    }

    console.log(`🎉 ${createdCount} yeni makina eklendi`);
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  createSampleMachines();
}

module.exports = createSampleMachines;
