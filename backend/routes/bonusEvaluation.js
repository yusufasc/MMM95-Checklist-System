const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');

// Models
const BonusEvaluationTemplate = require('../models/BonusEvaluationTemplate');
const BonusEvaluation = require('../models/BonusEvaluation');
const User = require('../models/User');

// ===============================
// DASHBOARD ROUTES
// ===============================

// Dashboard istatistikleri getir
router.get(
  '/dashboard/stats',
  auth,
  checkModulePermission([
    'Bonus Değerlendirme',
    'Bonus Değerlendirme Yönetimi',
  ]),
  async (req, res) => {
    try {
      // Toplam değerlendirme sayısı
      const totalEvaluations = await BonusEvaluation.countDocuments();

      // Bu ay yapılan değerlendirmeler
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyEvaluations = await BonusEvaluation.countDocuments({
        degerlendirmeTarihi: { $gte: currentMonth },
      });

      // Ortalama puan hesaplama
      const avgResult = await BonusEvaluation.aggregate([
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$toplamPuan' },
            maxScore: { $max: '$toplamPuan' },
          },
        },
      ]);

      const averageScore = avgResult.length > 0 ? avgResult[0].averageScore : 0;
      const maxScore = avgResult.length > 0 ? avgResult[0].maxScore : 0;

      // Benzersiz değerlendirilen kişi sayısı
      const uniqueUsers = await BonusEvaluation.distinct(
        'degerlendirilenKullanici',
      );

      res.json({
        success: true,
        data: {
          totalEvaluations,
          monthlyEvaluations,
          averageScore: Math.round(averageScore * 10) / 10,
          maxScore,
          evaluatedUsersCount: uniqueUsers.length,
        },
      });
    } catch (error) {
      console.error('Bonus dashboard stats error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// ===============================
// TEMPLATE ROUTES (Admin Only)
// ===============================

// Tüm şablonları getir (admin için)
router.get(
  '/templates',
  auth,
  checkModulePermission('Bonus Değerlendirme Yönetimi'),
  async (req, res) => {
    try {
      const templates = await BonusEvaluationTemplate.find()
        .populate('rol', 'ad')
        .populate('olusturanKullanici', 'ad soyad')
        .populate('guncelleyenKullanici', 'ad soyad')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      console.error('Bonus template list error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Aktif şablonları getir
router.get(
  '/templates/active',
  auth,
  checkModulePermission([
    'Bonus Değerlendirme',
    'Bonus Değerlendirme Yönetimi',
  ]),
  async (req, res) => {
    try {
      const templates = await BonusEvaluationTemplate.find({ aktif: true })
        .populate('rol', 'ad')
        .sort({ ad: 1 });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      console.error('Active bonus templates error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Şablon detayı getir
router.get(
  '/templates/:id',
  auth,
  checkModulePermission([
    'Bonus Değerlendirme',
    'Bonus Değerlendirme Yönetimi',
  ]),
  async (req, res) => {
    try {
      const template = await BonusEvaluationTemplate.findById(req.params.id)
        .populate('rol', 'ad')
        .populate('olusturanKullanici', 'ad soyad')
        .populate('guncelleyenKullanici', 'ad soyad');

      if (!template) {
        return res
          .status(404)
          .json({ success: false, message: 'Şablon bulunamadı' });
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Bonus template detail error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Yeni şablon oluştur
router.post(
  '/templates',
  auth,
  checkModulePermission('Bonus Değerlendirme Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const templateData = {
        ...req.body,
        olusturanKullanici: req.user.id,
      };

      const template = new BonusEvaluationTemplate(templateData);
      await template.save();

      const populatedTemplate = await BonusEvaluationTemplate.findById(
        template._id,
      )
        .populate('rol', 'ad')
        .populate('olusturanKullanici', 'ad soyad');

      res.status(201).json({
        success: true,
        message: 'Bonus değerlendirme şablonu başarıyla oluşturuldu',
        data: populatedTemplate,
      });
    } catch (error) {
      console.error('Bonus template create error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Şablon güncelle
router.put(
  '/templates/:id',
  auth,
  checkModulePermission('Bonus Değerlendirme Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        guncelleyenKullanici: req.user.id,
      };

      const template = await BonusEvaluationTemplate.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      )
        .populate('rol', 'ad')
        .populate('olusturanKullanici', 'ad soyad')
        .populate('guncelleyenKullanici', 'ad soyad');

      if (!template) {
        return res
          .status(404)
          .json({ success: false, message: 'Şablon bulunamadı' });
      }

      res.json({
        success: true,
        message: 'Şablon başarıyla güncellendi',
        data: template,
      });
    } catch (error) {
      console.error('Bonus template update error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Şablon sil
router.delete(
  '/templates/:id',
  auth,
  checkModulePermission('Bonus Değerlendirme Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const template = await BonusEvaluationTemplate.findById(req.params.id);

      if (!template) {
        return res
          .status(404)
          .json({ success: false, message: 'Şablon bulunamadı' });
      }

      // Check if template is used in evaluations
      const evaluationCount = await BonusEvaluation.countDocuments({
        sablon: req.params.id,
      });

      if (evaluationCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Bu şablon ${evaluationCount} değerlendirmede kullanılmış. Önce ilgili değerlendirmeleri silin.`,
        });
      }

      await BonusEvaluationTemplate.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Şablon başarıyla silindi',
      });
    } catch (error) {
      console.error('Bonus template delete error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// ===============================
// EVALUATION ROUTES
// ===============================

// Şablona göre aktif çalışanları listele (periyot kontrolü ile)
router.get(
  '/template-workers/:templateId',
  auth,
  checkModulePermission('Bonus Değerlendirme'),
  async (req, res) => {
    try {
      const template = await BonusEvaluationTemplate.findById(
        req.params.templateId,
      );

      if (!template) {
        return res
          .status(404)
          .json({ success: false, message: 'Şablon bulunamadı' });
      }

      if (!template.aktif) {
        return res
          .status(400)
          .json({ success: false, message: 'Şablon aktif değil' });
      }

      // Get users with the template's role
      const users = await User.find({
        roller: template.rol,
        durum: 'aktif',
      })
        .populate('departmanlar', 'ad')
        .populate('roller', 'ad')
        .select('ad soyad kullaniciAdi departmanlar roller');

      // Her kullanıcı için periyot kontrolü yap
      const usersWithPeriodCheck = await Promise.all(
        users.map(async user => {
          // Son değerlendirmeyi bul
          const lastEvaluation = await BonusEvaluation.findOne({
            degerlendirilenKullanici: user._id,
            sablon: template._id,
          }).sort({ olusturmaTarihi: -1 });

          // Periyot kontrolü
          let canEvaluate = true;
          let nextEvaluationDate = null;
          let daysSinceLastEvaluation = null;

          if (lastEvaluation && template.degerlendirmePeriyodu) {
            const daysDiff = Math.floor(
              (new Date() - new Date(lastEvaluation.olusturmaTarihi)) /
                (1000 * 60 * 60 * 24),
            );
            daysSinceLastEvaluation = daysDiff;

            if (daysDiff < template.degerlendirmePeriyodu) {
              canEvaluate = false;
              nextEvaluationDate = new Date(
                lastEvaluation.olusturmaTarihi.getTime() +
                  template.degerlendirmePeriyodu * 24 * 60 * 60 * 1000,
              );
            }
          }

          return {
            _id: user._id,
            ad: user.ad,
            soyad: user.soyad,
            kullaniciAdi: user.kullaniciAdi,
            departman:
              user.departmanlar && user.departmanlar.length > 0
                ? user.departmanlar[0]
                : null,
            departmanlar: user.departmanlar,
            roller: user.roller,
            canEvaluate,
            lastEvaluation: lastEvaluation
              ? {
                tarih: lastEvaluation.olusturmaTarihi,
                toplamPuan: lastEvaluation.toplamPuan,
                basariYuzdesi: lastEvaluation.basariYuzdesi,
              }
              : null,
            nextEvaluationDate,
            daysSinceLastEvaluation,
            periodMessage: canEvaluate
              ? 'Değerlendirilebilir'
              : `${
                template.degerlendirmePeriyodu - daysSinceLastEvaluation
              } gün sonra değerlendirilebilir`,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          template: {
            _id: template._id,
            ad: template.ad,
            aciklama: template.aciklama,
            rol: template.rol,
            degerlendirmePeriyodu: template.degerlendirmePeriyodu,
            bonusKategorisi: template.bonusKategorisi,
            bonusKatsayisi: template.bonusKatsayisi,
            maddeler: template.maddeler,
          },
          workers: usersWithPeriodCheck,
          totalWorkers: usersWithPeriodCheck.length,
          evaluableWorkers: usersWithPeriodCheck.filter(w => w.canEvaluate)
            .length,
        },
      });
    } catch (error) {
      console.error('Template workers error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Kullanıcının değerlendirme geçmişini getir
router.get(
  '/user-evaluations/:userId/:templateId',
  auth,
  checkModulePermission('Bonus Değerlendirme'),
  async (req, res) => {
    try {
      const { userId, templateId } = req.params;

      const evaluations = await BonusEvaluation.find({
        degerlendirilenKullanici: userId,
        sablon: templateId,
      })
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('onaylayanKullanici', 'ad soyad')
        .sort({ olusturmaTarihi: -1 })
        .limit(10);

      const template = await BonusEvaluationTemplate.findById(templateId);
      const user = await User.findById(userId).select('ad soyad kullaniciAdi');

      res.json({
        success: true,
        data: {
          user,
          template: {
            ad: template?.ad,
            degerlendirmePeriyodu: template?.degerlendirmePeriyodu,
          },
          evaluations,
          totalEvaluations: evaluations.length,
        },
      });
    } catch (error) {
      console.error('User evaluations error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Periyot kontrolü endpoint'i
router.get(
  '/period-check/:templateId/:userId',
  auth,
  checkModulePermission('Bonus Değerlendirme'),
  async (req, res) => {
    try {
      const { templateId, userId } = req.params;

      const template = await BonusEvaluationTemplate.findById(templateId);
      if (!template) {
        return res
          .status(404)
          .json({ success: false, message: 'Şablon bulunamadı' });
      }

      const lastEvaluation = await BonusEvaluation.findOne({
        degerlendirilenKullanici: userId,
        sablon: templateId,
      }).sort({ olusturmaTarihi: -1 });

      let canEvaluate = true;
      let message = 'Değerlendirme yapılabilir';
      let nextEvaluationDate = null;
      let remainingDays = null;

      if (lastEvaluation && template.degerlendirmePeriyodu) {
        const daysDiff = Math.floor(
          (new Date() - new Date(lastEvaluation.olusturmaTarihi)) /
            (1000 * 60 * 60 * 24),
        );

        if (daysDiff < template.degerlendirmePeriyodu) {
          canEvaluate = false;
          remainingDays = template.degerlendirmePeriyodu - daysDiff;
          nextEvaluationDate = new Date(
            lastEvaluation.olusturmaTarihi.getTime() +
              template.degerlendirmePeriyodu * 24 * 60 * 60 * 1000,
          );
          message = `Bu personel ${remainingDays} gün önce değerlendirilmiş. ${remainingDays} gün sonra tekrar değerlendirilebilir.`;
        }
      }

      res.json({
        success: true,
        data: {
          canEvaluate,
          message,
          nextEvaluationDate,
          remainingDays,
          lastEvaluation: lastEvaluation
            ? {
              tarih: lastEvaluation.olusturmaTarihi,
              toplamPuan: lastEvaluation.toplamPuan,
              basariYuzdesi: lastEvaluation.basariYuzdesi,
            }
            : null,
          templatePeriod: template.degerlendirmePeriyodu,
        },
      });
    } catch (error) {
      console.error('Period check error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Şablona göre aktif çalışanları listele
router.get(
  '/active-workers/:templateId',
  auth,
  checkModulePermission('Bonus Değerlendirme'),
  async (req, res) => {
    try {
      const template = await BonusEvaluationTemplate.findById(
        req.params.templateId,
      );

      if (!template) {
        return res
          .status(404)
          .json({ success: false, message: 'Şablon bulunamadı' });
      }

      // Get users with the template's role
      const users = await User.find({
        roller: template.rol,
        durum: 'aktif',
      })
        .populate('departmanlar', 'ad')
        .populate('roller', 'ad')
        .select('ad soyad email departmanlar roller');

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Active workers error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Yeni değerlendirme oluştur
router.post(
  '/evaluations',
  auth,
  checkModulePermission('Bonus Değerlendirme'),
  async (req, res) => {
    try {
      const evaluationData = {
        ...req.body,
        degerlendirenKullanici: req.user.id,
      };

      const evaluation = new BonusEvaluation(evaluationData);
      await evaluation.save();

      const populatedEvaluation = await BonusEvaluation.findById(evaluation._id)
        .populate('degerlendirilenKullanici', 'ad soyad')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('sablon', 'ad');

      res.status(201).json({
        success: true,
        message: 'Bonus değerlendirme başarıyla oluşturuldu',
        data: populatedEvaluation,
      });
    } catch (error) {
      console.error('Bonus evaluation create error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Değerlendirmeleri listele
router.get(
  '/evaluations',
  auth,
  checkModulePermission([
    'Bonus Değerlendirme',
    'Bonus Değerlendirme Yönetimi',
  ]),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        sablon,
        degerlendirilenKullanici,
        bonusOnayi,
        degerlendirmeDonemi,
      } = req.query;

      const query = {};
      if (sablon) {
        query.sablon = sablon;
      }
      if (degerlendirilenKullanici) {
        query.degerlendirilenKullanici = degerlendirilenKullanici;
      }
      if (bonusOnayi) {
        query.bonusOnayi = bonusOnayi;
      }
      if (degerlendirmeDonemi) {
        query.degerlendirmeDonemi = degerlendirmeDonemi;
      }

      const evaluations = await BonusEvaluation.find(query)
        .populate('degerlendirilenKullanici', 'ad soyad')
        .populate('degerlendirenKullanici', 'ad soyad')
        .populate('sablon', 'ad bonusKategorisi')
        .populate('onaylayanKullanici', 'ad soyad')
        .sort({ degerlendirmeTarihi: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await BonusEvaluation.countDocuments(query);

      res.json({
        success: true,
        data: evaluations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Bonus evaluation list error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

// Dashboard özet bilgileri
router.get(
  '/dashboard/summary',
  auth,
  checkModulePermission('Bonus Değerlendirme'),
  async (req, res) => {
    try {
      // Bu ay yapılan değerlendirmeler
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyEvaluations = await BonusEvaluation.countDocuments({
        degerlendirmeTarihi: { $gte: thisMonth },
      });

      // Aktif şablonlar
      const activeTemplates = await BonusEvaluationTemplate.countDocuments({
        aktif: true,
      });

      // Onay bekleyen bonus'lar
      const pendingApprovals = await BonusEvaluation.countDocuments({
        bonusOnayi: 'Beklemede',
      });

      // Ortalama başarı yüzdesi (bu ay)
      const avgScoreResult = await BonusEvaluation.aggregate([
        { $match: { degerlendirmeTarihi: { $gte: thisMonth } } },
        { $group: { _id: null, avgScore: { $avg: '$basariYuzdesi' } } },
      ]);

      const avgScore =
        avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

      res.json({
        success: true,
        data: {
          monthlyEvaluations,
          activeTemplates,
          pendingApprovals,
          avgScore: Math.round(avgScore * 100) / 100,
        },
      });
    } catch (error) {
      console.error('Bonus dashboard summary error:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  },
);

module.exports = router;
