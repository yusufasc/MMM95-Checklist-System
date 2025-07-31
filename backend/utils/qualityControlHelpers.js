const QualityControlEvaluation = require('../models/QualityControlEvaluation');

/**
 * Tarih aralıklarını hesapla (bugün başlangıcı ve 4 saat öncesi)
 */
const getDateRanges = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const fourHoursAgo = new Date();
  fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

  return { todayStart, fourHoursAgo };
};

/**
 * Son 4 saat içinde değerlendirme kontrolü
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<Object>} - Kontrol sonucu
 */
const checkRecentEvaluation = async userId => {
  const fourHoursAgo = new Date();
  fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

  const recentEvaluation = await QualityControlEvaluation.findOne({
    degerlendirilenKullanici: userId,
    degerlendirmeTarihi: { $gte: fourHoursAgo },
  }).sort('-degerlendirmeTarihi');

  if (recentEvaluation) {
    const timeDiff =
      new Date().getTime() -
      new Date(recentEvaluation.degerlendirmeTarihi).getTime();
    const hoursLeft = Math.ceil(
      (4 * 60 * 60 * 1000 - timeDiff) / (60 * 60 * 1000),
    );

    return {
      hasRecent: true,
      message: `Bu çalışan ${hoursLeft} saat sonra tekrar puanlanabilir`,
    };
  }

  return { hasRecent: false };
};

/**
 * Mevcut vardiyayı belirle
 * @returns {string} - Vardiya adı
 */
const determineCurrentShift = () => {
  const currentHour = new Date().getHours();

  if (currentHour >= 6 && currentHour < 14) {
    return 'Sabah';
  } else if (currentHour >= 14 && currentHour < 22) {
    return 'Öğle';
  } else {
    return 'Gece';
  }
};

/**
 * Şablon için sıralı maddeler oluştur
 * @param {Object} templateData - Şablon verisi
 * @returns {Object} - Sıralı maddeler ile template verisi
 */
const createTemplateWithOrder = templateData => {
  const { maddeler, ...rest } = templateData;

  // Maddelere sıra numarası ekle
  const maddelerWithOrder = maddeler.map((madde, index) => ({
    ...madde,
    siraNo: index + 1,
  }));

  return {
    ...rest,
    maddeler: maddelerWithOrder,
  };
};

/**
 * Template response formatla
 * @param {Object} template - Template instance
 * @returns {Object} - Formatted template
 */
const formatTemplateResponse = template => {
  return template.toObject ? template.toObject() : template;
};

/**
 * Evaluation data oluştur
 * @param {Object} params - Evaluation parametreleri
 * @returns {Object} - Evaluation data
 */
const createEvaluationData = ({
  degerlendirilenKullanici,
  degerlendirenKullanici,
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
}) => {
  // Puanlamaları backend formatına çevir
  const puanlamalar = maddeler.map((madde, index) => {
    const templateMadde = template.maddeler[index];
    return {
      maddeId: index.toString(),
      maddeBaslik: templateMadde ? templateMadde.baslik : madde.baslik,
      puan: madde.alinanPuan || 0,
      maksimumPuan: templateMadde
        ? templateMadde.maksimumPuan
        : madde.maksimumPuan,
      aciklama: madde.yorum || '',
      fotograflar: madde.fotografUrl ? [madde.fotografUrl] : [],
    };
  });

  const evaluationData = {
    degerlendirilenKullanici,
    degerlendirenKullanici,
    sablon,
    vardiya,
    puanlamalar,
    toplamPuan: toplamPuan || 0,
    maksimumPuan: maksimumToplamPuan || 0,
    basariYuzdesi:
      maksimumToplamPuan > 0
        ? Math.round((toplamPuan / maksimumToplamPuan) * 100)
        : 0,
    notlar: genelYorum || '',
    durum: 'Tamamlandı',
  };

  // Opsiyonel alanları ekle
  if (makina) {
    evaluationData.makina = makina;
  }
  if (kalip) {
    evaluationData.kalip = kalip;
  }
  if (hammadde) {
    evaluationData.hammadde = hammadde;
  }

  return evaluationData;
};

/**
 * Evaluation filter oluştur
 * @param {Object} params - Filter parametreleri
 * @returns {Object} - MongoDB filter
 */
const buildEvaluationFilter = ({
  kullanici,
  tarihBaslangic,
  tarihBitis,
  durum,
}) => {
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

  return filter;
};

/**
 * Tarih filtresi oluştur (istatistikler için)
 * @param {string} tarihBaslangic - Başlangıç tarihi
 * @param {string} tarihBitis - Bitiş tarihi
 * @returns {Object} - MongoDB date filter
 */
const buildDateFilter = (tarihBaslangic, tarihBitis) => {
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

  return dateFilter;
};

/**
 * Kullanıcı performans bilgilerini hesapla
 * @param {Object} evaluationData - Değerlendirme verisi
 * @returns {Object} - Performans bilgileri
 */
const calculateUserPerformance = evaluationData => {
  if (!evaluationData) {
    return {
      puanlanabilir: true,
      puanlanamaSebebi: null,
    };
  }

  const timeDiff =
    new Date().getTime() - new Date(evaluationData.sonDegerlendirme).getTime();
  const hoursDiff = timeDiff / (60 * 60 * 1000);

  if (hoursDiff <= 4) {
    return {
      puanlanabilir: false,
      puanlanamaSebebi: `Son değerlendirmeden ${hoursDiff.toFixed(1)} saat geçti (4 saat gerekli)`,
    };
  }

  return {
    puanlanabilir: true,
    puanlanamaSebebi: null,
  };
};

/**
 * Değerlendirme summary oluştur
 * @param {Array} workers - İşçi listesi
 * @returns {Object} - Özet bilgiler
 */
const createWorkerSummary = workers => {
  const puanlanabilirSayisi = workers.filter(w => w.puanlanabilir).length;
  const puanlanamayacakSayisi = workers.filter(w => !w.puanlanabilir).length;

  return {
    toplamCalisanSayisi: workers.length,
    puanlanabilirSayisi,
    puanlanamayacakSayisi,
  };
};

/**
 * Error response oluştur
 * @param {string} message - Hata mesajı
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Error response
 */
const createErrorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Success response oluştur
 * @param {*} data - Response data
 * @param {string} message - Success mesajı
 * @returns {Object} - Success response
 */
const createSuccessResponse = (data, message = 'İşlem başarılı') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Array'i güvenli şekilde sırala
 * @param {Array} array - Sıralanacak array
 * @param {Function} sortFn - Sıralama fonksiyonu
 * @returns {Array} - Sıralanmış array
 */
const safeSortArray = (array, sortFn) => {
  if (!Array.isArray(array)) {
    return [];
  }

  return [...array].sort(sortFn);
};

/**
 * Object'i güvenli şekilde merge et
 * @param {Object} target - Hedef object
 * @param {Object} source - Kaynak object
 * @returns {Object} - Merge edilmiş object
 */
const safeMergeObjects = (target, source) => {
  return {
    ...target,
    ...source,
  };
};

module.exports = {
  getDateRanges,
  checkRecentEvaluation,
  determineCurrentShift,
  createTemplateWithOrder,
  formatTemplateResponse,
  createEvaluationData,
  buildEvaluationFilter,
  buildDateFilter,
  calculateUserPerformance,
  createWorkerSummary,
  createErrorResponse,
  createSuccessResponse,
  safeSortArray,
  safeMergeObjects,
};
