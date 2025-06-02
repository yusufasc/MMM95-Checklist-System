const mongoose = require('mongoose');

/**
 * MongoDB ObjectId validasyonu
 * @param {string} id - Kontrol edilecek ID
 * @returns {boolean} - Geçerli ObjectId mi?
 */
const isValidObjectId = id => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Email formatı validasyonu
 * @param {string} email - Email adresi
 * @returns {boolean} - Geçerli email mi?
 */
const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Şifre güçlülük validasyonu
 * @param {string} password - Şifre
 * @returns {object} - {isValid, errors}
 */
const validatePassword = password => {
  const errors = [];

  if (!password) {
    errors.push('Şifre gereklidir');
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push('Şifre en az 6 karakter olmalıdır');
  }

  if (password.length > 50) {
    errors.push('Şifre en fazla 50 karakter olabilir');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Kullanıcı adı validasyonu
 * @param {string} username - Kullanıcı adı
 * @returns {object} - {isValid, errors}
 */
const validateUsername = username => {
  const errors = [];

  if (!username) {
    errors.push('Kullanıcı adı gereklidir');
    return { isValid: false, errors };
  }

  if (username.length < 3) {
    errors.push('Kullanıcı adı en az 3 karakter olmalıdır');
  }

  if (username.length > 20) {
    errors.push('Kullanıcı adı en fazla 20 karakter olabilir');
  }

  // Sadece harf, rakam, nokta ve alt çizgi
  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  if (!usernameRegex.test(username)) {
    errors.push('Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * İsim validasyonu (ad, soyad)
 * @param {string} name - İsim
 * @param {string} fieldName - Alan adı (hata mesajı için)
 * @returns {object} - {isValid, errors}
 */
const validateName = (name, fieldName = 'İsim') => {
  const errors = [];

  if (!name) {
    errors.push(`${fieldName} gereklidir`);
    return { isValid: false, errors };
  }

  if (name.length < 2) {
    errors.push(`${fieldName} en az 2 karakter olmalıdır`);
  }

  if (name.length > 50) {
    errors.push(`${fieldName} en fazla 50 karakter olabilir`);
  }

  // Sadece harf, boşluk ve Türkçe karakterler
  const nameRegex = /^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/;
  if (!nameRegex.test(name)) {
    errors.push(`${fieldName} sadece harf ve boşluk içerebilir`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Genel string validasyonu
 * @param {string} value - Değer
 * @param {string} fieldName - Alan adı
 * @param {object} options - Validasyon seçenekleri
 * @returns {object} - {isValid, errors}
 */
const validateString = (value, fieldName, options = {}) => {
  const {
    required = true,
    minLength = 1,
    maxLength = 255,
    pattern = null,
    patternMessage = 'Geçersiz format',
  } = options;

  const errors = [];

  if (required && (!value || value.trim() === '')) {
    errors.push(`${fieldName} gereklidir`);
    return { isValid: false, errors };
  }

  if (value) {
    if (value.length < minLength) {
      errors.push(`${fieldName} en az ${minLength} karakter olmalıdır`);
    }

    if (value.length > maxLength) {
      errors.push(`${fieldName} en fazla ${maxLength} karakter olabilir`);
    }

    if (pattern && !pattern.test(value)) {
      errors.push(patternMessage);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sayı validasyonu
 * @param {number} value - Değer
 * @param {string} fieldName - Alan adı
 * @param {object} options - Validasyon seçenekleri
 * @returns {object} - {isValid, errors}
 */
const validateNumber = (value, fieldName, options = {}) => {
  const { required = true, min = null, max = null, integer = false } = options;

  const errors = [];

  if (required && (value === null || value === undefined)) {
    errors.push(`${fieldName} gereklidir`);
    return { isValid: false, errors };
  }

  if (value !== null && value !== undefined) {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`${fieldName} geçerli bir sayı olmalıdır`);
      return { isValid: false, errors };
    }

    if (integer && !Number.isInteger(value)) {
      errors.push(`${fieldName} tam sayı olmalıdır`);
    }

    if (min !== null && value < min) {
      errors.push(`${fieldName} en az ${min} olmalıdır`);
    }

    if (max !== null && value > max) {
      errors.push(`${fieldName} en fazla ${max} olabilir`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Dizi validasyonu
 * @param {Array} value - Değer
 * @param {string} fieldName - Alan adı
 * @param {object} options - Validasyon seçenekleri
 * @returns {object} - {isValid, errors}
 */
const validateArray = (value, fieldName, options = {}) => {
  const { required = true, minLength = 0, maxLength = null, itemValidator = null } = options;

  const errors = [];

  if (required && (!value || !Array.isArray(value))) {
    errors.push(`${fieldName} gereklidir ve dizi olmalıdır`);
    return { isValid: false, errors };
  }

  if (value && Array.isArray(value)) {
    if (value.length < minLength) {
      errors.push(`${fieldName} en az ${minLength} eleman içermelidir`);
    }

    if (maxLength !== null && value.length > maxLength) {
      errors.push(`${fieldName} en fazla ${maxLength} eleman içerebilir`);
    }

    // Her eleman için validasyon
    if (itemValidator) {
      value.forEach((item, index) => {
        const itemValidation = itemValidator(item, `${fieldName}[${index}]`);
        if (!itemValidation.isValid) {
          errors.push(...itemValidation.errors);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Tarih validasyonu
 * @param {Date|string} value - Tarih değeri
 * @param {string} fieldName - Alan adı
 * @param {object} options - Validasyon seçenekleri
 * @returns {object} - {isValid, errors}
 */
const validateDate = (value, fieldName, options = {}) => {
  const { required = true, minDate = null, maxDate = null } = options;

  const errors = [];

  if (required && !value) {
    errors.push(`${fieldName} gereklidir`);
    return { isValid: false, errors };
  }

  if (value) {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} geçerli bir tarih olmalıdır`);
      return { isValid: false, errors };
    }

    if (minDate && date < new Date(minDate)) {
      errors.push(
        `${fieldName} ${new Date(minDate).toLocaleDateString('tr-TR')} tarihinden sonra olmalıdır`,
      );
    }

    if (maxDate && date > new Date(maxDate)) {
      errors.push(
        `${fieldName} ${new Date(maxDate).toLocaleDateString('tr-TR')} tarihinden önce olmalıdır`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Enum validasyonu
 * @param {any} value - Değer
 * @param {Array} allowedValues - İzin verilen değerler
 * @param {string} fieldName - Alan adı
 * @param {boolean} required - Zorunlu mu?
 * @returns {object} - {isValid, errors}
 */
const validateEnum = (value, allowedValues, fieldName, required = true) => {
  const errors = [];

  if (required && (!value || value === '')) {
    errors.push(`${fieldName} gereklidir`);
    return { isValid: false, errors };
  }

  if (value && !allowedValues.includes(value)) {
    errors.push(`${fieldName} geçerli değerlerden biri olmalıdır: ${allowedValues.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Kullanıcı oluşturma validasyonu
 * @param {object} userData - Kullanıcı verisi
 * @returns {object} - {isValid, errors}
 */
const validateUserCreation = userData => {
  const allErrors = [];

  // Ad validasyonu
  const nameValidation = validateName(userData.ad, 'Ad');
  if (!nameValidation.isValid) {
    allErrors.push(...nameValidation.errors);
  }

  // Soyad validasyonu
  const surnameValidation = validateName(userData.soyad, 'Soyad');
  if (!surnameValidation.isValid) {
    allErrors.push(...surnameValidation.errors);
  }

  // Kullanıcı adı validasyonu
  const usernameValidation = validateUsername(userData.kullaniciAdi);
  if (!usernameValidation.isValid) {
    allErrors.push(...usernameValidation.errors);
  }

  // Şifre validasyonu
  const passwordValidation = validatePassword(userData.sifre);
  if (!passwordValidation.isValid) {
    allErrors.push(...passwordValidation.errors);
  }

  // Email validasyonu (opsiyonel)
  if (userData.email && !isValidEmail(userData.email)) {
    allErrors.push('Geçerli bir email adresi giriniz');
  }

  // Roller validasyonu
  if (userData.roller && userData.roller.length > 0) {
    userData.roller.forEach((roleId, index) => {
      if (!isValidObjectId(roleId)) {
        allErrors.push(`Rol ${index + 1} geçerli bir ID değil`);
      }
    });
  }

  // Departmanlar validasyonu
  if (userData.departmanlar && userData.departmanlar.length > 0) {
    userData.departmanlar.forEach((deptId, index) => {
      if (!isValidObjectId(deptId)) {
        allErrors.push(`Departman ${index + 1} geçerli bir ID değil`);
      }
    });
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Rol oluşturma validasyonu
 * @param {object} roleData - Rol verisi
 * @returns {object} - {isValid, errors}
 */
const validateRoleCreation = roleData => {
  const allErrors = [];

  // Rol adı validasyonu
  const nameValidation = validateString(roleData.ad, 'Rol adı', {
    minLength: 2,
    maxLength: 50,
  });
  if (!nameValidation.isValid) {
    allErrors.push(...nameValidation.errors);
  }

  // Modüller validasyonu
  if (roleData.moduller && Array.isArray(roleData.moduller)) {
    roleData.moduller.forEach((modul, index) => {
      if (!modul.modul || !isValidObjectId(modul.modul)) {
        allErrors.push(`Modül ${index + 1} geçerli bir ID değil`);
      }

      if (typeof modul.erisebilir !== 'boolean') {
        allErrors.push(`Modül ${index + 1} erişim yetkisi boolean olmalıdır`);
      }

      if (typeof modul.duzenleyebilir !== 'boolean') {
        allErrors.push(`Modül ${index + 1} düzenleme yetkisi boolean olmalıdır`);
      }
    });
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Görev oluşturma validasyonu
 * @param {object} taskData - Görev verisi
 * @returns {object} - {isValid, errors}
 */
const validateTaskCreation = taskData => {
  const allErrors = [];

  // Kullanıcı validasyonu
  if (!taskData.kullanici || !isValidObjectId(taskData.kullanici)) {
    allErrors.push('Geçerli bir kullanıcı seçiniz');
  }

  // Checklist validasyonu
  if (!taskData.checklist || !isValidObjectId(taskData.checklist)) {
    allErrors.push('Geçerli bir checklist seçiniz');
  }

  // Durum validasyonu
  const allowedStatuses = ['bekliyor', 'tamamlandi', 'onaylandi', 'iadeEdildi'];
  if (taskData.durum && !allowedStatuses.includes(taskData.durum)) {
    allErrors.push('Geçerli bir durum seçiniz');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  validatePassword,
  validateUsername,
  validateName,
  validateString,
  validateNumber,
  validateArray,
  validateDate,
  validateEnum,
  validateUserCreation,
  validateRoleCreation,
  validateTaskCreation,
};
