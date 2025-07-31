/**
 * Score Calculations Utility
 * ScoreBreakdown.js'den ayrılan puan hesaplama fonksiyonları
 * Geçmiş problemler: NaN display, field mapping issues
 * Çözümler: Güvenli fallbacks, null checks, proper field mapping
 */

/**
 * İK toplam puanını güvenli şekilde hesapla
 * @param {Array} hrScores - HR scores array
 * @param {Object} ikFallback - Fallback ik object
 * @returns {number} Toplam İK puanı
 */
export const calculateIKTotalScore = (hrScores, ikFallback = {}) => {
  if (hrScores && hrScores.length > 0) {
    return hrScores.reduce((sum, score) => {
      // Farklı field isimlerini dene - geçmiş field mapping problemlerinden ders
      const puan = score.puan || score.toplamPuan || score.puanlar?.toplam || 0;
      return sum + (typeof puan === 'number' ? puan : 0);
    }, 0);
  }
  return ikFallback.toplam || 0;
};

/**
 * WorkTask toplam puanını güvenli şekilde hesapla
 * @param {Array} workTaskScores - WorkTask scores array
 * @param {Object} workTaskFallback - Fallback workTask object
 * @param {Object} checklistFallback - Fallback checklist object
 * @returns {number} Toplam WorkTask puanı
 */
export const calculateWorkTaskTotalScore = (
  workTaskScores,
  workTaskFallback = {},
  checklistFallback = {},
) => {
  if (workTaskScores && workTaskScores.length > 0) {
    return workTaskScores.reduce((sum, score) => {
      // WorkTask'ların puan yapısı - field mapping fix
      const puan =
        score.puan ||
        score.toplamPuan ||
        score.puanlar?.toplam ||
        score.puanlar?.alinan ||
        0;
      return sum + (typeof puan === 'number' ? puan : 0);
    }, 0);
  }
  return workTaskFallback.toplamPuan || checklistFallback.iseBagliGorevler || 0;
};

/**
 * Kalite Kontrol toplam puanını güvenli şekilde hesapla
 * @param {Array} qualityScores - Quality scores array
 * @param {Object} kaliteKontrolFallback - Fallback kaliteKontrol object
 * @returns {number} Toplam Kalite Kontrol puanı
 */
export const calculateQualityControlTotalScore = (
  qualityScores,
  kaliteKontrolFallback = {},
) => {
  if (qualityScores && qualityScores.length > 0) {
    return qualityScores.reduce((sum, score) => {
      const puan = score.puan || score.toplamPuan || score.puanlar?.toplam || 0;
      return sum + (typeof puan === 'number' ? puan : 0);
    }, 0);
  }
  return kaliteKontrolFallback.toplamPuan || 0;
};

/**
 * Bonus evaluations toplam puanını güvenli şekilde hesapla
 * @param {Array} bonusEvaluations - Bonus evaluations array
 * @returns {number} Toplam Bonus puanı
 */
export const calculateBonusTotalScore = bonusEvaluations => {
  if (bonusEvaluations && bonusEvaluations.length > 0) {
    return bonusEvaluations.reduce((sum, bonus) => {
      const puan = bonus.toplamPuan || bonus.puan || 0;
      return sum + (typeof puan === 'number' ? puan : 0);
    }, 0);
  }
  return 0;
};

/**
 * Kontrol puanlarını güvenli şekilde hesapla
 * @param {Object} checklistSablonlari - Checklist templates object
 * @param {Object} kontrol - Kontrol object
 * @returns {number} Toplam Kontrol puanı
 */
export const calculateControlScore = (
  checklistSablonlari = {},
  kontrol = {},
) => {
  const rutinGorevler = checklistSablonlari.rutinGorevler || 0;
  const kontrolPuani = kontrol.toplamPuan || 0;
  return (
    (typeof rutinGorevler === 'number' ? rutinGorevler : 0) +
    (typeof kontrolPuani === 'number' ? kontrolPuani : 0)
  );
};

/**
 * Kontrol kartı puanını güvenli şekilde hesapla
 * @param {Object} controlSummary - Control summary object
 * @returns {number} Kontrol kartı puanı
 */
export const calculateControlCardScore = controlSummary => {
  return controlSummary?.genel?.toplamPuan || 0;
};

/**
 * Toplam görev sayısını güvenli şekilde hesapla
 * @param {Object} params - Calculation parameters
 * @returns {number} Toplam görev sayısı
 */
export const calculateTotalTaskCount = ({
  hrScores,
  qualityScores,
  workTaskScores,
  bonusEvaluations,
  ik = {},
  kaliteKontrol = {},
  workTask = {},
  kontrol = {},
  checklistSablonlari = {},
  controlSummary,
}) => {
  const hrCount = hrScores?.length || ik.gorevSayisi || 0;
  const qualityCount = qualityScores?.length || kaliteKontrol.gorevSayisi || 0;
  const workTaskCount = workTaskScores?.length || workTask.gorevSayisi || 0;
  const bonusCount = bonusEvaluations?.length || 0;
  const kontrolCount =
    kontrol?.gorevSayisi || checklistSablonlari?.rutinGorevler || 0;
  const controlCardCount = controlSummary?.genel?.kontrolSayisi || 0;

  return (
    hrCount +
    qualityCount +
    workTaskCount +
    bonusCount +
    kontrolCount +
    controlCardCount
  );
};

/**
 * Genel toplam puanı hesapla (tüm kategoriler dahil)
 * @param {Object} scores - Tüm puan kategorileri
 * @returns {Object} Düzeltilmiş genel toplam
 */
export const calculateGrandTotal = scores => {
  const {
    ikToplamPuan = 0,
    kaliteKontrolToplamPuan = 0,
    workTaskToplamPuan = 0,
    kontrolToplamPuan = 0,
    kontrolKartiPuani = 0,
    bonusToplamPuan = 0,
    toplamGorevSayisi = 0,
    genelToplam = {},
  } = scores;

  const toplamPuan =
    ikToplamPuan +
    kaliteKontrolToplamPuan +
    workTaskToplamPuan +
    kontrolToplamPuan +
    kontrolKartiPuani +
    bonusToplamPuan;

  return {
    ...genelToplam,
    tumPuanlar: toplamPuan,
    tumGorevler: toplamGorevSayisi,
    ortalamaPuan: toplamGorevSayisi > 0 ? toplamPuan / toplamGorevSayisi : 0,
  };
};

/**
 * Ortalama puan hesapla (NaN prevention)
 * @param {number} toplamPuan - Toplam puan
 * @param {number} gorevSayisi - Görev sayısı
 * @returns {number} Güvenli ortalama puan
 */
export const calculateSafeAverage = (toplamPuan, gorevSayisi) => {
  if (!gorevSayisi || gorevSayisi === 0) {
    return 0;
  }
  if (!toplamPuan || typeof toplamPuan !== 'number') {
    return 0;
  }

  const average = toplamPuan / gorevSayisi;
  return isNaN(average) ? 0 : average;
};

/**
 * Development debug logging (sadece development'ta çalışır)
 * @param {string} category - Debug kategorisi
 * @param {Object} data - Debug verileri
 */
export const debugScoreCalculation = (category, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${category}:`, data);
  }
};
