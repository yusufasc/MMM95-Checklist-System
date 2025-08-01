const Notification = require('../models/Notification');
const socketService = require('./socketService');
const logger = require('../utils/logger');

/**
 * 🔔 MMM95 Notification Service
 * In-app notification creation and management
 */
class NotificationService {
  /**
   * Create and send notification to user
   */
  async createNotification(data) {
    try {
      const {
        kullanici,
        baslik,
        mesaj,
        tip,
        oncelik = 'normal',
        ilgiliToplanti,
        ilgiliGorev,
        ilgiliKullanici,
        aksiyon,
        metadata = {},
        sonGecerlilikTarihi,
      } = data;

      // Validate required fields
      if (!kullanici || !baslik || !mesaj || !tip) {
        throw new Error('Kullanıcı, başlık, mesaj ve tip alanları zorunludur');
      }

      // Set default metadata
      const defaultMetadata = {
        ikon: this.getDefaultIcon(tip),
        renk: this.getDefaultColor(tip),
        otomatikKapat: true,
        otomatikKapatSuresi: this.getDefaultAutoCloseTime(tip, oncelik),
      };

      const notification = new Notification({
        kullanici,
        baslik,
        mesaj,
        tip,
        oncelik,
        ilgiliToplanti,
        ilgiliGorev,
        ilgiliKullanici,
        aksiyon: aksiyon || { type: 'none' },
        metadata: { ...defaultMetadata, ...metadata },
        sonGecerlilikTarihi,
        gonderimDurumu: 'bekliyor',
      });

      await notification.save();

      // Try to send real-time notification
      const sentRealTime = await this.sendRealTimeNotification(notification);

      // Mark as delivered or failed
      if (sentRealTime) {
        await notification.markAsDelivered();
      } else {
        // User is offline, notification will be stored and shown when they come online
        notification.gonderimDurumu = 'gonderildi'; // Still consider it "sent" for offline delivery
        await notification.save();
      }

      logger.info(`🔔 Notification created for user ${kullanici}: ${baslik}`);
      return notification;
    } catch (error) {
      logger.error('❌ Create notification error:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createNotificationsForUsers(userIds, data) {
    try {
      const notifications = await Promise.all(
        userIds.map(kullanici =>
          this.createNotification({ ...data, kullanici }),
        ),
      );

      logger.info(
        `🔔 Created ${notifications.length} notifications for multiple users`,
      );
      return notifications;
    } catch (error) {
      logger.error('❌ Create multiple notifications error:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via Socket.IO
   */
  async sendRealTimeNotification(notification) {
    try {
      const notificationData = {
        _id: notification._id,
        baslik: notification.baslik,
        mesaj: notification.mesaj,
        tip: notification.tip,
        oncelik: notification.oncelik,
        metadata: notification.metadata,
        aksiyon: notification.aksiyon,
        ilgiliToplanti: notification.ilgiliToplanti,
        ilgiliGorev: notification.ilgiliGorev,
        ilgiliKullanici: notification.ilgiliKullanici,
        olusturmaTarihi: notification.olusturmaTarihi,
      };

      return await socketService.sendNotificationToUser(
        notification.kullanici,
        notificationData,
      );
    } catch (error) {
      logger.error('❌ Send real-time notification error:', error);
      return false;
    }
  }

  /**
   * 📅 Meeting Invitation Notification
   */
  async sendMeetingInvitationNotification(meeting, participants) {
    try {
      const baslik = `Toplantı Daveti: ${meeting.baslik}`;
      const meetingDate = new Date(meeting.tarih).toLocaleDateString('tr-TR');
      const mesaj = `${meeting.organizator?.ad} ${meeting.organizator?.soyad} tarafından ${meetingDate} tarihinde düzenlenecek toplantıya davet edildiniz.`;

      const notificationData = {
        baslik,
        mesaj,
        tip: 'meeting-invitation',
        oncelik: 'yüksek',
        ilgiliToplanti: meeting._id,
        ilgiliKullanici: meeting.organizator?._id,
        aksiyon: {
          type: 'navigate',
          url: `/meetings/${meeting._id}`,
          label: 'Toplantı Detayları',
        },
        metadata: {
          ikon: 'EventIcon',
          renk: 'primary',
          otomatikKapat: false,
        },
      };

      const participantIds = participants
        .map(p => p.kullanici?._id || p._id)
        .filter(
          id => id && id.toString() !== meeting.organizator._id.toString(),
        );

      const notifications = await this.createNotificationsForUsers(
        participantIds,
        notificationData,
      );

      logger.info(
        `📅 Meeting invitation notifications sent to ${notifications.length} participants`,
      );
      return notifications;
    } catch (error) {
      logger.error('❌ Meeting invitation notification error:', error);
      throw error;
    }
  }

  /**
   * ⏰ Meeting Reminder Notification
   */
  async sendMeetingReminderNotification(
    meeting,
    participants,
    reminderTime = '15min',
  ) {
    try {
      const reminderTexts = {
        '15min': '15 dakika',
        '1hour': '1 saat',
        '1day': '1 gün',
      };

      const baslik = `Toplantı Hatırlatması: ${meeting.baslik}`;
      const mesaj = `Toplantınız ${reminderTexts[reminderTime]} sonra başlıyor. Hazırlıklarınızı tamamlayın.`;

      const notificationData = {
        baslik,
        mesaj,
        tip: 'meeting-reminder',
        oncelik: 'yüksek',
        ilgiliToplanti: meeting._id,
        aksiyon: {
          type: 'navigate',
          url: `/meetings/${meeting._id}`,
          label: 'Toplantıya Katıl',
        },
        metadata: {
          ikon: 'AccessTimeIcon',
          renk: 'warning',
          otomatikKapat: false,
        },
      };

      const participantIds = participants
        .map(p => p.kullanici?._id || p._id)
        .filter(id => id);

      const notifications = await this.createNotificationsForUsers(
        participantIds,
        notificationData,
      );

      logger.info(
        `⏰ Meeting reminder notifications sent to ${notifications.length} participants`,
      );
      return notifications;
    } catch (error) {
      logger.error('❌ Meeting reminder notification error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Meeting Started Notification
   */
  async sendMeetingStartedNotification(meeting, participants) {
    try {
      const baslik = `Toplantı Başladı: ${meeting.baslik}`;
      const mesaj = 'Toplantı şu anda devam ediyor. Katılım sağlayabilirsiniz.';

      const notificationData = {
        baslik,
        mesaj,
        tip: 'meeting-started',
        oncelik: 'normal',
        ilgiliToplanti: meeting._id,
        aksiyon: {
          type: 'navigate',
          url: `/meetings/${meeting._id}`,
          label: 'Toplantıya Katıl',
        },
        metadata: {
          ikon: 'PlayCircleIcon',
          renk: 'success',
          otomatikKapat: true,
          otomatikKapatSuresi: 10000,
        },
      };

      const participantIds = participants
        .map(p => p.kullanici?._id || p._id)
        .filter(id => id);

      const notifications = await this.createNotificationsForUsers(
        participantIds,
        notificationData,
      );

      logger.info(
        `🎯 Meeting started notifications sent to ${notifications.length} participants`,
      );
      return notifications;
    } catch (error) {
      logger.error('❌ Meeting started notification error:', error);
      throw error;
    }
  }

  /**
   * 📋 Task Assignment Notification
   */
  async sendTaskAssignmentNotification(task, assignee) {
    try {
      const baslik = `Yeni Görev: ${task.baslik}`;
      const dueDate = task.teslimTarihi
        ? new Date(task.teslimTarihi).toLocaleDateString('tr-TR')
        : 'Belirsiz';
      const mesaj = `Size yeni bir görev atandı. Teslim tarihi: ${dueDate}`;

      const notificationData = {
        kullanici: assignee._id,
        baslik,
        mesaj,
        tip: 'task-assigned',
        oncelik: this.getTaskPriority(task.oncelik),
        ilgiliGorev: task._id,
        ilgiliToplanti: task.kaynakToplanti,
        aksiyon: {
          type: 'navigate',
          url: `/tasks/${task._id}`,
          label: 'Görevi Görüntüle',
        },
        metadata: {
          ikon: 'AssignmentIcon',
          renk: 'primary',
          otomatikKapat: false,
        },
      };

      const notification = await this.createNotification(notificationData);

      logger.info(
        `📋 Task assignment notification sent to user ${assignee._id}`,
      );
      return notification;
    } catch (error) {
      logger.error('❌ Task assignment notification error:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Task Overdue Notification
   */
  async sendTaskOverdueNotification(task, assignee) {
    try {
      const daysOverdue = Math.floor(
        (new Date() - new Date(task.teslimTarihi)) / (1000 * 60 * 60 * 24),
      );

      const baslik = `Süresi Geçen Görev: ${task.baslik}`;
      const mesaj = `Görevinizin süresi ${daysOverdue} gün önce dolmuştur. Lütfen tamamlayın.`;

      const notificationData = {
        kullanici: assignee._id,
        baslik,
        mesaj,
        tip: 'task-overdue',
        oncelik: 'kritik',
        ilgiliGorev: task._id,
        aksiyon: {
          type: 'navigate',
          url: `/tasks/${task._id}`,
          label: 'Görevi Tamamla',
        },
        metadata: {
          ikon: 'ErrorIcon',
          renk: 'error',
          otomatikKapat: false,
        },
      };

      const notification = await this.createNotification(notificationData);

      logger.info(`⚠️ Task overdue notification sent to user ${assignee._id}`);
      return notification;
    } catch (error) {
      logger.error('❌ Task overdue notification error:', error);
      throw error;
    }
  }

  /**
   * ✅ Task Completed Notification
   */
  async sendTaskCompletedNotification(task, assignee, completedBy) {
    try {
      const baslik = `Görev Tamamlandı: ${task.baslik}`;
      const mesaj = `${completedBy.ad} ${completedBy.soyad} tarafından görev tamamlandı.`;

      const notificationData = {
        kullanici: assignee._id,
        baslik,
        mesaj,
        tip: 'task-completed',
        oncelik: 'normal',
        ilgiliGorev: task._id,
        ilgiliKullanici: completedBy._id,
        aksiyon: {
          type: 'navigate',
          url: `/tasks/${task._id}`,
          label: 'Görevi İncele',
        },
        metadata: {
          ikon: 'CheckCircleIcon',
          renk: 'success',
          otomatikKapat: true,
          otomatikKapatSuresi: 8000,
        },
      };

      const notification = await this.createNotification(notificationData);

      logger.info(
        `✅ Task completed notification sent to user ${assignee._id}`,
      );
      return notification;
    } catch (error) {
      logger.error('❌ Task completed notification error:', error);
      throw error;
    }
  }

  /**
   * 🔔 System Notification
   */
  async sendSystemNotification(userIds, baslik, mesaj, options = {}) {
    try {
      const notificationData = {
        baslik,
        mesaj,
        tip: 'system',
        oncelik: options.oncelik || 'normal',
        aksiyon: options.aksiyon || { type: 'none' },
        metadata: {
          ikon: options.ikon || 'InfoIcon',
          renk: options.renk || 'info',
          otomatikKapat: options.otomatikKapat !== false,
          otomatikKapatSuresi: options.otomatikKapatSuresi || 6000,
          ...options.metadata,
        },
        sonGecerlilikTarihi: options.sonGecerlilikTarihi,
      };

      const notifications = await this.createNotificationsForUsers(
        userIds,
        notificationData,
      );

      logger.info(
        `🔔 System notifications sent to ${notifications.length} users`,
      );
      return notifications;
    } catch (error) {
      logger.error('❌ System notification error:', error);
      throw error;
    }
  }

  /**
   * Get default icon for notification type
   */
  getDefaultIcon(tip) {
    const icons = {
      'meeting-invitation': 'EventIcon',
      'meeting-reminder': 'AccessTimeIcon',
      'meeting-started': 'PlayCircleIcon',
      'meeting-ended': 'StopCircleIcon',
      'task-assigned': 'AssignmentIcon',
      'task-overdue': 'ErrorIcon',
      'task-completed': 'CheckCircleIcon',
      system: 'InfoIcon',
      general: 'NotificationsIcon',
    };
    return icons[tip] || 'NotificationsIcon';
  }

  /**
   * Get default color for notification type
   */
  getDefaultColor(tip) {
    const colors = {
      'meeting-invitation': 'primary',
      'meeting-reminder': 'warning',
      'meeting-started': 'success',
      'meeting-ended': 'info',
      'task-assigned': 'primary',
      'task-overdue': 'error',
      'task-completed': 'success',
      system: 'info',
      general: 'primary',
    };
    return colors[tip] || 'primary';
  }

  /**
   * Get default auto close time based on type and priority
   */
  getDefaultAutoCloseTime(tip, oncelik) {
    if (
      ['meeting-invitation', 'meeting-reminder', 'task-overdue'].includes(tip)
    ) {
      return 0; // Don't auto close important notifications
    }

    if (oncelik === 'kritik') {
      return 0;
    }
    if (oncelik === 'yüksek') {
      return 10000;
    }
    if (oncelik === 'normal') {
      return 6000;
    }
    return 4000; // düşük
  }

  /**
   * Convert task priority to notification priority
   */
  getTaskPriority(taskPriority) {
    const mapping = {
      kritik: 'kritik',
      yüksek: 'yüksek',
      orta: 'normal',
      normal: 'normal',
      düşük: 'düşük',
    };
    return mapping[taskPriority] || 'normal';
  }

  /**
   * Clean expired notifications (for scheduled task)
   */
  async cleanExpiredNotifications() {
    try {
      const result = await Notification.cleanExpired();
      if (result.deletedCount > 0) {
        logger.info(`🧹 Cleaned ${result.deletedCount} expired notifications`);
      }
      return result;
    } catch (error) {
      logger.error('❌ Clean expired notifications error:', error);
      throw error;
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    try {
      const failedNotifications = await Notification.getFailedNotifications();
      let retryCount = 0;

      for (const notification of failedNotifications) {
        try {
          const sent = await this.sendRealTimeNotification(notification);
          if (sent) {
            await notification.markAsDelivered();
            retryCount++;
          } else {
            await notification.markAsFailed('User still offline');
          }
        } catch (error) {
          await notification.markAsFailed(error.message);
        }
      }

      if (retryCount > 0) {
        logger.info(`🔄 Retried ${retryCount} failed notifications`);
      }

      return retryCount;
    } catch (error) {
      logger.error('❌ Retry failed notifications error:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
