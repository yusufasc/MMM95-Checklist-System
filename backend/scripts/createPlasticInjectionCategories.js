const mongoose = require('mongoose');
require('dotenv').config();

// Models
const InventoryCategory = require('../models/InventoryCategory');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
const User = require('../models/User');

const predefinedCategories = [
  {
    ad: 'Plastik Enjeksiyon Makinası',
    aciklama: 'Plastik enjeksiyon üretim makinaları',
    icon: 'precision_manufacturing',
    renk: '#1976d2',
    siraNo: 1,
  },
  {
    ad: 'Plastik Enjeksiyon Kalıpları',
    aciklama: 'Üretimde kullanılan kalıp setleri',
    icon: 'view_in_ar',
    renk: '#388e3c',
    siraNo: 2,
  },
  {
    ad: 'Yardımcı Ekipmanlar',
    aciklama: 'Hammadde hazırlama, soğutma, otomasyon sistemleri',
    icon: 'build_circle',
    renk: '#9c27b0',
    siraNo: 3,
  },
];

const predefinedTemplates = {
  'Plastik Enjeksiyon Makinası': [
    // Genel Tanımlayıcı Bilgiler
    {
      ad: 'Makine Adı',
      tip: 'text',
      gerekli: true,
      siraNo: 1,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Örn: ZAFIR 250',
    },
    {
      ad: 'Seri No',
      tip: 'text',
      gerekli: true,
      siraNo: 2,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Benzersiz tanıtım numarası',
    },
    {
      ad: 'Üretici Firma',
      tip: 'text',
      gerekli: true,
      siraNo: 3,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Örn: Haitian, Demag, Arburg vb.',
    },
    {
      ad: 'Model Kodu / Tipi',
      tip: 'text',
      gerekli: false,
      siraNo: 4,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Üreticiye ait model numarası',
    },
    {
      ad: 'Üretim Yılı',
      tip: 'number',
      gerekli: false,
      siraNo: 5,
      grup: 'Genel Tanımlayıcı Bilgiler',
      validasyon: { min: 1990, max: 2030 },
    },
    {
      ad: 'Envanter Kayıt Tarihi',
      tip: 'date',
      gerekli: false,
      siraNo: 6,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Sisteme ilk kaydedildiği tarih',
    },
    {
      ad: 'Lokasyon / Hat / Alan',
      tip: 'text',
      gerekli: true,
      siraNo: 7,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Hangi bölümde, hangi hat üzerinde kurulu',
    },

    // Teknik Özellikler
    {
      ad: 'Motor Gücü (kW)',
      tip: 'number',
      gerekli: false,
      siraNo: 8,
      grup: 'Teknik Özellikler',
      aciklama: 'Ana motorun gücü',
    },
    {
      ad: 'Rezistans Gücü (Toplam W)',
      tip: 'number',
      gerekli: false,
      siraNo: 9,
      grup: 'Teknik Özellikler',
      aciklama: 'Isıtıcı rezistansların toplam gücü',
    },
    {
      ad: 'Mengene Açılma Mesafesi (mm)',
      tip: 'number',
      gerekli: false,
      siraNo: 10,
      grup: 'Teknik Özellikler',
      aciklama: 'Açık konumda maksimum mesafe',
    },
    {
      ad: 'Mengene En (mm)',
      tip: 'number',
      gerekli: false,
      siraNo: 11,
      grup: 'Teknik Özellikler',
      aciklama: 'Plaka genişliği',
    },
    {
      ad: 'Mengene Boy (mm)',
      tip: 'number',
      gerekli: false,
      siraNo: 12,
      grup: 'Teknik Özellikler',
      aciklama: 'Plaka yüksekliği',
    },
    {
      ad: 'Mengene Arası Mesafe (Tie Bar)',
      tip: 'text',
      gerekli: false,
      siraNo: 13,
      grup: 'Teknik Özellikler',
      aciklama: 'Tie-bar aralıkları (örn: 470mm x 470mm)',
    },
    {
      ad: 'Enjeksiyon Hacmi (cm³)',
      tip: 'number',
      gerekli: false,
      siraNo: 14,
      grup: 'Teknik Özellikler',
      aciklama: 'Bir baskıda enjekte edilen hacim',
    },
    {
      ad: 'Enjeksiyon Basıncı (bar)',
      tip: 'number',
      gerekli: false,
      siraNo: 15,
      grup: 'Teknik Özellikler',
      aciklama: 'Maksimum enjeksiyon basıncı',
    },
    {
      ad: 'Vida Çapı (mm)',
      tip: 'number',
      gerekli: false,
      siraNo: 16,
      grup: 'Teknik Özellikler',
      aciklama: 'Plastikleştirme vidası çapı',
    },
    {
      ad: 'Vida L/D Oranı',
      tip: 'text',
      gerekli: false,
      siraNo: 17,
      grup: 'Teknik Özellikler',
      aciklama: 'Vida uzunluk/çap oranı',
    },
    {
      ad: 'Kapanma Kuvveti (kN / ton)',
      tip: 'number',
      gerekli: false,
      siraNo: 18,
      grup: 'Teknik Özellikler',
      aciklama: 'Mengene sıkma kuvveti',
    },

    // Bakım ve Kalite Takibi
    {
      ad: 'Bakım Sorumlusu',
      tip: 'text',
      gerekli: false,
      siraNo: 19,
      grup: 'Bakım ve Kalite Takibi',
      aciklama: 'Sorumlu departman/personel',
    },
    {
      ad: 'Son Genel Bakım Tarihi',
      tip: 'date',
      gerekli: false,
      siraNo: 20,
      grup: 'Bakım ve Kalite Takibi',
    },
    {
      ad: 'Sonraki Planlı Bakım',
      tip: 'date',
      gerekli: false,
      siraNo: 21,
      grup: 'Bakım ve Kalite Takibi',
    },
    {
      ad: 'Günlük/Haftalık Kontroller',
      tip: 'textarea',
      gerekli: false,
      siraNo: 22,
      grup: 'Bakım ve Kalite Takibi',
      aciklama: 'Checklist kodları',
    },

    // Dijital ve Takip Sistemleri
    {
      ad: 'Makineye Takılı Sayaçlar',
      tip: 'textarea',
      gerekli: false,
      siraNo: 23,
      grup: 'Dijital ve Takip Sistemleri',
      aciklama: 'Cycle, Saat, Üretim Adedi sayaçları',
    },
    {
      ad: 'Kontrol Paneli Türü',
      tip: 'select',
      gerekli: false,
      siraNo: 24,
      grup: 'Dijital ve Takip Sistemleri',
      secenekler: ['KEBA', 'Siemens', 'B&R', 'Fanuc', 'Mitsubishi', 'Diğer'],
      aciklama: 'Makineye ait yazılım/kontrol paneli',
    },
    {
      ad: 'Teknik Dökümantasyon Linkleri',
      tip: 'textarea',
      gerekli: false,
      siraNo: 25,
      grup: 'Dijital ve Takip Sistemleri',
      aciklama: 'Manuel, şema vb. doküman linkleri',
    },
  ],
  'Plastik Enjeksiyon Kalıpları': [
    // Genel Bilgiler
    {
      ad: 'Kalıp Adı/Kodu',
      tip: 'text',
      gerekli: true,
      siraNo: 1,
      grup: 'Genel Bilgiler',
      aciklama: 'Kalıp tanımlayıcı adı',
    },
    {
      ad: 'Ürün Adı',
      tip: 'text',
      gerekli: true,
      siraNo: 2,
      grup: 'Genel Bilgiler',
      aciklama: 'Üretilen ürün',
    },
    {
      ad: 'Kavite Sayısı',
      tip: 'number',
      gerekli: false,
      siraNo: 3,
      grup: 'Teknik Özellikler',
      aciklama: 'Kalıptaki toplam kavite sayısı',
    },
    {
      ad: 'Malzeme Tipi',
      tip: 'select',
      gerekli: false,
      siraNo: 4,
      grup: 'Teknik Özellikler',
      secenekler: ['PP', 'PE', 'ABS', 'PC', 'PVC', 'Diğer'],
    },
    {
      ad: 'Bağlı Makine',
      tip: 'text',
      gerekli: false,
      siraNo: 5,
      grup: 'Kullanım Bilgileri',
      aciklama: 'Hangi makinede kullanılıyor',
    },
    {
      ad: 'Toplam Kullanım Saati',
      tip: 'number',
      gerekli: false,
      siraNo: 6,
      grup: 'Kullanım Bilgileri',
    },
    {
      ad: 'Depolama Lokasyonu',
      tip: 'text',
      gerekli: false,
      siraNo: 7,
      grup: 'Depolama',
      aciklama: 'Kalıp deposundaki yeri',
    },
  ],
  'Yardımcı Ekipmanlar': [
    // Genel Bilgiler
    { ad: 'Ekipman Adı/Kodu', tip: 'text', gerekli: true, siraNo: 1, grup: 'Genel Bilgiler' },
    {
      ad: 'Ekipman Türü',
      tip: 'select',
      gerekli: true,
      siraNo: 2,
      grup: 'Genel Bilgiler',
      secenekler: ['Kurutucu', 'Besleyici', 'Chiller', 'Robot', 'Konveyör', 'Kırıcı', 'Diğer'],
    },
    { ad: 'Marka/Model', tip: 'text', gerekli: false, siraNo: 3, grup: 'Genel Bilgiler' },
    {
      ad: 'Kapasite',
      tip: 'text',
      gerekli: false,
      siraNo: 4,
      grup: 'Teknik Özellikler',
      aciklama: 'Örn: 100kg/h, 50L/dk',
    },
    {
      ad: 'Güç Tüketimi',
      tip: 'text',
      gerekli: false,
      siraNo: 5,
      grup: 'Teknik Özellikler',
      aciklama: 'Elektrikli/Pnömatik güç',
    },
    {
      ad: 'Bağlı Makine/Hat',
      tip: 'text',
      gerekli: false,
      siraNo: 6,
      grup: 'Kullanım Bilgileri',
      aciklama: 'Hangi makine/hat ile kullanılıyor',
    },
    {
      ad: 'Kullanım Amacı',
      tip: 'textarea',
      gerekli: false,
      siraNo: 7,
      grup: 'Kullanım Bilgileri',
    },
  ],
};

const createFieldTemplates = async (categoryId, categoryName, adminUserId) => {
  const templates = predefinedTemplates[categoryName];
  if (!templates) {
    return;
  }

  console.log(`${categoryName} için field template'ler oluşturuluyor...`);

  for (const template of templates) {
    try {
      // Önce aynı alan var mı kontrol et
      const existingField = await InventoryFieldTemplate.findOne({
        kategoriId: categoryId,
        alanAdi: template.ad,
      });

      if (existingField) {
        console.log(`⚠️  ${template.ad} alanı zaten mevcut`);
        continue;
      }

      const fieldTemplate = new InventoryFieldTemplate({
        kategoriId: categoryId,
        alanAdi: template.ad,
        alanTipi: template.tip,
        zorunlu: template.gerekli,
        varsayilanDeger: template.varsayilanDeger,
        secenekler: template.secenekler || [],
        siraNo: template.siraNo,
        grup: template.grup || 'Genel Bilgiler',
        validasyon: template.validasyon || {},
        aktif: true,
        olusturanKullanici: adminUserId,
      });

      await fieldTemplate.save();
      console.log(`✓ ${template.ad} alanı oluşturuldu`);
    } catch (error) {
      console.error(`✗ ${template.ad} alanı oluşturulamadı:`, error.message);
    }
  }
};

const createInventorySystem = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    // Admin kullanıcıyı bul
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' });
    if (!adminUser) {
      console.error('Admin kullanıcı bulunamadı!');
      process.exit(1);
    }

    console.log('Envanter kategorileri oluşturuluyor...');

    for (const categoryData of predefinedCategories) {
      // Kategori zaten var mı kontrol et
      const existingCategory = await InventoryCategory.findOne({ ad: categoryData.ad });

      if (existingCategory) {
        console.log(
          `⚠️  ${categoryData.ad} kategorisi zaten mevcut, field template'ler kontrol ediliyor...`,
        );

        // Field template'ler var mı kontrol et
        const fieldCount = await InventoryFieldTemplate.countDocuments({
          kategoriId: existingCategory._id,
          aktif: true,
        });

        console.log(`Mevcut field template sayısı: ${fieldCount}`);
        console.log(
          `Beklenilen field template sayısı: ${predefinedTemplates[categoryData.ad]?.length || 0}`,
        );

        // Field template'leri oluştur/güncelle
        await createFieldTemplates(existingCategory._id, categoryData.ad, adminUser._id);
        continue;
      }

      // Yeni kategori oluştur
      const newCategory = new InventoryCategory({
        ad: categoryData.ad,
        aciklama: categoryData.aciklama,
        icon: categoryData.icon,
        renk: categoryData.renk,
        siraNo: categoryData.siraNo,
        olusturanKullanici: adminUser._id,
      });

      await newCategory.save();
      console.log(`✓ ${categoryData.ad} kategorisi oluşturuldu`);

      // Field template'leri oluştur
      await createFieldTemplates(newCategory._id, categoryData.ad, adminUser._id);
    }

    console.log('\n🎉 Envanter sistemi başarıyla oluşturuldu!');
    console.log('\nOluşturulan kategoriler:');
    predefinedCategories.forEach(cat => {
      const templateCount = predefinedTemplates[cat.ad]?.length || 0;
      console.log(`  - ${cat.ad} (${templateCount} alan)`);
    });

    // Son durum kontrolü
    console.log('\n=== SON DURUM ===');
    for (const categoryData of predefinedCategories) {
      const category = await InventoryCategory.findOne({ ad: categoryData.ad });
      if (category) {
        const fieldCount = await InventoryFieldTemplate.countDocuments({
          kategoriId: category._id,
          aktif: true,
        });
        console.log(`${categoryData.ad}: ${fieldCount} alan template'i`);
      }
    }
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
};

// Script çalıştır
createInventorySystem();
