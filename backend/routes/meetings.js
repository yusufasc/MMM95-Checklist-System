const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, checkModulePermission } = require('../middleware/auth');

// Services
const ExcelService = require('../services/excelService');
const emailService = require('../services/emailService');

// Excel dosyaları için multer ayarları (MMM95 pattern)
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

// Import meeting controller
const {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  finishMeeting,
  createTaskFromMeeting,
  getMyMeetings,
} = require('../controllers/meetingController');

// @route   GET /api/meetings
// @desc    Toplantıları listele (filtreleme ve pagination ile)
// @access  Private (Toplantı Yönetimi modülü erişim yetkisi)
router.get('/', auth, checkModulePermission('Toplantı Yönetimi'), getMeetings);

// @route   GET /api/meetings/my-meetings
// @desc    Kullanıcının kendi toplantılarını getir
// @access  Private (Giriş yapmış kullanıcı)
router.get('/my-meetings', auth, getMyMeetings);

// @route   GET /api/meetings/:id
// @desc    Toplantı detaylarını getir
// @access  Private (Toplantı katılımcısı veya yetkili)
router.get(
  '/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  getMeetingById,
);

// @route   POST /api/meetings
// @desc    Yeni toplantı oluştur
// @access  Private (Toplantı Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  createMeeting,
);

// @route   PUT /api/meetings/:id
// @desc    Toplantı güncelle
// @access  Private (Organizatör veya Admin)
router.put(
  '/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  updateMeeting,
);

// @route   PATCH /api/meetings/:id
// @desc    Toplantı güncelle (partial update)
// @access  Private (Organizatör veya Admin)
router.patch(
  '/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  updateMeeting,
);

// @route   DELETE /api/meetings/:id
// @desc    Toplantı sil (soft delete)
// @access  Private (Organizatör veya Admin)
router.delete(
  '/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  deleteMeeting,
);

// @route   POST /api/meetings/:id/start
// @desc    Toplantı başlat
// @access  Private (Organizatör veya Sunucu)
router.post(
  '/:id/start',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  startMeeting,
);

// @route   POST /api/meetings/:id/finish
// @desc    Toplantı bitir
// @access  Private (Organizatör veya Sunucu)
router.post(
  '/:id/finish',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  finishMeeting,
);

// @route   POST /api/meetings/:id/create-task
// @desc    Toplantıdan görev oluştur
// @access  Private (Organizatör veya Karar Verici)
router.post(
  '/:id/create-task',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  createTaskFromMeeting,
);

// ===== EXCEL IMPORT/EXPORT ENDPOINTS (MMM95 Pattern) =====

// @route   GET /api/meetings/excel-template
// @desc    Toplantı Excel şablonunu indir
// @access  Private (Toplantı Yönetimi modülü erişim yetkisi)
router.get(
  '/excel-template',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  async (req, res) => {
    try {
      console.log('📊 Meeting Excel template requested by user:', req.user?.id);

      const result = await ExcelService.generateMeetingTemplate();

      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.fileName}"`,
      );

      res.send(result.buffer);
    } catch (error) {
      console.error('❌ Meeting Excel template error:', error);
      res.status(500).json({
        message: 'Excel şablonu oluşturulamadı',
        error: error.message,
      });
    }
  },
);

// @route   GET /api/meetings/excel-export
// @desc    Toplantıları Excel'e export et
// @access  Private (Toplantı Yönetimi modülü erişim yetkisi)
router.get(
  '/excel-export',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  async (req, res) => {
    try {
      console.log('📊 Meeting Excel export requested by user:', req.user?.id);

      // Import Meeting model burada (controller'dan ayrı)
      const Meeting = require('../models/Meeting');

      // Tüm toplantıları çek (populate ile)
      const meetings = await Meeting.find({ silindiMi: false })
        .populate('organizator', 'ad soyad email')
        .populate('departman', 'ad')
        .populate('makina', 'kod ad')
        .sort({ tarih: -1 });

      const result = await ExcelService.generateMeetingExport(meetings);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.fileName}"`,
      );

      res.send(result.buffer);
    } catch (error) {
      console.error('❌ Meeting Excel export error:', error);
      res.status(500).json({
        message: 'Excel export oluşturulamadı',
        error: error.message,
      });
    }
  },
);

// @route   POST /api/meetings/excel-import
// @desc    Excel'den toplantı import et
// @access  Private (Toplantı Yönetimi modülü düzenleme yetkisi)
router.post(
  '/excel-import',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  upload.single('excelFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Excel dosyası gerekli' });
      }

      console.log('📊 Meeting Excel import started:', {
        userId: req.user?.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      // Excel dosyasını parse et
      const excelData = await ExcelService.parseMeetingExcel(req.file.buffer);

      if (excelData.length === 0) {
        return res
          .status(400)
          .json({ message: 'Excel dosyasında veri bulunamadı' });
      }

      // Import işlemi için controller'a delegate et
      const Meeting = require('../models/Meeting');
      const User = require('../models/User');
      const Department = require('../models/Department');
      const InventoryItem = require('../models/InventoryItem');

      let basariliSayisi = 0;
      let hataliSayisi = 0;
      const hatalar = [];

      // Her Excel satırını işle
      for (let i = 0; i < excelData.length; i++) {
        try {
          const rowData = excelData[i];

          console.log(`📋 Processing Excel row ${i + 1}:`, rowData);

          // Gerekli field'lar kontrol et
          if (!rowData['Başlık'] || !rowData['Tarih (YYYY-MM-DD)']) {
            hatalar.push(`Satır ${i + 2}: Başlık ve Tarih zorunlu alanlar`);
            hataliSayisi++;
            continue;
          }

          // Organizatör email ile kullanıcıyı bul
          let organizator = null;
          if (rowData['Organizatör Email']) {
            organizator = await User.findOne({
              email: rowData['Organizatör Email'],
            });
            if (!organizator) {
              hatalar.push(
                `Satır ${i + 2}: Organizatör email bulunamadı: ${rowData['Organizatör Email']}`,
              );
              hataliSayisi++;
              continue;
            }
          } else {
            // Default olarak import eden kullanıcıyı organizatör yap
            organizator = await User.findById(req.user.id);
          }

          // Departman adı ile departmanı bul
          let departman = null;
          if (rowData['Departman Adı']) {
            departman = await Department.findOne({
              ad: rowData['Departman Adı'],
            });
          }

          // Makina kodu ile makinayı bul
          let makina = null;
          if (rowData['Makina Kodu']) {
            makina = await InventoryItem.findOne({
              kod: rowData['Makina Kodu'],
            });
          }

          // Katılımcıları parse et
          const katilimcilar = [];
          if (rowData['Katılımcı Email\'leri (virgülle ayırın)']) {
            const emails =
              rowData['Katılımcı Email\'leri (virgülle ayırın)'].split(',');
            for (const email of emails) {
              const trimmedEmail = email.trim();
              if (trimmedEmail) {
                const user = await User.findOne({ email: trimmedEmail });
                if (user) {
                  katilimcilar.push({
                    kullanici: user._id,
                    rol: 'katılımcı',
                    katilimDurumu: 'davetli',
                  });
                }
              }
            }
          }

          // Gündem maddelerini parse et
          const gundem = [];
          if (rowData['Gündem Maddeleri (| ile ayırın)']) {
            const maddeler =
              rowData['Gündem Maddeleri (| ile ayırın)'].split('|');
            maddeler.forEach((madde, index) => {
              const trimmedMadde = madde.trim();
              if (trimmedMadde) {
                gundem.push({
                  baslik: trimmedMadde,
                  siraNo: index + 1,
                  sure: 10, // Default 10 dakika
                  durum: 'bekliyor',
                });
              }
            });
          }

          // Tarih parse et
          const tarih = new Date(rowData['Tarih (YYYY-MM-DD)']);
          if (isNaN(tarih.getTime())) {
            hatalar.push(
              `Satır ${i + 2}: Geçersiz tarih formatı: ${rowData['Tarih (YYYY-MM-DD)']}`,
            );
            hataliSayisi++;
            continue;
          }

          // Meeting oluştur
          const meetingData = {
            baslik: rowData['Başlık'],
            aciklama: rowData['Açıklama'] || '',
            kategori: [
              'rutin',
              'proje',
              'acil',
              'kalite',
              'güvenlik',
              'performans',
              'vardiya',
              'kalip-degisim',
            ].includes(rowData['Kategori'])
              ? rowData['Kategori']
              : 'rutin',
            tarih: tarih,
            baslangicSaati: rowData['Başlangıç Saati (HH:MM)'] || '09:00',
            bitisSaati: rowData['Bitiş Saati (HH:MM)'] || '',
            lokasyon: rowData['Lokasyon'] || '',
            durum: [
              'planlanıyor',
              'bekliyor',
              'devam-ediyor',
              'tamamlandı',
              'iptal',
            ].includes(rowData['Durum'])
              ? rowData['Durum']
              : 'planlanıyor',
            oncelik: ['düşük', 'normal', 'yüksek', 'kritik'].includes(
              rowData['Öncelik'],
            )
              ? rowData['Öncelik']
              : 'normal',
            organizator: organizator._id,
            departman: departman?._id,
            makina: makina?._id,
            katilimcilar: katilimcilar,
            gundem: gundem,
            tekrarlamaAyarlari: {
              tip: ['yok', 'günlük', 'haftalık', 'aylık', 'özel'].includes(
                rowData['Tekrarlama Tipi'],
              )
                ? rowData['Tekrarlama Tipi']
                : 'yok',
              aralik: parseInt(rowData['Tekrarlama Aralığı']) || 1,
            },
          };

          // Bitiş tarihi varsa ekle
          if (rowData['Bitiş Tarihi (YYYY-MM-DD)']) {
            const bitisTarihi = new Date(rowData['Bitiş Tarihi (YYYY-MM-DD)']);
            if (!isNaN(bitisTarihi.getTime())) {
              meetingData.tekrarlamaAyarlari.bitisTarihi = bitisTarihi;
            }
          }

          const meeting = new Meeting(meetingData);
          await meeting.save();

          basariliSayisi++;
          console.log(`✅ Meeting created from Excel row ${i + 1}`);
        } catch (error) {
          console.error(`❌ Error processing Excel row ${i + 1}:`, error);
          hatalar.push(`Satır ${i + 2}: ${error.message}`);
          hataliSayisi++;
        }
      }

      console.log('📊 Meeting Excel import completed:', {
        totalRows: excelData.length,
        successful: basariliSayisi,
        failed: hataliSayisi,
        errors: hatalar.length,
      });

      res.json({
        message: 'Excel import tamamlandı',
        basariliSayisi,
        hataliSayisi,
        toplamSatir: excelData.length,
        hatalar: hatalar.slice(0, 10), // İlk 10 hatayı göster
      });
    } catch (error) {
      console.error('❌ Meeting Excel import error:', error);
      res.status(500).json({
        message: 'Excel import hatası',
        error: error.message,
      });
    }
  },
);

module.exports = router;
