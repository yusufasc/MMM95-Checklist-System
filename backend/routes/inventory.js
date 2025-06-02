const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { auth, checkModulePermission } = require('../middleware/auth');

// Models
const InventoryCategory = require('../models/InventoryCategory');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
const InventoryItem = require('../models/InventoryItem');

// Excel dosyaları için multer ayarları
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları kabul edilir'));
    }
  },
});

// Önceden tanımlı şablonlar
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
    // Genel Tanımlayıcı Bilgiler
    {
      ad: 'Kalıp Adı/Kodu',
      tip: 'text',
      gerekli: true,
      siraNo: 1,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Kalıp kimlik bilgisi',
    },
    {
      ad: 'Kalıp Seri No',
      tip: 'text',
      gerekli: true,
      siraNo: 2,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Üretici seri numarası',
    },
    {
      ad: 'Kalıp Üreticisi',
      tip: 'text',
      gerekli: true,
      siraNo: 3,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Kalıbı imal eden firma',
    },
    {
      ad: 'Teslim Tarihi',
      tip: 'date',
      gerekli: false,
      siraNo: 4,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Fabrikaya teslim edildiği tarih',
    },
    {
      ad: 'Üretilecek Ürün Bilgisi',
      tip: 'textarea',
      gerekli: false,
      siraNo: 5,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Bu kalıptan çıkan ürünün tanımı',
    },
    {
      ad: 'Kavite Sayısı',
      tip: 'number',
      gerekli: false,
      siraNo: 6,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Bir çevrimde kaç adet ürün çıkarabilir',
    },

    // Teknik Özellikler
    {
      ad: 'Malzeme Türü',
      tip: 'select',
      gerekli: false,
      siraNo: 7,
      grup: 'Teknik Özellikler',
      secenekler: ['PP', 'PE', 'ABS', 'PC', 'PA', 'POM', 'Diğer'],
      aciklama: 'İşlenecek plastik hammadde türü',
    },
    {
      ad: 'Kalıp Ağırlığı (kg)',
      tip: 'number',
      gerekli: false,
      siraNo: 8,
      grup: 'Teknik Özellikler',
      aciklama: 'Toplam kalıp ağırlığı',
    },
    {
      ad: 'Soğutma Kanalları',
      tip: 'textarea',
      gerekli: false,
      siraNo: 9,
      grup: 'Teknik Özellikler',
      aciklama: 'Soğutma sistemi detayları',
    },
    {
      ad: 'Çıkarma Mekanizması',
      tip: 'select',
      gerekli: false,
      siraNo: 10,
      grup: 'Teknik Özellikler',
      secenekler: ['Ejektör pin', 'Hava üfleme', 'Robot', 'Manuel', 'Diğer'],
      aciklama: 'Ürün çıkarma yöntemi',
    },

    // Bakım ve Kalite Takibi
    {
      ad: 'Bakım Programı',
      tip: 'textarea',
      gerekli: false,
      siraNo: 11,
      grup: 'Bakım ve Kalite Takibi',
      aciklama: 'Periyodik bakım detayları',
    },
    {
      ad: 'Depolama Lokasyonu',
      tip: 'text',
      gerekli: false,
      siraNo: 12,
      grup: 'Bakım ve Kalite Takibi',
      aciklama: 'Kalıp deposundaki yeri',
    },
  ],

  'Plastik Yardımcı Ekipmanlar': [
    // Genel Tanımlayıcı Bilgiler
    {
      ad: 'Ekipman Adı',
      tip: 'text',
      gerekli: true,
      siraNo: 1,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Ekipman tanımı',
    },
    {
      ad: 'Ekipman Türü',
      tip: 'select',
      gerekli: true,
      siraNo: 2,
      grup: 'Genel Tanımlayıcı Bilgiler',
      secenekler: [
        'Hammadde Kurutucusu',
        'Granül Karıştırıcısı',
        'Soğutma Kulesi',
        'Kırpıntı Öğütücü',
        'Robot',
        'Konveyör',
        'Paketleme Makinesi',
        'Kalite Kontrol Cihazı',
        'Diğer',
      ],
      aciklama: 'Ekipman kategorisi',
    },
    {
      ad: 'Üretici',
      tip: 'text',
      gerekli: false,
      siraNo: 3,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'İmal eden firma',
    },
    {
      ad: 'Model',
      tip: 'text',
      gerekli: false,
      siraNo: 4,
      grup: 'Genel Tanımlayıcı Bilgiler',
      aciklama: 'Model bilgisi',
    },
    {
      ad: 'Kapasite',
      tip: 'text',
      gerekli: false,
      siraNo: 5,
      grup: 'Teknik Özellikler',
      aciklama: 'İşleme kapasitesi (kg/saat, adet/dk vb.)',
    },
    {
      ad: 'Güç Tüketimi (kW)',
      tip: 'number',
      gerekli: false,
      siraNo: 6,
      grup: 'Teknik Özellikler',
      aciklama: 'Elektrik güç tüketimi',
    },
  ],
};

// === KATEGORİ YÖNETİMİ ===

// Tüm kategorileri getir
router.get('/categories', auth, checkModulePermission('Envanter Yönetimi'), async (req, res) => {
  try {
    const categories = await InventoryCategory.find({ aktif: true })
      .populate('olusturanKullanici', 'ad soyad')
      .sort({ siraNo: 1, ad: 1 });

    res.json(categories);
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni kategori oluştur
router.post(
  '/categories',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, aciklama, icon, renk, siraNo } = req.body;

      // Aynı isimde kategori var mı kontrol et
      const existingCategory = await InventoryCategory.findOne({ ad: ad.trim() });
      if (existingCategory) {
        return res.status(400).json({ message: 'Bu kategori adı zaten kullanılıyor' });
      }

      const newCategory = new InventoryCategory({
        ad: ad.trim(),
        aciklama,
        icon: icon || 'inventory',
        renk: renk || '#1976d2',
        siraNo: siraNo || 0,
        olusturanKullanici: req.user.id,
      });

      await newCategory.save();
      await newCategory.populate('olusturanKullanici', 'ad soyad');

      // Kategori oluşturulduğunda otomatik şablon alanları oluşturma
      await createPredefinedFieldTemplates(newCategory._id, newCategory.ad);

      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Kategori oluşturulurken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Kategori güncelle
router.put(
  '/categories/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, aciklama, icon, renk, siraNo, aktif } = req.body;

      const category = await InventoryCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Eğer ad değişiyorsa, aynı isimde başka kategori var mı kontrol et
      if (ad && ad.trim() !== category.ad) {
        const existingCategory = await InventoryCategory.findOne({
          ad: ad.trim(),
          _id: { $ne: req.params.id },
        });
        if (existingCategory) {
          return res.status(400).json({ message: 'Bu kategori adı zaten kullanılıyor' });
        }
      }

      // Update fields
      if (ad) {
        category.ad = ad.trim();
      }
      if (aciklama !== undefined) {
        category.aciklama = aciklama;
      }
      if (icon) {
        category.icon = icon;
      }
      if (renk) {
        category.renk = renk;
      }
      if (siraNo !== undefined) {
        category.siraNo = siraNo;
      }
      if (aktif !== undefined) {
        category.aktif = aktif;
      }

      await category.save();
      await category.populate('olusturanKullanici', 'ad soyad');

      res.json(category);
    } catch (error) {
      console.error('Kategori güncellenirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Kategori sil
router.delete(
  '/categories/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const category = await InventoryCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Bu kategoriye ait envanter var mı kontrol et
      const itemCount = await InventoryItem.countDocuments({ kategoriId: req.params.id });
      if (itemCount > 0) {
        return res.status(400).json({
          message: `Bu kategoriye ait ${itemCount} envanter kaydı bulunuyor. Önce bu kayıtları silin veya başka kategoriye taşıyın.`,
        });
      }

      // Kategoriyi pasif yap (tamamen silme)
      category.aktif = false;
      await category.save();

      res.json({ message: 'Kategori başarıyla silindi' });
    } catch (error) {
      console.error('Kategori silinirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// === ALAN ŞABLONLARI YÖNETİMİ ===

// Kategoriye ait alan şablonlarını getir
router.get(
  '/categories/:categoryId/fields',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const fields = await InventoryFieldTemplate.find({
        kategoriId: req.params.categoryId,
        aktif: true,
      })
        .populate('olusturanKullanici', 'ad soyad')
        .sort({ grup: 1, siraNo: 1, alanAdi: 1 });

      // Gruplara göre organize et
      const groupedFields = {};
      fields.forEach(field => {
        const grupAdi = field.grup || 'Genel Bilgiler';
        if (!groupedFields[grupAdi]) {
          groupedFields[grupAdi] = [];
        }
        groupedFields[grupAdi].push(field);
      });

      res.json({
        fields,
        groupedFields,
      });
    } catch (error) {
      console.error('Alan şablonları getirilirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Yeni alan şablonu oluştur
router.post(
  '/categories/:categoryId/fields',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        tip,
        gerekli,
        varsayilanDeger,
        secenekler,
        siraNo,
        grup,
        placeholder,
        validasyon,
        aciklama,
      } = req.body;

      // Kategori var mı kontrol et
      const category = await InventoryCategory.findById(req.params.categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Aynı kategoride aynı alan adı var mı kontrol et
      const existingField = await InventoryFieldTemplate.findOne({
        kategoriId: req.params.categoryId,
        alanAdi: ad.trim(),
      });
      if (existingField) {
        return res.status(400).json({ message: 'Bu alan adı zaten kullanılıyor' });
      }

      const newField = new InventoryFieldTemplate({
        kategoriId: req.params.categoryId,
        alanAdi: ad.trim(),
        alanTipi: tip || 'text',
        zorunlu: gerekli || false,
        varsayilanDeger,
        secenekler: secenekler || [],
        siraNo: siraNo || 0,
        grup: grup || 'Genel Bilgiler',
        placeholder,
        validasyon,
        aciklama,
        aktif: true,
        olusturanKullanici: req.user.id,
        olusturmaTarihi: new Date(),
      });

      await newField.save();
      await newField.populate('olusturanKullanici', 'ad soyad');

      res.status(201).json(newField);
    } catch (error) {
      console.error('Alan şablonu oluşturulurken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Alan şablonu güncelle
router.put(
  '/fields/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const field = await InventoryFieldTemplate.findById(req.params.id);
      if (!field) {
        return res.status(404).json({ message: 'Alan şablonu bulunamadı' });
      }

      const {
        alanAdi,
        alanTipi,
        zorunlu,
        varsayilanDeger,
        secenekler,
        siraNo,
        grup,
        aktif,
        placeholder,
        validasyon,
      } = req.body;

      // Eğer alan adı değişiyorsa, aynı kategoride aynı isimde alan var mı kontrol et
      if (alanAdi && alanAdi.trim() !== field.alanAdi) {
        const existingField = await InventoryFieldTemplate.findOne({
          kategoriId: field.kategoriId,
          alanAdi: alanAdi.trim(),
          _id: { $ne: req.params.id },
        });
        if (existingField) {
          return res.status(400).json({ message: 'Bu alan adı zaten kullanılıyor' });
        }
      }

      // Update fields
      if (alanAdi) {
        field.alanAdi = alanAdi.trim();
      }
      if (alanTipi) {
        field.alanTipi = alanTipi;
      }
      if (zorunlu !== undefined) {
        field.zorunlu = zorunlu;
      }
      if (varsayilanDeger !== undefined) {
        field.varsayilanDeger = varsayilanDeger;
      }
      if (secenekler !== undefined) {
        field.secenekler = secenekler;
      }
      if (siraNo !== undefined) {
        field.siraNo = siraNo;
      }
      if (grup !== undefined) {
        field.grup = grup;
      }
      if (aktif !== undefined) {
        field.aktif = aktif;
      }
      if (placeholder !== undefined) {
        field.placeholder = placeholder;
      }
      if (validasyon !== undefined) {
        field.validasyon = validasyon;
      }

      await field.save();
      await field.populate('olusturanKullanici', 'ad soyad');

      res.json(field);
    } catch (error) {
      console.error('Alan şablonu güncellenirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Alan şablonu sil
router.delete(
  '/fields/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const field = await InventoryFieldTemplate.findById(req.params.id);
      if (!field) {
        return res.status(404).json({ message: 'Alan şablonu bulunamadı' });
      }

      // Bu alanı kullanan envanter var mı kontrol et
      const itemsUsingField = await InventoryItem.find({
        kategoriId: field.kategoriId,
        [`dinamikAlanlar.${field.alanAdi}`]: { $exists: true },
      });

      if (itemsUsingField.length > 0) {
        return res.status(400).json({
          message: `Bu alan ${itemsUsingField.length} envanter kaydında kullanılıyor. Önce bu kayıtlardaki verileri temizleyin.`,
        });
      }

      // Alanı pasif yap
      field.aktif = false;
      await field.save();

      res.json({ message: 'Alan şablonu başarıyla silindi' });
    } catch (error) {
      console.error('Alan şablonu silinirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// === ENVANTER ÖĞELERİ YÖNETİMİ ===

// Envanter öğelerini getir (gelişmiş filtreleme ile)
router.get('/items', auth, checkModulePermission('Envanter Yönetimi'), async (req, res) => {
  try {
    const {
      kategori,
      durum,
      lokasyon,
      sorumluKisi,
      etiket,
      arama,
      sayfa = 1,
      limit = 50,
      sirala = 'olusturmaTarihi',
      yon = 'desc',
    } = req.query;

    // Filtreleme koşulları
    const filter = { aktif: true };

    if (kategori) {
      filter.kategoriId = kategori;
    }
    if (durum) {
      filter.durum = durum;
    }
    if (lokasyon) {
      filter.lokasyon = new RegExp(lokasyon, 'i');
    }
    if (sorumluKisi) {
      filter.sorumluKisi = sorumluKisi;
    }
    if (etiket) {
      filter.etiketler = { $in: [etiket] };
    }

    if (arama) {
      filter.$or = [
        { ad: new RegExp(arama, 'i') },
        { envanterKodu: new RegExp(arama, 'i') },
        { aciklama: new RegExp(arama, 'i') },
        { tedarikci: new RegExp(arama, 'i') },
      ];
    }

    // Sıralama
    const sortObj = {};
    sortObj[sirala] = yon === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(sayfa) - 1) * parseInt(limit);

    const items = await InventoryItem.find(filter)
      .populate('kategoriId', 'ad icon renk')
      .populate('departman', 'ad')
      .populate('sorumluKisi', 'ad soyad')
      .populate('bakimSorumlusu', 'ad soyad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const totalItems = await InventoryItem.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    // İstatistikler
    const stats = await InventoryItem.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$durum',
          count: { $sum: 1 },
          toplamDeger: { $sum: '$guncelDeger' },
        },
      },
    ]);

    res.json({
      items,
      pagination: {
        currentPage: parseInt(sayfa),
        totalPages,
        totalItems,
        hasNext: parseInt(sayfa) < totalPages,
        hasPrev: parseInt(sayfa) > 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Envanter öğeleri getirilirken hata:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tek envanter öğesi getir
router.get('/items/:id', auth, checkModulePermission('Envanter Yönetimi'), async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id)
      .populate('kategoriId')
      .populate('departman', 'ad')
      .populate('sorumluKisi', 'ad soyad email')
      .populate('bakimSorumlusu', 'ad soyad email')
      .populate('olusturanKullanici', 'ad soyad')
      .populate('degisiklikGecmisi.degistirenKullanici', 'ad soyad');

    if (!item) {
      return res.status(404).json({ message: 'Envanter öğesi bulunamadı' });
    }

    // Alan şablonlarını da getir (dinamik alanları doğru gösterebilmek için)
    const fieldTemplates = await InventoryFieldTemplate.find({
      kategoriId: item.kategoriId._id,
      aktif: true,
    }).sort({ grup: 1, siraNo: 1 });

    res.json({
      item,
      fieldTemplates,
    });
  } catch (error) {
    console.error('Envanter öğesi getirilirken hata:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Validation middleware
const validateInventoryItem = async (req, res, next) => {
  try {
    const { kategoriId, dinamikAlanlar } = req.body;

    // Kategori kontrolü
    const category = await InventoryCategory.findById(kategoriId);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Zorunlu alan kontrolü
    const fieldTemplates = await InventoryFieldTemplate.find({
      kategoriId,
      zorunlu: true,
      aktif: true,
    });

    for (const template of fieldTemplates) {
      if (
        !dinamikAlanlar ||
        !dinamikAlanlar[template.alanAdi] ||
        (typeof dinamikAlanlar[template.alanAdi] === 'string' &&
          dinamikAlanlar[template.alanAdi].trim() === '')
      ) {
        return res.status(400).json({
          message: `${template.alanAdi} alanı zorunludur`,
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Validation hatası:', error);
    res.status(500).json({ message: 'Validation sırasında hata oluştu' });
  }
};

// Middleware kullanımı
router.post(
  '/items',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  validateInventoryItem,
  async (req, res) => {
    try {
      const {
        kategoriId,
        envanterKodu,
        ad,
        aciklama,
        dinamikAlanlar,
        durum,
        lokasyon,
        departman,
        sorumluKisi,
        resimler,
        belgeler,
        alisFiyati,
        guncelDeger,
        tedarikci,
        garantiBitisTarihi,
        bakimPeriyodu,
        bakimSorumlusu,
        etiketler,
        oncelikSeviyesi,
        qrKodu,
        barkod,
      } = req.body;

      // Kategori var mı kontrol et
      const category = await InventoryCategory.findById(kategoriId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Envanter kodu oluştur veya kontrol et
      let finalEnvanterKodu = envanterKodu?.trim();

      if (!finalEnvanterKodu) {
        // Otomatik envanter kodu oluştur
        const categoryPrefix = category.ad
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, '');
        const timestamp = Date.now().toString().slice(-6); // Son 6 hanesi
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        finalEnvanterKodu = `${categoryPrefix}-${timestamp}-${randomSuffix}`;

        // Eğer yine çakışırsa, benzersiz olana kadar dene
        const maxAttempts = 10;
        const generateCodes = Array(maxAttempts)
          .fill()
          .map(() => {
            const newSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
            return `${categoryPrefix}-${timestamp}-${newSuffix}`;
          });

        const existingCodes = await Promise.all(
          generateCodes.map(code => InventoryItem.findOne({ envanterKodu: code })),
        );

        const availableCode = generateCodes.find((code, index) => !existingCodes[index]);
        if (availableCode) {
          finalEnvanterKodu = availableCode;
        }
      } else {
        // Envanter kodu benzersiz mi kontrol et
        const existingItem = await InventoryItem.findOne({ envanterKodu: finalEnvanterKodu });
        if (existingItem) {
          return res.status(400).json({ message: 'Bu envanter kodu zaten kullanılıyor' });
        }
      }

      // Zorunlu alan kontrolü
      const fieldTemplates = await InventoryFieldTemplate.find({
        kategoriId,
        zorunlu: true,
        aktif: true,
      });

      for (const template of fieldTemplates) {
        if (
          !dinamikAlanlar ||
          !dinamikAlanlar[template.alanAdi] ||
          (typeof dinamikAlanlar[template.alanAdi] === 'string' &&
            dinamikAlanlar[template.alanAdi].trim() === '')
        ) {
          return res.status(400).json({
            message: `${template.alanAdi} alanı zorunludur`,
          });
        }
      }

      const newItem = new InventoryItem({
        kategoriId,
        envanterKodu: finalEnvanterKodu,
        ad: ad.trim(),
        aciklama,
        dinamikAlanlar: dinamikAlanlar || {},
        durum: durum || 'aktif',
        lokasyon,
        departman: departman && departman.trim() !== '' ? departman : undefined,
        sorumluKisi: sorumluKisi && sorumluKisi.trim() !== '' ? sorumluKisi : undefined,
        resimler: resimler || [],
        belgeler: belgeler || [],
        alisFiyati: alisFiyati || 0,
        guncelDeger: guncelDeger || alisFiyati || 0,
        tedarikci,
        garantiBitisTarihi,
        bakimPeriyodu: bakimPeriyodu || 30,
        bakimSorumlusu: bakimSorumlusu && bakimSorumlusu.trim() !== '' ? bakimSorumlusu : undefined,
        qrKodu,
        barkod,
        etiketler: etiketler || [],
        oncelikSeviyesi: oncelikSeviyesi || 'orta',
        olusturanKullanici: req.user.id,
      });

      // Veri kalitesi skorunu hesapla
      newItem.hesaplaDataKalitesiSkoru();

      await newItem.save();
      await newItem.populate([
        { path: 'kategoriId', select: 'ad icon renk' },
        { path: 'departman', select: 'ad' },
        { path: 'sorumluKisi', select: 'ad soyad' },
        { path: 'bakimSorumlusu', select: 'ad soyad' },
        { path: 'olusturanKullanici', select: 'ad soyad' },
      ]);

      res.status(201).json(newItem);
    } catch (error) {
      console.error('Envanter öğesi oluşturulurken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Envanter öğesi güncelle
router.put(
  '/items/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const item = await InventoryItem.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Envanter öğesi bulunamadı' });
      }

      const updateData = req.body;
      const oldItem = item.toObject();

      // Envanter kodu değişiyorsa benzersizlik kontrol et
      if (updateData.envanterKodu && updateData.envanterKodu.trim() !== item.envanterKodu) {
        const existingItem = await InventoryItem.findOne({
          envanterKodu: updateData.envanterKodu.trim(),
          _id: { $ne: req.params.id },
        });
        if (existingItem) {
          return res.status(400).json({ message: 'Bu envanter kodu zaten kullanılıyor' });
        }
      }

      // Değişiklikleri kaydet (audit trail için)
      const degisiklikler = [];
      Object.keys(updateData).forEach(key => {
        if (key !== 'degisiklikGecmisi' && oldItem[key] !== updateData[key]) {
          degisiklikler.push({
            alan: key,
            eskiDeger: oldItem[key],
            yeniDeger: updateData[key],
            degistirenKullanici: req.user.id,
            degisiklikTarihi: new Date(),
          });
        }
      });

      // ObjectId alanları için boş string kontrolü
      if (updateData.departman === '') {
        updateData.departman = undefined;
      }
      if (updateData.sorumluKisi === '') {
        updateData.sorumluKisi = undefined;
      }
      if (updateData.bakimSorumlusu === '') {
        updateData.bakimSorumlusu = undefined;
      }

      // Güncelleme
      Object.assign(item, updateData);

      if (degisiklikler.length > 0) {
        item.degisiklikGecmisi.push(...degisiklikler);
      }

      // Veri kalitesi skorunu yeniden hesapla
      item.hesaplaDataKalitesiSkoru();

      await item.save();
      await item.populate([
        { path: 'kategoriId', select: 'ad icon renk' },
        { path: 'departman', select: 'ad' },
        { path: 'sorumluKisi', select: 'ad soyad' },
        { path: 'bakimSorumlusu', select: 'ad soyad' },
        { path: 'olusturanKullanici', select: 'ad soyad' },
      ]);

      res.json(item);
    } catch (error) {
      console.error('Envanter öğesi güncellenirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Envanter öğesi sil
router.delete(
  '/items/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const item = await InventoryItem.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Envanter öğesi bulunamadı' });
      }

      // Soft delete - aktif değerini false yap
      item.aktif = false;
      item.degisiklikGecmisi.push({
        alan: 'durum',
        eskiDeger: 'aktif',
        yeniDeger: 'silindi',
        degistirenKullanici: req.user.id,
        degisiklikTarihi: new Date(),
        aciklama: 'Envanter öğesi silindi',
      });

      await item.save();

      res.json({ message: 'Envanter öğesi başarıyla silindi' });
    } catch (error) {
      console.error('Envanter öğesi silinirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// === EXCEL İMPORT/EXPORT ===

// Debug endpoint - kategori parametrelerini kontrol et
router.get('/debug/categories/:categoryId', auth, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await InventoryCategory.findById(categoryId);

    res.json({
      receivedCategoryId: categoryId,
      categoryIdType: typeof categoryId,
      isValidObjectId: require('mongoose').Types.ObjectId.isValid(categoryId),
      categoryFound: !!category,
      categoryName: category?.ad || 'Bulunamadı',
    });
  } catch (error) {
    console.error('Debug endpoint hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel template indir
router.get(
  '/categories/:categoryId/excel-template',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const category = await InventoryCategory.findById(req.params.categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      const fieldTemplates = await InventoryFieldTemplate.find({
        kategoriId: req.params.categoryId,
        aktif: true,
      }).sort({ grup: 1, siraNo: 1 });

      // Excel başlıkları - Temel bilgiler
      const headers = [
        'Envanter Kodu*',
        'Ad*',
        'Açıklama',
        'Durum',
        'Lokasyon',
        'Alış Fiyatı',
        'Güncel Değer',
        'Tedarikçi',
        'Garanti Bitiş Tarihi (YYYY-MM-DD)',
        'Bakım Periyodu (Gün)',
        'QR Kodu',
        'Barkod',
        'Öncelik Seviyesi',
        'Etiketler (virgülle ayırın)',
      ];

      // Dinamik alanları ekle
      fieldTemplates.forEach(field => {
        const required = field.zorunlu ? '*' : '';
        headers.push(`${field.alanAdi}${required}`);
      });

      // Örnek satır - temel bilgiler
      const exampleRow = [
        category.ad.toLowerCase().includes('makina')
          ? 'MAK-001'
          : category.ad.toLowerCase().includes('kalıp')
            ? 'KLP-001'
            : 'EKP-001',
        category.ad.toLowerCase().includes('makina')
          ? 'Plastik Enjeksiyon Makinası Örnek'
          : category.ad.toLowerCase().includes('kalıp')
            ? 'Örnek Kalıp'
            : 'Örnek Ekipman',
        'Açıklama giriniz',
        'aktif',
        'Fabrika/Hat1',
        '150000',
        '140000',
        'Örnek Tedarikçi',
        '2026-12-31',
        '30',
        'QR-001',
        'BC-001',
        'orta',
        'kategori,excel',
      ];

      // Dinamik alanlar için gelişmiş örnek değerler
      fieldTemplates.forEach(field => {
        let exampleValue = '';

        switch (field.alanTipi) {
        case 'text':
          if (field.alanAdi.includes('Makine Adı')) {
            exampleValue = 'HAITIAN ZE230';
          } else if (field.alanAdi.includes('Seri No')) {
            exampleValue = 'HT230-2023-001';
          } else if (field.alanAdi.includes('Üretici')) {
            exampleValue = 'HAITIAN';
          } else if (field.alanAdi.includes('Model')) {
            exampleValue = 'ZE230';
          } else if (field.alanAdi.includes('Lokasyon')) {
            exampleValue = 'Üretim/Hat-1';
          } else if (field.alanAdi.includes('Bakım Sorumlusu')) {
            exampleValue = 'Teknik Ekip';
          } else if (field.alanAdi.includes('Kalıp Adı')) {
            exampleValue = 'VS-001';
          } else if (field.alanAdi.includes('Kalıp Üretici')) {
            exampleValue = 'DEMKUR';
          } else if (field.alanAdi.includes('Depolama')) {
            exampleValue = 'RF-A1';
          } else {
            exampleValue = field.varsayilanDeger || `Örnek ${field.alanAdi}`;
          }
          break;
        case 'number':
          if (field.alanAdi.includes('Yıl')) {
            exampleValue = '2023';
          } else if (field.alanAdi.includes('Güç') && field.alanAdi.includes('kW')) {
            exampleValue = '150';
          } else if (field.alanAdi.includes('Güç') && field.alanAdi.includes('W')) {
            exampleValue = '25000';
          } else if (field.alanAdi.includes('Kuvvet')) {
            exampleValue = '230';
          } else if (field.alanAdi.includes('Hacmi')) {
            exampleValue = '230';
          } else if (field.alanAdi.includes('Çap')) {
            exampleValue = '35';
          } else if (field.alanAdi.includes('Mesafe')) {
            exampleValue = '500';
          } else if (field.alanAdi.includes('En')) {
            exampleValue = '400';
          } else if (field.alanAdi.includes('Boy')) {
            exampleValue = '300';
          } else if (field.alanAdi.includes('Basınç')) {
            exampleValue = '160';
          } else if (field.alanAdi.includes('Ağırlık')) {
            exampleValue = '1250';
          } else if (field.alanAdi.includes('Kavite')) {
            exampleValue = '8';
          } else {
            exampleValue = field.varsayilanDeger || '100';
          }
          break;
        case 'date':
          if (field.alanAdi.includes('Kayıt') || field.alanAdi.includes('Teslim')) {
            exampleValue = '2024-01-15';
          } else if (field.alanAdi.includes('Bakım')) {
            exampleValue = '2024-12-01';
          } else {
            exampleValue = field.varsayilanDeger || '2024-01-01';
          }
          break;
        case 'select':
          if (field.secenekler && field.secenekler.length > 0) {
            exampleValue = field.secenekler[0];
          } else {
            exampleValue = 'Seçenek1';
          }
          break;
        case 'boolean':
          exampleValue = 'true';
          break;
        case 'textarea':
          if (field.alanAdi.includes('Kontrol')) {
            exampleValue = 'Günlük: Sıcaklık kontrolü, Haftalık: Genel temizlik';
          } else if (field.alanAdi.includes('Sayaç')) {
            exampleValue = 'Cycle Counter: C001, Saat Counter: H001';
          } else if (field.alanAdi.includes('Dökümantasyon')) {
            exampleValue = 'Manuel: /docs/manual.pdf, Şema: /docs/schema.pdf';
          } else if (field.alanAdi.includes('Ürün')) {
            exampleValue = 'Villa saksısı, 2 numara, PP malzeme';
          } else if (field.alanAdi.includes('Soğutma')) {
            exampleValue = '12 soğutma kanalı, seri bağlantı';
          } else if (field.alanAdi.includes('Bakım Program')) {
            exampleValue = 'Aylık: temizlik, 6 aylık: genel bakım';
          } else {
            exampleValue = field.varsayilanDeger || `Detaylı açıklama - ${field.alanAdi}`;
          }
          break;
        default:
          exampleValue = field.varsayilanDeger || '';
        }

        exampleRow.push(exampleValue);
      });

      // Excel dosyası oluştur
      const workbook = xlsx.utils.book_new();

      // Ana worksheet
      const worksheet = xlsx.utils.aoa_to_sheet([headers, exampleRow]);

      // Kolon genişlikleri ayarla
      const colWidths = headers.map((header, index) => {
        if (index < 14) {
          return { wch: 18 };
        } // Temel alanlar
        if (header.includes('textarea')) {
          return { wch: 30 };
        } // Textarea alanları
        return { wch: 20 }; // Dinamik alanlar
      });
      worksheet['!cols'] = colWidths;

      // İkinci worksheet: Alan açıklamaları
      const explanationData = [
        ['Alan Adı', 'Tip', 'Zorunlu', 'Grup', 'Açıklama'],
        ...fieldTemplates.map(field => [
          field.alanAdi,
          field.alanTipi,
          field.zorunlu ? 'EVET' : 'HAYIR',
          field.grup || 'Genel',
          field.aciklama || '',
        ]),
      ];

      const explanationWorksheet = xlsx.utils.aoa_to_sheet(explanationData);
      explanationWorksheet['!cols'] = [
        { wch: 25 },
        { wch: 12 },
        { wch: 10 },
        { wch: 20 },
        { wch: 40 },
      ];

      // Worksheetleri ekle
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Envanter Template');
      xlsx.utils.book_append_sheet(workbook, explanationWorksheet, 'Alan Açıklamaları');

      // Dosyayı buffer'a çevir
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const fileName = `envanter_template_${category.ad.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);

      console.log(`✅ Excel template oluşturuldu: ${fileName}`);
    } catch (error) {
      console.error('Excel template oluşturulurken hata:', error.message);
      res
        .status(500)
        .json({ message: 'Excel template oluşturulurken hata oluştu: ' + error.message });
    }
  },
);

// Excel import - Geliştirilmiş versiyon
router.post(
  '/categories/:categoryId/excel-import',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  upload.single('file'),
  async (req, res) => {
    try {
      // 1. Dosya kontrolü
      if (!req.file) {
        return res.status(400).json({ message: 'Excel dosyası gerekli' });
      }

      // 2. Kategori ID validasyonu
      const categoryId = req.params.categoryId;
      console.log(
        `📥 Excel import başlatılıyor. Kategori ID: ${categoryId}, Dosya: ${req.file.originalname}, Boyut: ${req.file.size} bytes`,
      );

      if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
        console.error('❌ Kategori ID undefined veya null:', categoryId);
        return res.status(400).json({
          message: 'Geçerli bir kategori ID gerekli',
          detay: `Alınan kategori ID: ${categoryId}`,
        });
      }

      // 3. ObjectId format kontrolü
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        console.error('❌ Geçersiz kategori ID formatı:', categoryId);
        return res.status(400).json({
          message: 'Geçersiz kategori ID formatı',
          detay: `Kategori ID: ${categoryId}`,
        });
      }

      // 4. Kategoriyi bul
      const category = await InventoryCategory.findById(categoryId);
      if (!category) {
        console.error('❌ Kategori bulunamadı. ID:', categoryId);
        return res.status(404).json({
          message: 'Kategori bulunamadı',
          detay: `Kategori ID: ${categoryId}`,
        });
      }

      console.log(`✅ Kategori bulundu: ${category.ad} (ID: ${categoryId})`);

      // 5. Alan şablonlarını getir
      const fieldTemplates = await InventoryFieldTemplate.find({
        kategoriId: categoryId,
        aktif: true,
      });

      console.log(`📋 Kategori: ${category.ad}, Alan şablonu sayısı: ${fieldTemplates.length}`);

      if (fieldTemplates.length === 0) {
        console.warn('⚠️ Bu kategoride alan şablonu bulunamadı');
        return res.status(400).json({
          message: 'Bu kategoride alan şablonu tanımlanmamış. Önce alan şablonlarını oluşturun.',
          kategori: category.ad,
        });
      }

      // 6. Excel dosyasını parse et
      let workbook, data;
      try {
        workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
      } catch (parseError) {
        console.error('❌ Excel parse hatası:', parseError);
        return res.status(400).json({
          message: 'Excel dosyası okunamadı. Dosya formatını kontrol edin.',
          detay: parseError.message,
        });
      }

      console.log(`📊 Excel'den okunan satır sayısı: ${data.length}`);

      if (data.length === 0) {
        return res.status(400).json({
          message: 'Excel dosyasında veri bulunamadı. En az bir satır data olmalı.',
          detay: 'Başlık satırından sonra veri satırları olmalı',
        });
      }

      const results = {
        success: 0,
        errors: [],
        warnings: [],
        duplicates: [],
      };

      // Batch validation - önce tüm satırları kontrol et
      const validRows = [];

      // Önce tüm satırların envanter kodlarını topla
      const rowsToValidate = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        // Boş satır kontrolü
        if (!row['Envanter Kodu*'] && !row['Ad*']) {
          results.warnings.push({
            row: rowNumber,
            message: 'Boş satır atlandı',
          });
          continue;
        }

        rowsToValidate.push({ row, rowNumber, index: i });
      }

      // Tüm envanter kodlarını batch olarak kontrol et
      const envanterKodlari = rowsToValidate
        .map(item => item.row['Envanter Kodu*']?.toString().trim())
        .filter(Boolean);

      const existingItems = await InventoryItem.find({
        envanterKodu: { $in: envanterKodlari },
      }).select('envanterKodu');

      const existingKodlar = new Set(existingItems.map(item => item.envanterKodu));

      // Şimdi her satırı validation yap
      for (const { row, rowNumber } of rowsToValidate) {
        const rowErrors = [];

        try {
          // 2. Zorunlu alanları kontrol et
          if (!row['Envanter Kodu*']) {
            rowErrors.push('Envanter Kodu zorunludur');
          }
          if (!row['Ad*']) {
            rowErrors.push('Ad zorunludur');
          }

          // 3. Envanter kodu format kontrolü
          const envanterKodu = row['Envanter Kodu*']?.toString().trim();
          if (envanterKodu && envanterKodu.length < 3) {
            rowErrors.push('Envanter kodu en az 3 karakter olmalıdır');
          }

          // 4. Envanter kodu benzersizlik kontrolü (batch'den)
          if (envanterKodu && existingKodlar.has(envanterKodu)) {
            results.duplicates.push({
              row: rowNumber,
              envanterKodu: envanterKodu,
              message: `Envanter kodu "${envanterKodu}" zaten kullanılıyor`,
            });
            rowErrors.push(`Envanter kodu "${envanterKodu}" zaten sistemde var`);
          }

          // 5. Dinamik alanları hazırla ve kontrol et
          const dinamikAlanlar = {};
          fieldTemplates.forEach(template => {
            const fieldKeyWithRequired = template.zorunlu
              ? `${template.alanAdi}*`
              : template.alanAdi;

            // Hem zorunlu hem de zorunlu olmayan versiyonları kontrol et
            let fieldValue = row[fieldKeyWithRequired];
            if (fieldValue === undefined || fieldValue === '') {
              fieldValue = row[template.alanAdi];
            }

            // Değer varsa dinamik alanlara ekle
            if (fieldValue !== undefined && fieldValue !== '') {
              // Tip dönüşümü
              switch (template.alanTipi) {
              case 'number': {
                const numValue = parseFloat(fieldValue);
                if (!isNaN(numValue)) {
                  dinamikAlanlar[template.alanAdi] = numValue;
                } else {
                  rowErrors.push(`"${template.alanAdi}" sayısal değer olmalıdır`);
                }
                break;
              }
              case 'date':
                try {
                  const dateValue = new Date(fieldValue);
                  if (!isNaN(dateValue.getTime())) {
                    dinamikAlanlar[template.alanAdi] = dateValue.toISOString().split('T')[0];
                  } else {
                    rowErrors.push(
                      `"${template.alanAdi}" geçerli tarih formatında olmalıdır (YYYY-MM-DD)`,
                    );
                  }
                } catch {
                  rowErrors.push(`"${template.alanAdi}" tarih formatı hatalı`);
                }
                break;
              case 'boolean':
                dinamikAlanlar[template.alanAdi] = fieldValue.toString().toLowerCase() === 'true';
                break;
              case 'select':
                if (template.secenekler && template.secenekler.length > 0) {
                  if (template.secenekler.includes(fieldValue)) {
                    dinamikAlanlar[template.alanAdi] = fieldValue;
                  } else {
                    rowErrors.push(
                      `"${template.alanAdi}" için geçerli seçenekler: ${template.secenekler.join(', ')}`,
                    );
                  }
                } else {
                  dinamikAlanlar[template.alanAdi] = fieldValue;
                }
                break;
              default:
                dinamikAlanlar[template.alanAdi] = fieldValue.toString();
              }
            }

            // Zorunlu alan kontrolü
            if (
              template.zorunlu &&
              (!dinamikAlanlar[template.alanAdi] ||
                dinamikAlanlar[template.alanAdi].toString().trim() === '')
            ) {
              rowErrors.push(`"${template.alanAdi}" alanı zorunludur`);
            }
          });

          // 6. Hatalar varsa kaydet ve devam et
          if (rowErrors.length > 0) {
            results.errors.push({
              row: rowNumber,
              envanterKodu: envanterKodu,
              errors: rowErrors,
            });
            continue;
          }

          // 7. Geçerli satır olarak işaretle
          validRows.push({
            rowNumber,
            data: row,
            dinamikAlanlar,
            envanterKodu,
          });
        } catch (error) {
          console.error(`Excel import row ${rowNumber} validation error:`, error);
          results.errors.push({
            row: rowNumber,
            errors: [`Satır işlenirken hata: ${error.message}`],
          });
        }
      }

      console.log(
        `✅ Validation tamamlandı. Geçerli satır: ${validRows.length}, Hata: ${results.errors.length}`,
      );

      // Geçerli satırları kaydet
      const savePromises = validRows.map(async validRow => {
        try {
          const { data: row, dinamikAlanlar, envanterKodu } = validRow;

          // Etiketleri parse et
          const etiketler = row['Etiketler (virgülle ayırın)']
            ? row['Etiketler (virgülle ayırın)']
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag)
            : [];

          // Tarih alanlarını parse et
          const garantiBitisTarihi = row['Garanti Bitiş Tarihi (YYYY-MM-DD)']
            ? new Date(row['Garanti Bitiş Tarihi (YYYY-MM-DD)'])
            : null;

          // Öncelik seviyesi kontrolü
          const oncelikSeviyesi = ['dusuk', 'orta', 'yuksek', 'kritik'].includes(
            row['Öncelik Seviyesi'],
          )
            ? row['Öncelik Seviyesi']
            : 'orta';

          // Envanter öğesi oluştur
          const newItem = new InventoryItem({
            kategoriId: categoryId,
            envanterKodu: envanterKodu,
            ad: row['Ad*'].toString().trim(),
            aciklama: row['Açıklama'] || '',
            dinamikAlanlar,
            durum: ['aktif', 'pasif', 'bakim', 'arizali'].includes(row['Durum'])
              ? row['Durum']
              : 'aktif',
            lokasyon: row['Lokasyon'] || '',
            departman:
              row['Departman'] && row['Departman'].trim() !== '' ? row['Departman'] : undefined,
            sorumluKisi:
              row['Sorumlu Kişi'] && row['Sorumlu Kişi'].trim() !== ''
                ? row['Sorumlu Kişi']
                : undefined,
            alisFiyati: parseFloat(row['Alış Fiyatı']) || 0,
            guncelDeger: parseFloat(row['Güncel Değer']) || parseFloat(row['Alış Fiyatı']) || 0,
            tedarikci: row['Tedarikçi'] || '',
            garantiBitisTarihi,
            bakimPeriyodu: parseInt(row['Bakım Periyodu (Gün)']) || 30,
            bakimSorumlusu:
              row['Bakım Sorumlusu'] && row['Bakım Sorumlusu'].trim() !== ''
                ? row['Bakım Sorumlusu']
                : undefined,
            qrKodu: row['QR Kodu'] || '',
            barkod: row['Barkod'] || '',
            oncelikSeviyesi,
            etiketler,
            excelImportBilgisi: {
              dosyaAdi: req.file.originalname,
              importTarihi: new Date(),
              satirNo: validRow.rowNumber,
              toplamSatir: data.length,
              kategoriAdi: category.ad,
            },
            olusturanKullanici: req.user.id,
          });

          // Veri kalitesi skorunu hesapla
          newItem.hesaplaDataKalitesiSkoru();
          await newItem.save();
          results.success++;
          return { success: true, row: validRow.rowNumber };
        } catch (error) {
          results.errors.push({
            row: validRow.rowNumber,
            envanterKodu: validRow.envanterKodu,
            errors: [`Kaydetme hatası: ${error.message}`],
          });
          return { success: false, row: validRow.rowNumber, error };
        }
      });

      // Tüm kayıtları paralel olarak işle
      await Promise.all(savePromises);

      // Sonuç raporu
      const successMessage = `Excel import tamamlandı! ${results.success} kayıt başarıyla eklendi.`;
      const detailedReport = {
        basariliSayisi: results.success,
        hataSayisi: results.errors.length,
        uyariSayisi: results.warnings.length,
        duplicateSayisi: results.duplicates.length,
        toplamSatir: data.length,
        kategori: category.ad,
      };

      console.log('📊 Import sonucu:', detailedReport);

      res.json({
        message: successMessage,
        ...detailedReport,
        hatalar: results.errors,
        uyarilar: results.warnings,
        duplicates: results.duplicates,
      });
    } catch (error) {
      console.error('Excel import genel hatası:', error);
      res.status(500).json({
        message: 'Excel import sırasında hata oluştu: ' + error.message,
        detay: error.stack,
        kategoriId: req.params.categoryId,
      });
    }
  },
);

// Excel export
router.get(
  '/categories/:categoryId/excel-export',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const category = await InventoryCategory.findById(req.params.categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      const fieldTemplates = await InventoryFieldTemplate.find({
        kategoriId: req.params.categoryId,
        aktif: true,
      }).sort({ grup: 1, siraNo: 1 });

      const items = await InventoryItem.find({
        kategoriId: req.params.categoryId,
        aktif: true,
      })
        .populate('departman', 'ad')
        .populate('sorumluKisi', 'ad soyad')
        .populate('bakimSorumlusu', 'ad soyad');

      // Excel başlıkları
      const headers = [
        'Envanter Kodu',
        'Ad',
        'Açıklama',
        'Durum',
        'Lokasyon',
        'Departman',
        'Sorumlu Kişi',
        'Alış Fiyatı',
        'Güncel Değer',
        'Tedarikçi',
        'Garanti Bitiş Tarihi',
        'Son Bakım Tarihi',
        'Sonraki Bakım Tarihi',
        'Bakım Sorumlusu',
        'Kullanım Saati',
        'Etiketler',
        'Öncelik Seviyesi',
        'Oluşturma Tarihi',
      ];

      // Dinamik alanları ekle
      fieldTemplates.forEach(field => {
        headers.push(field.alanAdi);
      });

      // Veri satırları
      const rows = [headers];
      items.forEach(item => {
        const row = [
          item.envanterKodu,
          item.ad,
          item.aciklama || '',
          item.durum,
          item.lokasyon || '',
          item.departman ? item.departman.ad : '',
          item.sorumluKisi ? `${item.sorumluKisi.ad} ${item.sorumluKisi.soyad}` : '',
          item.alisFiyati,
          item.guncelDeger,
          item.tedarikci || '',
          item.garantiBitisTarihi ? item.garantiBitisTarihi.toISOString().split('T')[0] : '',
          item.sonBakimTarihi ? item.sonBakimTarihi.toISOString().split('T')[0] : '',
          item.sonrakiBakimTarihi ? item.sonrakiBakimTarihi.toISOString().split('T')[0] : '',
          item.bakimSorumlusu ? `${item.bakimSorumlusu.ad} ${item.bakimSorumlusu.soyad}` : '',
          item.kullanimSaati,
          item.etiketler.join(', '),
          item.oncelikSeviyesi,
          item.olusturmaTarihi.toISOString().split('T')[0],
        ];

        // Dinamik alanları ekle
        fieldTemplates.forEach(field => {
          const value = item.dinamikAlanlar.get(field.alanAdi);
          row.push(value || '');
        });

        rows.push(row);
      });

      // Excel dosyası oluştur
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.aoa_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Envanter Listesi');

      // Dosyayı buffer'a çevir
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="envanter_${category.ad}_${new Date().toISOString().split('T')[0]}.xlsx"`,
      );
      res.send(buffer);
    } catch (error) {
      console.error('Excel export hatası:', error.message);
      res.status(500).json({ message: 'Excel export sırasında hata oluştu' });
    }
  },
);

// === MAKİNA LİSTESİ (TASKS İÇİN) ===

// Makina listesi getir (Tasks için)
router.get('/machines-for-tasks', auth, async (req, res) => {
  try {
    logger.info('🔧 Makina listesi getiriliyor (Tasks için)...');

    // Tek query ile makina ve kalıp kategorilerini bul
    const [machineCategories, moldCategories] = await Promise.all([
      InventoryCategory.find({
        ad: { $regex: /makina|makine|machine/i },
        aktif: true,
      }).select('_id ad'),
      InventoryCategory.find({
        ad: { $regex: /kalıp|kalip|mold/i },
        aktif: true,
      }).select('_id ad'),
    ]);

    logger.info(`📋 Bulunan makina kategorileri: ${machineCategories.length}`);
    logger.info(`🚫 Dışlanan kalıp kategorileri: ${moldCategories.length}`);

    // Tek query ile tüm makinaları getir
    const machines = await InventoryItem.find({
      $or: [
        // Makina kategorilerinden olanlar
        { kategoriId: { $in: machineCategories.map(c => c._id) } },
        // Envanter kodunda makina geçenler
        { envanterKodu: { $regex: /mak|machine/i } },
        // Dinamik alanlarda makina özellikleri olanlar
        { 'dinamikAlanlar.Makine Adı': { $exists: true } },
        { 'dinamikAlanlar.Kapanma Kuvveti (kN / ton)': { $exists: true } },
      ],
      // Kalıp kategorilerini dışla
      kategoriId: { $nin: moldCategories.map(c => c._id) },
      aktif: true,
      durum: { $in: ['aktif', 'bakim'] },
    })
      .select('envanterKodu ad lokasyon kategoriId durum dinamikAlanlar')
      .populate('kategoriId', 'ad')
      .sort({ envanterKodu: 1 });

    logger.info(`📋 Toplam makina sayısı: ${machines.length}`);

    // Formatlı response
    const formattedMachines = machines.map(machine => ({
      _id: machine._id,
      kod: machine.envanterKodu,
      ad: machine.dinamikAlanlar?.get('Makine Adı') || machine.ad,
      originalAd: machine.ad,
      lokasyon: machine.lokasyon || '',
      kategori: machine.kategoriId?.ad || '',
      durum: machine.durum,
      name: `${machine.envanterKodu} - ${machine.ad}`,
      machineCode: machine.envanterKodu,
    }));

    res.json(formattedMachines);
  } catch (error) {
    logger.error('Makina listesi getirilirken hata:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// === KALIP LİSTESİ (WORKTASKS İÇİN) ===

// Kalıp listesi getir (WorkTasks için)
router.get('/kalips-for-tasks', auth, async (req, res) => {
  try {
    logger.info('🔧 Kalıp listesi getiriliyor (WorkTasks için)...');

    // Plastik Enjeksiyon Kalıpları kategorisini bul
    const kalipCategory = await InventoryCategory.findOne({
      ad: 'Plastik Enjeksiyon Kalıpları',
      aktif: true,
    }).select('_id ad');

    if (!kalipCategory) {
      logger.info('⚠️  Plastik Enjeksiyon Kalıpları kategorisi bulunamadı');
      return res.json([]);
    }

    logger.info(`📋 Kalıp kategorisi bulundu: ${kalipCategory.ad}`);

    // Kalıpları getir
    const kalips = await InventoryItem.find({
      kategoriId: kalipCategory._id,
      aktif: true,
      durum: { $in: ['aktif', 'bakim', 'depo'] },
    })
      .select('envanterKodu ad aciklama lokasyon durum dinamikAlanlar')
      .sort({ envanterKodu: 1 });

    logger.info(`📋 Toplam kalıp sayısı: ${kalips.length}`);

    // Formatlı response
    const formattedKalips = kalips.map(kalip => ({
      _id: kalip._id,
      kod: kalip.envanterKodu,
      ad: kalip.dinamikAlanlar?.get('Kalıp Adı/Kodu') || kalip.ad,
      originalAd: kalip.ad,
      aciklama: kalip.aciklama || '',
      lokasyon: kalip.lokasyon || '',
      durum: kalip.durum,
      uretilecekUrun: kalip.dinamikAlanlar?.get('Üretilecek Ürün Bilgisi') || '',
      kaviteSayisi: kalip.dinamikAlanlar?.get('Kavite Sayısı') || '',
      malzemeTuru: kalip.dinamikAlanlar?.get('Malzeme Türü') || '',
      searchText:
        `${kalip.envanterKodu} ${kalip.ad} ${kalip.dinamikAlanlar?.get('Kalıp Adı/Kodu') || ''} ${kalip.dinamikAlanlar?.get('Üretilecek Ürün Bilgisi') || ''}`.toLowerCase(),
    }));

    res.json(formattedKalips);
  } catch (error) {
    logger.error('Kalıp listesi getirilirken hata:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// === DASHBOARD VE İSTATİSTİKLER ===

// Envanter dashboard istatistikleri
router.get('/dashboard', auth, checkModulePermission('Envanter Yönetimi'), async (req, res) => {
  try {
    // Genel istatistikler
    const toplamEnvanter = await InventoryItem.countDocuments({ aktif: true });
    const kategoriler = await InventoryCategory.countDocuments({ aktif: true });

    // Durum bazlı istatistikler
    const durumStats = await InventoryItem.aggregate([
      { $match: { aktif: true } },
      { $group: { _id: '$durum', count: { $sum: 1 } } },
    ]);

    // Kategori bazlı istatistikler
    const kategoriStats = await InventoryItem.aggregate([
      { $match: { aktif: true } },
      {
        $lookup: {
          from: 'inventorycategories',
          localField: 'kategoriId',
          foreignField: '_id',
          as: 'kategori',
        },
      },
      { $unwind: '$kategori' },
      {
        $group: {
          _id: '$kategori.ad',
          count: { $sum: 1 },
          toplamDeger: { $sum: '$guncelDeger' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Yaklaşan bakımlar
    const yaklasanBakimlar = await InventoryItem.find({
      aktif: true,
      sonrakiBakimTarihi: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonraya kadar
      },
    })
      .populate('kategoriId', 'ad')
      .populate('bakimSorumlusu', 'ad soyad')
      .limit(10);

    // Kritik envanter (yüksek öncelikli)
    const kritikEnvanter = await InventoryItem.countDocuments({
      aktif: true,
      oncelikSeviyesi: 'kritik',
    });

    // En düşük veri kalitesi skoruna sahip öğeler
    const dusukKaliteEnvanter = await InventoryItem.find({
      aktif: true,
      'dataKalitesi.eksiksizlikSkoru': { $lt: 70 },
    })
      .populate('kategoriId', 'ad')
      .sort({ 'dataKalitesi.eksiksizlikSkoru': 1 })
      .limit(10);

    res.json({
      genel: {
        toplamEnvanter,
        kategoriler,
        kritikEnvanter,
      },
      durumStats,
      kategoriStats,
      yaklasanBakimlar,
      dusukKaliteEnvanter,
    });
  } catch (error) {
    console.error('Dashboard istatistikleri alınırken hata:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategori oluşturulduğunda otomatik şablon alanları oluşturma
const createPredefinedFieldTemplates = async (categoryId, categoryName) => {
  const templates = predefinedTemplates[categoryName];
  if (!templates) {
    return;
  }

  try {
    const templatePromises = templates.map(template => {
      const fieldTemplate = new InventoryFieldTemplate({
        kategoriId: categoryId,
        alanAdi: template.ad,
        alanTipi: template.tip,
        zorunlu: template.gerekli,
        varsayilanDeger: template.varsayilanDeger,
        secenekler: template.secenekler || [],
        siraNo: template.siraNo,
        grup: template.grup,
        validasyon: template.validasyon || {},
        aktif: true,
        olusturanKullanici: '507f1f77bcf86cd799439011', // Dummy ObjectId for system
        olusturmaTarihi: new Date(),
      });

      return fieldTemplate.save();
    });

    await Promise.all(templatePromises);
    console.log(`${categoryName} için ${templates.length} alan şablonu oluşturuldu`);
  } catch (error) {
    console.error('Önceden tanımlı şablonlar oluşturulurken hata:', error);
  }
};

// Logger helper
const logger = {
  info: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  },
};

module.exports = router;
