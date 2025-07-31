// Initial form data structures
export const INITIAL_TEMPLATE_FORM_DATA = {
  ad: '',
  aciklama: '',
  rol: '',
  aktif: true,
  maddeler: [],
  degerlendirmeSaatleri: [],
  degerlendirmeSikligi: 'Günlük',
  degerlendirmePeriyodu: 2,
};

export const INITIAL_ITEM_FORM_DATA = {
  baslik: '',
  aciklama: '',
  maksimumPuan: 10,
};

// Evaluation frequency options
export const EVALUATION_FREQUENCY_OPTIONS = [
  { value: 'Günlük', label: 'Günlük' },
  { value: 'Haftalık', label: 'Haftalık' },
  { value: 'Aylık', label: 'Aylık' },
  { value: 'Özel', label: 'Özel' },
];

// Evaluation period marks for slider
export const EVALUATION_PERIOD_MARKS = [
  { value: 1, label: '1h' },
  { value: 2, label: '2h' },
  { value: 4, label: '4h' },
  { value: 6, label: '6h' },
  { value: 8, label: '8h' },
];

// Score slider configuration
export const SCORE_SLIDER_CONFIG = {
  min: 1,
  max: 100,
  step: 1,
  marks: true,
};

// Table column configurations
export const TABLE_COLUMNS = [
  { id: 'ad', label: 'Şablon Adı', minWidth: 200 },
  { id: 'rol', label: 'Hedef Rol', minWidth: 120 },
  { id: 'madde', label: 'Madde Sayısı', minWidth: 100, align: 'center' },
  { id: 'puan', label: 'Toplam Puan', minWidth: 100, align: 'center' },
  { id: 'saat', label: 'Değerlendirme Saatleri', minWidth: 180 },
  { id: 'periyot', label: 'Periyot', minWidth: 80, align: 'center' },
  { id: 'durum', label: 'Durum', minWidth: 80, align: 'center' },
  { id: 'olusturan', label: 'Oluşturan', minWidth: 150 },
  { id: 'islemler', label: 'İşlemler', minWidth: 120, align: 'right' },
];

// Status chip configurations
export const STATUS_CHIP_CONFIGS = {
  aktif: {
    color: 'success',
    label: 'Aktif',
  },
  pasif: {
    color: 'default',
    label: 'Pasif',
  },
};

// Alert messages
export const ALERT_MESSAGES = {
  NO_TEMPLATES: 'Henüz değerlendirme şablonu oluşturulmamış.',
  TEMPLATE_CREATED: 'Şablon başarıyla oluşturuldu',
  TEMPLATE_UPDATED: 'Şablon başarıyla güncellendi',
  TEMPLATE_DELETED: 'Şablon başarıyla silindi',
  TEMPLATE_FORCE_DELETED: 'Şablon ve bağımlılıkları başarıyla silindi',
  ITEM_TITLE_REQUIRED: 'Madde başlığı gereklidir',
  SCHEDULE_INFO:
    'Değerlendirme saati eklemezseniz, şablon 24 saat boyunca kullanılabilir olacaktır. Saat eklerseniz, sadece belirlenen saatlerden sonraki periyot süresince değerlendirme yapılabilir.',
  TOTAL_SCORE_INFO: 'Fotoğraf ekleme her madde için isteğe bağlıdır',
  DELETE_WARNING: 'Bu işlem geri alınamaz!',
  FORCE_DELETE_INFO: 'Tüm bağımlılıkları iptal ederek silebilirsiniz.',
};

// Dialog configurations
export const DIALOG_CONFIG = {
  maxWidth: 'md',
  fullWidth: true,
  deleteMaxWidth: 'sm',
};

// Button styles
export const BUTTON_STYLES = {
  primary: {
    background: 'linear-gradient(45deg, #9c27b0, #673ab7)',
    '&:hover': {
      background: 'linear-gradient(45deg, #7b1fa2, #5e35b1)',
    },
  },
  danger: {
    background: 'linear-gradient(45deg, #f44336, #d32f2f)',
    '&:hover': {
      background: 'linear-gradient(45deg, #d32f2f, #c62828)',
    },
  },
};

// Validation rules
export const VALIDATION_RULES = {
  templateName: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  itemTitle: {
    required: true,
    minLength: 2,
    maxLength: 200,
  },
  description: {
    maxLength: 500,
  },
  maxScore: {
    min: 1,
    max: 100,
  },
  evaluationPeriod: {
    min: 1,
    max: 8,
  },
};

// Utility functions
export const formatScheduleTime = schedule => {
  return `${schedule.saat} - ${schedule.aciklama || 'Değerlendirme'}`;
};

export const formatCreatorName = user => {
  if (!user) {
    return '';
  }
  return `${user.ad} ${user.soyad}`;
};

export const calculateTotalScore = items => {
  return items?.reduce((sum, item) => sum + item.maksimumPuan, 0) || 0;
};

export const getStatusChipConfig = isActive => {
  return isActive ? STATUS_CHIP_CONFIGS.aktif : STATUS_CHIP_CONFIGS.pasif;
};

export const validateTemplateForm = formData => {
  const errors = [];

  // Template name validation
  if (!formData.ad.trim()) {
    errors.push('Şablon adı gereklidir');
  } else if (formData.ad.length < VALIDATION_RULES.templateName.minLength) {
    errors.push(
      `Şablon adı en az ${VALIDATION_RULES.templateName.minLength} karakter olmalıdır`,
    );
  }

  // Role validation
  if (!formData.rol) {
    errors.push('Hedef rol seçimi gereklidir');
  }

  // Items validation
  if (!formData.maddeler || formData.maddeler.length === 0) {
    errors.push('En az bir değerlendirme maddesi eklenmelidir');
  }

  return errors;
};

export const validateItemForm = itemData => {
  const errors = [];

  if (!itemData.baslik.trim()) {
    errors.push(ALERT_MESSAGES.ITEM_TITLE_REQUIRED);
  }

  return errors;
};

export const createTemplatePayload = formData => {
  // Geçici id'leri ve MongoDB _id'leri temizle
  const cleanedMaddeler = formData.maddeler.map(madde => {
    // eslint-disable-next-line no-unused-vars
    const { id: _unusedId, _id: _unusedMongoId, ...cleanMadde } = madde;
    return cleanMadde;
  });

  return {
    ...formData,
    maddeler: cleanedMaddeler,
    toplamMaksimumPuan: cleanedMaddeler.reduce(
      (sum, item) => sum + item.maksimumPuan,
      0,
    ),
  };
};

export const generateTempItemId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const processTemplateForEdit = template => {
  // Mevcut maddelere geçici id ekle (düzenleme için)
  const maddelerWithTempIds = (template.maddeler || []).map((madde, index) => ({
    ...madde,
    id: madde._id || `temp_${Date.now()}_${index}`,
  }));

  return {
    ad: template.ad,
    aciklama: template.aciklama,
    rol: template.rol._id,
    aktif: template.aktif,
    maddeler: maddelerWithTempIds,
    degerlendirmeSaatleri: template.degerlendirmeSaatleri || [],
    degerlendirmeSikligi: template.degerlendirmeSikligi || 'Günlük',
    degerlendirmePeriyodu: template.degerlendirmePeriyodu || 2,
  };
};

// Time utility functions
export const formatEvaluationHours = hours => {
  if (!hours || hours.length === 0) {
    return [{ label: 'Her Zaman', color: 'default' }];
  }

  return hours.map(hour => ({
    label: hour.saat,
    color: 'secondary',
    variant: 'outlined',
  }));
};

export const formatEvaluationPeriod = period => {
  return `${period || 2}h`;
};

// Form helper functions
export const createNewScheduleItem = (time, description) => {
  return {
    saat: time,
    aciklama: description || 'Değerlendirme',
  };
};

export const isValidTimeFormat = time => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Delete confirmation helpers
export const getDeleteConfirmationText = template => {
  return {
    title: template?.ad || 'Şablon',
    role: template?.rol?.ad || 'Bilinmeyen Rol',
    itemCount: template?.maddeler?.length || 0,
  };
};

export const formatDeleteError = error => {
  return {
    message: error.message,
    canForceDelete: error.canForceDelete || false,
    dependencyCount: error.dependencyCount || 0,
  };
};
