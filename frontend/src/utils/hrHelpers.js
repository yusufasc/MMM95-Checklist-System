export const validateUserForm = form => {
  const errors = {};

  if (!form.ad?.trim()) {
    errors.ad = 'Ad alanı zorunludur';
  }

  if (!form.soyad?.trim()) {
    errors.soyad = 'Soyad alanı zorunludur';
  }

  if (!form.kullaniciAdi?.trim()) {
    errors.kullaniciAdi = 'Kullanıcı adı alanı zorunludur';
  }

  if (!form.sifre?.trim()) {
    errors.sifre = 'Şifre alanı zorunludur';
  } else if (form.sifre.length < 6) {
    errors.sifre = 'Şifre en az 6 karakter olmalıdır';
  }

  if (!form.departman) {
    errors.departman = 'Departman seçimi zorunludur';
  }

  if (!form.roller || form.roller.length === 0) {
    errors.roller = 'En az bir rol seçimi zorunludur';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateEvaluationForm = (form, template) => {
  const errors = {};

  if (!form.kullaniciId) {
    errors.kullaniciId = 'Kullanıcı seçimi zorunludur';
  }

  if (template?.maddeler) {
    const requiredFields = template.maddeler.filter(madde => madde.zorunlu);
    for (const madde of requiredFields) {
      if (!form.maddePuanlari[madde._id]) {
        errors[`madde_${madde._id}`] = `${madde.baslik} puanı zorunludur`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateManuelForm = (form, type) => {
  const errors = {};

  if (!form.kullaniciId) {
    errors.kullaniciId = 'Kullanıcı seçimi zorunludur';
  }

  if (!form.tarih) {
    errors.tarih = 'Tarih seçimi zorunludur';
  }

  if (type === 'mesai' && !form.saat) {
    errors.saat = 'Mesai saati zorunludur';
  }

  if (type === 'devamsizlik' && !form.miktar) {
    errors.miktar = 'Devamsızlık miktarı zorunludur';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const formatUserName = user => {
  if (!user) {
    return '';
  }
  return `${user.ad || ''} ${user.soyad || ''}`.trim();
};

export const formatDate = date => {
  if (!date) {
    return '';
  }
  return new Date(date).toLocaleDateString('tr-TR');
};

export const formatDateTime = date => {
  if (!date) {
    return '';
  }
  return new Date(date).toLocaleString('tr-TR');
};

export const calculateAverageScore = scores => {
  if (!scores || scores.length === 0) {
    return 0;
  }
  const total = scores.reduce((sum, score) => sum + (score.toplamPuan || 0), 0);
  return (total / scores.length).toFixed(1);
};

export const getScoreColor = score => {
  if (score >= 90) {
    return 'success';
  }
  if (score >= 70) {
    return 'warning';
  }
  return 'error';
};

export const getScoreLabel = score => {
  if (score >= 90) {
    return 'Mükemmel';
  }
  if (score >= 80) {
    return 'İyi';
  }
  if (score >= 70) {
    return 'Orta';
  }
  if (score >= 60) {
    return 'Zayıf';
  }
  return 'Yetersiz';
};

export const exportToExcel = (data, filename) => {
  // Excel export utility
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const convertToCSV = data => {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row =>
    headers
      .map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      })
      .join(','),
  );

  return [csvHeaders, ...csvRows].join('\n');
};
