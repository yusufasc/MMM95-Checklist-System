// Envanter öğe yönetimi
// Otomatik oluşturuldu: 2025-02-05T22:44:00.000Z
// Orijinal: inventory.js

const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');

// Models
const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');

// Validation middleware
const validateInventoryItem = async (req, res, next) => {
  try {
    const { kategoriId, dinamikAlanlar } = req.body;

    // Kategori varlığını kontrol et
    const kategori = await InventoryCategory.findById(kategoriId);
    if (!kategori) {
      return res.status(400).json({ message: 'Geçersiz kategori' });
    }

    // Dinamik alanları doğrula
    if (dinamikAlanlar && typeof dinamikAlanlar === 'object') {
      const templates = await InventoryFieldTemplate.find({ kategoriId });

      for (const template of templates) {
        if (template.gerekli) {
          const value = dinamikAlanlar[template.ad];
          if (!value || value === '') {
            return res.status(400).json({
              message: `${template.ad} alanı zorunludur`,
            });
          }
        }

        // Tip validasyonu
        const value = dinamikAlanlar[template.ad];
        if (value && template.tip === 'number' && isNaN(Number(value))) {
          return res.status(400).json({
            message: `${template.ad} sayısal bir değer olmalıdır`,
          });
        }

        // Validasyon kuralları
        if (value && template.validasyon) {
          const numValue = Number(value);
          if (template.validasyon.min && numValue < template.validasyon.min) {
            return res.status(400).json({
              message: `${template.ad} minimum ${template.validasyon.min} olmalıdır`,
            });
          }
          if (template.validasyon.max && numValue > template.validasyon.max) {
            return res.status(400).json({
              message: `${template.ad} maksimum ${template.validasyon.max} olmalıdır`,
            });
          }
        }

        // Select seçenekleri
        if (value && template.tip === 'select' && template.secenekler) {
          if (!template.secenekler.includes(value)) {
            return res.status(400).json({
              message: `${template.ad} için geçersiz seçenek`,
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ message: 'Validasyon hatası' });
  }
};

// GET /items - Envanter öğelerini listele
router.get(
  '/',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const {
        kategoriId,
        durum,
        search,
        lokasyon,
        sorumluKisi,
        sayfa = 1,
        limit = 20,
        sirala = 'olusturmaTarihi',
        yon = 'desc',
      } = req.query;

      console.log('📦 Inventory items endpoint çağrıldı');
      console.log('Query parametreleri:', req.query);
      console.log('🔍 Filtreleme parametreleri:', {
        kategoriId,
        durum,
        search,
        lokasyon,
        sorumluKisi,
      });

      // Parametreleri düzelt
      const page = parseInt(sayfa);
      const sortBy = sirala;
      const sortOrder = yon;

      // Filtreleme kriteri oluştur
      const filter = {};

      if (kategoriId) {
        filter.kategoriId = kategoriId;
      }

      if (durum) {
        filter.durum = durum;
      }

      if (lokasyon) {
        filter.lokasyon = { $regex: lokasyon, $options: 'i' };
      }

      if (sorumluKisi) {
        filter.sorumluKisi = sorumluKisi;
      }

      // Arama filtresi - model field isimlerini kullan
      if (search) {
        filter.$or = [
          { envanterKodu: { $regex: search, $options: 'i' } },
          { ad: { $regex: search, $options: 'i' } },
          { aciklama: { $regex: search, $options: 'i' } },
          { lokasyon: { $regex: search, $options: 'i' } },
          { tedarikci: { $regex: search, $options: 'i' } },
        ];
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === 'desc' ? -1 : 1;

      console.log('📋 Filter:', filter);
      console.log('📋 Sort:', { [sortBy]: sortDirection });

      const items = await InventoryItem.find(filter)
        .populate('kategoriId', 'ad renk ikon')
        .populate('olusturanKullanici', 'username')
        .populate('sorumluKisi', 'ad soyad username')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await InventoryItem.countDocuments(filter);

      console.log(`📋 ${items.length} öğe bulundu (toplam: ${total})`);

      res.json({
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Inventory items error:', error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /items/:id - Tek öğe detayı
router.get(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const item = await InventoryItem.findById(req.params.id)
        .populate('kategoriId', 'ad renk ikon')
        .populate('olusturanKullanici', 'username email')
        .populate('guncelleyenId', 'username email');

      if (!item) {
        return res.status(404).json({ message: 'Öğe bulunamadı' });
      }

      // Kategori şablonlarını al
      const templates = await InventoryFieldTemplate.find({
        kategoriId: item.kategoriId._id,
      }).sort({ siraNo: 1 });

      res.json({
        item,
        templates,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// POST /items - Yeni envanter öğesi oluştur
router.post(
  '/',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  validateInventoryItem,
  async (req, res) => {
    try {
      console.log('📦 POST /inventory/items çağrıldı');
      console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));

      const {
        kod,
        ad,
        aciklama,
        kategoriId,
        durum,
        dinamikAlanlar,
        etiketler,
        resimUrl,
        qrKodu,
        barkod,
      } = req.body;

      // Envanter kodu otomatik oluştur veya kontrol et
      let envanterKodu = kod;
      if (!envanterKodu || envanterKodu.trim() === '') {
        // Otomatik kod oluştur: kategori kısaltması + timestamp + random
        const kategori = await InventoryCategory.findById(kategoriId);
        const kategoriKisaltma = kategori
          ? kategori.ad.substring(0, 3).toUpperCase()
          : 'INV';
        const timestamp = Date.now().toString().slice(-6); // Son 6 digit
        const random = Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, '0');
        envanterKodu = `${kategoriKisaltma}-${timestamp}-${random}`;
      }

      // Envanter kodu benzersizlik kontrolü
      const existingItem = await InventoryItem.findOne({ envanterKodu });
      if (existingItem) {
        return res
          .status(400)
          .json({ message: 'Bu envanter kodu zaten kullanılıyor' });
      }

      // QR kod benzersizlik kontrolü
      if (qrKodu) {
        const existingQR = await InventoryItem.findOne({ qrKodu });
        if (existingQR) {
          return res
            .status(400)
            .json({ message: 'Bu QR kod zaten kullanılıyor' });
        }
      }

      // Barkod benzersizlik kontrolü
      if (barkod) {
        const existingBarcode = await InventoryItem.findOne({ barkod });
        if (existingBarcode) {
          return res
            .status(400)
            .json({ message: 'Bu barkod zaten kullanılıyor' });
        }
      }

      const item = new InventoryItem({
        envanterKodu, // Otomatik oluşturulan veya gönderilen kod
        ad,
        aciklama,
        kategoriId,
        durum: durum || 'aktif', // enum'a uygun küçük harf
        dinamikAlanlar: dinamikAlanlar || {},
        etiketler: etiketler || [],
        resimUrl,
        qrKodu,
        barkod,
        olusturanKullanici: req.user.id, // olusturanId -> olusturanKullanici field mapping
      });

      await item.save();

      // Populate ile geri döndür
      const populatedItem = await InventoryItem.findById(item._id)
        .populate('kategoriId', 'ad renk ikon')
        .populate('olusturanKullanici', 'username');

      res.json(populatedItem);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// PUT /items/:id - Envanter öğesi güncelle
router.put(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  validateInventoryItem,
  async (req, res) => {
    try {
      const {
        kod,
        ad,
        aciklama,
        durum,
        dinamikAlanlar,
        etiketler,
        resimUrl,
        qrKodu,
        barkod,
      } = req.body;

      // Benzersizlik kontrolleri (kendi dışında)
      if (kod) {
        const existingItem = await InventoryItem.findOne({
          envanterKodu: kod,
          _id: { $ne: req.params.id },
        });
        if (existingItem) {
          return res
            .status(400)
            .json({ message: 'Bu envanter kodu zaten kullanılıyor' });
        }
      }

      if (qrKodu) {
        const existingQR = await InventoryItem.findOne({
          qrKodu,
          _id: { $ne: req.params.id },
        });
        if (existingQR) {
          return res
            .status(400)
            .json({ message: 'Bu QR kod zaten kullanılıyor' });
        }
      }

      if (barkod) {
        const existingBarcode = await InventoryItem.findOne({
          barkod,
          _id: { $ne: req.params.id },
        });
        if (existingBarcode) {
          return res
            .status(400)
            .json({ message: 'Bu barkod zaten kullanılıyor' });
        }
      }

      const item = await InventoryItem.findByIdAndUpdate(
        req.params.id,
        {
          envanterKodu: kod, // kod -> envanterKodu field mapping
          ad,
          aciklama,
          durum,
          dinamikAlanlar: dinamikAlanlar || {},
          etiketler: etiketler || [],
          resimUrl,
          qrKodu,
          barkod,
          guncellemeTarihi: Date.now(), // model field adını kullan
        },
        { new: true },
      )
        .populate('kategoriId', 'ad renk ikon')
        .populate('guncelleyenId', 'username');

      if (!item) {
        return res.status(404).json({ message: 'Öğe bulunamadı' });
      }

      res.json(item);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// DELETE /items/:id - Envanter öğesi sil
router.delete(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const item = await InventoryItem.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Öğe bulunamadı' });
      }

      await InventoryItem.findByIdAndDelete(req.params.id);
      res.json({ message: 'Öğe silindi' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /search - Gelişmiş arama
router.get(
  '/search/advanced',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const { query, kategoriId, durum, etiketler } = req.query;

      const searchCriteria = {};

      if (query) {
        searchCriteria.$text = { $search: query };
      }

      if (kategoriId) {
        searchCriteria.kategoriId = kategoriId;
      }

      if (durum) {
        searchCriteria.durum = durum;
      }

      if (etiketler) {
        searchCriteria.etiketler = { $in: etiketler.split(',') };
      }

      const items = await InventoryItem.find(searchCriteria)
        .populate('kategoriId', 'ad renk ikon')
        .sort({ score: { $meta: 'textScore' } })
        .limit(50);

      res.json(items);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /qr-scan/:qrCode - QR kod ile öğe bul
router.get(
  '/qr-scan/:qrCode',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const item = await InventoryItem.findOne({ qrKodu: req.params.qrCode })
        .populate('kategoriId', 'ad renk ikon')
        .populate('olusturanId', 'username');

      if (!item) {
        return res
          .status(404)
          .json({ message: 'QR kod ile eşleşen öğe bulunamadı' });
      }

      res.json(item);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /barcode-scan/:barcode - Barkod ile öğe bul
router.get(
  '/barcode-scan/:barcode',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const item = await InventoryItem.findOne({ barkod: req.params.barcode })
        .populate('kategoriId', 'ad renk ikon')
        .populate('olusturanId', 'username');

      if (!item) {
        return res
          .status(404)
          .json({ message: 'Barkod ile eşleşen öğe bulunamadı' });
      }

      res.json(item);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

module.exports = router;
