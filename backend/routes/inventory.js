// Inventory Management - Ana Router
// Refactored: 2025-02-05T22:44:00.000Z
// Orijinal 2,166 satırlık dosya modüllere bölündü

const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const { inventoryCache, machinesListCache } = require('../middleware/cache');

// Models - Dashboard için gerekli
const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');
const Machine = require('../models/Machine'); // Machine model eklendi

// Alt modülleri import et
const categoriesRoutes = require('./inventory-categories');
const itemsRoutes = require('./inventory-items');
const exportRoutes = require('./inventory-export');

// Excel import endpoint - Frontend uyumluluğu için doğrudan routing
const multer = require('multer');
const ExcelService = require('../services/excelService');

// Excel dosyaları için multer ayarları
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları (.xlsx, .xls) kabul edilir'), false);
    }
  },
});

// POST /categories/:id/excel-import - Frontend uyumlu endpoint
router.post(
  '/categories/:id/excel-import',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('📊 Excel import started for category:', req.params.id);

      if (!req.file) {
        return res.status(400).json({ message: 'Excel dosyası gerekli' });
      }

      const categoryId = req.params.id;

      // Kategori kontrolü
      const category = await InventoryCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Kategori şablonlarını al
      const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
      const templates = await InventoryFieldTemplate.find({
        kategoriId: categoryId,
      }).sort({
        siraNo: 1,
      });

      // Excel dosyasını oku
      const excelData = await ExcelService.readExcel(
        req.file.buffer,
        templates,
      );

      if (excelData.length === 0) {
        return res.status(400).json({ message: 'Excel dosyası boş' });
      }

      let basariliSayisi = 0;
      let hataliSayisi = 0;
      const hatalar = [];

      // Excel verilerini batch processing ile optimize et
      const validItems = [];

      // İlk aşama: Validation ve data preparation
      for (let i = 0; i < excelData.length; i++) {
        try {
          const rowData = excelData[i];

          // Excel header'larına göre akıllı field mapping
          const headers = Object.keys(rowData);

          // Plastik enjeksiyon makinası için özel mapping
          let ad, kod, marka, model, detay;

          // Header değerlerine göre intelligent mapping
          if (headers.length > 6) {
            // Marka + Model kombinasyonu (HAİTİAN + ZAFİR + VE 1500II)
            marka = rowData[headers[1]] || rowData[headers[5]]; // HAİTİAN
            model = rowData[headers[2]]; // ZAFİR
            detay = rowData[headers[6]]; // VE 1500II

            ad = [marka, model, detay]
              .filter(x => x && x !== '' && x !== 'undefined')
              .join(' ');

            // Kod: En uzun sayısal değeri bul (201515015031597)
            kod =
              headers
                .map(h => rowData[h])
                .find(val => val && /^[0-9]{10,}$/.test(val)) || // 10+ digit kod
              rowData[headers[4]]; // Varsayılan 5. sütun
          } else {
            // Fallback: Basit mapping
            ad = rowData[headers[1]] || 'Bilinmeyen Makina';
            kod =
              rowData[headers[0]] || Math.random().toString(36).substr(2, 9);
            marka = ad;
            model = '';
            detay = '';
          }

          console.log(`📋 Satır ${i + 2}: Ad="${ad}", Kod="${kod}"`);

          // Required fields kontrolü - dinamik
          if (!ad || !kod) {
            hatalar.push(
              `Satır ${i + 2}: Ad ("${ad}") ve Kod ("${kod}") alanları zorunludur`,
            );
            hataliSayisi++;
            continue;
          }

          // Duplicate kod kontrolü
          const existingItem = await InventoryItem.findOne({
            envanterKodu: kod,
            kategoriId: categoryId,
          });

          if (existingItem) {
            hatalar.push(`Satır ${i + 2}: '${kod}' kodu zaten mevcut`);
            hataliSayisi++;
            continue;
          }

          // Ek field mapping
          const durum = rowData[headers[3]] || 'aktif'; // "Aktif" sütunu
          const aciklama =
            [marka, model, detay].filter(x => x).join(' - ') || '';

          // InventoryItem verisi hazırla
          const itemData = {
            ad: ad,
            envanterKodu: kod,
            kategoriId: categoryId,
            aciklama: aciklama,
            durum: durum.toLowerCase(),
            dinamikAlanlar: {},
            olusturmaTarihi: new Date(),
            guncellemeTarihi: new Date(),
            olusturanKullanici: req.user.id,
          };

          // Dinamik alanları ekle
          templates.forEach(template => {
            const fieldName = template.alanAdi;
            if (fieldName && rowData[fieldName] !== undefined) {
              itemData.dinamikAlanlar[fieldName] = rowData[fieldName];
            }
          });

          validItems.push(itemData);
          basariliSayisi++;
        } catch (error) {
          hatalar.push(`Satır ${i + 2}: ${error.message}`);
          hataliSayisi++;
        }
      }

      // Batch insert
      if (validItems.length > 0) {
        await InventoryItem.insertMany(validItems);
      }

      console.log(
        `✅ Excel import completed: ${basariliSayisi} success, ${hataliSayisi} errors`,
      );

      res.json({
        message: 'Excel import tamamlandı',
        basariliSayisi,
        hataliSayisi,
        hatalar: hatalar.slice(0, 10), // İlk 10 hatayı göster
        toplamSatir: excelData.length,
      });
    } catch (error) {
      console.error('❌ Excel import error:', error);
      res.status(500).json({
        message: 'Excel import hatası: ' + error.message,
      });
    }
  },
);

// Excel template endpoint - Frontend uyumluluğu için
router.get(
  '/categories/:id/excel-template',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      console.log(
        '🔧 Excel template endpoint called for category:',
        req.params.id,
      );

      const categoryId = req.params.id;

      // Kategori kontrolü
      console.log('📋 Checking category...');
      const category = await InventoryCategory.findById(categoryId);
      if (!category) {
        console.log('❌ Category not found:', categoryId);
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }
      console.log('✅ Category found:', category.ad);

      // Kategori şablonlarını al
      console.log('📋 Loading field templates...');
      const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
      const templates = await InventoryFieldTemplate.find({
        kategoriId: categoryId,
      }).sort({ siraNo: 1 });
      console.log('✅ Templates loaded:', templates.length);

      // ExcelJS yükle
      console.log('📊 Loading ExcelJS...');
      const ExcelJS = require('exceljs');
      console.log('✅ ExcelJS loaded');

      // Excel başlıkları oluştur
      const headers = ['Kod', 'Ad', 'Açıklama', 'Durum'];

      // Dinamik alanları ekle
      templates.forEach(template => {
        const fieldName = template.alanAdi || template.ad || template.alan;
        if (fieldName) {
          headers.push(fieldName);
        }
      });
      console.log('📋 Headers created:', headers);

      // Örnek veri satırı oluştur
      const exampleData = {
        Kod: 'MAKINA001',
        Ad: 'Örnek Makina',
        Açıklama: 'Açıklama metni',
        Durum: 'Aktif',
      };

      // Dinamik alanlar için örnek değerler
      templates.forEach(template => {
        const fieldName = template.alanAdi || template.ad || template.alan;
        const fieldType = template.alanTipi || template.tip;

        if (!fieldName) {
          return;
        }

        if (fieldType === 'number') {
          exampleData[fieldName] = 100;
        } else if (fieldType === 'date') {
          exampleData[fieldName] = new Date().toISOString().split('T')[0];
        } else if (fieldType === 'select' && template.secenekler?.length > 0) {
          exampleData[fieldName] = template.secenekler[0];
        } else {
          exampleData[fieldName] = `Örnek ${fieldName}`;
        }
      });
      console.log('📋 Example data created');

      // Excel dosyası oluştur
      console.log('📊 Creating Excel workbook...');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(category.ad);

      // Başlıkları ekle
      worksheet.addRow(headers);

      // Örnek veri satırını ekle
      const exampleRow = headers.map(header => exampleData[header] || '');
      worksheet.addRow(exampleRow);

      // Başlık satırını kalın yap
      worksheet.getRow(1).font = { bold: true };
      console.log('✅ Excel worksheet created');

      // Buffer oluştur
      console.log('📊 Creating buffer...');
      const buffer = await workbook.xlsx.writeBuffer();
      console.log('✅ Buffer created, size:', buffer.length);

      // Dosya adı
      const fileName = `${category.ad.replace(/[^a-zA-Z0-9]/g, '_')}_sablon.xlsx`;
      console.log('📁 File name:', fileName);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );

      console.log('✅ Sending Excel file...');
      res.send(buffer);
      console.log('🎉 Excel template sent successfully!');
    } catch (error) {
      console.error('❌ Excel template error:', error);
      console.error('🔍 Error stack:', error.stack);
      res
        .status(500)
        .json({ message: 'Şablon oluşturma hatası: ' + error.message });
    }
  },
);

// Frontend uyumluluğu için eski endpoint'ler
router.get(
  '/categories/:id/fields',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    // Frontend'den /fields çağrısını /field-templates'e yönlendir
    try {
      const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
      const templates = await InventoryFieldTemplate.find({
        kategoriId: req.params.id,
      }).sort({ siraNo: 1 });

      // Database field adlarını frontend'in beklediği formata map et
      const mappedTemplates = templates.map(template => ({
        _id: template._id,
        kategoriId: template.kategoriId,
        alan: template.alanAdi, // alanAdi → alan
        ad: template.alanAdi, // alanAdi → ad
        tip: template.alanTipi, // alanTipi → tip
        gerekli: template.zorunlu, // zorunlu → gerekli
        siraNo: template.siraNo,
        grup: template.grup,
        aciklama: template.aciklama,
        placeholder: template.placeholder,
        varsayilanDeger: template.varsayilanDeger,
        secenekler: template.secenekler,
        validasyon: template.validasyon,
        aktif: template.aktif,
        olusturmaTarihi: template.olusturmaTarihi,
        guncellemeTarihi: template.guncellemeTarihi,
      }));

      console.log(
        `✅ Field templates for category ${req.params.id}:`,
        mappedTemplates.length,
      );
      res.json(mappedTemplates);
    } catch (error) {
      console.error('Field templates error:', error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /dashboard - Dashboard verilerini getir (ana dosyada kalması gereken)
router.get(
  '/dashboard',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  inventoryCache('dashboard'), // 🚀 CACHE: 5 dakika
  async (req, res) => {
    try {
      // Toplam öğe sayısı
      const toplamOgeSayisi = await InventoryItem.countDocuments();

      // Kategori bazlı sayılar
      const kategoriBazliSayilar = await InventoryItem.aggregate([
        {
          $group: {
            _id: '$kategoriId',
            sayi: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'inventorycategories',
            localField: '_id',
            foreignField: '_id',
            as: 'kategori',
          },
        },
        {
          $unwind: '$kategori',
        },
        {
          $project: {
            kategoriAdi: '$kategori.ad',
            sayi: 1,
            renk: '$kategori.renk',
          },
        },
      ]);

      // Durum bazlı sayılar
      const durumBazliSayilar = await InventoryItem.aggregate([
        {
          $group: {
            _id: '$durum',
            sayi: { $sum: 1 },
          },
        },
      ]);

      // Son eklenen öğeler
      const sonEklenenler = await InventoryItem.find()
        .populate('kategoriId', 'ad renk')
        .populate('olusturanKullanici', 'username')
        .sort({ olusturmaTarihi: -1 })
        .limit(5)
        .select('ad envanterKodu durum olusturmaTarihi');

      // Kalite skorları (dinamik alanlara göre)
      let kaliteSkorlari = [];
      try {
        const items = await InventoryItem.find({}).limit(100);
        kaliteSkorlari = items
          .map(item => {
            let skor = 0;
            let toplamAlan = 0;

            if (item.dinamikAlanlar) {
              Object.keys(item.dinamikAlanlar).forEach(key => {
                toplamAlan++;
                if (
                  item.dinamikAlanlar[key] &&
                  item.dinamikAlanlar[key] !== ''
                ) {
                  skor++;
                }
              });
            }

            return {
              id: item._id,
              ad: item.ad,
              kaliteSkor:
                toplamAlan > 0 ? Math.round((skor / toplamAlan) * 100) : 0,
            };
          })
          .filter(item => item.kaliteSkor < 80); // Düşük kalite skorlu öğeler
      } catch (error) {
        console.warn('Kalite skorları hesaplanamadı:', error.message);
      }

      res.json({
        toplamOgeSayisi,
        kategoriBazliSayilar,
        durumBazliSayilar,
        sonEklenenler,
        kaliteSkorlari: kaliteSkorlari.slice(0, 10), // İlk 10'u göster
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Dashboard error:', error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// GET /machines - Birleştirilmiş makina API (hem Machine hem InventoryItem)
router.get('/machines', auth, machinesListCache(), async (req, res) => {
  // 🚀 CACHE: 30 dakika
  try {
    const { source = 'all' } = req.query; // source: 'all', 'machine', 'inventory'

    const allMachines = [];

    // 1. Machine modelinden makinaları al
    if (source === 'all' || source === 'machine') {
      const machineRecords = await Machine.find({ durum: 'aktif' })
        .populate('departman', 'ad')
        .populate('sorumluRoller', 'ad');

      machineRecords.forEach(machine => {
        allMachines.push({
          _id: machine._id,
          ad: machine.ad,
          kod: machine.makinaNo,
          tip: 'machine',
          kaynak: 'Machine',
          lokasyon: machine.departman?.ad || 'Belirtilmemiş',
          durum: machine.durum,
          aciklama: machine.aciklama,
          // Ek bilgiler
          sorumluRoller: machine.sorumluRoller,
          departman: machine.departman,
          // Frontend uyumluluğu
          makinaNo: machine.makinaNo,
          envanterKodu: machine.makinaNo,
          searchText: `${machine.makinaNo} ${machine.ad}`.toLowerCase(),
        });
      });
    }

    // 2. InventoryItem'dan makinaları al
    if (source === 'all' || source === 'inventory') {
      const makinaCategory = await InventoryCategory.findOne({
        ad: 'Plastik Enjeksiyon Makinası',
      });

      if (makinaCategory) {
        const inventoryMachines = await InventoryItem.find({
          kategoriId: makinaCategory._id,
          durum: { $regex: /^aktif$/i },
        });

        inventoryMachines.forEach(machine => {
          allMachines.push({
            _id: machine._id,
            ad: machine.ad,
            kod: machine.envanterKodu || machine.ad,
            tip: 'inventoryItem',
            kaynak: 'InventoryItem',
            lokasyon:
              machine.dinamikAlanlar?.['Lokasyon'] ||
              machine.lokasyon ||
              'Belirtilmemiş',
            durum: machine.durum,
            aciklama: machine.aciklama,
            // Ek bilgiler
            dinamikAlanlar: machine.dinamikAlanlar,
            kategoriId: machine.kategoriId,
            qrKodu: machine.qrKodu,
            barkod: machine.barkod,
            // Frontend uyumluluğu
            makinaNo: machine.envanterKodu,
            envanterKodu: machine.envanterKodu,
            searchText:
              `${machine.envanterKodu || ''} ${machine.ad}`.toLowerCase(),
          });
        });
      }
    }

    // Kod'a göre sırala
    allMachines.sort((a, b) => (a.kod || '').localeCompare(b.kod || ''));

    console.log(
      `✅ Toplam ${allMachines.length} makina hazırlandı (${source})`,
    );
    res.json(allMachines);
  } catch (error) {
    console.error('Birleştirilmiş makina API hatası:', error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// GET /machines/:id - Tek makina detayı (tip agnostik)
router.get('/machines/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Önce Machine modelinde ara
    const machine = await Machine.findById(id)
      .populate('departman', 'ad')
      .populate('sorumluRoller', 'ad');

    if (machine) {
      return res.json({
        _id: machine._id,
        ad: machine.ad,
        kod: machine.makinaNo,
        tip: 'machine',
        kaynak: 'Machine',
        lokasyon: machine.departman?.ad || 'Belirtilmemiş',
        durum: machine.durum,
        aciklama: machine.aciklama,
        sorumluRoller: machine.sorumluRoller,
        departman: machine.departman,
        makinaNo: machine.makinaNo,
        envanterKodu: machine.makinaNo,
      });
    }

    // Machine'de bulunamazsa InventoryItem'da ara
    const inventoryItem = await InventoryItem.findById(id).populate(
      'kategoriId',
      'ad',
    );

    if (inventoryItem) {
      return res.json({
        _id: inventoryItem._id,
        ad: inventoryItem.ad,
        kod: inventoryItem.envanterKodu,
        tip: 'inventoryItem',
        kaynak: 'InventoryItem',
        lokasyon:
          inventoryItem.dinamikAlanlar?.['Lokasyon'] ||
          inventoryItem.lokasyon ||
          'Belirtilmemiş',
        durum: inventoryItem.durum,
        aciklama: inventoryItem.aciklama,
        dinamikAlanlar: inventoryItem.dinamikAlanlar,
        kategoriId: inventoryItem.kategoriId,
        qrKodu: inventoryItem.qrKodu,
        barkod: inventoryItem.barkod,
        makinaNo: inventoryItem.envanterKodu,
        envanterKodu: inventoryItem.envanterKodu,
      });
    }

    return res.status(404).json({ message: 'Makina bulunamadı' });
  } catch (error) {
    console.error('Makina detay hatası:', error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// GET /kalips - Tüm kalıpları getir (Quality Control için)
router.get('/kalips', auth, async (req, res) => {
  try {
    console.log('🔍 Kalıp kategorisi aranıyor...');

    // "Plastik Enjeksiyon Kalıpları" veya benzeri kategorileri ara
    const kalipCategory = await InventoryCategory.findOne({
      $or: [
        { ad: 'Plastik Enjeksiyon Kalıpları' },
        { ad: 'Kalıplar' },
        { ad: { $regex: /kalıp/i } }, // "kalıp" içeren herhangi bir kategori
      ],
    });

    if (!kalipCategory) {
      console.log('⚠️  Kalıp kategorisi bulunamadı!');
      return res.json([]);
    }

    console.log('✅ Kalıp kategorisi bulundu:', kalipCategory.ad);

    const kalips = await InventoryItem.find({
      kategoriId: kalipCategory._id,
      durum: { $regex: /^aktif$/i }, // Case-insensitive "aktif" kontrolü
    })
      .select('ad envanterKodu dinamikAlanlar')
      .sort({ ad: 1 });

    const formattedKalips = kalips.map(kalip => {
      // Dinamik alanlardan kalıp bilgilerini çıkar
      const kod = kalip.envanterKodu || kalip.ad;
      const uretilecekUrun = kalip.dinamikAlanlar?.['Üretilecek Ürün'] || '';
      const lokasyon = kalip.dinamikAlanlar?.['Lokasyon'] || '';

      return {
        _id: kalip._id,
        ad: kalip.ad,
        kod: kod,
        envanterKodu: kalip.envanterKodu,
        uretilecekUrun: uretilecekUrun,
        lokasyon: lokasyon,
        searchText: `${kod} ${kalip.ad} ${uretilecekUrun}`.toLowerCase(),
      };
    });

    console.log(`✅ ${formattedKalips.length} kalıp hazırlandı`);
    res.json(formattedKalips);
  } catch (error) {
    console.error('Kalips error:', error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// GET /kalips-for-tasks - Görev için kalıpları getir (WorkTasks entegrasyonu)
router.get('/kalips-for-tasks', auth, async (req, res) => {
  try {
    console.log('🔍 Kalıp kategorisi aranıyor...');

    // Önce tüm kategorileri listele (debug için)
    const allCategories = await InventoryCategory.find().select('ad');
    console.log(
      '📋 Mevcut kategoriler:',
      allCategories.map(c => c.ad),
    );

    // "Plastik Enjeksiyon Kalıpları" veya benzeri kategorileri ara
    const kalipCategory = await InventoryCategory.findOne({
      $or: [
        { ad: 'Plastik Enjeksiyon Kalıpları' },
        { ad: 'Kalıplar' },
        { ad: { $regex: /kalıp/i } }, // "kalıp" içeren herhangi bir kategori
      ],
    });

    if (!kalipCategory) {
      console.log('⚠️  Kalıp kategorisi bulunamadı!');
      return res.json([]);
    }

    console.log('✅ Kalıp kategorisi bulundu:', kalipCategory.ad);

    const kalips = await InventoryItem.find({
      kategoriId: kalipCategory._id,
      durum: { $regex: /^aktif$/i }, // Case-insensitive "aktif" kontrolü
    })
      .select('ad envanterKodu dinamikAlanlar')
      .sort({ ad: 1 });

    const formattedKalips = kalips.map(kalip => {
      // Dinamik alanlardan kalıp bilgilerini çıkar
      const kod = kalip.envanterKodu || kalip.ad;
      const uretilecekUrun = kalip.dinamikAlanlar?.['Üretilecek Ürün'] || '';
      const lokasyon = kalip.dinamikAlanlar?.['Lokasyon'] || '';

      return {
        _id: kalip._id,
        ad: kalip.ad,
        kod: kod,
        envanterKodu: kalip.envanterKodu,
        uretilecekUrun: uretilecekUrun,
        lokasyon: lokasyon,
        searchText: `${kod} ${kalip.ad} ${uretilecekUrun}`.toLowerCase(),
      };
    });

    console.log(`✅ ${formattedKalips.length} kalıp görev için hazırlandı`);
    res.json(formattedKalips);
  } catch (error) {
    console.error('Kalips for tasks error:', error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Alt route'ları bağla - Excel route'undan SONRA
router.use('/categories', categoriesRoutes);
router.use('/items', itemsRoutes);
router.use('/export', exportRoutes);

module.exports = router;
