const express = require('express');
const router = express.Router();
const ControlScore = require('../models/ControlScore');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const HRTemplate = require('../models/HRTemplate');
const QualityControlTemplate = require('../models/QualityControlTemplate');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Kontrol puanı oluştur (puanlama sonrası otomatik çağrılır)
router.post('/create', auth, async (req, res) => {
  try {
    const {
      puanlananTask,
      gorevTipi,
      sablon,
      sablonTipi,
      puanlananKullanici,
      buddyGorevTipi,
      verilenPuan,
    } = req.body;

    console.log('🎯 Kontrol puanı oluşturma isteği:', {
      puanlayanKullanici: req.user.id,
      puanlananTask,
      gorevTipi,
      sablon,
      sablonTipi,
      puanlananKullanici,
      buddyGorevTipi,
      verilenPuan,
    });

    // Buddy puanlaması için extra log
    if (gorevTipi === 'WorkTask-Buddy') {
      console.log('🎯 BUDDY PUANLAMA DETECTED!', {
        buddyUserId: puanlananKullanici,
        workTaskId: puanlananTask,
        isBuddy: buddyGorevTipi,
      });
    }

    // Puanı belirle: Önce verilenPuan, yoksa template kontrolPuani
    let kontrolPuani = 0;
    let sablonAdi = '';

    if (verilenPuan !== undefined && verilenPuan !== null) {
      // ✅ Kullanıcının verdiği gerçek puanı kullan
      kontrolPuani = verilenPuan;
      console.log(
        '✅ Kullanıcının verdiği gerçek puan kullanılıyor:',
        kontrolPuani,
      );
    } else {
      // Fallback: Template kontrolPuani (eski sistem)
      let template;
      switch (sablonTipi) {
      case 'ChecklistTemplate':
        template = await ChecklistTemplate.findById(sablon);
        break;
      case 'HRTemplate':
        template = await HRTemplate.findById(sablon);
        break;
      case 'QualityControlTemplate':
        template = await QualityControlTemplate.findById(sablon);
        break;
      default:
        return res.status(400).json({ message: 'Geçersiz şablon tipi' });
      }

      if (!template) {
        return res.status(404).json({ message: 'Şablon bulunamadı' });
      }

      kontrolPuani = template.kontrolPuani || 0;
      console.log('⚠️ Template kontrolPuani kullanılıyor:', kontrolPuani);
    }

    // Şablon adını al
    if (!sablonAdi) {
      let template;
      switch (sablonTipi) {
      case 'ChecklistTemplate':
        template = await ChecklistTemplate.findById(sablon);
        break;
      case 'HRTemplate':
        template = await HRTemplate.findById(sablon);
        break;
      case 'QualityControlTemplate':
        template = await QualityControlTemplate.findById(sablon);
        break;
      }
      sablonAdi = template?.ad || 'Bilinmeyen Şablon';
    }

    // Kontrol puanı 0 ise kayıt oluşturma
    if (kontrolPuani === 0) {
      console.log('⚠️ Kontrol puanı 0, kayıt oluşturulmayacak');
      return res.json({
        message: 'Kontrol puanı 0, kayıt oluşturulmadı',
        kontrolPuani: 0,
      });
    }

    // Aynı görev için daha önce kontrol puanı verilmiş mi kontrol et
    const existingScore = await ControlScore.findOne({
      puanlayanKullanici: req.user.id,
      puanlananTask,
      gorevTipi,
    });

    if (existingScore) {
      console.log('⚠️ Bu görev için zaten kontrol puanı verilmiş');
      return res.json({
        message: 'Bu görev için zaten kontrol puanı verilmiş',
        kontrolPuani: existingScore.kontrolPuani,
      });
    }

    // Yeni kontrol puanı kaydı oluştur
    const controlScore = new ControlScore({
      puanlayanKullanici: req.user.id,
      puanlananTask,
      gorevTipi,
      sablon,
      sablonTipi,
      kontrolPuani,
      sablonAdi,
      puanlananKullanici,
      aciklama: `${sablonAdi} şablonu kontrol puanı (${kontrolPuani} puan)`,
    });

    await controlScore.save();

    console.log('✅ Kontrol puanı başarıyla oluşturuldu:', {
      id: controlScore._id,
      kontrolPuani,
      sablonAdi,
      verilenPuan,
    });

    res.status(201).json({
      message: 'Kontrol puanı başarıyla verildi',
      controlScore,
      kontrolPuani,
    });
  } catch (error) {
    console.error('❌ Kontrol puanı oluşturma hatası:', error);
    res.status(500).json({
      message: 'Kontrol puanı oluşturulurken hata oluştu',
      error: error.message,
    });
  }
});

// Kullanıcının kontrol puanları listesi
router.get('/my-scores', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    console.log('🔍 /my-scores API çağrısı:', {
      userId: req.user.id,
      page,
      limit,
      startDate,
      endDate,
      query: req.query,
    });

    const filter = {
      puanlayanKullanici: new mongoose.Types.ObjectId(req.user.id),
      aktif: true,
    };

    // Tarih filtresi
    if (startDate || endDate) {
      filter.puanlamaTarihi = {};
      if (startDate) {
        filter.puanlamaTarihi.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.puanlamaTarihi.$lte = new Date(endDate);
      }
    }

    console.log('🔍 MongoDB filter:', filter);

    const skip = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      ControlScore.find(filter)
        .populate('puanlananKullanici', 'ad soyad kullaniciAdi')
        .sort({ puanlamaTarihi: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ControlScore.countDocuments(filter),
    ]);

    // Toplam kontrol puanı
    const toplamKontrolPuani = await ControlScore.aggregate([
      { $match: filter },
      { $group: { _id: null, toplam: { $sum: '$kontrolPuani' } } },
    ]);

    // Debug: Raw verileri de kontrol et
    const rawScores = await ControlScore.find(
      filter,
      'kontrolPuani sablonAdi puanlamaTarihi',
    );
    console.log(
      '🔍 Raw kontrol puanları:',
      rawScores.map(s => ({
        kontrolPuani: s.kontrolPuani,
        type: typeof s.kontrolPuani,
        sablonAdi: s.sablonAdi,
        tarih: s.puanlamaTarihi,
      })),
    );

    console.log('🔍 Sonuçlar:', {
      scoresLength: scores.length,
      total,
      toplamKontrolPuani: toplamKontrolPuani[0]?.toplam || 0,
      aggregateResult: toplamKontrolPuani,
    });

    res.json({
      scores,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
      toplamKontrolPuani: toplamKontrolPuani[0]?.toplam || 0,
    });
  } catch (error) {
    console.error('❌ Kontrol puanları getirme hatası:', error);
    res.status(500).json({
      message: 'Kontrol puanları getirilirken hata oluştu',
      error: error.message,
    });
  }
});

// Kontrol puanları özeti
router.get('/summary', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    console.log('🔍 /summary API çağrısı:', {
      userId: req.user.id,
      year: currentYear,
      month: currentMonth,
      query: req.query,
    });

    // Bu ay için filtre
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    console.log('🔍 Summary tarih aralığı:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const filter = {
      puanlananKullanici: new mongoose.Types.ObjectId(req.user.id), // ✅ Kullanıcının aldığı puanlar
      aktif: true,
      puanlamaTarihi: { $gte: startDate, $lte: endDate },
    };

    const [buAyToplam, buAySayisi, genelToplam, genelSayisi, sablonBazliOzet] =
      await Promise.all([
        // Bu ay toplam puan
        ControlScore.aggregate([
          { $match: filter },
          { $group: { _id: null, toplam: { $sum: '$kontrolPuani' } } },
        ]),

        // Bu ay kontrol sayısı
        ControlScore.countDocuments(filter),

        // Genel toplam puan
        ControlScore.aggregate([
          {
            $match: {
              puanlananKullanici: new mongoose.Types.ObjectId(req.user.id), // ✅ Kullanıcının aldığı puanlar
              aktif: true,
            },
          },
          { $group: { _id: null, toplam: { $sum: '$kontrolPuani' } } },
        ]),

        // Genel kontrol sayısı
        ControlScore.countDocuments({
          puanlananKullanici: new mongoose.Types.ObjectId(req.user.id), // ✅ Kullanıcının aldığı puanlar
          aktif: true,
        }),

        // Şablon bazlı özet
        ControlScore.aggregate([
          { $match: filter },
          {
            $group: {
              _id: { sablonTipi: '$sablonTipi', sablonAdi: '$sablonAdi' },
              toplam: { $sum: '$kontrolPuani' },
              sayisi: { $sum: 1 },
            },
          },
          { $sort: { toplam: -1 } },
        ]),
      ]);

    // Debug: Raw verileri kontrol et
    const rawSummaryScores = await ControlScore.find(
      filter,
      'kontrolPuani sablonAdi puanlamaTarihi',
    );
    console.log(
      '🔍 Summary Raw kontrol puanları:',
      rawSummaryScores.map(s => ({
        kontrolPuani: s.kontrolPuani,
        type: typeof s.kontrolPuani,
        sablonAdi: s.sablonAdi,
        tarih: s.puanlamaTarihi,
      })),
    );

    console.log('🔍 Summary sonuçları:', {
      buAyToplam: buAyToplam[0]?.toplam || 0,
      buAySayisi,
      genelToplam: genelToplam[0]?.toplam || 0,
      genelSayisi,
      sablonBazliOzetLength: sablonBazliOzet.length,
    });

    res.json({
      buAy: {
        toplamPuan: buAyToplam[0]?.toplam || 0,
        kontrolSayisi: buAySayisi,
        ortalamaPuan:
          buAySayisi > 0 ? (buAyToplam[0]?.toplam || 0) / buAySayisi : 0,
      },
      genel: {
        toplamPuan: genelToplam[0]?.toplam || 0,
        kontrolSayisi: genelSayisi,
        ortalamaPuan:
          genelSayisi > 0 ? (genelToplam[0]?.toplam || 0) / genelSayisi : 0,
      },
      sablonBazliOzet,
      period: {
        year: currentYear,
        month: currentMonth,
      },
    });
  } catch (error) {
    console.error('❌ Kontrol puanları özeti hatası:', error);
    res.status(500).json({
      message: 'Kontrol puanları özeti getirilirken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;
