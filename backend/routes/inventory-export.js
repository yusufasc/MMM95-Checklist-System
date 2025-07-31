// İçe/Dışa aktarma işlemleri
// Otomatik oluşturuldu: 2025-02-05T22:44:00.000Z
// Orijinal: inventory.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, checkModulePermission } = require('../middleware/auth');

// Models
const ExcelJS = require('exceljs');
const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
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

// POST /excel-import/:categoryId - Excel dosyası import et
router.post(
  '/excel-import/:categoryId',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  upload.single('excelFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Excel dosyası gerekli' });
      }

      const categoryId = req.params.categoryId;

      // Kategori kontrolü
      const category = await InventoryCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Kategori şablonlarını al
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

      // İlk aşama: Validation ve data preparation (loop içinde await yok)
      for (let i = 0; i < excelData.length; i++) {
        try {
          const row = excelData[i];
          const dinamikAlanlar = {};

          // Template'lere göre dinamik alanları oluştur
          templates.forEach(template => {
            const value = row[template.ad];
            if (value !== undefined && value !== null && value !== '') {
              if (template.tip === 'number') {
                dinamikAlanlar[template.ad] = Number(value);
              } else if (template.tip === 'date') {
                dinamikAlanlar[template.ad] = new Date(value);
              } else {
                dinamikAlanlar[template.ad] = String(value);
              }
            }
          });

          // Ana alanları oluştur
          const itemData = {
            kod: row['Kod'] || `AUTO-${Date.now()}-${i}`,
            ad: row['Ad'] || row['Makine Adı'] || `Import ${i + 1}`,
            aciklama: row['Açıklama'] || '',
            kategoriId: categoryId,
            durum: row['Durum'] || 'Aktif',
            dinamikAlanlar: dinamikAlanlar,
            etiketler: row['Etiketler']
              ? row['Etiketler'].split(',').map(e => e.trim())
              : [],
            qrKodu: row['QR Kod'] || null,
            barkod: row['Barkod'] || null,
            olusturanId: req.user.id,
            _rowIndex: i + 1, // Hata mesajları için
          };

          // Zorunlu alanları kontrol et
          let validationError = null;
          templates.forEach(template => {
            if (
              template.gerekli &&
              (!dinamikAlanlar[template.ad] ||
                dinamikAlanlar[template.ad] === '')
            ) {
              validationError = `${template.ad} alanı zorunludur`;
            }
          });

          if (validationError) {
            hatalar.push(`Satır ${i + 1}: ${validationError}`);
            hataliSayisi++;
            continue;
          }

          validItems.push(itemData);
        } catch (error) {
          console.error(`Row ${i + 1} validation error:`, error.message);
          hatalar.push(`Satır ${i + 1}: ${error.message}`);
          hataliSayisi++;
        }
      }

      // İkinci aşama: Batch benzersizlik kontrolü (tek seferde)
      if (validItems.length > 0) {
        const kodValues = validItems
          .filter(item => item.kod)
          .map(item => item.kod);
        const qrValues = validItems
          .filter(item => item.qrKodu)
          .map(item => item.qrKodu);
        const barkodValues = validItems
          .filter(item => item.barkod)
          .map(item => item.barkod);

        const [existingKods, existingQRs, existingBarkods] = await Promise.all([
          kodValues.length > 0
            ? InventoryItem.find({ kod: { $in: kodValues } }, 'kod')
            : [],
          qrValues.length > 0
            ? InventoryItem.find({ qrKodu: { $in: qrValues } }, 'qrKodu')
            : [],
          barkodValues.length > 0
            ? InventoryItem.find({ barkod: { $in: barkodValues } }, 'barkod')
            : [],
        ]);

        const existingKodSet = new Set(existingKods.map(item => item.kod));
        const existingQRSet = new Set(existingQRs.map(item => item.qrKodu));
        const existingBarkodSet = new Set(
          existingBarkods.map(item => item.barkod),
        );

        // Benzersizlik kontrolü ve final item listesi
        const finalItems = [];

        for (const itemData of validItems) {
          let hasConflict = false;

          if (itemData.kod && existingKodSet.has(itemData.kod)) {
            hatalar.push(
              `Satır ${itemData._rowIndex}: ${itemData.kod} kodu zaten mevcut`,
            );
            hataliSayisi++;
            hasConflict = true;
          }

          if (itemData.qrKodu && existingQRSet.has(itemData.qrKodu)) {
            hatalar.push(
              `Satır ${itemData._rowIndex}: ${itemData.qrKodu} QR kodu zaten mevcut`,
            );
            hataliSayisi++;
            hasConflict = true;
          }

          if (itemData.barkod && existingBarkodSet.has(itemData.barkod)) {
            hatalar.push(
              `Satır ${itemData._rowIndex}: ${itemData.barkod} barkodu zaten mevcut`,
            );
            hataliSayisi++;
            hasConflict = true;
          }

          if (!hasConflict) {
            delete itemData._rowIndex; // Temp field'ı temizle
            finalItems.push(itemData);
          }
        }

        // Üçüncü aşama: Batch insert (tek seferde tüm valid items)
        if (finalItems.length > 0) {
          try {
            const insertResult = await InventoryItem.insertMany(finalItems, {
              ordered: false,
            });
            basariliSayisi = insertResult.length;
          } catch (error) {
            // insertMany hatalarını işle
            console.error('Batch insert error:', error);
            if (error.writeErrors) {
              error.writeErrors.forEach(writeError => {
                hatalar.push(`Insert hatası: ${writeError.errmsg}`);
                hataliSayisi++;
              });
              basariliSayisi = finalItems.length - error.writeErrors.length;
            } else {
              hatalar.push(`Genel insert hatası: ${error.message}`);
              hataliSayisi += finalItems.length;
            }
          }
        }
      }

      res.json({
        message: 'Excel import tamamlandı',
        basariliSayisi,
        hataliSayisi,
        toplamSayisi: excelData.length,
        hatalar: hatalar.slice(0, 20), // İlk 20 hatayı göster
      });
    } catch (error) {
      console.error('Excel import error:', error.message);
      res
        .status(500)
        .json({ message: 'Excel import hatası: ' + error.message });
    }
  },
);

// GET /excel-export - Excel dosyası export et
router.get(
  '/excel-export',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const { kategoriId, durum } = req.query;

      // Filtreleri uygula
      const filter = {};
      if (kategoriId) {
        filter.kategoriId = kategoriId;
      }
      if (durum) {
        filter.durum = durum;
      }

      // Öğeleri al
      const items = await InventoryItem.find(filter)
        .populate('kategoriId', 'ad')
        .populate('olusturanId', 'username')
        .sort({ olusturmaTarihi: -1 });

      if (items.length === 0) {
        return res
          .status(404)
          .json({ message: 'Export edilecek veri bulunamadı' });
      }

      // Excel verisi oluştur
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Envanter');

      // Excel verisi oluştur
      const excelData = [];

      items.forEach(item => {
        const row = {
          Kod: item.kod,
          Ad: item.ad,
          Açıklama: item.aciklama,
          Kategori: item.kategoriId.ad,
          Durum: item.durum,
          Oluşturan: item.olusturanId.username,
          'Oluşturma Tarihi': item.olusturmaTarihi.toLocaleDateString('tr-TR'),
          'QR Kod': item.qrKodu || '',
          Barkod: item.barkod || '',
          Etiketler: item.etiketler.join(', '),
        };

        // Dinamik alanları ekle
        if (item.dinamikAlanlar) {
          Object.keys(item.dinamikAlanlar).forEach(key => {
            row[key] = item.dinamikAlanlar[key];
          });
        }

        excelData.push(row);
      });

      // Excel verisi oluştur
      excelData.forEach(row => {
        worksheet.addRow(row);
      });

      // Excel dosyası oluştur
      const buffer = await ExcelService.generateExcel(workbook, 'Envanter');

      // Dosya adı
      const fileName = `envanter_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.send(buffer);
    } catch (error) {
      console.error('Excel export error:', error.message);
      res
        .status(500)
        .json({ message: 'Excel export hatası: ' + error.message });
    }
  },
);

// GET /excel-template/:categoryId - Kategori için Excel şablonu indir
router.get(
  '/excel-template/:categoryId',
  auth,
  checkModulePermission('Envanter Yönetimi'),
  async (req, res) => {
    try {
      const categoryId = req.params.categoryId;

      // Kategori kontrolü
      const category = await InventoryCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Kategori şablonlarını al
      const templates = await InventoryFieldTemplate.find({
        kategoriId: categoryId,
      }).sort({
        siraNo: 1,
      });

      // Excel başlıkları oluştur
      const headers = [
        'Kod',
        'Ad',
        'Açıklama',
        'Durum',
        'QR Kod',
        'Barkod',
        'Etiketler',
      ];

      // Dinamik alanları ekle
      templates.forEach(template => {
        headers.push(template.ad);
      });

      // Örnek veri satırı oluştur
      const exampleRow = {};
      headers.forEach(header => {
        if (header === 'Kod') {
          exampleRow[header] = 'MAKINA001';
        } else if (header === 'Ad') {
          exampleRow[header] = 'Örnek Makina';
        } else if (header === 'Açıklama') {
          exampleRow[header] = 'Açıklama metni';
        } else if (header === 'Durum') {
          exampleRow[header] = 'Aktif';
        } else if (header === 'QR Kod') {
          exampleRow[header] = 'QR123456';
        } else if (header === 'Barkod') {
          exampleRow[header] = 'BAR123456';
        } else if (header === 'Etiketler') {
          exampleRow[header] = 'etiket1, etiket2';
        } else {
          // Dinamik alan için örnek değer
          const template = templates.find(t => t.ad === header);
          if (template) {
            if (template.tip === 'number') {
              exampleRow[header] = 100;
            } else if (template.tip === 'date') {
              exampleRow[header] = new Date().toISOString().split('T')[0];
            } else if (
              template.tip === 'select' &&
              template.secenekler.length > 0
            ) {
              exampleRow[header] = template.secenekler[0];
            } else {
              exampleRow[header] = `Örnek ${header}`;
            }
          }
        }
      });

      // Excel dosyası oluştur
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(category.ad);

      // Excel verisi oluştur
      const excelData = [headers, [exampleRow]];

      // Excel verisi oluştur
      excelData.forEach(row => {
        worksheet.addRow(row);
      });

      // Excel dosyası oluştur
      const buffer = await ExcelService.generateExcel(workbook, category.ad);

      // Dosya adı
      const fileName = `${category.ad}_sablon.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.send(buffer);
    } catch (error) {
      console.error('Template export error:', error.message);
      res
        .status(500)
        .json({ message: 'Şablon oluşturma hatası: ' + error.message });
    }
  },
);

// POST /bulk-update - Toplu güncelleme
router.post(
  '/bulk-update',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { itemIds, updates } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res
          .status(400)
          .json({ message: 'Güncellenecek öğe ID\'leri gerekli' });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: 'Güncelleme verisi gerekli' });
      }

      const result = await InventoryItem.updateMany(
        { _id: { $in: itemIds } },
        {
          ...updates,
          guncelleyenId: req.user.id,
          guncellenmeTarihi: Date.now(),
        },
      );

      res.json({
        message: 'Toplu güncelleme tamamlandı',
        guncellenenSayisi: result.modifiedCount,
        toplamSayisi: itemIds.length,
      });
    } catch (error) {
      console.error('Bulk update error:', error.message);
      res
        .status(500)
        .json({ message: 'Toplu güncelleme hatası: ' + error.message });
    }
  },
);

// DELETE /bulk-delete - Toplu silme
router.delete(
  '/bulk-delete',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { itemIds } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res
          .status(400)
          .json({ message: 'Silinecek öğe ID\'leri gerekli' });
      }

      const result = await InventoryItem.deleteMany({ _id: { $in: itemIds } });

      res.json({
        message: 'Toplu silme tamamlandı',
        silinenSayisi: result.deletedCount,
        toplamSayisi: itemIds.length,
      });
    } catch (error) {
      console.error('Bulk delete error:', error.message);
      res.status(500).json({ message: 'Toplu silme hatası: ' + error.message });
    }
  },
);

module.exports = router;
