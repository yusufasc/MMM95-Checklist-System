const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const KalipDegisimEvaluation = require('../models/KalipDegisimEvaluation');
const WorkTask = require('../models/WorkTask');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const User = require('../models/User');
// const Role = require('../models/Role'); // Unused import

// GET /api/kalip-degisim-evaluation/evaluation-templates - Değerlendirme şablonlarını getir
router.get('/evaluation-templates', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Kullanıcının rollerini getir
    const user = await User.findById(userId).populate('roller');
    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }

    const userRoles = user.roller.map(role => role.ad);

    // MAKİNA AYARLARI şablonlarını getir
    const templates = await ChecklistTemplate.find({
      ad: { $in: ['MAKİNA AYARLARI 1', 'MAKİNA AYARLARI 2'] },
      aktif: true,
    }).populate('degerlendirmeRolleri', 'ad');

    // Kullanıcının erişebileceği şablonları filtrele
    const accessibleTemplates = templates.filter(template => {
      const templateRoles = template.degerlendirmeRolleri.map(role => role.ad);
      return userRoles.some(role => templateRoles.includes(role));
    });

    // Şablon tipini belirle
    const templatesWithType = accessibleTemplates.map(template => {
      let degerlendirmeTipi = 'DEGERLENDIRME_1';
      if (template.ad.includes('2')) {
        degerlendirmeTipi = 'DEGERLENDIRME_2';
      }

      return {
        ...template.toObject(),
        degerlendirmeTipi,
      };
    });

    console.log(
      '🔍 Backend - Templates döndürülüyor:',
      templatesWithType.map(t => ({
        ad: t.ad,
        degerlendirmeTipi: t.degerlendirmeTipi,
      })),
    );
    res.json(templatesWithType);
  } catch (error) {
    console.error('❌ Değerlendirme şablonları getirme hatası:', error);
    res.status(500).json({ msg: 'Sunucu hatası', error: error.message });
  }
});

// GET /api/kalip-degisim-evaluation/worktask-status/:workTaskId - WorkTask değerlendirme durumu
router.get('/worktask-status/:workTaskId', auth, async (req, res) => {
  try {
    const { workTaskId } = req.params;

    // Bu WorkTask için yapılmış değerlendirmeleri kontrol et
    const evaluations = await KalipDegisimEvaluation.find({
      workTask: workTaskId,
      aktif: true,
    });

    const status = {
      DEGERLENDIRME_1: evaluations.some(
        e => e.degerlendirmeTipi === 'DEGERLENDIRME_1',
      ),
      DEGERLENDIRME_2: evaluations.some(
        e => e.degerlendirmeTipi === 'DEGERLENDIRME_2',
      ),
    };

    res.json(status);
  } catch (error) {
    console.error('❌ WorkTask durum kontrolü hatası:', error);
    res.status(500).json({ msg: 'Sunucu hatası', error: error.message });
  }
});

// POST /api/kalip-degisim-evaluation/evaluate - Yeni değerlendirme yap
router.post('/evaluate', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workTaskId, templateId, degerlendirmeTipi, maddeler, genelYorum } =
      req.body;

    console.log('📥 Backend - Gelen request body:', req.body);
    console.log('📥 Backend - workTaskId:', workTaskId);
    console.log('📥 Backend - templateId:', templateId);
    console.log('📥 Backend - degerlendirmeTipi:', degerlendirmeTipi);
    console.log('📥 Backend - maddeler:', maddeler);
    console.log('📥 Backend - genelYorum:', genelYorum);
    console.log('📥 Backend - buddyId (frontend):', req.body.buddyId);

    // Validation
    if (!workTaskId || !templateId || !degerlendirmeTipi || !maddeler) {
      console.log('❌ Validation hatası - Eksik alanlar:', {
        workTaskId: !!workTaskId,
        templateId: !!templateId,
        degerlendirmeTipi: !!degerlendirmeTipi,
        maddeler: !!maddeler,
      });
      return res.status(400).json({ msg: 'Eksik zorunlu alanlar' });
    }

    console.log('✅ Validation geçti, WorkTask aranıyor...');

    // WorkTask kontrolü
    const workTask = await WorkTask.findById(workTaskId)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi')
      .populate('makina', 'ad');

    console.log('🔍 WorkTask bulma sonucu:', !!workTask);
    if (workTask) {
      console.log('✅ WorkTask bulundu:', {
        id: workTask._id,
        kullanici: workTask.kullanici?.kullaniciAdi,
        makina: workTask.makina?.ad,
        makinaId: workTask.makina?._id,
        makinaType: workTask.makina?.constructor?.modelName,
      });
    }

    if (!workTask) {
      console.log('❌ WorkTask bulunamadı - ID:', workTaskId);
      return res.status(404).json({ msg: 'WorkTask bulunamadı' });
    }

    // Template kontrolü ve yetki kontrolü
    console.log('🔍 Template aranıyor - ID:', templateId);
    const template = await ChecklistTemplate.findById(templateId).populate(
      'degerlendirmeRolleri',
    );
    console.log('🔍 Template bulma sonucu:', !!template);
    if (template) {
      console.log('✅ Template bulundu:', {
        id: template._id,
        ad: template.ad,
        roller: template.degerlendirmeRolleri?.length,
      });
    }
    if (!template) {
      console.log('❌ Template bulunamadı - ID:', templateId);
      return res.status(404).json({ msg: 'Şablon bulunamadı' });
    }

    console.log('🔍 Yetki kontrolü başlıyor...');
    const user = await User.findById(userId).populate('roller');
    const userRoleIds = user.roller.map(role => role._id.toString());
    const templateRoleIds = template.degerlendirmeRolleri.map(role =>
      role._id.toString(),
    );

    console.log('🔍 Yetki kontrolü:', {
      userId,
      userRoles: user.roller.map(r => r.ad),
      templateRoles: template.degerlendirmeRolleri.map(r => r.ad),
      userRoleIds,
      templateRoleIds,
    });

    const hasPermission = userRoleIds.some(roleId =>
      templateRoleIds.includes(roleId),
    );
    console.log('🔍 Yetki kontrolü sonucu:', hasPermission);

    if (!hasPermission) {
      console.log('❌ Yetki kontrolü başarısız');
      return res
        .status(403)
        .json({ msg: 'Bu değerlendirmeyi yapma yetkiniz yok' });
    }

    console.log('✅ Yetki kontrolü başarılı');

    // Duplicate kontrol
    console.log('🔍 Duplicate kontrol başlıyor...');
    const existingEvaluation = await KalipDegisimEvaluation.findOne({
      workTask: workTaskId,
      degerlendirmeTipi,
      aktif: true,
    });

    console.log('🔍 Duplicate kontrol sonucu:', {
      existingEvaluation: !!existingEvaluation,
      workTaskId,
      degerlendirmeTipi,
    });

    if (existingEvaluation) {
      console.log('❌ Duplicate evaluation bulundu - Güncelleme yapılacak');

      // Mevcut değerlendirmeyi güncelle
      let anaCalısanToplamPuan = 0;
      let buddyToplamPuan = 0;
      let maxToplamPuan = 0;

      const processedMaddeler = maddeler.map(madde => {
        anaCalısanToplamPuan += madde.verilenPuan;
        if (workTask.kalipDegisimBuddy) {
          buddyToplamPuan += madde.verilenPuan;
        }
        maxToplamPuan += madde.maxPuan;

        return {
          maddeId: madde.maddeId,
          soru: madde.soru,
          maxPuan: madde.maxPuan,
          verilenPuan: madde.verilenPuan,
          yorum: madde.yorum || '',
          resimUrl: madde.resimUrl || '',
        };
      });

      // Mevcut değerlendirmeyi güncelle
      existingEvaluation.maddeler = processedMaddeler;
      existingEvaluation.anaCalısanToplamPuan = anaCalısanToplamPuan;
      existingEvaluation.buddyToplamPuan = buddyToplamPuan;
      existingEvaluation.maxToplamPuan = maxToplamPuan;
      existingEvaluation.genelYorum = genelYorum || '';
      existingEvaluation.degerlendirmeTarihi = new Date();
      existingEvaluation.degerlendiren = userId;

      await existingEvaluation.save();

      console.log('✅ Mevcut değerlendirme güncellendi');

      return res.json({
        msg: 'Değerlendirme başarıyla güncellendi',
        evaluation: existingEvaluation,
        anaCalisan: {
          ad: workTask.kullanici.ad,
          soyad: workTask.kullanici.soyad,
          puan: anaCalısanToplamPuan,
        },
        buddy: workTask.kalipDegisimBuddy
          ? {
            ad: workTask.kalipDegisimBuddy.ad,
            soyad: workTask.kalipDegisimBuddy.soyad,
            puan: buddyToplamPuan,
          }
          : null,
      });
    }

    console.log('✅ Duplicate kontrol başarılı');

    // Puanları hesapla
    let anaCalısanToplamPuan = 0;
    let buddyToplamPuan = 0;
    let maxToplamPuan = 0;

    console.log('🔍 Buddy kontrolü:', {
      kalipDegisimBuddy: !!workTask.kalipDegisimBuddy,
      buddyId: workTask.kalipDegisimBuddy?._id,
      frontendBuddyId: req.body.buddyId,
    });

    const processedMaddeler = maddeler.map(madde => {
      anaCalısanToplamPuan += madde.verilenPuan;
      // Buddy varsa aynı puanı alır
      if (workTask.kalipDegisimBuddy) {
        buddyToplamPuan += madde.verilenPuan;
      }
      maxToplamPuan += madde.maxPuan;

      return {
        maddeId: madde.maddeId,
        soru: madde.soru,
        maxPuan: madde.maxPuan,
        verilenPuan: madde.verilenPuan,
        yorum: madde.yorum || '',
        resimUrl: madde.resimUrl || '',
      };
    });

    // Değerlendirme kaydet
    const evaluation = new KalipDegisimEvaluation({
      workTask: workTaskId,
      checklistTemplate: templateId,
      degerlendiren: userId,
      anaCalisan: workTask.kullanici._id,
      buddyCalisan: workTask.kalipDegisimBuddy?._id,
      makina: workTask.makina._id,
      maddeler: processedMaddeler,
      anaCalısanToplamPuan,
      buddyToplamPuan,
      maxToplamPuan,
      degerlendirmeTipi,
      genelYorum: genelYorum || '',
    });

    await evaluation.save();

    res.json({
      msg: 'Değerlendirme başarıyla kaydedildi',
      evaluation,
      anaCalisan: {
        ad: workTask.kullanici.ad,
        soyad: workTask.kullanici.soyad,
        puan: anaCalısanToplamPuan,
      },
      buddy: workTask.kalipDegisimBuddy
        ? {
          ad: workTask.kalipDegisimBuddy.ad,
          soyad: workTask.kalipDegisimBuddy.soyad,
          puan: buddyToplamPuan,
        }
        : null,
    });
  } catch (error) {
    console.error('❌ Değerlendirme kaydetme hatası:', error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ msg: 'Bu değerlendirme daha önce yapılmış' });
    }
    res.status(500).json({ msg: 'Sunucu hatası', error: error.message });
  }
});

// GET /api/kalip-degisim-evaluation/my-evaluations - Kullanıcının yaptığı değerlendirmeler
router.get('/my-evaluations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const evaluations = await KalipDegisimEvaluation.find({
      degerlendiren: userId,
      aktif: true,
    })
      .populate('workTask')
      .populate('checklistTemplate', 'ad')
      .populate('anaCalisan', 'ad soyad kullaniciAdi')
      .populate('buddyCalisan', 'ad soyad kullaniciAdi')
      .populate('makina', 'ad')
      .sort({ degerlendirmeTarihi: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await KalipDegisimEvaluation.countDocuments({
      degerlendiren: userId,
      aktif: true,
    });

    res.json({
      evaluations,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Değerlendirmeler getirme hatası:', error);
    res.status(500).json({ msg: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;
