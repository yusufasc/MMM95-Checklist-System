const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const ExcelService = require('../services/excelService');
const HRTemplate = require('../models/HRTemplate');
const HRSettings = require('../models/HRSettings');
const HRScore = require('../models/HRScore');
const User = require('../models/User');
const Role = require('../models/Role');

// Multer configuration for Excel upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları kabul edilir'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware - auth
router.use(auth);

// İK modülüne erişim yetkisi kontrolü
const checkHRAccess = async (req, res, next) => {
  try {
    const settings = await HRSettings.getSettings();
    const kullaniciId = req.user.id;
    const kullaniciRolleri = req.user.roller;

    console.log('🔍 İK erişim kontrolü:', {
      kullaniciId,
      kullaniciRolleri: kullaniciRolleri.map(r => r.ad),
      isAdmin: kullaniciRolleri.some(rol => rol.ad === 'Admin'),
    });

    // Admin her zaman erişebilir
    if (kullaniciRolleri.some(rol => rol.ad === 'Admin')) {
      req.hrYetkileri = {
        kullaniciAcabilir: true,
        kullaniciSilebilir: true,
        puanlamaYapabilir: true,
        excelYukleyebilir: true,
        raporGorebilir: true,
        acabildigiRoller: await Role.find().select('_id'),
        silebildigiRoller: await Role.find().select('_id'),
      };
      return next();
    }

    // Kullanıcı bazlı erişim kontrolü
    const kullaniciErisim = settings.modulErisimYetkileri.find(
      mey =>
        mey.kullanici?.toString() === kullaniciId &&
        mey.erisimDurumu === 'aktif',
    );

    if (kullaniciErisim) {
      // Kullanıcının rolüne göre yetkileri al
      const userRole = kullaniciRolleri[0]; // İlk rolü al
      const rolYetkisi = settings.rolYetkileri.find(
        ry => ry.rol.toString() === userRole._id.toString(),
      );

      if (rolYetkisi) {
        req.hrYetkileri = rolYetkisi.yetkiler;
        return next();
      }
    }

    // Rol bazlı erişim kontrolü
    for (const rol of kullaniciRolleri) {
      const rolErisim = settings.modulErisimYetkileri.find(
        mey =>
          mey.rol?.toString() === rol._id.toString() &&
          mey.erisimDurumu === 'aktif',
      );

      if (rolErisim) {
        const rolYetkisi = settings.rolYetkileri.find(
          ry => ry.rol.toString() === rol._id.toString(),
        );

        if (rolYetkisi) {
          req.hrYetkileri = rolYetkisi.yetkiler;
          return next();
        }
      }
    }

    return res
      .status(403)
      .json({ message: 'İnsan Kaynakları modülüne erişim yetkiniz yok' });
  } catch (error) {
    console.error('HR erişim kontrolü hatası:', error);
    res.status(500).send('Sunucu hatası');
  }
};

// Tüm route'larda HR erişim kontrolü
router.use(checkHRAccess);

// Kullanıcının İK yetkileri
router.get('/permissions', (req, res) => {
  try {
    res.json(req.hrYetkileri);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Aktif İK şablonlarını getir
router.get('/templates/active', async (req, res) => {
  try {
    const templates = await HRTemplate.find({ aktif: true })
      .select('ad maddeler hedefRoller')
      .populate('hedefRoller', 'ad')
      .sort('ad');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Tüm İK şablonlarını getir
router.get('/templates', async (req, res) => {
  try {
    const templates = await HRTemplate.find()
      .populate('hedefRoller', 'ad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort('-olusturmaTarihi');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Tek bir İK şablonunu getir
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await HRTemplate.findById(req.params.id)
      .populate('hedefRoller', 'ad')
      .populate('olusturanKullanici', 'ad soyad');

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK şablonu oluştur
router.post('/templates', async (req, res) => {
  try {
    const { ad, maddeler, hedefRoller, aktif } = req.body;

    const template = new HRTemplate({
      ad,
      maddeler,
      hedefRoller,
      aktif: aktif !== undefined ? aktif : true,
      olusturanKullanici: req.user.id,
    });

    await template.save();
    await template.populate('hedefRoller', 'ad');
    await template.populate('olusturanKullanici', 'ad soyad');

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK şablonu güncelle
router.put('/templates/:id', async (req, res) => {
  try {
    const { ad, maddeler, hedefRoller, aktif } = req.body;

    const template = await HRTemplate.findByIdAndUpdate(
      req.params.id,
      {
        ad,
        maddeler,
        hedefRoller,
        aktif,
        guncellemeTarihi: Date.now(),
      },
      { new: true },
    )
      .populate('hedefRoller', 'ad')
      .populate('olusturanKullanici', 'ad soyad');

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK şablonu sil
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await HRTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json({ message: 'Şablon başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK ayarlarını getir
router.get('/settings', async (req, res) => {
  try {
    const settings = await HRSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK ayarlarını güncelle
router.put('/settings', async (req, res) => {
  try {
    const {
      mesaiPuanlama,
      devamsizlikPuanlama,
      digerPuanlama,
      modulErisimYetkileri,
      rolYetkileri,
    } = req.body;

    const settings = await HRSettings.getSettings();

    if (mesaiPuanlama) {
      settings.mesaiPuanlama = mesaiPuanlama;
    }
    if (devamsizlikPuanlama) {
      settings.devamsizlikPuanlama = devamsizlikPuanlama;
    }
    if (digerPuanlama) {
      settings.digerPuanlama = digerPuanlama;
    }
    if (modulErisimYetkileri) {
      settings.modulErisimYetkileri = modulErisimYetkileri;
    }
    if (rolYetkileri) {
      settings.rolYetkileri = rolYetkileri;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Rol yetkilerini güncelle
router.post('/settings/role-permissions', async (req, res) => {
  try {
    const { rolId, yetkiler } = req.body;

    const settings = await HRSettings.getSettings();

    // Mevcut rol yetkisini bul veya oluştur
    const existingIndex = settings.rolYetkileri.findIndex(
      ry => ry.rol.toString() === rolId,
    );

    if (existingIndex !== -1) {
      settings.rolYetkileri[existingIndex].yetkiler = yetkiler;
    } else {
      settings.rolYetkileri.push({ rol: rolId, yetkiler });
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Modül erişim yetkilerini güncelle
router.post('/settings/module-access', async (req, res) => {
  try {
    const { itemId, itemType, action } = req.body;

    const settings = await HRSettings.getSettings();

    // Mevcut erişimi bul
    const existingIndex = settings.modulErisimYetkileri.findIndex(mey => {
      if (itemType === 'user') {
        return mey.kullanici?.toString() === itemId;
      } else {
        return mey.rol?.toString() === itemId;
      }
    });

    if (action === 'toggle') {
      if (existingIndex !== -1) {
        // Var olan erişimi toggle et
        const currentStatus =
          settings.modulErisimYetkileri[existingIndex].erisimDurumu;
        settings.modulErisimYetkileri[existingIndex].erisimDurumu =
          currentStatus === 'aktif' ? 'pasif' : 'aktif';
      } else {
        // Yeni erişim ekle
        const newAccess = {
          erisimDurumu: 'aktif',
          verilisTarihi: Date.now(),
        };

        if (itemType === 'user') {
          newAccess.kullanici = itemId;
        } else {
          newAccess.rol = itemId;
        }

        settings.modulErisimYetkileri.push(newAccess);
      }
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı listesi (yetki kontrolü ile)
router.get('/users', async (req, res) => {
  try {
    const { sablonId } = req.query;
    const query = { durum: 'aktif' }; // Sadece aktif kullanıcıları getir

    // Şablon ID'si varsa, sadece o şablonun hedef rollerindeki kullanıcıları getir
    if (sablonId) {
      const template = await HRTemplate.findById(sablonId)
        .select('hedefRoller')
        .populate('hedefRoller', 'ad');
      console.log('🔍 Şablon filtreleme:', {
        sablonId,
        template: template
          ? {
            _id: template._id,
            hedefRoller: template.hedefRoller,
          }
          : null,
      });

      if (template && template.hedefRoller && template.hedefRoller.length > 0) {
        const hedefRolIds = template.hedefRoller.map(rol => rol._id);
        query.roller = { $in: hedefRolIds };
        console.log('📋 Hedef rol ID\'leri:', hedefRolIds);
        console.log('🔍 Final query:', query);
      } else {
        // Şablonun hedef rolleri yoksa boş liste dön
        console.log('⚠️ Şablonun hedef rolleri yok, boş liste döndürülüyor');
        return res.json([]);
      }
    } else {
      // Sadece izin verilen rollerdeki kullanıcıları göster
      if (
        !req.hrYetkileri.kullaniciAcabilir &&
        !req.hrYetkileri.kullaniciSilebilir
      ) {
        // Hiçbir kullanıcı işlemi yapamıyorsa boş liste dön
        return res.json([]);
      }

      // Açabildiği veya silebildiği rollerdeki kullanıcıları getir
      const allowedRoles = new Set();
      if (req.hrYetkileri.acabildigiRoller) {
        req.hrYetkileri.acabildigiRoller.forEach(rol => {
          // ObjectId ise _id'sini al, değilse kendisini kullan
          const rolId = rol._id ? rol._id.toString() : rol.toString();
          allowedRoles.add(rolId);
        });
      }
      if (req.hrYetkileri.silebildigiRoller) {
        req.hrYetkileri.silebildigiRoller.forEach(rol => {
          // ObjectId ise _id'sini al, değilse kendisini kullan
          const rolId = rol._id ? rol._id.toString() : rol.toString();
          allowedRoles.add(rolId);
        });
      }

      if (allowedRoles.size > 0) {
        query.roller = { $in: Array.from(allowedRoles) };
      }
    }

    const users = await User.find(query)
      .select('ad soyad kullaniciAdi roller departmanlar durum')
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .sort('ad soyad');

    console.log('👥 Backend: Bulunan kullanıcı sayısı:', users.length);
    console.log(
      '📋 Backend: Kullanıcılar:',
      users.map(
        u => `${u.ad} ${u.soyad} (${u.roller.map(r => r.ad).join(', ')})`,
      ),
    );

    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı oluştur (yetki kontrolü ile)
router.post('/users', async (req, res) => {
  try {
    if (!req.hrYetkileri.kullaniciAcabilir) {
      return res
        .status(403)
        .json({ message: 'Kullanıcı oluşturma yetkiniz yok' });
    }

    const { ad, soyad, kullaniciAdi, sifre, roller, departmanlar } = req.body;

    // Rol kontrolü - sadece izin verilen rollerde kullanıcı açabilir
    const allowedRoles = req.hrYetkileri.acabildigiRoller.map(r => {
      return r._id ? r._id.toString() : r.toString();
    });
    const invalidRoles = roller.filter(rolId => !allowedRoles.includes(rolId));

    if (invalidRoles.length > 0) {
      return res
        .status(403)
        .json({ message: 'Bu rollerde kullanıcı açma yetkiniz yok' });
    }

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ kullaniciAdi });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Yeni kullanıcı oluştur
    const user = new User({
      ad,
      soyad,
      kullaniciAdi,
      sifreHash: hashedPassword,
      roller,
      departmanlar,
      durum: 'aktif',
    });

    await user.save();
    await user.populate('roller', 'ad');
    await user.populate('departmanlar', 'ad');

    // Şifreyi response'dan çıkar
    const userObj = user.toObject();
    delete userObj.sifre;

    res.json(userObj);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı sil (yetki kontrolü ile)
router.delete('/users/:id', async (req, res) => {
  try {
    if (!req.hrYetkileri.kullaniciSilebilir) {
      return res.status(403).json({ message: 'Kullanıcı silme yetkiniz yok' });
    }

    const user = await User.findById(req.params.id).populate('roller');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Rol kontrolü - sadece izin verilen rollerdeki kullanıcıları silebilir
    const allowedRoles = req.hrYetkileri.silebildigiRoller.map(r => {
      return r._id ? r._id.toString() : r.toString();
    });
    const userRoles = user.roller.map(r => r._id.toString());

    const hasPermission = userRoles.some(rolId => allowedRoles.includes(rolId));

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: 'Bu roldeki kullanıcıyı silme yetkiniz yok' });
    }

    await user.deleteOne();
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Puanlama yap
router.post('/scores', async (req, res) => {
  try {
    if (!req.hrYetkileri.puanlamaYapabilir) {
      return res.status(403).json({ message: 'Puanlama yapma yetkiniz yok' });
    }

    const {
      kullaniciId,
      sablonId,
      secilenMaddeler,
      mesaiKayitlari,
      devamsizlikKayitlari,
      donem,
    } = req.body;

    console.log('📊 Puanlama isteği alındı:', {
      kullaniciId,
      sablonId,
      mesaiKayitlari: mesaiKayitlari?.length || 0,
      devamsizlikKayitlari: devamsizlikKayitlari?.length || 0,
      donem,
    });

    // Şablonu getir (opsiyonel - manuel giriş için gerekli değil)
    let template = null;
    if (sablonId) {
      template = await HRTemplate.findById(sablonId);
      if (!template || !template.aktif) {
        return res.status(404).json({ message: 'Geçerli şablon bulunamadı' });
      }
    }

    // Ayarları getir
    const settings = await HRSettings.getSettings();

    // Mevcut dönem kaydını bul veya oluştur
    let score = await HRScore.findOne({
      kullanici: kullaniciId,
      'donem.yil': donem.yil,
      'donem.ay': donem.ay,
    });

    if (!score) {
      score = new HRScore({
        kullanici: kullaniciId,
        donem,
      });
    }

    // Checklist puanlarını ekle
    if (secilenMaddeler && secilenMaddeler.length > 0) {
      const checklistPuanlari = secilenMaddeler.map(maddeId => {
        const madde = template.maddeler.find(m => m._id.toString() === maddeId);
        return {
          sablon: sablonId,
          madde: {
            baslik: madde.baslik,
            puan: madde.puan,
          },
          periyot: madde.periyot,
          tarih: new Date(),
        };
      });

      score.checklistPuanlari.push(...checklistPuanlari);
    }

    // Mesai kayıtlarını ekle
    if (mesaiKayitlari && mesaiKayitlari.length > 0) {
      const mesaiPuanlari = mesaiKayitlari.map(kayit => ({
        ...kayit,
        puan: kayit.saat * settings.mesaiPuanlama.saatBasinaPuan,
        olusturanKullanici: req.user.id,
      }));

      score.mesaiKayitlari.push(...mesaiPuanlari);
    }

    // Devamsızlık kayıtlarını ekle
    if (devamsizlikKayitlari && devamsizlikKayitlari.length > 0) {
      const devamsizlikPuanlari = devamsizlikKayitlari.map(kayit => {
        let puan = 0;
        if (kayit.tur === 'tam_gun') {
          puan = kayit.miktar * settings.devamsizlikPuanlama.gunBasinaPuan;
        } else {
          puan = kayit.miktar * settings.devamsizlikPuanlama.saatBasinaPuan;
        }

        return {
          ...kayit,
          puan,
          olusturanKullanici: req.user.id,
        };
      });

      score.devamsizlikKayitlari.push(...devamsizlikPuanlari);
    }

    await score.save();
    await score.populate('kullanici', 'ad soyad');

    res.json(score);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Puanlama geçmişi
router.get('/scores', async (req, res) => {
  try {
    if (!req.hrYetkileri.raporGorebilir && !req.hrYetkileri.puanlamaYapabilir) {
      return res.status(403).json({ message: 'Puanları görme yetkiniz yok' });
    }

    const { kullaniciId, yil, ay } = req.query;
    const query = {};

    if (kullaniciId) {
      query.kullanici = kullaniciId;
    }
    if (yil) {
      query['donem.yil'] = parseInt(yil);
    }
    if (ay) {
      query['donem.ay'] = parseInt(ay);
    }

    const scores = await HRScore.find(query)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklistPuanlari.sablon', 'ad')
      .sort('-donem.yil -donem.ay')
      .limit(100);

    res.json(scores);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı puanlama detayı
router.get('/scores/user/:userId', async (req, res) => {
  try {
    if (!req.hrYetkileri.raporGorebilir) {
      return res.status(403).json({ message: 'Rapor görme yetkiniz yok' });
    }

    const { yil, ay } = req.query;
    const query = {
      kullanici: req.params.userId,
    };

    if (yil && ay) {
      query['donem.yil'] = parseInt(yil);
      query['donem.ay'] = parseInt(ay);
    }

    const scores = await HRScore.find(query)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklistPuanlari.sablon', 'ad')
      .sort('-donem.yil -donem.ay');

    // Diğer modüllerden gelen puanları da ekle
    // TODO: QualityControl, Task, WorkTask modellerinden puanları çek

    res.json(scores);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Excel indir - Personel listesi
router.get('/excel/download', async (req, res) => {
  try {
    if (!req.hrYetkileri.excelYukleyebilir) {
      return res.status(403).json({ message: 'Excel indirme yetkiniz yok' });
    }

    // Tüm kullanıcıları getir
    const users = await User.find({ durum: 'aktif' })
      .select('ad soyad kullaniciAdi roller departmanlar')
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .sort('ad soyad');

    // ExcelService ile personel Excel dosyası oluştur
    const excelResult = await ExcelService.generatePersonelExcel(users);

    res.setHeader('Content-Type', excelResult.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${excelResult.fileName}"`,
    );
    res.send(excelResult.buffer);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Excel yükle - Mesai ve devamsızlık
router.post('/excel/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.hrYetkileri.excelYukleyebilir) {
      return res.status(403).json({ message: 'Excel yükleme yetkiniz yok' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }

    const { yil, ay } = req.body;

    if (!yil || !ay) {
      return res.status(400).json({ message: 'Yıl ve ay bilgisi gereklidir' });
    }

    // Excel dosyasını oku
    const data = await ExcelService.parseExcelFile(req.file.buffer);

    // Ayarları getir
    const settings = await HRSettings.getSettings();

    const results = {
      basarili: 0,
      hatali: 0,
      hatalar: [],
    };

    // Batch processing için verileri hazırla
    const processPromises = data.map(async row => {
      try {
        const kullaniciId = row['Kullanıcı ID'];
        const fazlaMesaiSaat = parseFloat(row['Fazla Mesai (Saat)'] || 0);
        const devamsizlikGun = parseFloat(row['Devamsızlık (Gün)'] || 0);
        const devamsizlikSaat = parseFloat(row['Devamsızlık (Saat)'] || 0);
        const aciklama = row['Açıklama'] || '';

        if (!kullaniciId) {
          return {
            success: false,
            error: `${row['Ad']} ${row['Soyad']}: Kullanıcı ID bulunamadı`,
          };
        }

        // Mevcut dönem kaydını bul veya oluştur
        let score = await HRScore.findOne({
          kullanici: kullaniciId,
          'donem.yil': parseInt(yil),
          'donem.ay': parseInt(ay),
        });

        if (!score) {
          score = new HRScore({
            kullanici: kullaniciId,
            donem: { yil: parseInt(yil), ay: parseInt(ay) },
          });
        }

        // Mesai kaydı ekle
        if (fazlaMesaiSaat > 0) {
          score.mesaiKayitlari.push({
            tarih: new Date(),
            saat: fazlaMesaiSaat,
            puan: fazlaMesaiSaat * settings.mesaiPuanlama.saatBasinaPuan,
            aciklama: `Excel import - ${aciklama}`,
            olusturanKullanici: req.user.id,
          });
        }

        // Devamsızlık kayıtları ekle
        if (devamsizlikGun > 0) {
          score.devamsizlikKayitlari.push({
            tarih: new Date(),
            tur: 'tam_gun',
            miktar: devamsizlikGun,
            puan: devamsizlikGun * settings.devamsizlikPuanlama.gunBasinaPuan,
            aciklama: `Excel import - ${aciklama}`,
            olusturanKullanici: req.user.id,
          });
        }

        if (devamsizlikSaat > 0) {
          score.devamsizlikKayitlari.push({
            tarih: new Date(),
            tur: 'saat',
            miktar: devamsizlikSaat,
            puan: devamsizlikSaat * settings.devamsizlikPuanlama.saatBasinaPuan,
            aciklama: `Excel import - ${aciklama}`,
            olusturanKullanici: req.user.id,
          });
        }

        await score.save();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: `${row['Ad']} ${row['Soyad']}: ${error.message}`,
        };
      }
    });

    // Batch processing ile tüm işlemleri paralel çalıştır
    const processResults = await Promise.allSettled(processPromises);

    // Sonuçları topla
    processResults.forEach(result => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          results.basarili++;
        } else {
          results.hatalar.push(result.value.error);
          results.hatali++;
        }
      } else {
        results.hatalar.push(`İşlem hatası: ${result.reason}`);
        results.hatali++;
      }
    });

    res.json({
      message: 'Excel import tamamlandı',
      results,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Özet rapor
router.get('/reports/summary', async (req, res) => {
  try {
    if (!req.hrYetkileri.raporGorebilir) {
      return res.status(403).json({ message: 'Rapor görme yetkiniz yok' });
    }

    const { yil, ay } = req.query;
    const matchQuery = {};

    if (yil) {
      matchQuery['donem.yil'] = parseInt(yil);
    }
    if (ay) {
      matchQuery['donem.ay'] = parseInt(ay);
    }

    // Aggregation pipeline
    const summary = await HRScore.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$kullanici',
          toplamChecklistPuani: { $sum: '$toplamPuanlar.checklistPuani' },
          toplamMesaiPuani: { $sum: '$toplamPuanlar.mesaiPuani' },
          toplamDevamsizlikPuani: { $sum: '$toplamPuanlar.devamsizlikPuani' },
          toplamDigerModulPuani: { $sum: '$toplamPuanlar.digerModulPuani' },
          genelToplam: { $sum: '$toplamPuanlar.genelToplam' },
          kayitSayisi: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'kullanici',
        },
      },
      { $unwind: '$kullanici' },
      {
        $project: {
          _id: 0,
          kullanici: {
            _id: '$kullanici._id',
            ad: '$kullanici.ad',
            soyad: '$kullanici.soyad',
            kullaniciAdi: '$kullanici.kullaniciAdi',
          },
          toplamChecklistPuani: 1,
          toplamMesaiPuani: 1,
          toplamDevamsizlikPuani: 1,
          toplamDigerModulPuani: 1,
          genelToplam: 1,
          kayitSayisi: 1,
        },
      },
      { $sort: { genelToplam: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Yeni değerlendirme sistemi
router.post('/evaluations', async (req, res) => {
  try {
    if (!req.hrYetkileri.puanlamaYapabilir) {
      return res.status(403).json({ message: 'Puanlama yapma yetkiniz yok' });
    }

    const { kullaniciId, sablonId, maddePuanlari, genelNot, donem } = req.body;

    // Şablonu getir
    const template = await HRTemplate.findById(sablonId);
    if (!template || !template.aktif) {
      return res.status(404).json({ message: 'Geçerli şablon bulunamadı' });
    }

    // Mevcut dönem kaydını bul veya oluştur
    let score = await HRScore.findOne({
      kullanici: kullaniciId,
      'donem.yil': donem.yil,
      'donem.ay': donem.ay,
    });

    if (!score) {
      score = new HRScore({
        kullanici: kullaniciId,
        donem,
      });
    }

    // Checklist puanlarını ekle
    const checklistPuanlari = Object.entries(maddePuanlari).map(
      ([maddeId, puan]) => {
        const madde = template.maddeler.find(m => m._id.toString() === maddeId);
        return {
          sablon: sablonId,
          madde: {
            baslik: madde.baslik,
            puan: parseInt(puan) || 0,
            maxPuan: madde.puan,
          },
          periyot: madde.periyot,
          tarih: new Date(),
          degerlendiren: req.user.id,
          genelNot,
        };
      },
    );

    score.checklistPuanlari.push(...checklistPuanlari);

    await score.save();
    await score.populate('kullanici', 'ad soyad');

    res.json(score);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Puanlanan kullanıcıları getir
router.get('/evaluated-users', async (req, res) => {
  try {
    if (!req.hrYetkileri.puanlamaYapabilir && !req.hrYetkileri.raporGorebilir) {
      return res
        .status(403)
        .json({ message: 'Bu bilgileri görme yetkiniz yok' });
    }

    const { sablonId, yil, ay } = req.query;

    if (!sablonId || !yil || !ay) {
      return res.json([]);
    }

    // Bu dönemde bu şablonla puanlanan kullanıcıları bul
    const scores = await HRScore.find({
      'donem.yil': parseInt(yil),
      'donem.ay': parseInt(ay),
      'checklistPuanlari.sablon': sablonId,
    }).populate('kullanici', 'ad soyad kullaniciAdi');

    // Benzersiz kullanıcıları çıkar
    const evaluatedUsers = [];
    const userIds = new Set();

    scores.forEach(score => {
      if (score.kullanici && !userIds.has(score.kullanici._id.toString())) {
        userIds.add(score.kullanici._id.toString());
        evaluatedUsers.push(score.kullanici);
      }
    });

    res.json(evaluatedUsers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
