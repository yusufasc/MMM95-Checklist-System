const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const QualityControlTemplate = require('../models/QualityControlTemplate');
const {
  checkRecentEvaluation,
  determineCurrentShift,
  createEvaluationData,
  buildEvaluationFilter,
} = require('../utils/qualityControlHelpers');

/**
 * Yeni değerlendirme oluştur
 */
const createEvaluation = async (req, res) => {
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
    const recentEvaluationCheck = await checkRecentEvaluation(
      degerlendirilenKullanici,
    );
    if (recentEvaluationCheck.hasRecent) {
      return res.status(400).json({
        message: recentEvaluationCheck.message,
      });
    }

    // Şablon verilerini al
    const template =
      await QualityControlTemplate.findById(sablon).populate('maddeler');
    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    console.log(
      '📋 Şablon maddeler:',
      template.maddeler.map(m => ({
        baslik: m.baslik,
        maksimumPuan: m.maksimumPuan,
      })),
    );

    // Vardiya belirleme
    const vardiya = determineCurrentShift();

    // Evaluation data oluştur
    const evaluationData = createEvaluationData({
      degerlendirilenKullanici,
      degerlendirenKullanici: req.user.id,
      sablon,
      vardiya,
      maddeler,
      template,
      toplamPuan,
      maksimumToplamPuan,
      genelYorum,
      makina,
      kalip,
      hammadde,
    });

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
    res.status(500).json({
      message: 'Değerlendirme kaydedilirken hata oluştu: ' + error.message,
    });
  }
};

/**
 * Değerlendirmeleri listele - filtering ile
 */
const getEvaluations = async (req, res) => {
  try {
    const { kullanici, tarihBaslangic, tarihBitis, durum } = req.query;

    const filter = buildEvaluationFilter({
      kullanici,
      tarihBaslangic,
      tarihBitis,
      durum,
    });

    const evaluations = await QualityControlEvaluation.find(filter)
      .populate('degerlendirilenKullanici', 'ad soyad')
      .populate('degerlendirenKullanici', 'ad soyad')
      .populate('sablon', 'ad')
      .populate('makina', 'kod ad')
      .populate('kalip', 'kod ad')
      .sort('-degerlendirmeTarihi');

    res.json(evaluations);
  } catch (error) {
    console.error('Evaluation listing error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Değerlendirme detayı getir
 */
const getEvaluationById = async (req, res) => {
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
    console.error('Evaluation detail error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
};
