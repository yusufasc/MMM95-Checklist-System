const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const checkModulePermission = require('../middleware/checkModulePermission');
const QualityControlTemplate = require('../models/QualityControlTemplate');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const User = require('../models/User');
const Task = require('../models/Task');

// Şablon listesi (admin için)
router.get('/templates', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const templates = await QualityControlTemplate.find()
      .populate('rol', 'ad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort('-createdAt');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Aktif şablonlar (kalite kontrol personeli için) - saat kontrolü ile
router.get('/templates/active', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`🕐 Mevcut saat: ${currentTimeString}`);

    // Tüm aktif şablonları getir
    const templates = await QualityControlTemplate.find({ aktif: true })
      .populate('rol', 'ad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort('rol.ad');

    // Saat kontrolü yap - eğer şablon saatleri varsa kontrol et
    const availableTemplates = templates.filter(template => {
      // Eğer değerlendirme saatleri tanımlanmışsa kontrol et
      if (template.degerlendirmeSaatleri && template.degerlendirmeSaatleri.length > 0) {
        const isInEvaluationPeriod = template.degerlendirmeSaatleri.some(saatObj => {
          const [templateHour, templateMinute] = saatObj.saat.split(':').map(Number);
          const templateTimeInMinutes = templateHour * 60 + templateMinute;
          const currentTimeInMinutes = currentHour * 60 + currentMinute;

          // Değerlendirme periyodu (varsayılan 2 saat)
          const evaluationPeriodHours = template.degerlendirmePeriyodu || 2;
          const evaluationPeriodMinutes = evaluationPeriodHours * 60;

          // Belirlenen saatten itibaren periyot süresince değerlendirme yapılabilir
          const timeDiff = currentTimeInMinutes - templateTimeInMinutes;
          const isInPeriod = timeDiff >= 0 && timeDiff <= evaluationPeriodMinutes;

          if (isInPeriod) {
            const remainingMinutes = evaluationPeriodMinutes - timeDiff;
            const remainingHours = Math.floor(remainingMinutes / 60);
            const remainingMins = remainingMinutes % 60;
            console.log(
              `✅ Şablon "${template.ad}" - ${saatObj.aciklama} (${saatObj.saat}) şu anda kullanılabilir. Kalan süre: ${remainingHours}:${remainingMins.toString().padStart(2, '0')}`,
            );
            return true;
          }

          return false;
        });

        if (!isInEvaluationPeriod) {
          console.log(`⏰ Şablon "${template.ad}" şu anda değerlendirme periyodu dışında`);
          return false;
        }

        return true;
      }

      // Saat tanımlanmamışsa her zaman kullanılabilir
      console.log(`🔓 Şablon "${template.ad}" her zaman kullanılabilir (saat kısıtı yok)`);
      return true;
    });

    console.log(
      `📋 ${templates.length} şablondan ${availableTemplates.length} tanesi şu anda kullanılabilir`,
    );
    res.json(availableTemplates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Debug endpoint - tüm şablonları göster (zaman kısıtı olmadan)
router.get('/templates/debug', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`🔍 DEBUG - Mevcut saat: ${currentTimeString}`);

    const allTemplates = await QualityControlTemplate.find({ aktif: true })
      .populate('rol', 'ad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort('rol.ad');

    const debugInfo = allTemplates.map(template => {
      const hasTimeRestrictions =
        template.degerlendirmeSaatleri && template.degerlendirmeSaatleri.length > 0;
      let isCurrentlyAvailable = true;
      let availabilityInfo = 'Her zaman kullanılabilir';

      if (hasTimeRestrictions) {
        isCurrentlyAvailable = template.degerlendirmeSaatleri.some(saatObj => {
          const [templateHour, templateMinute] = saatObj.saat.split(':').map(Number);
          const templateTimeInMinutes = templateHour * 60 + templateMinute;
          const currentTimeInMinutes = currentHour * 60 + currentMinute;

          const evaluationPeriodHours = template.degerlendirmePeriyodu || 2;
          const evaluationPeriodMinutes = evaluationPeriodHours * 60;

          const timeDiff = currentTimeInMinutes - templateTimeInMinutes;
          return timeDiff >= 0 && timeDiff <= evaluationPeriodMinutes;
        });

        availabilityInfo = isCurrentlyAvailable
          ? 'Şu anda kullanılabilir'
          : 'Değerlendirme saati dışında';
      }

      return {
        _id: template._id,
        ad: template.ad,
        rol: template.rol.ad,
        hasTimeRestrictions,
        degerlendirmeSaatleri: template.degerlendirmeSaatleri,
        degerlendirmePeriyodu: template.degerlendirmePeriyodu,
        isCurrentlyAvailable,
        availabilityInfo,
        maddelerSayisi: template.maddeler.length,
      };
    });

    res.json({
      currentTime: currentTimeString,
      totalTemplates: allTemplates.length,
      availableNow: debugInfo.filter(t => t.isCurrentlyAvailable).length,
      templates: debugInfo,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Şablon detayı
router.get('/templates/:id', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const template = await QualityControlTemplate.findById(req.params.id)
      .populate('rol', 'ad')
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

// Yeni şablon oluştur (admin)
router.post(
  '/templates',
  auth,
  checkModulePermission('Kalite Kontrol', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        rol,
        maddeler,
        degerlendirmeSaatleri,
        degerlendirmeSikligi,
        degerlendirmeGunleri,
        degerlendirmePeriyodu,
      } = req.body;

      // Maddelere sıra numarası ekle
      const maddelerWithOrder = maddeler.map((madde, index) => ({
        ...madde,
        siraNo: index + 1,
      }));

      const template = new QualityControlTemplate({
        ad,
        rol,
        maddeler: maddelerWithOrder,
        degerlendirmeSaatleri: degerlendirmeSaatleri || [],
        degerlendirmeSikligi: degerlendirmeSikligi || 'Günlük',
        degerlendirmeGunleri: degerlendirmeGunleri || [],
        degerlendirmePeriyodu: degerlendirmePeriyodu || 2,
        olusturanKullanici: req.user.id,
      });

      await template.save();
      await template.populate('rol', 'ad');

      console.log(
        `✅ Yeni şablon oluşturuldu: "${ad}" - ${degerlendirmeSaatleri?.length || 0} saat, ${degerlendirmePeriyodu || 2}h periyot`,
      );
      res.json(template);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// Şablon güncelle (admin)
router.put(
  '/templates/:id',
  auth,
  checkModulePermission('Kalite Kontrol', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        rol,
        maddeler,
        aktif,
        degerlendirmeSaatleri,
        degerlendirmeSikligi,
        degerlendirmeGunleri,
        degerlendirmePeriyodu,
      } = req.body;

      const template = await QualityControlTemplate.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Şablon bulunamadı' });
      }

      // Maddelere sıra numarası ekle
      const maddelerWithOrder = maddeler.map((madde, index) => ({
        ...madde,
        siraNo: index + 1,
      }));

      template.ad = ad;
      template.rol = rol;
      template.maddeler = maddelerWithOrder;
      template.aktif = aktif;
      template.degerlendirmeSaatleri = degerlendirmeSaatleri || [];
      template.degerlendirmeSikligi = degerlendirmeSikligi || 'Günlük';
      template.degerlendirmeGunleri = degerlendirmeGunleri || [];
      template.degerlendirmePeriyodu = degerlendirmePeriyodu || 2;
      template.guncelleyenKullanici = req.user.id;

      await template.save();
      await template.populate('rol', 'ad');

      console.log(
        `🔄 Şablon güncellendi: "${ad}" - ${degerlendirmeSaatleri?.length || 0} saat, ${degerlendirmePeriyodu || 2}h periyot`,
      );
      res.json(template);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// Şablon sil (admin) - Gelişmiş silme sistemi
router.delete(
  '/templates/:id',
  auth,
  checkModulePermission('Kalite Kontrol', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const template = await QualityControlTemplate.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Şablon bulunamadı' });
      }

      // Kullanımda olup olmadığını kontrol et
      const usageCount = await QualityControlEvaluation.countDocuments({ sablon: req.params.id });

      // Zorla silme kontrolü
      const forceDelete = req.query.force === 'true' || req.body.force === true;

      if (usageCount > 0 && !forceDelete) {
        return res.status(400).json({
          message: `Bu şablona bağlı ${usageCount} değerlendirme bulunmaktadır.`,
          canForceDelete: true,
          dependencyCount: usageCount,
        });
      }

      if (forceDelete && usageCount > 0) {
        // Zorla silme - bağımlılıkları da sil
        console.log(
          `🗑️ Zorla silme: ${template.ad} şablonu ve ${usageCount} değerlendirmesi siliniyor...`,
        );

        // Önce bağımlı değerlendirmeleri sil
        await QualityControlEvaluation.deleteMany({ sablon: req.params.id });
        console.log(`✅ ${usageCount} değerlendirme silindi`);
      }

      // Şablonu sil
      await template.deleteOne();

      const message =
        forceDelete && usageCount > 0
          ? `Şablon ve ${usageCount} bağımlı değerlendirme başarıyla silindi`
          : 'Şablon başarıyla silindi';

      console.log(`✅ ${message}: ${template.ad}`);
      res.json({ message });
    } catch (error) {
      console.error('❌ Şablon silme hatası:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Belirli bir şablonun rolüne göre aktif çalışanları listele
router.get(
  '/active-workers/:templateId',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const { templateId } = req.params;

      // Şablonu getir
      const template = await QualityControlTemplate.findById(templateId).populate('rol', 'ad');
      if (!template) {
        return res.status(404).json({ message: 'Şablon bulunamadı' });
      }

      // Bugünün başlangıcı
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // 4 saat öncesi
      const fourHoursAgo = new Date();
      fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

      console.log('🔍 DEBUG - Active Workers for Template:', template.ad);
      console.log('🎯 Target Role:', template.rol.ad, '(ID:', template.rol._id, ')');
      console.log('📅 Today start:', todayStart);
      console.log('⏰ Four hours ago:', fourHoursAgo);

      // Önce bu role sahip tüm kullanıcıları kontrol et
      const allUsersWithRole = await User.find({
        roller: template.rol._id,
      }).select('ad soyad durum roller');

      console.log(
        `🔍 ${template.rol.ad} rolüne sahip tüm kullanıcılar:`,
        allUsersWithRole.map(u => `${u.ad} ${u.soyad} (${u.durum})`),
      );

      // Sadece şablonun atandığı roldeki aktif kullanıcıları getir
      const workers = await User.find({
        durum: 'aktif',
        roller: template.rol._id, // Sadece bu role sahip kullanıcılar
      })
        .populate('roller', 'ad')
        .select('ad soyad kullaniciAdi roller') // Sadece gerekli alanları seç
        .sort('ad soyad');

      console.log(`👥 ${template.rol.ad} rolündeki aktif kullanıcı sayısı: ${workers.length}`);

      // Bugün makina seçimi yapmış kullanıcıları bul (ek bilgi için)
      const activeTasks = await Task.find({
        createdAt: { $gte: todayStart },
        makina: { $exists: true, $ne: null },
        durum: { $in: ['beklemede', 'yapiliyor', 'tamamlandi'] },
      })
        .populate('atananKullanici', '_id')
        .populate('makina', 'kod ad');

      console.log(`📋 Bugün makina seçimi yapmış görev sayısı: ${activeTasks.length}`);

      // Makina bilgilerini map'le
      const machineMap = new Map();
      activeTasks.forEach(task => {
        if (task.atananKullanici && task.makina) {
          machineMap.set(task.atananKullanici._id.toString(), task.makina);
          console.log(`🏭 Makina eşlemesi: ${task.atananKullanici._id} -> ${task.makina.kod}`);
        }
      });

      // Son 4 saat içinde puanlanmış kullanıcıları bul
      const recentEvaluations = await QualityControlEvaluation.find({
        degerlendirmeTarihi: { $gte: fourHoursAgo },
      })
        .populate('degerlendirilenKullanici', 'ad soyad')
        .sort('-degerlendirmeTarihi');

      console.log(`📊 Son 4 saat içinde değerlendirme sayısı: ${recentEvaluations.length}`);

      // Kullanıcı başına son değerlendirmeleri map'le
      const evaluationMap = new Map();
      recentEvaluations.forEach(evaluation => {
        const userId = evaluation.degerlendirilenKullanici._id.toString();
        const userName = `${evaluation.degerlendirilenKullanici.ad} ${evaluation.degerlendirilenKullanici.soyad}`;

        if (!evaluationMap.has(userId)) {
          evaluationMap.set(userId, {
            sonDegerlendirme: evaluation.degerlendirmeTarihi,
            basariYuzdesi: evaluation.basariYuzdesi,
            toplamPuan: evaluation.toplamPuan,
            maksimumPuan: evaluation.maksimumPuan,
            degerlendirmeSayisi: 1,
          });
          console.log(`📝 Son değerlendirme: ${userName} - ${evaluation.degerlendirmeTarihi}`);
        } else {
          // Aynı kullanıcının bugünkü değerlendirme sayısını artır
          evaluationMap.get(userId).degerlendirmeSayisi++;
          console.log(
            `📝 Ek değerlendirme: ${userName} - Toplam: ${evaluationMap.get(userId).degerlendirmeSayisi}`,
          );
        }
      });

      // Workers array'ini evaluation bilgileri ile zenginleştir - sadece gerekli bilgilerle
      const workersWithEvaluations = workers.map(worker => {
        const userId = worker._id.toString();
        const evaluationData = evaluationMap.get(userId);

        let puanlanabilir = true;
        let puanlanamaSebebi = '';

        if (evaluationData) {
          const timeDiff = new Date() - new Date(evaluationData.sonDegerlendirme);
          const hoursDiff = timeDiff / (60 * 60 * 1000);

          if (hoursDiff <= 4) {
            puanlanabilir = false;
            puanlanamaSebebi = `Son değerlendirmeden ${hoursDiff.toFixed(1)} saat geçti (4 saat gerekli)`;
          }
        }

        console.log(
          `👤 ${worker.ad} ${worker.soyad}: ${puanlanabilir ? 'Puanlanabilir' : `Puanlanamaz - ${puanlanamaSebebi}`}`,
        );

        return {
          _id: worker._id,
          ad: worker.ad,
          soyad: worker.soyad,
          puanlanabilir,
          sonDegerlendirme: evaluationData?.sonDegerlendirme || null,
          basariYuzdesi: evaluationData?.basariYuzdesi || null,
          toplamPuan: evaluationData?.toplamPuan || null,
          maksimumPuan: evaluationData?.maksimumPuan || null,
          degerlendirmeSayisi: evaluationData?.degerlendirmeSayisi || 0,
          puanlanamaSebebi: puanlanamaSebebi || null,
        };
      });

      // Ad soyada göre sırala
      const sortedWorkers = workersWithEvaluations.sort((a, b) => {
        return `${a.ad} ${a.soyad}`.localeCompare(`${b.ad} ${b.soyad}`);
      });

      const puanlanabilirSayisi = sortedWorkers.filter(w => w.puanlanabilir).length;
      const puanlanamayacakSayisi = sortedWorkers.filter(w => !w.puanlanabilir).length;

      console.log('📋 ÖZET:');
      console.log(`   - ${template.rol.ad} rolündeki toplam çalışan: ${sortedWorkers.length}`);
      console.log(`   - Puanlanabilir: ${puanlanabilirSayisi}`);
      console.log(`   - Puanlanamayacak: ${puanlanamayacakSayisi}`);

      res.json(sortedWorkers);
    } catch (error) {
      console.error('❌ Active workers endpoint hatası:', error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// Belirli bir rol için aktif şablonu getir
router.get(
  '/templates/role/:roleId',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const template = await QualityControlTemplate.findOne({
        rol: req.params.roleId,
        aktif: true,
      })
        .populate('rol', 'ad')
        .sort('-createdAt');

      if (!template) {
        return res.status(404).json({ message: 'Bu rol için aktif şablon bulunamadı' });
      }

      res.json(template);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// Yeni değerlendirme oluştur
router.post('/evaluations', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const {
      sablon,
      degerlendirilenKullanici,
      makina,
      kalip,
      hammadde,
      maddeler,
      genelYorum,
      toplamPuan,
      maksimumToplamPuan,
    } = req.body;

    console.log('📝 Değerlendirme oluşturma isteği:', {
      sablon,
      degerlendirilenKullanici,
      makina,
      kalip,
      hammadde,
      maddelerSayisi: maddeler?.length || 0,
      toplamPuan,
      maksimumToplamPuan,
    });

    // 4 saat içinde değerlendirme kontrolü
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    const recentEvaluation = await QualityControlEvaluation.findOne({
      degerlendirilenKullanici,
      degerlendirmeTarihi: { $gte: fourHoursAgo },
    }).sort('-degerlendirmeTarihi');

    if (recentEvaluation) {
      const timeDiff = new Date() - new Date(recentEvaluation.degerlendirmeTarihi);
      const hoursLeft = Math.ceil((4 * 60 * 60 * 1000 - timeDiff) / (60 * 60 * 1000));

      return res.status(400).json({
        message: `Bu çalışan ${hoursLeft} saat sonra tekrar puanlanabilir`,
      });
    }

    // Varsayılan vardiya belirleme (şu an için)
    const currentHour = new Date().getHours();
    let vardiya = 'Sabah';
    if (currentHour >= 14 && currentHour < 22) {
      vardiya = 'Öğle';
    } else if (currentHour >= 22 || currentHour < 6) {
      vardiya = 'Gece';
    }

    // Şablon verilerini al
    const template = await QualityControlTemplate.findById(sablon).populate('maddeler');
    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    console.log(
      '📋 Şablon maddeler:',
      template.maddeler.map(m => ({ baslik: m.baslik, maksimumPuan: m.maksimumPuan })),
    );

    // Puanlamaları backend formatına çevir
    const puanlamalar = maddeler.map((madde, index) => {
      const templateMadde = template.maddeler[index];
      return {
        maddeId: index.toString(),
        maddeBaslik: templateMadde ? templateMadde.baslik : madde.baslik,
        puan: madde.alinanPuan || 0,
        maksimumPuan: templateMadde ? templateMadde.maksimumPuan : madde.maksimumPuan,
        aciklama: madde.yorum || '',
        fotograflar: madde.fotografUrl ? [madde.fotografUrl] : [],
      };
    });

    const evaluationData = {
      degerlendirilenKullanici,
      degerlendirenKullanici: req.user.id,
      sablon,
      vardiya,
      puanlamalar,
      toplamPuan: toplamPuan || 0,
      maksimumPuan: maksimumToplamPuan || 0,
      basariYuzdesi:
        maksimumToplamPuan > 0 ? Math.round((toplamPuan / maksimumToplamPuan) * 100) : 0,
      notlar: genelYorum || '',
      durum: 'Tamamlandı',
    };

    // Makina varsa ekle
    if (makina) {
      evaluationData.makina = makina;
    }

    // Kalıp varsa ekle
    if (kalip) {
      evaluationData.kalip = kalip;
    }

    // Hammadde varsa ekle
    if (hammadde) {
      evaluationData.hammadde = hammadde;
    }

    console.log('💾 Kaydedilecek değerlendirme:', evaluationData);

    const evaluation = new QualityControlEvaluation(evaluationData);
    await evaluation.save();

    // Populate ile tam veriyi döndür
    await evaluation.populate([
      { path: 'degerlendirilenKullanici', select: 'ad soyad' },
      { path: 'degerlendirenKullanici', select: 'ad soyad' },
      { path: 'sablon', select: 'ad' },
      { path: 'makina', select: 'kod ad' },
      { path: 'kalip', select: 'kod ad' },
    ]);

    console.log('✅ Değerlendirme başarıyla kaydedildi:', evaluation._id);
    res.json(evaluation);
  } catch (error) {
    console.error('❌ Değerlendirme kaydedilirken hata:', error.message);
    res.status(500).json({ message: 'Değerlendirme kaydedilirken hata oluştu: ' + error.message });
  }
});

// Değerlendirmeleri listele
router.get('/evaluations', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const { kullanici, tarihBaslangic, tarihBitis, durum } = req.query;

    const filter = {};

    if (kullanici) {
      filter.degerlendirilenKullanici = kullanici;
    }

    if (tarihBaslangic || tarihBitis) {
      filter.degerlendirmeTarihi = {};
      if (tarihBaslangic) {
        filter.degerlendirmeTarihi.$gte = new Date(tarihBaslangic);
      }
      if (tarihBitis) {
        const endDate = new Date(tarihBitis);
        endDate.setHours(23, 59, 59, 999);
        filter.degerlendirmeTarihi.$lte = endDate;
      }
    }

    if (durum) {
      filter.durum = durum;
    }

    const evaluations = await QualityControlEvaluation.find(filter)
      .populate('degerlendirilenKullanici', 'ad soyad')
      .populate('degerlendirenKullanici', 'ad soyad')
      .populate('sablon', 'ad')
      .populate('makina', 'kod ad')
      .populate('kalip', 'kod ad')
      .sort('-degerlendirmeTarihi');

    res.json(evaluations);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Değerlendirme detayı
router.get('/evaluations/:id', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const evaluation = await QualityControlEvaluation.findById(req.params.id)
      .populate('degerlendirilenKullanici', 'ad soyad')
      .populate('degerlendirenKullanici', 'ad soyad')
      .populate('sablon')
      .populate('makina', 'kod ad')
      .populate('kalip', 'kod ad');

    if (!evaluation) {
      return res.status(404).json({ message: 'Değerlendirme bulunamadı' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İstatistikler
router.get('/statistics', auth, checkModulePermission('Kalite Kontrol'), async (req, res) => {
  try {
    const { tarihBaslangic, tarihBitis } = req.query;

    const dateFilter = {};
    if (tarihBaslangic || tarihBitis) {
      dateFilter.degerlendirmeTarihi = {};
      if (tarihBaslangic) {
        dateFilter.degerlendirmeTarihi.$gte = new Date(tarihBaslangic);
      }
      if (tarihBitis) {
        const endDate = new Date(tarihBitis);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.degerlendirmeTarihi.$lte = endDate;
      }
    }

    // Genel istatistikler
    const [toplamDegerlendirme, ortalamaPuan, rolBazliIstatistikler, kullaniciBazliIstatistikler] =
      await Promise.all([
        // Toplam değerlendirme sayısı
        QualityControlEvaluation.countDocuments(dateFilter),

        // Ortalama başarı yüzdesi
        QualityControlEvaluation.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              ortalamaBasari: { $avg: '$basariYuzdesi' },
            },
          },
        ]),

        // Rol bazlı istatistikler
        QualityControlEvaluation.aggregate([
          { $match: dateFilter },
          {
            $lookup: {
              from: 'users',
              localField: 'degerlendirilenKullanici',
              foreignField: '_id',
              as: 'kullanici',
            },
          },
          { $unwind: '$kullanici' },
          {
            $lookup: {
              from: 'roles',
              localField: 'kullanici.rol',
              foreignField: '_id',
              as: 'rol',
            },
          },
          { $unwind: '$rol' },
          {
            $group: {
              _id: '$rol.ad',
              sayac: { $sum: 1 },
              ortalamaBasari: { $avg: '$basariYuzdesi' },
            },
          },
          { $sort: { ortalamaBasari: -1 } },
        ]),

        // Kullanıcı bazlı en iyi performans
        QualityControlEvaluation.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$degerlendirilenKullanici',
              sayac: { $sum: 1 },
              ortalamaBasari: { $avg: '$basariYuzdesi' },
            },
          },
          { $sort: { ortalamaBasari: -1 } },
          { $limit: 10 },
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
              kullanici: {
                ad: '$kullanici.ad',
                soyad: '$kullanici.soyad',
              },
              sayac: 1,
              ortalamaBasari: 1,
            },
          },
        ]),
      ]);

    res.json({
      toplamDegerlendirme,
      ortalamaBasariYuzdesi: ortalamaPuan[0]?.ortalamaBasari || 0,
      rolBazliIstatistikler,
      enIyiPerformans: kullaniciBazliIstatistikler,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
