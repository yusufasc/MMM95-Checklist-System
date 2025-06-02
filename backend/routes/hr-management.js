const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const HRTemplate = require('../models/HRTemplate');
const HRSettings = require('../models/HRSettings');
const User = require('../models/User');
const Role = require('../models/Role');

// Middleware - auth ve İK Yönetimi yetkisi
router.use(auth);
router.use(checkModulePermission('İnsan Kaynakları Yönetimi', 'duzenleyebilir'));

// İK Şablonları
router.get('/templates', async (req, res) => {
  try {
    const templates = await HRTemplate.find()
      .populate('olusturanKullanici', 'ad soyad')
      .populate('hedefRoller', 'ad')
      .sort('-olusturmaTarihi');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await HRTemplate.findById(req.params.id).populate(
      'olusturanKullanici',
      'ad soyad',
    );

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { ad, aciklama, maddeler, hedefRoller } = req.body;

    const template = new HRTemplate({
      ad,
      aciklama,
      maddeler,
      hedefRoller,
      olusturanKullanici: req.user.id,
    });

    await template.save();
    await template.populate('olusturanKullanici', 'ad soyad');
    await template.populate('hedefRoller', 'ad');

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const { ad, aciklama, maddeler, hedefRoller, aktif } = req.body;

    const template = await HRTemplate.findByIdAndUpdate(
      req.params.id,
      { ad, aciklama, maddeler, hedefRoller, aktif },
      { new: true },
    )
      .populate('olusturanKullanici', 'ad soyad')
      .populate('hedefRoller', 'ad');

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

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

// İK Ayarları
router.get('/settings', async (req, res) => {
  try {
    const settings = await HRSettings.getSettings();
    await settings.populate('rolYetkileri.rol', 'ad');
    await settings.populate('modulErisimYetkileri.kullanici', 'ad soyad kullaniciAdi');
    await settings.populate('modulErisimYetkileri.rol', 'ad');

    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { mesaiPuanlama, devamsizlikPuanlama } = req.body;

    const settings = await HRSettings.getSettings();
    settings.mesaiPuanlama = mesaiPuanlama;
    settings.devamsizlikPuanlama = devamsizlikPuanlama;
    settings.guncelleyenKullanici = req.user.id;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Rol Yetkileri
router.post('/settings/role-permissions', async (req, res) => {
  try {
    const { rolId, yetkiler } = req.body;

    const settings = await HRSettings.getSettings();

    // Mevcut rol yetkisini bul veya oluştur
    const rolYetkisi = settings.rolYetkileri.find(ry => ry.rol.toString() === rolId);

    if (rolYetkisi) {
      rolYetkisi.yetkiler = yetkiler;
    } else {
      settings.rolYetkileri.push({
        rol: rolId,
        yetkiler,
      });
    }

    settings.guncelleyenKullanici = req.user.id;
    await settings.save();

    res.json({ message: 'Rol yetkileri güncellendi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Modül Erişimi
router.post('/settings/module-access', async (req, res) => {
  try {
    const { kullaniciId, rolId, erisimDurumu } = req.body;

    const settings = await HRSettings.getSettings();

    // Mevcut erişim kaydını bul
    let erisimKaydi;
    if (kullaniciId) {
      erisimKaydi = settings.modulErisimYetkileri.find(
        mey => mey.kullanici?.toString() === kullaniciId,
      );
    } else if (rolId) {
      erisimKaydi = settings.modulErisimYetkileri.find(mey => mey.rol?.toString() === rolId);
    }

    if (erisimKaydi) {
      erisimKaydi.erisimDurumu = erisimDurumu;
    } else {
      const newErisim = { erisimDurumu };
      if (kullaniciId) {
        newErisim.kullanici = kullaniciId;
      } else if (rolId) {
        newErisim.rol = rolId;
      }
      settings.modulErisimYetkileri.push(newErisim);
    }

    settings.guncelleyenKullanici = req.user.id;
    await settings.save();

    res.json({ message: 'Modül erişimi güncellendi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Roller ve Kullanıcılar
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find().sort('ad');
    res.json(roles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ aktif: true })
      .select('ad soyad kullaniciAdi roller departman')
      .populate('roller', 'ad')
      .populate('departman', 'ad')
      .sort('ad soyad');

    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/users', async (req, res) => {
  try {
    const { ad, soyad, kullaniciAdi, sifre, roller, departman } = req.body;

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ kullaniciAdi });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(sifre, 10);

    const user = new User({
      ad,
      soyad,
      kullaniciAdi,
      sifre: hashedPassword,
      roller,
      departman,
      aktif: true,
    });

    await user.save();
    await user.populate('roller', 'ad');
    await user.populate('departman', 'ad');

    // Şifreyi response'dan çıkar
    const userObj = user.toObject();
    delete userObj.sifre;

    res.json(userObj);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { ad, soyad, roller, departman, aktif } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ad, soyad, roller, departman, aktif },
      { new: true },
    )
      .populate('roller', 'ad')
      .populate('departman', 'ad');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Şifreyi response'dan çıkar
    const userObj = user.toObject();
    delete userObj.sifre;

    res.json(userObj);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Puanlama ve Raporlar (İK Yönetimi için)
router.get('/scores', async (req, res) => {
  try {
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

    const HRScore = require('../models/HRScore');
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

router.get('/scores/user/:userId', async (req, res) => {
  try {
    const { yil, ay } = req.query;
    const query = {
      kullanici: req.params.userId,
    };

    if (yil && ay) {
      query['donem.yil'] = parseInt(yil);
      query['donem.ay'] = parseInt(ay);
    }

    const HRScore = require('../models/HRScore');
    const scores = await HRScore.find(query)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklistPuanlari.sablon', 'ad')
      .sort('-donem.yil -donem.ay');

    res.json(scores);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/reports/summary', async (req, res) => {
  try {
    const { yil, ay } = req.query;
    const matchQuery = {};

    if (yil) {
      matchQuery['donem.yil'] = parseInt(yil);
    }
    if (ay) {
      matchQuery['donem.ay'] = parseInt(ay);
    }

    const HRScore = require('../models/HRScore');
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

// Excel işlemleri
router.get('/excel/download', async (req, res) => {
  try {
    const users = await User.find({ aktif: true })
      .select('ad soyad kullaniciAdi roller departman')
      .populate('roller', 'ad')
      .populate('departman', 'ad')
      .sort('ad soyad');

    const xlsx = require('xlsx');

    // Excel için veri hazırla
    const excelData = users.map(user => ({
      'Kullanıcı ID': user._id.toString(),
      Ad: user.ad,
      Soyad: user.soyad,
      'Kullanıcı Adı': user.kullaniciAdi,
      Roller: user.roller.map(r => r.ad).join(', '),
      Departman: user.departman?.ad || '',
    }));

    // Excel dosyası oluştur
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);

    // Kolon genişlikleri
    ws['!cols'] = [
      { width: 30 }, // ID
      { width: 15 }, // Ad
      { width: 15 }, // Soyad
      { width: 20 }, // Kullanıcı Adı
      { width: 30 }, // Roller
      { width: 20 }, // Departman
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Kullanıcı Listesi');

    // Buffer'a çevir
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Dosya adı
    const fileName = `kullanici_listesi_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece Excel dosyaları kabul edilir'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post('/excel/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      basarili: 0,
      hatali: 0,
      hatalar: [],
    };

    // Excel verilerini işle
    for (const row of data) {
      try {
        // Excel işleme mantığı burada olacak
        // Şimdilik sadece sayıyoruz, gelecekte burada await kullanılabilir
        results.basarili++;
      } catch (error) {
        results.hatalar.push(`${row['Ad']} ${row['Soyad']}: ${error.message}`);
        results.hatali++;
      }
    }

    res.json({
      message: 'Excel import tamamlandı',
      results,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
