const QualityControlTemplate = require('../models/QualityControlTemplate');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const { validateTemplateSchedule } = require('../utils/timeValidation');
const {
  createTemplateWithOrder,
  formatTemplateResponse,
} = require('../utils/qualityControlHelpers');

/**
 * Tüm şablonları getir (admin için)
 */
const getAllTemplates = async (req, res) => {
  try {
    const templates = await QualityControlTemplate.find()
      .populate('rol', 'ad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort('-createdAt');

    res.json(templates);
  } catch (error) {
    console.error('Template listing error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Aktif şablonları getir - zaman kontrolü ile
 */
const getActiveTemplates = async (req, res) => {
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

    // Saat kontrolü yap
    const availableTemplates = templates.filter(template => {
      return validateTemplateSchedule(template, currentHour, currentMinute);
    });

    console.log(
      `📋 ${templates.length} şablondan ${availableTemplates.length} tanesi şu anda kullanılabilir`,
    );

    res.json(availableTemplates);
  } catch (error) {
    console.error('Active templates error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Debug endpoint - tüm şablonları zaman bilgisi ile göster
 */
const getDebugTemplates = async (req, res) => {
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
        template.degerlendirmeSaatleri &&
        template.degerlendirmeSaatleri.length > 0;
      const isCurrentlyAvailable = validateTemplateSchedule(
        template,
        currentHour,
        currentMinute,
      );

      const availabilityInfo = hasTimeRestrictions
        ? isCurrentlyAvailable
          ? 'Şu anda kullanılabilir'
          : 'Değerlendirme saati dışında'
        : 'Her zaman kullanılabilir';

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
    console.error('Debug templates error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Şablon detayı getir
 */
const getTemplateById = async (req, res) => {
  try {
    const template = await QualityControlTemplate.findById(req.params.id)
      .populate('rol', 'ad')
      .populate('olusturanKullanici', 'ad soyad');

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error('Template detail error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Role göre aktif şablon getir
 */
const getTemplateByRole = async (req, res) => {
  try {
    const template = await QualityControlTemplate.findOne({
      rol: req.params.roleId,
      aktif: true,
    })
      .populate('rol', 'ad')
      .sort('-createdAt');

    if (!template) {
      return res.status(404).json({
        message: 'Bu rol için aktif şablon bulunamadı',
      });
    }

    res.json(template);
  } catch (error) {
    console.error('Template by role error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Yeni şablon oluştur
 */
const createTemplate = async (req, res) => {
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

    const templateData = createTemplateWithOrder({
      ad,
      rol,
      maddeler,
      degerlendirmeSaatleri: degerlendirmeSaatleri || [],
      degerlendirmeSikligi: degerlendirmeSikligi || 'Günlük',
      degerlendirmeGunleri: degerlendirmeGunleri || [],
      degerlendirmePeriyodu: degerlendirmePeriyodu || 2,
      olusturanKullanici: req.user.id,
    });

    const template = new QualityControlTemplate(templateData);
    await template.save();
    await template.populate('rol', 'ad');

    console.log(
      `✅ Yeni şablon oluşturuldu: "${ad}" - ${degerlendirmeSaatleri?.length || 0} saat, ${degerlendirmePeriyodu || 2}h periyot`,
    );

    res.json(formatTemplateResponse(template));
  } catch (error) {
    console.error('Template creation error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Şablon güncelle
 */
const updateTemplate = async (req, res) => {
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

    const updatedData = createTemplateWithOrder({
      ad,
      rol,
      maddeler,
      aktif,
      degerlendirmeSaatleri: degerlendirmeSaatleri || [],
      degerlendirmeSikligi: degerlendirmeSikligi || 'Günlük',
      degerlendirmeGunleri: degerlendirmeGunleri || [],
      degerlendirmePeriyodu: degerlendirmePeriyodu || 2,
      guncelleyenKullanici: req.user.id,
    });

    Object.assign(template, updatedData);
    await template.save();
    await template.populate('rol', 'ad');

    console.log(
      `🔄 Şablon güncellendi: "${ad}" - ${degerlendirmeSaatleri?.length || 0} saat, ${degerlendirmePeriyodu || 2}h periyot`,
    );

    res.json(formatTemplateResponse(template));
  } catch (error) {
    console.error('Template update error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Şablon sil - gelişmiş silme sistemi ile
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await QualityControlTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    // Kullanımda olup olmadığını kontrol et
    const usageCount = await QualityControlEvaluation.countDocuments({
      sablon: req.params.id,
    });

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
};

module.exports = {
  getAllTemplates,
  getActiveTemplates,
  getDebugTemplates,
  getTemplateById,
  getTemplateByRole,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
