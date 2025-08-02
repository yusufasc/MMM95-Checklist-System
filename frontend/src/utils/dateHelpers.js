import { format, formatDistance, isToday, isYesterday, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Date Helper Functions
 * Tarih formatlama ve hesaplama yardımcı fonksiyonları
 */

/**
 * Tarihi Türkçe formatta gösterir
 * @param {string|Date} date - Tarih
 * @param {string} formatStr - Format string (default: 'dd MMMM yyyy')
 * @returns {string} Formatlanmış tarih
 */
export const formatDateToTurkish = (date, formatStr = 'dd MMMM yyyy') => {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: tr });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Tarihi saat ile birlikte Türkçe formatta gösterir
 * @param {string|Date} date - Tarih
 * @returns {string} Formatlanmış tarih ve saat
 */
export const formatDateTimeToTurkish = (date) => {
  return formatDateToTurkish(date, 'dd MMMM yyyy HH:mm');
};

/**
 * Kısa tarih formatı (01.01.2024)
 * @param {string|Date} date - Tarih
 * @returns {string} Kısa formatlanmış tarih
 */
export const formatDateShort = (date) => {
  return formatDateToTurkish(date, 'dd.MM.yyyy');
};

/**
 * Sadece saat gösterir
 * @param {string|Date} date - Tarih
 * @returns {string} Saat (HH:mm)
 */
export const formatTimeOnly = (date) => {
  return formatDateToTurkish(date, 'HH:mm');
};

/**
 * Tarihin ne kadar önce olduğunu gösterir
 * @param {string|Date} date - Tarih
 * @returns {string} Örn: "2 saat önce", "3 gün önce"
 */
export const getTimeAgo = (date) => {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (isToday(dateObj)) {
      return `Bugün ${formatTimeOnly(dateObj)}`;
    }

    if (isYesterday(dateObj)) {
      return `Dün ${formatTimeOnly(dateObj)}`;
    }

    return formatDistance(dateObj, new Date(), {
      addSuffix: true,
      locale: tr,
    });
  } catch (error) {
    console.error('Time ago calculation error:', error);
    return '';
  }
};

/**
 * İki tarih arasındaki farkı hesaplar
 * @param {string|Date} startDate - Başlangıç tarihi
 * @param {string|Date} endDate - Bitiş tarihi
 * @returns {string} Fark
 */
export const getDateDifference = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return '';
  }

  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

    return formatDistance(start, end, { locale: tr });
  } catch (error) {
    console.error('Date difference calculation error:', error);
    return '';
  }
};

/**
 * Tarihin bugünden itibaren kaç gün sonra olduğunu hesaplar
 * @param {string|Date} date - Tarih
 * @returns {number} Gün sayısı (negatif = geçmiş, pozitif = gelecek)
 */
export const getDaysFromNow = (date) => {
  if (!date) {
    return 0;
  }

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Days from now calculation error:', error);
    return 0;
  }
};

/**
 * Tarihin geçip geçmediğini kontrol eder
 * @param {string|Date} date - Tarih
 * @returns {boolean} Geçmiş tarih mi?
 */
export const isPastDate = (date) => {
  if (!date) {
    return false;
  }

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj < new Date();
  } catch (error) {
    console.error('Past date check error:', error);
    return false;
  }
};

/**
 * Tarihin bugün olup olmadığını kontrol eder
 * @param {string|Date} date - Tarih
 * @returns {boolean} Bugün mü?
 */
export const isTodayDate = (date) => {
  if (!date) {
    return false;
  }

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isToday(dateObj);
  } catch (error) {
    console.error('Today date check error:', error);
    return false;
  }
};

/**
 * Hafta günü adını Türkçe olarak döndürür
 * @param {string|Date} date - Tarih
 * @returns {string} Hafta günü
 */
export const getWeekdayName = (date) => {
  return formatDateToTurkish(date, 'EEEE');
};

/**
 * Ay adını Türkçe olarak döndürür
 * @param {string|Date} date - Tarih
 * @returns {string} Ay adı
 */
export const getMonthName = (date) => {
  return formatDateToTurkish(date, 'MMMM');
};

/**
 * Yıl döndürür
 * @param {string|Date} date - Tarih
 * @returns {string} Yıl
 */
export const getYear = (date) => {
  return formatDateToTurkish(date, 'yyyy');
};

/**
 * Date input için format (YYYY-MM-DD)
 * @param {string|Date} date - Tarih
 * @returns {string} HTML date input formatı
 */
export const formatForDateInput = (date) => {
  return formatDateToTurkish(date, 'yyyy-MM-dd');
};

/**
 * Time input için format (HH:mm)
 * @param {string|Date} date - Tarih
 * @returns {string} HTML time input formatı
 */
export const formatForTimeInput = (date) => {
  return formatDateToTurkish(date, 'HH:mm');
};

/**
 * DateTime input için format (YYYY-MM-DDTHH:mm)
 * @param {string|Date} date - Tarih
 * @returns {string} HTML datetime-local input formatı
 */
export const formatForDateTimeInput = (date) => {
  return formatDateToTurkish(date, "yyyy-MM-dd'T'HH:mm");
};

/**
 * Yaş hesaplar
 * @param {string|Date} birthDate - Doğum tarihi
 * @returns {number} Yaş
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) {
    return 0;
  }

  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    const now = new Date();
    const diffYears = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      return diffYears - 1;
    }

    return diffYears;
  } catch (error) {
    console.error('Age calculation error:', error);
    return 0;
  }
};

export default {
  formatDateToTurkish,
  formatDateTimeToTurkish,
  formatDateShort,
  formatTimeOnly,
  getTimeAgo,
  getDateDifference,
  getDaysFromNow,
  isPastDate,
  isTodayDate,
  getWeekdayName,
  getMonthName,
  getYear,
  formatForDateInput,
  formatForTimeInput,
  formatForDateTimeInput,
  calculateAge,
};