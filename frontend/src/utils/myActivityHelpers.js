// Color and text utility functions for MyActivity

export const getCategoryColor = (kategori, tip) => {
  if (tip) {
    return kategori === 'Checklist' && tip === 'İşe Bağlı'
      ? '#FECA57'
      : kategori === 'Checklist' && tip === 'İK'
        ? '#FF6B6B'
        : kategori === 'Checklist' && tip === 'Kalite'
          ? '#45B7D1'
          : '#96CEB4';
  }
  return kategori === 'İK'
    ? '#FF6B6B'
    : kategori === 'Kalite'
      ? '#45B7D1'
      : kategori === 'İşe Bağlı'
        ? '#FECA57'
        : '#96CEB4';
};

export const getDurumColor = durum => {
  switch (durum) {
    case 'Tamamlandı':
    case 'tamamlandi':
      return 'success';
    case 'Beklemede':
    case 'beklemede':
      return 'warning';
    case 'İptal':
    case 'iptal':
      return 'error';
    default:
      return 'default';
  }
};

export const getDurumText = durum => {
  switch (durum) {
    case 'Tamamlandı':
    case 'tamamlandi':
      return 'Tamamlandı';
    case 'Beklemede':
    case 'beklemede':
      return 'Beklemede';
    case 'İptal':
    case 'iptal':
      return 'İptal';
    default:
      return durum;
  }
};

export const getSuccessRate = (completed, total) => {
  if (total === 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
};

export const formatDate = date => {
  return new Date(date).toLocaleDateString('tr-TR');
};

export const formatDateTime = date => {
  return new Date(date).toLocaleString('tr-TR');
};
