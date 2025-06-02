const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryItem = require('../models/InventoryItem');

async function createUserMachine() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Önce kullanıcının verdiği kategori ID'yi bulalım
    let categoryId = '68380aa8b945226655fd3a9b';
    let category = await InventoryCategory.findById(categoryId);

    if (!category) {
      console.log(`❌ Kullanıcının verdiği kategori ID bulunamadı: ${categoryId}`);

      // Makina kategorisini kullan
      category = await InventoryCategory.findOne({
        ad: { $regex: /makina/i },
        aktif: true,
      });

      if (category) {
        categoryId = category._id;
        console.log(`✅ Makina kategorisi bulundu: ${category.ad} (${categoryId})`);
      } else {
        console.log('❌ Makina kategorisi de bulunamadı');
        return;
      }
    }

    // mak-zf01 makinesini kontrol et
    const existingMachine = await InventoryItem.findOne({ envanterKodu: 'mak-zf01' });
    if (existingMachine) {
      console.log('ℹ️  mak-zf01 makinesi zaten mevcut');
      return;
    }

    // Kullanıcının verdiği bilgilere göre makina oluştur
    const newMachine = new InventoryItem({
      kategoriId: categoryId,
      envanterKodu: 'mak-zf01',
      ad: 'zf230',
      aciklama: 'Plastik enjeksiyon makinası',
      dinamikAlanlar: {
        'Bakım Sorumlusu': 'ufuk',
        'Son Genel Bakım Tarihi': '2023-02-01',
        'Sonraki Planlı Bakım': '2024-02-06',
        'Kontrol Paneli Türü': 'KEBA',
        'Makine Adı': 'haitan',
        'Seri No': '123123',
        'Üretici Firma': 'haitan',
        'Model Kodu / Tipi': 'zf230',
        'Üretim Yılı': '2021',
        'Envanter Kayıt Tarihi': '2021-01-01',
        'Lokasyon / Hat / Alan': 'selipaşa',
        'Motor Gücü (kW)': '100',
        'Rezistans Gücü (Toplam W)': '50',
        'Mengene Açılma Mesafesi (mm)': '500',
        'Mengene En (mm)': '400',
        'Mengene Boy (mm)': '300',
        'Mengene Arası Mesafe (Tie Bar)': '200',
        'Enjeksiyon Hacmi (cm³)': '230',
        'Enjeksiyon Basıncı (bar)': '160',
        'Vida Çapı (mm)': '35',
        'Vida L/D Oranı': '1/25',
        'Kapanma Kuvveti (kN / ton)': '230',
      },
      durum: 'aktif',
      lokasyon: 'selimpasa',
      alisFiyati: 100,
      guncelDeger: 10000,
      tedarikci: 'haitan',
      garantiBitisTarihi: new Date('2022-01-01'),
      bakimPeriyodu: 30,
      qrKodu: 'INV-1748505560243-F744J5R22',
      barkod: '123123123',
      oncelikSeviyesi: 'orta',
      aktif: true,
      olusturanKullanici: new mongoose.Types.ObjectId('6837446e342f89c51d006421'),
      olusturmaTarihi: new Date('2025-05-29T08:00:49.896Z'),
      guncellemeTarihi: new Date('2025-05-29T08:04:32.226Z'),
    });

    await newMachine.save();
    console.log('✅ mak-zf01 makinesi başarıyla oluşturuldu');

    // Oluşturulan makineyi kontrol et
    const createdMachine = await InventoryItem.findOne({ envanterKodu: 'mak-zf01' }).populate(
      'kategoriId',
      'ad',
    );

    console.log('\n📋 Oluşturulan makine:');
    console.log(`  - Envanter Kodu: ${createdMachine.envanterKodu}`);
    console.log(`  - Ad: ${createdMachine.ad}`);
    console.log(`  - Kategori: ${createdMachine.kategoriId.ad}`);
    console.log(`  - Durum: ${createdMachine.durum}`);
    console.log(`  - Lokasyon: ${createdMachine.lokasyon}`);

    await mongoose.disconnect();
    console.log('\n📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

createUserMachine();
