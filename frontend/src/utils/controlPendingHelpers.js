// Utility functions for ControlPending

export const getStatusColor = status => {
  switch (status) {
    case 'tamamlandi':
      return 'warning';
    case 'onaylandi':
      return 'success';
    case 'iadeEdildi':
    case 'reddedildi':
      return 'error';
    default:
      return 'default';
  }
};

export const getStatusText = status => {
  switch (status) {
    case 'tamamlandi':
      return 'Kontrol Bekliyor';
    case 'onaylandi':
      return 'Onaylandı';
    case 'iadeEdildi':
      return 'İade Edildi';
    case 'reddedildi':
      return 'Reddedildi';
    default:
      return status;
  }
};

export const getStatusIcon = status => {
  switch (status) {
    case 'tamamlandi':
      return 'PendingActionsIcon';
    case 'onaylandi':
      return 'CheckCircleIcon';
    case 'iadeEdildi':
    case 'reddedildi':
      return 'WarningIcon';
    default:
      return 'InfoIcon';
  }
};

export const getTotalControlScore = scoringData => {
  if (!scoringData?.maddeler) {
    return 0;
  }
  return scoringData.maddeler.reduce(
    (total, madde) => total + (madde.kontrolPuani || 0),
    0,
  );
};

export const getMaxControlScore = scoringData => {
  if (!scoringData?.maddeler) {
    return 0;
  }
  return scoringData.maddeler.reduce(
    (total, madde) => total + (madde.maxPuan || madde.puan || 0),
    0,
  );
};

export const getScorePercentage = scoringData => {
  const total = getTotalControlScore(scoringData);
  const max = getMaxControlScore(scoringData);
  if (max === 0) {
    return 0;
  }
  return Math.round((total / max) * 100);
};

export const getTaskImagesCount = task => {
  if (!task?.maddeler) {
    return 0;
  }
  return task.maddeler.filter(madde => madde.resimUrl || madde.kontrolResimUrl)
    .length;
};

export const canScoreTask = (task, _hasChecklistPermission) => {
  if (!task) {
    return false;
  }

  // WorkTask'lar için her zaman puanlama izni ver
  if (task.taskType === 'worktask') {
    return task.durum === 'tamamlandi';
  }

  // Normal task'lar için checklist yetkilerine bak
  return task.durum === 'tamamlandi';
};

export const canViewTask = (task, _hasChecklistPermission) => {
  if (!task) {
    return false;
  }

  // Control-Pending sayfasına gelen tüm görevler görüntülenebilir
  // Çünkü backend zaten rol filtrelemesi yapıyor
  return true;
};

export const formatTaskDate = date => {
  if (!date) {
    return 'Tarih belirtilmemiş';
  }
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTaskTypeText = taskType => {
  switch (taskType) {
    case 'worktask':
      return 'İşe Bağlı Görev';
    case 'checklist':
      return 'Checklist Görevi';
    default:
      return 'Görev';
  }
};

export const getTaskTypeBadgeColor = taskType => {
  switch (taskType) {
    case 'worktask':
      return 'primary';
    case 'checklist':
      return 'secondary';
    default:
      return 'default';
  }
};
