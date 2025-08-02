import api from './api';

/**
 * Meeting Task API Services
 * Toplantı görevleri yönetimi için API çağrıları
 */

class MeetingTaskAPI {
  /**
   * Kullanıcının tüm meeting görevlerini getir
   * @param {Object} params - Query parametreleri
   * @returns {Promise} API response
   */
  static async getMyTasks(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.durum) {
      queryParams.append('durum', params.durum);
    }
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }
    if (params.meetingId) {
      queryParams.append('meetingId', params.meetingId);
    }

    const url = `/meeting-tasks/my-tasks${queryParams.toString() ? `?${queryParams}` : ''}`;

    try {
      const response = await api.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Görevler getirilirken hata oluştu',
      };
    }
  }

  /**
   * Meeting'in tüm görevlerini getir
   * @param {string} meetingId - Meeting ID
   * @returns {Promise} API response
   */
  static async getMeetingTasks(meetingId) {
    try {
      const response = await api.get(`/meeting-tasks/meeting/${meetingId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Meeting görevleri getirilirken hata oluştu',
      };
    }
  }

  /**
   * Görev detayını getir
   * @param {string} taskId - Task ID
   * @returns {Promise} API response
   */
  static async getTaskDetail(taskId) {
    try {
      const response = await api.get(`/meeting-tasks/${taskId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Görev detayı getirilirken hata oluştu',
      };
    }
  }

  /**
   * Görev progress'ini güncelle
   * @param {string} taskId - Task ID
   * @param {number} percentage - Tamamlanma yüzdesi (0-100)
   * @param {string} note - Not (opsiyonel)
   * @returns {Promise} API response
   */
  static async updateTaskProgress(taskId, percentage, note = '') {
    try {
      const response = await api.put(`/meeting-tasks/${taskId}/progress`, {
        tamamlanmaYuzdesi: percentage,
        not: note,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Progress güncellenirken hata oluştu',
      };
    }
  }

  /**
   * Görev durumunu güncelle
   * @param {string} taskId - Task ID
   * @param {string} status - Yeni durum
   * @param {string} note - Not (opsiyonel)
   * @returns {Promise} API response
   */
  static async updateTaskStatus(taskId, status, note = '') {
    try {
      const response = await api.put(`/meeting-tasks/${taskId}/status`, {
        durum: status,
        not: note,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Durum güncellenirken hata oluştu',
      };
    }
  }

  /**
   * Göreve yorum ekle
   * @param {string} taskId - Task ID
   * @param {string} comment - Yorum
   * @param {string} type - Yorum tipi
   * @returns {Promise} API response
   */
  static async addTaskComment(taskId, comment, type = 'yorum') {
    try {
      const response = await api.post(`/meeting-tasks/${taskId}/comments`, {
        yorum: comment,
        tip: type,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Yorum eklenirken hata oluştu',
      };
    }
  }

  /**
   * Meeting bitirme ve görev oluşturma
   * @param {string} meetingId - Meeting ID
   * @returns {Promise} API response
   */
  static async createTasksFromMeeting(meetingId) {
    try {
      const response = await api.post('/meeting-tasks/create-from-meeting', {
        meetingId,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Görevler oluşturulurken hata oluştu',
      };
    }
  }

  /**
   * Meeting'i bitir (existing meeting API)
   * @param {string} meetingId - Meeting ID
   * @returns {Promise} API response
   */
  static async finishMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/finish`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Toplantı bitirme sırasında hata oluştu',
      };
    }
  }
}

// Görev durum türleri
export const TASK_STATUS = {
  ATANDI: 'atandi',
  DEVAM_EDIYOR: 'devam-ediyor',
  KISMEN_TAMAMLANDI: 'kismen-tamamlandi',
  TAMAMLANDI: 'tamamlandi',
  IPTAL: 'iptal',
  ERTELENDI: 'ertelendi',
};

// Görev durum renkleri ve etiketleri
export const TASK_STATUS_CONFIG = {
  [TASK_STATUS.ATANDI]: {
    label: 'Atandı',
    color: 'info',
    icon: 'assignment',
  },
  [TASK_STATUS.DEVAM_EDIYOR]: {
    label: 'Devam Ediyor',
    color: 'warning',
    icon: 'work',
  },
  [TASK_STATUS.KISMEN_TAMAMLANDI]: {
    label: 'Kısmen Tamamlandı',
    color: 'secondary',
    icon: 'partial_complete',
  },
  [TASK_STATUS.TAMAMLANDI]: {
    label: 'Tamamlandı',
    color: 'success',
    icon: 'check_circle',
  },
  [TASK_STATUS.IPTAL]: {
    label: 'İptal',
    color: 'error',
    icon: 'cancel',
  },
  [TASK_STATUS.ERTELENDI]: {
    label: 'Ertelendi',
    color: 'default',
    icon: 'schedule',
  },
};

// Yorum türleri
export const COMMENT_TYPES = {
  YORUM: 'yorum',
  ONERI: 'oneri',
  SORU: 'soru',
  UYARI: 'uyari',
};

export const COMMENT_TYPE_CONFIG = {
  [COMMENT_TYPES.YORUM]: {
    label: 'Yorum',
    color: 'primary',
    icon: 'comment',
  },
  [COMMENT_TYPES.ONERI]: {
    label: 'Öneri',
    color: 'info',
    icon: 'lightbulb',
  },
  [COMMENT_TYPES.SORU]: {
    label: 'Soru',
    color: 'warning',
    icon: 'help',
  },
  [COMMENT_TYPES.UYARI]: {
    label: 'Uyarı',
    color: 'error',
    icon: 'warning',
  },
};

// Öncelik seviyeleri
export const PRIORITY_LEVELS = {
  DUSUK: 'düşük',
  NORMAL: 'normal',
  YUKSEK: 'yüksek',
  KRITIK: 'kritik',
};

export const PRIORITY_CONFIG = {
  [PRIORITY_LEVELS.DUSUK]: {
    label: 'Düşük',
    color: 'success',
    icon: 'arrow_downward',
  },
  [PRIORITY_LEVELS.NORMAL]: {
    label: 'Normal',
    color: 'primary',
    icon: 'remove',
  },
  [PRIORITY_LEVELS.YUKSEK]: {
    label: 'Yüksek',
    color: 'warning',
    icon: 'arrow_upward',
  },
  [PRIORITY_LEVELS.KRITIK]: {
    label: 'Kritik',
    color: 'error',
    icon: 'priority_high',
  },
};

export default MeetingTaskAPI;