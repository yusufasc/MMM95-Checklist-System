import React from 'react';
import {
  Schedule as ScheduleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export const getStatusColor = status => {
  switch (status) {
    case 'bekliyor':
      return 'warning';
    case 'tamamlandi':
      return 'info';
    case 'onaylandi':
      return 'success';
    case 'reddedildi':
      return 'error';
    default:
      return 'default';
  }
};

export const getStatusText = status => {
  switch (status) {
    case 'bekliyor':
      return 'Bekliyor';
    case 'tamamlandi':
      return 'Tamamlandı';
    case 'onaylandi':
      return 'Onaylandı';
    case 'reddedildi':
      return 'Reddedildi';
    default:
      return 'Bilinmiyor';
  }
};

export const getStatusIcon = status => {
  switch (status) {
    case 'bekliyor':
      return <ScheduleIcon />;
    case 'tamamlandi':
      return <CheckCircleOutlineIcon />;
    case 'onaylandi':
      return <CheckCircleIcon />;
    case 'reddedildi':
      return <CancelIcon />;
    default:
      return <InfoIcon />;
  }
};

export const isTaskOverdue = hedefTarih => {
  return new Date(hedefTarih) < new Date();
};

export const filterTasks = (tasks, tabValue) => {
  switch (tabValue) {
    case 0: // Bekleyen Görevler
      return tasks.filter(task => task.durum === 'bekliyor');
    case 1: // Tamamlanan Görevler
      return tasks
        .filter(task => ['tamamlandi', 'onaylandi'].includes(task.durum))
        .sort((a, b) => {
          // En yeni tamamlananlar önce gelsin (tamamlanmaTarihi'ne göre)
          const dateA = new Date(
            a.tamamlanmaTarihi || a.updatedAt || a.createdAt,
          );
          const dateB = new Date(
            b.tamamlanmaTarihi || b.updatedAt || b.createdAt,
          );
          return dateB - dateA; // Descending order (yeni -> eski)
        });
    case 2: // Geciken Görevler
      return tasks.filter(
        task => task.durum === 'bekliyor' && isTaskOverdue(task.hedefTarih),
      );
    default:
      return tasks;
  }
};

export const getTaskStats = tasks => {
  return {
    bekleyen: tasks.filter(t => t.durum === 'bekliyor').length,
    tamamlanan: tasks.filter(t => ['tamamlandi', 'onaylandi'].includes(t.durum))
      .length,
    geciken: tasks.filter(
      t => t.durum === 'bekliyor' && isTaskOverdue(t.hedefTarih),
    ).length,
  };
};

export const formatDateTime = date => {
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = date => {
  return new Date(date).toLocaleDateString('tr-TR');
};
