const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const checkModulePermission = require('../middleware/checkModulePermission');
const HRTemplate = require('../models/HRTemplate');
const HRSettings = require('../models/HRSettings');
const Role = require('../models/Role');
const User = require('../models/User');

// Tüm route'lar admin yetkisi gerektirir
router.use(auth);
router.use(checkModulePermission('İnsan Kaynakları Yönetimi', 'duzenleyebilir'));

// İK Şablonları - Listele
router.get('/templates', async (req, res) => {
  try {
    const templates = await HRTemplate.find()
      .populate('olusturanKullanici', 'ad soyad')
      .sort('-olusturmaTarihi');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK Şablonu - Detay
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

// İK Şablonu - Oluştur
router.post('/templates', async (req, res) => {
  try {
    const { ad, aciklama, maddeler } = req.body;

    if (!ad || !maddeler || maddeler.length === 0) {
      return res.status(400).json({ message: 'Şablon adı ve en az bir madde gereklidir' });
    }

    // Maddeleri sıra numarası ile düzenle
    const siralanmisMaddeler = maddeler.map((madde, index) => ({
      ...madde,
      siraNo: index + 1,
    }));

    const template = new HRTemplate({
      ad,
      aciklama,
      maddeler: siralanmisMaddeler,
      olusturanKullanici: req.user.id,
    });

    await template.save();
    await template.populate('olusturanKullanici', 'ad soyad');

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK Şablonu - Güncelle
router.put('/templates/:id', async (req, res) => {
  try {
    const { ad, aciklama, maddeler, aktif } = req.body;

    const template = await HRTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    if (ad) {
      template.ad = ad;
    }
    if (aciklama !== undefined) {
      template.aciklama = aciklama;
    }
    if (aktif !== undefined) {
      template.aktif = aktif;
    }

    if (maddeler && maddeler.length > 0) {
      template.maddeler = maddeler.map((madde, index) => ({
        ...madde,
        siraNo: index + 1,
      }));
    }

    await template.save();
    await template.populate('olusturanKullanici', 'ad soyad');

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK Şablonu - Sil
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await HRTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    await template.deleteOne();
    res.json({ message: 'Şablon başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK Ayarları - Getir
router.get('/settings', async (req, res) => {
  try {
    const settings = await HRSettings.getSettings();
    await settings.populate('rolYetkileri.rol');
    await settings.populate('rolYetkileri.yetkiler.acabildigiRoller');
    await settings.populate('rolYetkileri.yetkiler.silebildigiRoller');
    await settings.populate('modulErisimYetkileri.kullanici', 'ad soyad kullaniciAdi');
    await settings.populate('modulErisimYetkileri.rol');

    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK Ayarları - Güncelle
router.put('/settings', async (req, res) => {
  try {
    const settings = await HRSettings.getSettings();

    // Mesai ayarları
    if (req.body.mesaiPuanlama) {
      Object.assign(settings.mesaiPuanlama, req.body.mesaiPuanlama);
    }

    // Devamsızlık ayarları
    if (req.body.devamsizlikPuanlama) {
      Object.assign(settings.devamsizlikPuanlama, req.body.devamsizlikPuanlama);
    }

    // Rol yetkileri
    if (req.body.rolYetkileri) {
      settings.rolYetkileri = req.body.rolYetkileri;
    }

    // Modül erişim yetkileri
    if (req.body.modulErisimYetkileri) {
      settings.modulErisimYetkileri = req.body.modulErisimYetkileri;
    }

    settings.guncelleyenKullanici = req.user.id;
    await settings.save();

    // Populate et
    await settings.populate('rolYetkileri.rol');
    await settings.populate('rolYetkileri.yetkiler.acabildigiRoller');
    await settings.populate('rolYetkileri.yetkiler.silebildigiRoller');
    await settings.populate('modulErisimYetkileri.kullanici', 'ad soyad kullaniciAdi');
    await settings.populate('modulErisimYetkileri.rol');

    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Rol Yetki Tanımlama
router.post('/settings/role-permissions', async (req, res) => {
  try {
    const { rolId, yetkiler } = req.body;

    const settings = await HRSettings.getSettings();

    // Mevcut rol yetkisini bul veya ekle
    const existingIndex = settings.rolYetkileri.findIndex(ry => ry.rol.toString() === rolId);

    if (existingIndex >= 0) {
      settings.rolYetkileri[existingIndex].yetkiler = yetkiler;
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

// Modül Erişim Yetkisi Ver/Kaldır
router.post('/settings/module-access', async (req, res) => {
  try {
    const { kullaniciId, rolId, erisimDurumu } = req.body;

    if (!kullaniciId && !rolId) {
      return res.status(400).json({ message: 'Kullanıcı veya rol ID gereklidir' });
    }

    const settings = await HRSettings.getSettings();

    // Mevcut erişim yetkisini bul
    const existingIndex = settings.modulErisimYetkileri.findIndex(mey => {
      if (kullaniciId) {
        return mey.kullanici?.toString() === kullaniciId;
      } else {
        return mey.rol?.toString() === rolId;
      }
    });

    if (existingIndex >= 0) {
      settings.modulErisimYetkileri[existingIndex].erisimDurumu = erisimDurumu;
    } else {
      const newAccess = { erisimDurumu };
      if (kullaniciId) {
        newAccess.kullanici = kullaniciId;
      }
      if (rolId) {
        newAccess.rol = rolId;
      }

      settings.modulErisimYetkileri.push(newAccess);
    }

    settings.guncelleyenKullanici = req.user.id;
    await settings.save();

    res.json({ message: 'Modül erişim yetkisi güncellendi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Tüm rolleri getir (yetki tanımlama için)
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find().select('ad');
    res.json(roles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Tüm kullanıcıları getir (yetki tanımlama için)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('ad soyad kullaniciAdi roller').populate('roller', 'ad');
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı oluştur (Admin)
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

    // Yeni kullanıcı oluştur
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

// Kullanıcı güncelle (Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const { ad, soyad, kullaniciAdi, roller, departman, aktif } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcı adı kontrolü (kendisi hariç)
    if (kullaniciAdi && kullaniciAdi !== user.kullaniciAdi) {
      const existingUser = await User.findOne({ kullaniciAdi });
      if (existingUser) {
        return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
      user.kullaniciAdi = kullaniciAdi;
    }

    if (ad) {
      user.ad = ad;
    }
    if (soyad) {
      user.soyad = soyad;
    }
    if (roller) {
      user.roller = roller;
    }
    if (departman) {
      user.departman = departman;
    }
    if (aktif !== undefined) {
      user.aktif = aktif;
    }

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

// Kullanıcı sil (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    await user.deleteOne();
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Puanlama geçmişi (Admin)
router.get('/scores', async (req, res) => {
  try {
    const HRScore = require('../models/HRScore');
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

// Kullanıcı puanlama detayı (Admin)
router.get('/scores/user/:userId', async (req, res) => {
  try {
    const HRScore = require('../models/HRScore');
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

    res.json(scores);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Özet rapor (Admin)
router.get('/reports/summary', async (req, res) => {
  try {
    const HRScore = require('../models/HRScore');
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

// Excel indir (Admin)
router.get('/excel/download', async (req, res) => {
  try {
    const xlsx = require('xlsx');

    // Kullanıcı listesini getir
    const users = await User.find({ aktif: true })
      .select('ad soyad kullaniciAdi roller departman')
      .populate('roller', 'ad')
      .populate('departman', 'ad')
      .sort('ad soyad');

    // Excel verisi hazırla
    const excelData = users.map(user => ({
      'Kullanıcı ID': user._id.toString(),
      Ad: user.ad,
      Soyad: user.soyad,
      'Kullanıcı Adı': user.kullaniciAdi,
      Roller: user.roller.map(r => r.ad).join(', '),
      Departman: user.departman?.ad || '',
      'Fazla Mesai (Saat)': '',
      'Devamsızlık (Gün)': '',
      'Devamsızlık (Saat)': '',
      Açıklama: '',
    }));

    // Workbook oluştur
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);

    // Sütun genişlikleri
    ws['!cols'] = [
      { wch: 25 }, // Kullanıcı ID
      { wch: 15 }, // Ad
      { wch: 15 }, // Soyad
      { wch: 20 }, // Kullanıcı Adı
      { wch: 25 }, // Roller
      { wch: 20 }, // Departman
      { wch: 15 }, // Fazla Mesai
      { wch: 15 }, // Devamsızlık Gün
      { wch: 15 }, // Devamsızlık Saat
      { wch: 30 }, // Açıklama
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Personel Listesi');

    // Buffer'a çevir
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Dosya adı
    const fileName = `personel_listesi_${new Date().toISOString().split('T')[0]}.xlsx`;

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

// Excel yükle (Admin)
router.post('/excel/upload', (req, res) => {
  try {
    const multer = require('multer');
    const xlsx = require('xlsx');

    // Multer configuration
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

    // Dosya yükleme middleware'ini çalıştır
    upload.single('file')(req, res, err => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenmedi' });
      }

      const { yil, ay } = req.body;

      if (!yil || !ay) {
        return res.status(400).json({ message: 'Yıl ve ay bilgisi gereklidir' });
      }

      // Excel dosyasını oku ve async işlemleri başlat
      const processExcelData = async () => {
        try {
          const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = xlsx.utils.sheet_to_json(worksheet);

          // Ayarları getir
          const settings = await HRSettings.getSettings();
          const HRScore = require('../models/HRScore');

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
      };

      // Async fonksiyonu çalıştır
      processExcelData();
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
