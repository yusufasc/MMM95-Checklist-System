export const getTypeColor = type => {
  return type === 'rutin' ? 'primary' : 'secondary';
};

export const getTypeIcon = type => {
  return type === 'rutin' ? 'ScheduleIcon' : 'WorkIcon';
};

export const getPeriyotText = periyot => {
  const periyotMap = {
    gunluk: 'Günlük',
    haftalik: 'Haftalık',
    aylik: 'Aylık',
    olayBazli: 'Olay Bazlı',
  };
  return periyotMap[periyot] || periyot;
};

export const getTypeText = type => {
  const typeMap = {
    rutin: 'Rutin',
    iseBagli: 'İş Bağlı',
  };
  return typeMap[type] || type;
};

export const calculateChecklistStats = checklists => {
  const total = checklists.length;
  const rutin = checklists.filter(c => c.tur === 'rutin').length;
  const iseBagli = checklists.filter(c => c.tur === 'iseBagli').length;

  const periyotStats = {
    gunluk: checklists.filter(c => c.periyot === 'gunluk').length,
    haftalik: checklists.filter(c => c.periyot === 'haftalik').length,
    aylik: checklists.filter(c => c.periyot === 'aylik').length,
    olayBazli: checklists.filter(c => c.periyot === 'olayBazli').length,
  };

  return {
    total,
    rutin,
    iseBagli,
    periyotStats,
  };
};

export const getTotalPoints = maddeler => {
  return maddeler?.reduce((total, madde) => total + (madde.puan || 0), 0) || 0;
};

export const validateFormData = formData => {
  const errors = [];

  if (!formData.ad?.trim()) {
    errors.push('Checklist adı gereklidir');
  }

  if (!formData.hedefRol) {
    errors.push('Hedef rol seçin');
  }

  if (!formData.hedefDepartman) {
    errors.push('Hedef departman seçin');
  }

  if (formData.tur === 'iseBagli' && !formData.isTuru?.trim()) {
    errors.push('İş türü gereklidir');
  }

  const emptyMaddeler = formData.maddeler?.filter(m => !m.soru?.trim()) || [];
  if (emptyMaddeler.length > 0) {
    errors.push('Tüm maddelerin soruları doldurulmalıdır');
  }

  return errors;
};

export const formatChecklistForDisplay = (checklist, roles, departments) => {
  const role = roles.find(
    r => r._id === checklist.hedefRol?._id || checklist.hedefRol,
  );
  const department = departments.find(
    d => d._id === checklist.hedefDepartman?._id || checklist.hedefDepartman,
  );

  return {
    ...checklist,
    hedefRolAd: role?.ad || 'Bilinmiyor',
    hedefDepartmanAd: department?.ad || 'Bilinmiyor',
    toplamPuan: getTotalPoints(checklist.maddeler),
    maddeSayisi: checklist.maddeler?.length || 0,
    periyotText: getPeriyotText(checklist.periyot),
    typeText: getTypeText(checklist.tur),
  };
};
