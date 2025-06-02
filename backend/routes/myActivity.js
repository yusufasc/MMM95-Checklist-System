const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');

// Basit auth middleware sadece MyActivity için
const simpleAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı, erişim reddedildi' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Basit user getir (populate olmadan)
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    if (user.durum !== 'aktif') {
      return res.status(401).json({ message: 'Hesap pasif durumda' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Simple Auth hatası:', error.message);
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Test route
router.get('/test', simpleAuth, (req, res) => {
  try {
    console.log('🔍 Test route çalışıyor...');
    console.log('User ID:', req.user._id);
    console.log('User ad:', req.user.ad);
    console.log('User roller:', req.user.roller?.length || 0);
    res.json({
      message: 'Test başarılı',
      user: {
        id: req.user._id,
        ad: req.user.ad,
        soyad: req.user.soyad,
        rollerSayisi: req.user.roller?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Test route hatası:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ message: 'Test hatası: ' + error.message });
  }
});

// @route   GET /api/my-activity/summary
// @desc    Kullanıcının kendi aktivite özeti (1 aylık)
// @access  Private
router.get('/summary', simpleAuth, async (req, res) => {
  try {
    console.log('🔍 Summary endpoint başladı');
    console.log('User:', req.user?.ad, req.user?.soyad);
    console.log('User ID:', req.user?._id);

    const { days = 30 } = req.query;
    const userId = req.user._id;

    if (!userId) {
      console.error('❌ User ID bulunamadı');
      return res.status(400).json({ message: 'User ID gerekli' });
    }

    // Son 30 günün tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    console.log(`📊 ${req.user.ad} ${req.user.soyad} için aktivite özeti hesaplanıyor...`);
    console.log('Tarih aralığı:', startDate, '-', endDate);

    // Paralel sorgu ile tüm verileri getir
    console.log('📋 Database sorguları başlıyor...');

    let checklistTasks, workTasks;
    try {
      [checklistTasks, workTasks] = await Promise.all([
        // Checklist görevleri
        Task.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        })
          .populate('checklist', 'ad kategori')
          .populate('makina', 'ad makinaNo')
          .populate('onaylayan', 'ad soyad')
          .sort({ tamamlanmaTarihi: -1 }),

        // İşe bağlı görevler (WorkTask)
        WorkTask.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: startDate,
            $lte: endDate,
          },
        })
          .populate('checklist', 'ad kategori')
          .populate('makina', 'envanterKodu ad')
          .populate('indirilenKalip', 'envanterKodu ad')
          .populate('baglananHamade', 'envanterKodu ad')
          .populate('onaylayanKullanici', 'ad soyad')
          .sort({ tamamlanmaTarihi: -1 }),
      ]);

      console.log('✅ Database sorguları tamamlandı');
      console.log('ChecklistTasks sayısı:', checklistTasks.length);
      console.log('WorkTasks sayısı:', workTasks.length);
    } catch (dbError) {
      console.error('❌ Database sorgu hatası:', dbError.message);
      throw dbError;
    }

    // Kategorilere göre puanları ayır
    const scoresByCategory = {
      ik_sablon: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      ik_devamsizlik: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      kalite_kontrol: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      checklist: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      is_bagli: { puan: 0, gorevSayisi: 0, ortalama: 0 },
      kalip_degisim: { puan: 0, gorevSayisi: 0, ortalama: 0 },
    };

    // Checklist Task'larından puanları kategorilere göre ayır
    checklistTasks.forEach(task => {
      if (task.durum === 'tamamlandi' || task.durum === 'onaylandi') {
        if (task.checklist && task.checklist.kategori === 'IK') {
          scoresByCategory.ik_sablon.puan += task.toplamPuan || 0;
          scoresByCategory.ik_sablon.gorevSayisi++;
        } else if (task.checklist && task.checklist.kategori === 'Kalite') {
          scoresByCategory.kalite_kontrol.puan += task.toplamPuan || 0;
          scoresByCategory.kalite_kontrol.gorevSayisi++;
        } else {
          scoresByCategory.checklist.puan += task.toplamPuan || 0;
          scoresByCategory.checklist.gorevSayisi++;
        }
      }
    });

    // WorkTask'lardan puanları hesapla
    workTasks.forEach(task => {
      if (task.durum === 'tamamlandi') {
        scoresByCategory.is_bagli.puan += task.toplamPuan || 0;
        scoresByCategory.is_bagli.gorevSayisi++;

        // Kalıp değişimi varsa ek puan
        if (task.indirilenKalip) {
          scoresByCategory.kalip_degisim.puan += task.kontrolToplamPuani || 20;
          scoresByCategory.kalip_degisim.gorevSayisi++;
        }
      }
    });

    // İK Devamsızlık puanı - gerçek verilerden al (simulated kaldırıldı)
    // scoresByCategory.ik_devamsizlik.puan = Math.floor(Math.random() * 30) + 70;
    // scoresByCategory.ik_devamsizlik.gorevSayisi = 1;

    // Ortalama puanları hesapla
    Object.keys(scoresByCategory).forEach(key => {
      const category = scoresByCategory[key];
      if (category.gorevSayisi > 0) {
        category.ortalama = Math.round(category.puan / category.gorevSayisi);
      }
    });

    // Genel istatistikler
    const toplamGorevSayisi = checklistTasks.length + workTasks.length;
    const tamamlananGorevSayisi =
      checklistTasks.filter(t => t.durum === 'tamamlandi' || t.durum === 'onaylandi').length +
      workTasks.filter(t => t.durum === 'tamamlandi').length;
    const bekleyenGorevSayisi =
      checklistTasks.filter(t => t.durum === 'bekliyor').length +
      workTasks.filter(t => t.durum === 'bekliyor').length;
    const toplamPuan = Object.values(scoresByCategory).reduce((sum, cat) => sum + cat.puan, 0);

    // Response
    const summary = {
      kullanici: {
        id: req.user._id,
        ad: req.user.ad,
        soyad: req.user.soyad,
        roller: req.user.roller,
      },
      tarihAraligi: {
        baslangic: startDate,
        bitis: endDate,
        gunSayisi: parseInt(days),
      },
      genelIstatistikler: {
        toplamGorevSayisi,
        tamamlananGorevSayisi,
        bekleyenGorevSayisi,
        toplamPuan,
        gunlukOrtalama: Math.round(toplamPuan / parseInt(days)),
      },
      kategorilerePuanlar: scoresByCategory,
      checklistGorevleri: checklistTasks.length,
      iseBagliGorevleri: workTasks.length,
    };

    console.log(
      `✅ Aktivite özeti hazırlandı - Toplam: ${toplamGorevSayisi} görev, ${toplamPuan} puan`,
    );
    res.json(summary);
  } catch (error) {
    console.error('❌ Aktivite özeti hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/my-activity/detailed
// @desc    Kullanıcının detaylı aktivite geçmişi
// @access  Private
router.get('/detailed', simpleAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, durum, tarih } = req.query;
    const userId = req.user._id;

    // Sayfalama parametreleri
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Tarih filtresi
    let dateFilter = {};
    if (tarih) {
      const startDate = new Date(tarih);
      const endDate = new Date(tarih);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter = {
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else {
      // Varsayılan olarak son 30 gün
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      dateFilter = {
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // Durum filtresi
    const durumFilter = {};
    if (durum) {
      durumFilter.durum = durum;
    }

    console.log(`📋 ${req.user.ad} ${req.user.soyad} için detaylı aktivite listesi getiriliyor...`);

    // Paralel sorgu ile verileri getir
    const [checklistTasks, workTasks] = await Promise.all([
      // Checklist görevleri
      Task.find({
        kullanici: userId,
        ...dateFilter,
        ...durumFilter,
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 })
        .skip(skip)
        .limit(limitNum),

      // İşe bağlı görevler (WorkTask)
      WorkTask.find({
        kullanici: userId,
        ...dateFilter,
        ...durumFilter,
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad')
        .populate('baglananHamade', 'envanterKodu ad')
        .populate('onaylayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Toplam kayıt sayısını hesapla (sayfalama için)
    const [totalChecklistTasks, totalWorkTasks] = await Promise.all([
      Task.countDocuments({
        kullanici: userId,
        ...dateFilter,
        ...durumFilter,
      }),
      WorkTask.countDocuments({
        kullanici: userId,
        ...dateFilter,
        ...durumFilter,
      }),
    ]);

    // Aktiviteleri birleştir ve tip bilgisi ekle
    const allActivities = [
      ...checklistTasks.map(task => ({
        ...task.toObject(),
        tip: 'checklist',
        kategoriRengi: '#1976d2',
      })),
      ...workTasks.map(task => ({
        ...task.toObject(),
        tip: 'worktask',
        kategoriRengi: '#9c27b0',
      })),
    ];

    // Tarihe göre sırala
    allActivities.sort((a, b) => new Date(b.tamamlanmaTarihi) - new Date(a.tamamlanmaTarihi));

    const toplamKayit = totalChecklistTasks + totalWorkTasks;
    const toplamSayfa = Math.ceil(toplamKayit / limitNum);

    res.json({
      activities: allActivities,
      sayfalama: {
        mevcutSayfa: pageNum,
        toplamSayfa,
        toplamKayit,
        sayfaBoyutu: limitNum,
      },
    });
  } catch (error) {
    console.error('❌ Detaylı aktivite hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/my-activity/scores-detail
// @desc    Kullanıcının aldığı puanların detaylı listesi
// @access  Private
router.get('/scores-detail', simpleAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, days = 30 } = req.query;
    const userId = req.user._id;

    // Sayfalama parametreleri
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Tarih aralığı (son N gün)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    console.log(`🏆 ${req.user.ad} ${req.user.soyad} için puanlama detayları getiriliyor...`);

    // Puanlanan görevleri getir
    const [scoredChecklistTasks, scoredWorkTasks] = await Promise.all([
      // Puanlanan Checklist görevleri
      Task.find({
        kullanici: userId,
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
        $or: [{ toplamPuan: { $exists: true, $gt: 0 } }, { durum: 'onaylandi' }],
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 })
        .skip(skip)
        .limit(limitNum),

      // Puanlanan WorkTask görevleri
      WorkTask.find({
        kullanici: userId,
        tamamlanmaTarihi: {
          $gte: startDate,
          $lte: endDate,
        },
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      })
        .populate('checklist', 'ad kategori aciklama')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad')
        .populate('baglananHamade', 'envanterKodu ad')
        .populate('onaylayanKullanici', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Toplam kayıt sayısı
    const [totalChecklistTasks, totalWorkTasks] = await Promise.all([
      Task.countDocuments({
        kullanici: userId,
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
        $or: [{ toplamPuan: { $exists: true, $gt: 0 } }, { durum: 'onaylandi' }],
      }),
      WorkTask.countDocuments({
        kullanici: userId,
        tamamlanmaTarihi: { $gte: startDate, $lte: endDate },
        $or: [
          { toplamPuan: { $exists: true, $gt: 0 } },
          { kontrolToplamPuani: { $exists: true, $gt: 0 } },
          { durum: 'onaylandi' },
        ],
      }),
    ]);

    // Detayları hazırla
    const scoreDetails = [
      ...scoredChecklistTasks.map(task => ({
        id: task._id,
        tip: 'checklist',
        checklistAdi: task.checklist?.ad || 'Bilinmeyen Checklist',
        kategori: task.checklist?.kategori || 'Genel',
        makina: task.makina ? `${task.makina.ad} (${task.makina.makinaNo})` : 'Makina Yok',
        tamamlanmaTarihi: task.tamamlanmaTarihi,
        durum: task.durum,
        puanlar: {
          kendi: task.toplamPuan || 0,
          kontrol: task.kontrolToplamPuani || 0,
          toplam: (task.toplamPuan || 0) + (task.kontrolToplamPuani || 0),
        },
        puanlayanKullanici: task.puanlayanKullanici
          ? {
            ad: task.puanlayanKullanici.ad,
            soyad: task.puanlayanKullanici.soyad,
          }
          : null,
        onaylayan: task.onaylayan
          ? {
            ad: task.onaylayan.ad,
            soyad: task.onaylayan.soyad,
          }
          : null,
        aciklama: task.checklist?.aciklama || '',
        kategoriRengi:
          task.checklist?.kategori === 'IK'
            ? '#FF6B6B'
            : task.checklist?.kategori === 'Kalite'
              ? '#45B7D1'
              : '#96CEB4',
      })),
      ...scoredWorkTasks.map(task => ({
        id: task._id,
        tip: 'worktask',
        checklistAdi: task.checklist?.ad || 'İşe Bağlı Görev',
        kategori: 'İşe Bağlı',
        makina: task.makina ? `${task.makina.ad} (${task.makina.envanterKodu})` : 'Makina Yok',
        kalip: task.indirilenKalip
          ? `${task.indirilenKalip.ad} (${task.indirilenKalip.envanterKodu})`
          : null,
        hamade: task.baglananHamade
          ? `${task.baglananHamade.ad} (${task.baglananHamade.envanterKodu})`
          : null,
        tamamlanmaTarihi: task.tamamlanmaTarihi,
        durum: task.durum,
        puanlar: {
          kendi: task.toplamPuan || 0,
          kontrol: task.kontrolToplamPuani || 0,
          toplam: (task.toplamPuan || 0) + (task.kontrolToplamPuani || 0),
        },
        puanlayanKullanici: task.puanlayanKullanici
          ? {
            ad: task.puanlayanKullanici.ad,
            soyad: task.puanlayanKullanici.soyad,
          }
          : null,
        onaylayan: task.onaylayanKullanici
          ? {
            ad: task.onaylayanKullanici.ad,
            soyad: task.onaylayanKullanici.soyad,
          }
          : null,
        aciklama: task.checklist?.aciklama || '',
        kategoriRengi: '#FECA57',
      })),
    ];

    // Tarihe göre sırala
    scoreDetails.sort((a, b) => new Date(b.tamamlanmaTarihi) - new Date(a.tamamlanmaTarihi));

    const toplamKayit = totalChecklistTasks + totalWorkTasks;
    const toplamSayfa = Math.ceil(toplamKayit / limitNum);

    console.log(`✅ ${scoreDetails.length} puanlama detayı hazırlandı`);

    res.json({
      scoreDetails,
      sayfalama: {
        mevcutSayfa: pageNum,
        toplamSayfa,
        toplamKayit,
        sayfaBoyutu: limitNum,
      },
      istatistikler: {
        toplamPuanliGorev: toplamKayit,
        sonGunler: parseInt(days),
        tarihAraligi: {
          baslangic: startDate,
          bitis: endDate,
        },
      },
    });
  } catch (error) {
    console.error('❌ Puanlama detayları hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/my-activity/daily-performance
// @desc    Kullanıcının günlük performans verileri
// @access  Private
router.get('/daily-performance', simpleAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    console.log(
      `📈 ${req.user.ad} ${req.user.soyad} için günlük performans verileri hesaplanıyor...`,
    );

    // Paralel sorgu ile tüm günlerin verilerini al
    const dayPromises = Array.from({ length: parseInt(days) }, (_, i) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);

      return Promise.all([
        Task.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: currentDate,
            $lt: nextDate,
          },
        }).populate('checklist', 'kategori'),

        WorkTask.find({
          kullanici: userId,
          tamamlanmaTarihi: {
            $gte: currentDate,
            $lt: nextDate,
          },
        }).populate('checklist', 'kategori'),
      ]).then(([dayTasks, dayWorkTasks]) => {
        // Günlük puanları kategorilere göre hesapla
        const gunlukScores = {
          ik_sablon: 0,
          ik_devamsizlik: 0,
          kalite_kontrol: 0,
          checklist: 0,
          is_bagli: 0,
          kalip_degisim: 0,
        };

        // Checklist görevlerinden puanları topla
        dayTasks.forEach(task => {
          if (task.durum === 'tamamlandi' || task.durum === 'onaylandi') {
            if (task.checklist && task.checklist.kategori === 'IK') {
              gunlukScores.ik_sablon += task.toplamPuan || 0;
            } else if (task.checklist && task.checklist.kategori === 'Kalite') {
              gunlukScores.kalite_kontrol += task.toplamPuan || 0;
            } else {
              gunlukScores.checklist += task.toplamPuan || 0;
            }
          }
        });

        // WorkTask görevlerinden puanları topla
        dayWorkTasks.forEach(task => {
          if (task.durum === 'tamamlandi') {
            gunlukScores.is_bagli += task.toplamPuan || 0;
            if (task.indirilenKalip) {
              gunlukScores.kalip_degisim += task.kontrolToplamPuani || 20;
            }
          }
        });

        // Devamsızlık puanı - gerçek verilerden al (simulated kaldırıldı)
        // if (i % 7 === 0) {
        //   gunlukScores.ik_devamsizlik = Math.floor(Math.random() * 20) + 80;
        // }

        return {
          tarih: currentDate.toISOString().split('T')[0],
          tarihFormatli: currentDate.toLocaleDateString('tr-TR'),
          scores: gunlukScores,
          toplamPuan: Object.values(gunlukScores).reduce((sum, score) => sum + score, 0),
          gorevSayisi: dayTasks.length + dayWorkTasks.length,
        };
      });
    });

    const performansVerileri = await Promise.all(dayPromises);

    res.json({
      performansVerileri,
      toplamGun: parseInt(days),
    });
  } catch (error) {
    console.error('❌ Günlük performans hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
