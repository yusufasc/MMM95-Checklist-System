// Kategori ve şablon yönetimi
// Otomatik oluşturuldu: 2025-02-05T22:44:00.000Z
// Orijinal: inventory.js

const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');

// Models
const InventoryCategory = require('../models/InventoryCategory');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');

// Önceden tanımlı şablonlar - sadece bu modülde gerekli olanlar
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
      ad: 'Durum',
      tip: 'select',
      gerekli: true,
      siraNo: 22,
      grup: 'Bakım ve Kalite Takibi',
      secenekler: ['Aktif', 'Bakımda', 'Arızalı', 'Kullanım Dışı', 'Satıldı'],
      aciklama: 'Mevcut kullanım durumu',
    },
    {
      ad: 'Notlar',
      tip: 'textarea',
      gerekli: false,
      siraNo: 23,
      grup: 'Bakım ve Kalite Takibi',
      aciklama: 'Ek açıklamalar ve özel durumlar',
    },
  ],
};

// Predefined field templates function
const createPredefinedFieldTemplates = async (categoryId, categoryName) => {
  try {
    const templates = predefinedTemplates[categoryName];
    if (!templates) {
      return [];
    }

    // Batch processing ile performans optimizasyonu
    const fieldTemplates = templates.map(template => ({
      kategoriId: categoryId,
      ...template,
    }));

    const createdTemplates =
      await InventoryFieldTemplate.insertMany(fieldTemplates);

    return createdTemplates;
  } catch (error) {
    console.error('Predefined templates oluşturulamadı:', error);
    return [];
  }
};

// GET /categories - Kategorileri listele
router.get(
  '/',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const categories = await InventoryCategory.find().sort({
        olusturmaTarihi: -1,
      });
      res.json(categories);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// POST /categories - Yeni kategori oluştur
router.post(
  '/',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, aciklama, renk, ikon, ustKategoriId } = req.body;

      // Kategori adı benzersizlik kontrolü
      const existingCategory = await InventoryCategory.findOne({ ad });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: 'Bu kategori adı zaten mevcut' });
      }

      const kategori = new InventoryCategory({
        ad,
        aciklama,
        renk: renk || '#1976d2',
        ikon: ikon || 'CategoryIcon',
        ustKategoriId: ustKategoriId || null,
        olusturanId: req.user.id,
      });

      await kategori.save();

      // Predefined templates varsa oluştur
      if (predefinedTemplates[ad]) {
        await createPredefinedFieldTemplates(kategori._id, ad);
      }

      res.json(kategori);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// PUT /categories/:id - Kategori güncelle
router.put(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, aciklama, renk, ikon, ustKategoriId } = req.body;

      // Kategori adı benzersizlik kontrolü (kendi dışında)
      const existingCategory = await InventoryCategory.findOne({
        ad,
        _id: { $ne: req.params.id },
      });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: 'Bu kategori adı zaten mevcut' });
      }

      const kategori = await InventoryCategory.findByIdAndUpdate(
        req.params.id,
        {
          ad,
          aciklama,
          renk,
          ikon,
          ustKategoriId: ustKategoriId || null,
          guncellenmeTarihi: Date.now(),
        },
        { new: true },
      );

      if (!kategori) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      res.json(kategori);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// DELETE /categories/:id - Kategori sil
router.delete(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const kategori = await InventoryCategory.findById(req.params.id);
      if (!kategori) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Alt kategoriler kontrolü
      const altKategoriler = await InventoryCategory.find({
        ustKategoriId: req.params.id,
      });
      if (altKategoriler.length > 0) {
        return res.status(400).json({
          message:
            'Bu kategorinin alt kategorileri bulunmaktadır. Önce alt kategorileri silin.',
        });
      }

      await InventoryCategory.findByIdAndDelete(req.params.id);
      res.json({ message: 'Kategori silindi' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /categories/:id/field-templates - Kategori alan şablonları
router.get(
  '/:id/field-templates',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const templates = await InventoryFieldTemplate.find({
        kategoriId: req.params.id,
      }).sort({ siraNo: 1 });

      res.json(templates);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// POST /categories/:id/field-templates - Yeni alan şablonu oluştur
router.post(
  '/:id/field-templates',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        tip,
        gerekli,
        siraNo,
        grup,
        aciklama,
        validasyon,
        secenekler,
      } = req.body;

      const template = new InventoryFieldTemplate({
        kategoriId: req.params.id,
        ad,
        tip,
        gerekli: gerekli || false,
        siraNo: siraNo || 1,
        grup: grup || 'Genel',
        aciklama,
        validasyon,
        secenekler,
      });

      await template.save();
      res.json(template);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// PUT /categories/:id/field-templates/:templateId - Alan şablonu güncelle
router.put(
  '/:id/field-templates/:templateId',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        tip,
        gerekli,
        siraNo,
        grup,
        aciklama,
        validasyon,
        secenekler,
      } = req.body;

      const template = await InventoryFieldTemplate.findByIdAndUpdate(
        req.params.templateId,
        {
          ad,
          tip,
          gerekli,
          siraNo,
          grup,
          aciklama,
          validasyon,
          secenekler,
        },
        { new: true },
      );

      if (!template) {
        return res.status(404).json({ message: 'Alan şablonu bulunamadı' });
      }

      res.json(template);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// DELETE /categories/:id/field-templates/:templateId - Alan şablonu sil
router.delete(
  '/:id/field-templates/:templateId',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const template = await InventoryFieldTemplate.findById(
        req.params.templateId,
      );
      if (!template) {
        return res.status(404).json({ message: 'Alan şablonu bulunamadı' });
      }

      await template.remove();
      res.json({ message: 'Alan şablonu silindi' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// Debug route - kategorileri detaylı görüntüle
router.get('/debug/:categoryId', auth, async (req, res) => {
  try {
    const category = await InventoryCategory.findById(req.params.categoryId);
    const templates = await InventoryFieldTemplate.find({
      kategoriId: req.params.categoryId,
    }).sort({ siraNo: 1 });

    res.json({
      category,
      templates,
      templateCount: templates.length,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
