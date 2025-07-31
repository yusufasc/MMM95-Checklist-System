// File upload constraints
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
};

// UI configuration
export const UI_CONFIG = {
  MIN_INPUT_HEIGHT: '56px',
  INPUT_FONT_SIZE: '1.1rem',
  AVATAR_SIZE: {
    SMALL: { width: 32, height: 32 },
    MEDIUM: { width: 40, height: 40 },
  },
  PREVIEW_IMAGE_SIZE: {
    width: '100px',
    height: '100px',
  },
};

// Score chip configurations
export const SCORE_CHIP_CONFIGS = {
  EXCELLENT: { threshold: 80, color: 'success' },
  GOOD: { threshold: 60, color: 'warning' },
  POOR: { threshold: 0, color: 'error' },
};

// Section configurations
export const SECTION_CONFIGS = {
  template: {
    title: 'Değerlendirme Şablonu',
    icon: 'Assignment',
    defaultExpanded: true,
  },
  selections: {
    title: 'Çalışan ve Makina Seçimi',
    icon: 'Person',
    defaultExpanded: true,
  },
  evaluation: {
    title: 'Değerlendirme',
    icon: 'CheckCircle',
    defaultExpanded: false,
  },
};

// Default expanded sections
export const DEFAULT_EXPANDED_SECTIONS = {
  template: true,
  selections: true,
  evaluation: false,
};

// Form validation rules
export const VALIDATION_RULES = {
  requiredFields: ['selectedTemplate', 'selectedWorker'],
  optionalFields: ['selectedMachine', 'selectedKalip', 'hammadde', 'notes'],
};

// Slider configuration
export const SLIDER_CONFIG = {
  thumb: { height: 24, width: 24 },
  track: { height: 8 },
  rail: { height: 8 },
};

// Alert messages
export const ALERT_MESSAGES = {
  NO_TEMPLATES: {
    title: 'Henüz aktif değerlendirme şablonu bulunmuyor.',
    reasons: [
      'Hiç şablon oluşturulmamış olabilir',
      'Şablonlar "Pasif" durumda olabilir',
      'Şablonlarda belirli saatler tanımlanmış ve şu anda değerlendirme saati dışında olabilir',
      'Şablonlar başka rollere atanmış olabilir',
    ],
  },
  NO_WORKERS: 'Çalışan listesi yükleniyor...',
  NO_AVAILABLE_WORKERS: 'Tüm çalışanlar son 4 saat içinde puanlanmış',
  NO_MATCHING_WORKERS: 'Puanlanabilir çalışan bulunamadı',
};

// Success messages
export const SUCCESS_MESSAGES = {
  EVALUATION_SAVED: 'Değerlendirme başarıyla kaydedildi',
  IMAGE_UPLOADED: 'Fotoğraf başarıyla eklendi',
  DEBUG_SUCCESS: 'Şablon durumunu kontrol etme işlemi başarılı',
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Sadece resim dosyaları kabul edilir',
  FILE_TOO_LARGE: 'Dosya boyutu çok büyük (Max: 5MB)',
  IMAGE_UPLOAD_FAILED: 'Fotoğraf yüklenirken hata oluştu',
  EVALUATION_SAVE_FAILED: 'Değerlendirme kaydedilirken hata oluştu',
  WORKERS_LOAD_FAILED: 'Çalışanlar yüklenirken hata oluştu',
  DEBUG_FAILED: 'Şablon durumunu kontrol etme işlemi sırasında hata oluştu',
  MISSING_REQUIRED_FIELDS: 'Lütfen şablon ve çalışan seçin',
};

// Warning messages
export const WARNING_MESSAGES = {
  NO_ACTIVE_WORKERS: 'Bu role ait aktif çalışan bulunamadı',
  ALL_WORKERS_EVALUATED:
    'çalışan yüklendi, ancak hepsi son 4 saat içinde puanlanmış',
};

// Utility functions
export const getScoreChipConfig = score => {
  if (score >= SCORE_CHIP_CONFIGS.EXCELLENT.threshold) {
    return SCORE_CHIP_CONFIGS.EXCELLENT;
  }
  if (score >= SCORE_CHIP_CONFIGS.GOOD.threshold) {
    return SCORE_CHIP_CONFIGS.GOOD;
  }
  return SCORE_CHIP_CONFIGS.POOR;
};

export const formatWorkerName = worker => {
  if (!worker) {
    return '';
  }
  return `${worker.ad} ${worker.soyad}`;
};

export const formatMachineInfo = machine => {
  if (!machine) {
    return '';
  }
  return `${machine.kod} - ${machine.ad}`;
};

export const formatKalipInfo = kalip => {
  if (!kalip) {
    return '';
  }
  return `${kalip.kod} - ${kalip.ad}`;
};

export const formatTime = dateString => {
  return new Date(dateString).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const validateFile = file => {
  const errors = [];

  if (!file.type.startsWith('image/')) {
    errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
  }

  if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_SIZE) {
    errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
  }

  return errors;
};

export const calculateTotalScore = (template, evaluationData) => {
  if (!template) {
    return { current: 0, max: 0 };
  }

  const currentScore = template.maddeler.reduce(
    (sum, madde, index) => sum + (evaluationData[index]?.puan || 0),
    0,
  );
  const maxScore = template.maddeler.reduce(
    (sum, madde) => sum + madde.maksimumPuan,
    0,
  );

  return { current: currentScore, max: maxScore };
};

export const createEvaluationPayload = (formData, template) => {
  const {
    selectedTemplate,
    selectedWorker,
    selectedMachine,
    selectedKalip,
    hammadde,
    notes,
    evaluationData,
  } = formData;

  return {
    sablon: selectedTemplate,
    degerlendirilenKullanici: selectedWorker,
    makina: selectedMachine || undefined,
    kalip: selectedKalip || undefined,
    hammadde: hammadde || undefined,
    genelYorum: notes || '',
    maddeler: template.maddeler.map((madde, index) => ({
      baslik: madde.baslik,
      maksimumPuan: madde.maksimumPuan,
      alinanPuan: evaluationData[index]?.puan || 0,
      yorum: evaluationData[index]?.yorum || '',
      fotografUrl: evaluationData[index]?.fotograf || undefined,
    })),
    toplamPuan: template.maddeler.reduce(
      (sum, madde, index) => sum + (evaluationData[index]?.puan || 0),
      0,
    ),
    maksimumToplamPuan: template.maddeler.reduce(
      (sum, madde) => sum + madde.maksimumPuan,
      0,
    ),
  };
};

export const generateWorkerSuccessMessage = (totalCount, availableCount) => {
  if (totalCount === 0) {
    return WARNING_MESSAGES.NO_ACTIVE_WORKERS;
  }

  if (availableCount === 0) {
    return `${totalCount} ${WARNING_MESSAGES.ALL_WORKERS_EVALUATED}`;
  }

  return `${totalCount} çalışan yüklendi (${availableCount} puanlanabilir)`;
};

// Template card configurations
export const TEMPLATE_CARD_CONFIG = {
  selectedStyle: {
    border: 2,
    borderColor: 'primary.main',
    backgroundColor: 'primary.50',
  },
  defaultStyle: {
    border: 1,
    borderColor: 'divider',
    backgroundColor: 'white',
  },
};

// Image preview dialog configuration
export const IMAGE_PREVIEW_CONFIG = {
  maxWidth: 'md',
  fullWidth: true,
  style: {
    width: '100%',
    height: 'auto',
    maxHeight: '80vh',
    objectFit: 'contain',
  },
};

// Floating action button configuration
export const FAB_CONFIG = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 1000,
  background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
  hoverBackground: 'linear-gradient(45deg, #388e3c, #689f38)',
};

// Form field placeholders
export const PLACEHOLDERS = {
  worker: 'Çalışan ara (ad, soyad ile)...',
  machine: 'Makina ara ve seç...',
  kalip: 'Kalıp ara ve seç...',
  hammadde: 'Kullanılan hammadde bilgisini giriniz...',
  generalNotes: 'Bu değerlendirme hakkında genel yorumlarınızı yazın...',
  comment: 'Yorum',
};
