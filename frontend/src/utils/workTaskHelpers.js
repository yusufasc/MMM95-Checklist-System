/**
 * WorkTask Helper Functions
 * Refactored: AI Guide patterns and ESLint compliance
 * Enterprise-level utility functions for WorkTask operations
 */

/**
 * Kalıp görevi mi kontrol eder
 * @param {Object} checklist - Checklist objesi
 * @returns {boolean} - Kalıp görevi mi
 */
export const isKalipTask = checklist => {
  return checklist?.ad && checklist.ad.toLowerCase().includes('kalıp');
};

/**
 * Kategori ikonunu belirler
 * @param {string} kategori - Kategori adı
 * @param {boolean} isKalip - Kalıp görevi mi
 * @returns {string} - Icon component name
 */
export const getCategoryIcon = (kategori, isKalip = false) => {
  if (isKalip) {
    return 'AutoAwesome';
  }

  switch (kategori?.toLowerCase()) {
    case 'bakım': {
      return 'Engineering';
    }
    case 'kalite': {
      return 'Assignment';
    }
    default: {
      return 'Build';
    }
  }
};

/**
 * Kategori rengini belirler
 * @param {string} kategori - Kategori adı
 * @param {boolean} isKalip - Kalıp görevi mi
 * @returns {string} - Hex color code
 */
export const getCategoryColor = (kategori, isKalip = false) => {
  if (isKalip) {
    return '#FF9800';
  } // Orange for kalıp tasks

  switch (kategori?.toLowerCase()) {
    case 'bakım': {
      return '#FF6B6B';
    }
    case 'kalite': {
      return '#45B7D1';
    }
    case 'üretim': {
      return '#96CEB4';
    }
    default: {
      return '#6C7B7F';
    }
  }
};

/**
 * Checklist progress hesaplar
 * @param {Array} items - Checklist maddeleri
 * @param {string} completedField - Tamamlanma field adı ('yapildi' veya 'tamamlandi')
 * @returns {number} - Progress yüzdesi (0-100)
 */
export const calculateProgress = (items, completedField = 'yapildi') => {
  if (!items || items.length === 0) {
    return 0;
  }
  const completed = items.filter(item => item[completedField]).length;
  return Math.round((completed / items.length) * 100);
};

/**
 * Form validasyon kuralları
 */
export const validationRules = {
  machine: {
    required: true,
    message: 'Lütfen bir makina seçin',
  },
  indirilenKalip: {
    required: true,
    message: 'Lütfen indirilen kalıbı seçin',
  },
  baglananKalip: {
    required: true,
    message: 'Lütfen bağlanan kalıbı seçin',
  },
  hammadde: {
    required: true,
    message: 'Lütfen kullanılan hammaddeyi girin',
  },
  checklistItems: {
    message: 'Tüm checklist maddeleri tamamlanmalıdır',
  },
};

/**
 * Form alanını valide eder
 * @param {string} fieldName - Alan adı
 * @param {any} value - Alan değeri
 * @param {Array} checklistItems - Checklist maddeleri (opsiyonel)
 * @returns {Object} - {isValid: boolean, message: string}
 */
export const validateField = (fieldName, value, checklistItems = []) => {
  const rule = validationRules[fieldName];

  if (!rule) {
    return { isValid: true, message: '' };
  }

  // Özel validasyonlar
  switch (fieldName) {
    case 'hammadde': {
      if (rule.required && (!value || !value.trim())) {
        return { isValid: false, message: rule.message };
      }
      return { isValid: true, message: '' };
    }

    case 'checklistItems': {
      const uncompleted = checklistItems.filter(item => !item.tamamlandi);
      if (uncompleted.length > 0) {
        return {
          isValid: false,
          message: `${uncompleted.length} madde henüz tamamlanmamış`,
        };
      }
      return { isValid: true, message: '' };
    }

    default: {
      if (rule.required && !value) {
        return { isValid: false, message: rule.message };
      }
      return { isValid: true, message: '' };
    }
  }
};

/**
 * Step validasyonu yapar
 * @param {number} step - Adım numarası
 * @param {Object} formData - Form verileri
 * @param {Array} checklistItems - Checklist maddeleri
 * @returns {Object} - {isValid: boolean, message: string}
 */
export const validateStep = (step, formData, checklistItems = []) => {
  switch (step) {
    case 0: {
      // Makina seçimi
      return validateField('machine', formData.selectedMachine);
    }

    case 1: {
      // Kalıp bilgileri
      const indirilenValidation = validateField(
        'indirilenKalip',
        formData.indirilenKalip,
      );
      if (!indirilenValidation.isValid) {
        return indirilenValidation;
      }
      return validateField('baglananKalip', formData.ekstraKalip);
    }

    case 2: {
      // Hammadde
      return validateField('hammadde', formData.kullanilanHamade);
    }

    case 3: {
      // Checklist items
      return validateField('checklistItems', null, checklistItems);
    }

    default: {
      return { isValid: true, message: '' };
    }
  }
};

/**
 * Dialog/Wizard state'ini resetler
 * @param {Function} setters - State setter fonksiyonları objesi
 */
export const resetWorkTaskState = setters => {
  const {
    setSelectedChecklist,
    setCurrentTaskId,
    setActiveStep,
    dispatchChecklistItems,
    setSelectedMachine,
    setIndirilenKalip,
    setEkstraKalip,
    setKullanilanHamade,
  } = setters;

  if (setSelectedChecklist) {
    setSelectedChecklist(null);
  }
  if (setCurrentTaskId) {
    setCurrentTaskId(null);
  }
  if (setActiveStep) {
    setActiveStep(0);
  }
  if (dispatchChecklistItems) {
    dispatchChecklistItems({ type: 'RESET' });
  }

  // Wizard spesifik state'ler (opsiyonel)
  if (setSelectedMachine) {
    setSelectedMachine(null);
  }
  if (setIndirilenKalip) {
    setIndirilenKalip(null);
  }
  if (setEkstraKalip) {
    setEkstraKalip(null);
  }
  if (setKullanilanHamade) {
    setKullanilanHamade('');
  }
};

/**
 * Checklist items'ı standart formata dönüştürür
 * @param {Array} maddeler - Ham checklist maddeleri
 * @returns {Array} - Formatlanmış checklist items
 */
export const formatChecklistItems = maddeler => {
  return maddeler.map(madde => ({
    maddeId: madde._id,
    baslik: madde.baslik,
    aciklama: madde.aciklama,
    puan: madde.puan,
    periyot: madde.periyot,
    tamamlandi: false,
  }));
};
