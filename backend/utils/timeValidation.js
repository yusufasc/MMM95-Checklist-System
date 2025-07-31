/**
 * Şablon zaman kısıtlamalarını kontrol et
 * @param {Object} template - QualityControlTemplate instance
 * @param {number} currentHour - Mevcut saat (0-23)
 * @param {number} currentMinute - Mevcut dakika (0-59)
 * @returns {boolean} - Şablon kullanılabilir mi?
 */
const validateTemplateSchedule = (template, currentHour, currentMinute) => {
  // Eğer değerlendirme saatleri tanımlanmışsa kontrol et
  if (
    template.degerlendirmeSaatleri &&
    template.degerlendirmeSaatleri.length > 0
  ) {
    const isInEvaluationPeriod = template.degerlendirmeSaatleri.some(
      saatObj => {
        const [templateHour, templateMinute] = saatObj.saat
          .split(':')
          .map(Number);
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
      },
    );

    if (!isInEvaluationPeriod) {
      console.log(
        `⏰ Şablon "${template.ad}" şu anda değerlendirme periyodu dışında`,
      );
      return false;
    }

    return true;
  }

  // Saat tanımlanmamışsa her zaman kullanılabilir
  console.log(
    `🔓 Şablon "${template.ad}" her zaman kullanılabilir (saat kısıtı yok)`,
  );
  return true;
};

/**
 * Zaman aralığı hesaplama
 * @param {number} hours - Saat sayısı
 * @returns {Date} - Belirtilen saat kadar önceki tarih
 */
const getTimeAgo = hours => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

/**
 * Günün başlangıcını getir
 * @returns {Date} - Bugünün 00:00:00
 */
const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Zaman formatı doğrulama
 * @param {string} timeString - HH:MM formatında zaman
 * @returns {boolean} - Geçerli format mi?
 */
const isValidTimeFormat = timeString => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * İki zaman arasındaki farkı dakika olarak hesapla
 * @param {string} time1 - HH:MM formatında zaman
 * @param {string} time2 - HH:MM formatında zaman
 * @returns {number} - Dakika cinsinden fark
 */
const getTimeDifferenceInMinutes = (time1, time2) => {
  const [hour1, minute1] = time1.split(':').map(Number);
  const [hour2, minute2] = time2.split(':').map(Number);

  const minutes1 = hour1 * 60 + minute1;
  const minutes2 = hour2 * 60 + minute2;

  return Math.abs(minutes2 - minutes1);
};

/**
 * Mevcut saati HH:MM formatında getir
 * @returns {string} - HH:MM formatında mevcut saat
 */
const getCurrentTimeString = () => {
  const now = new Date();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

module.exports = {
  validateTemplateSchedule,
  getTimeAgo,
  getTodayStart,
  isValidTimeFormat,
  getTimeDifferenceInMinutes,
  getCurrentTimeString,
};
