const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

/**
 * 🔔 MMM95 Notification Routes
 * In-app notification management endpoints
 */

// @route   GET /api/notifications
// @desc    Kullanıcının bildirimlerini listele
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      tip,
      okundu,
      limit = 20,
      page = 1,
      sortBy = 'olusturmaTarihi',
      sortOrder = 'desc',
    } = req.query;

    const options = {
      tip,
      okundu: okundu !== undefined ? okundu === 'true' : undefined,
      limit: parseInt(limit),
      page: parseInt(page),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1,
    };

    const result = await Notification.getUserNotifications(
      req.user.id,
      options,
    );

    res.json({
      message: 'Bildirimler başarıyla getirildi',
      ...result,
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Okunmamış bildirim sayısını getir
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   GET /api/notifications/:id
// @desc    Belirli bir bildirimi getir
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      kullanici: req.user.id,
      silindiMi: false,
    })
      .populate('ilgiliToplanti', 'baslik tarih baslangicSaati')
      .populate('ilgiliGorev', 'baslik teslimTarihi durum')
      .populate('ilgiliKullanici', 'ad soyad');

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    res.json({
      message: 'Bildirim başarıyla getirildi',
      notification,
    });
  } catch (error) {
    logger.error('Get notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Bildirimi okundu olarak işaretle
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      kullanici: req.user.id,
      silindiMi: false,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    await notification.markAsRead();

    // Send updated unread count via Socket.IO
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    if (socketService.isUserOnline(req.user.id)) {
      socketService.sendNotificationToUser(req.user.id, {
        type: 'unread-count-update',
        count: unreadCount,
      });
    }

    res.json({
      message: 'Bildirim okundu olarak işaretlendi',
      notification,
      unreadCount,
    });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   PUT /api/notifications/read-multiple
// @desc    Birden fazla bildirimi okundu olarak işaretle
// @access  Private
router.put('/read-multiple', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'Geçerli bildirim ID\'leri gerekli' });
    }

    const result = await Notification.markAsRead(notificationIds, req.user.id);

    // Send updated unread count via Socket.IO
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    if (socketService.isUserOnline(req.user.id)) {
      socketService.sendNotificationToUser(req.user.id, {
        type: 'unread-count-update',
        count: unreadCount,
      });
    }

    res.json({
      message: `${result.modifiedCount} bildirim okundu olarak işaretlendi`,
      modifiedCount: result.modifiedCount,
      unreadCount,
    });
  } catch (error) {
    logger.error('Mark multiple notifications read error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Tüm bildirimleri okundu olarak işaretle
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    // Get all unread notification IDs
    const unreadNotifications = await Notification.find({
      kullanici: req.user.id,
      okundu: false,
      silindiMi: false,
    }).select('_id');

    const notificationIds = unreadNotifications.map(n => n._id);

    if (notificationIds.length === 0) {
      return res.json({
        message: 'Okunmamış bildirim bulunamadı',
        modifiedCount: 0,
        unreadCount: 0,
      });
    }

    const result = await Notification.markAsRead(notificationIds, req.user.id);

    // Send updated unread count via Socket.IO
    if (socketService.isUserOnline(req.user.id)) {
      socketService.sendNotificationToUser(req.user.id, {
        type: 'unread-count-update',
        count: 0,
      });
    }

    res.json({
      message: `Tüm bildirimler (${result.modifiedCount}) okundu olarak işaretlendi`,
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Bildirimi sil (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      kullanici: req.user.id,
      silindiMi: false,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    await notification.softDelete();

    // Send updated unread count if notification was unread
    if (!notification.okundu) {
      const unreadCount = await Notification.getUnreadCount(req.user.id);
      if (socketService.isUserOnline(req.user.id)) {
        socketService.sendNotificationToUser(req.user.id, {
          type: 'unread-count-update',
          count: unreadCount,
        });
      }
    }

    res.json({
      message: 'Bildirim başarıyla silindi',
      notificationId: req.params.id,
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   DELETE /api/notifications/delete-multiple
// @desc    Birden fazla bildirimi sil
// @access  Private
router.delete('/delete-multiple', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'Geçerli bildirim ID\'leri gerekli' });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        kullanici: req.user.id,
        silindiMi: false,
      },
      {
        $set: {
          silindiMi: true,
          silinmeTarihi: new Date(),
          guncellemeTarihi: new Date(),
        },
      },
    );

    // Send updated unread count
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    if (socketService.isUserOnline(req.user.id)) {
      socketService.sendNotificationToUser(req.user.id, {
        type: 'unread-count-update',
        count: unreadCount,
      });
    }

    res.json({
      message: `${result.modifiedCount} bildirim başarıyla silindi`,
      modifiedCount: result.modifiedCount,
      unreadCount,
    });
  } catch (error) {
    logger.error('Delete multiple notifications error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   POST /api/notifications/test
// @desc    Test bildirimi oluştur (Admin only)
// @access  Private
router.post('/test', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Sadece admin test bildirimi oluşturabilir' });
    }

    const { recipientUserId, tip = 'system' } = req.body;
    const targetUserId = recipientUserId || req.user.id;

    const testNotification = new Notification({
      kullanici: targetUserId,
      baslik: 'Test Bildirimi',
      mesaj: `Bu bir test bildirimidir. ${new Date().toLocaleString('tr-TR')} tarihinde oluşturuldu.`,
      tip,
      oncelik: 'normal',
      metadata: {
        ikon: 'TestIcon',
        renk: 'info',
        otomatikKapat: true,
        otomatikKapatSuresi: 8000,
      },
      aksiyon: {
        type: 'none',
      },
      gonderimDurumu: 'gonderildi',
      gonderimTarihi: new Date(),
    });

    await testNotification.save();

    // Send via Socket.IO if user is online
    const notificationData = {
      _id: testNotification._id,
      baslik: testNotification.baslik,
      mesaj: testNotification.mesaj,
      tip: testNotification.tip,
      oncelik: testNotification.oncelik,
      metadata: testNotification.metadata,
      aksiyon: testNotification.aksiyon,
      olusturmaTarihi: testNotification.olusturmaTarihi,
    };

    const sentRealTime = await socketService.sendNotificationToUser(
      targetUserId,
      notificationData,
    );

    res.json({
      message: 'Test bildirimi başarıyla oluşturuldu',
      notification: testNotification,
      sentRealTime,
      targetUser: targetUserId,
    });
  } catch (error) {
    logger.error('Create test notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   GET /api/notifications/stats
// @desc    Bildirim istatistikleri (Admin only)
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Sadece admin istatistikleri görüntüleyebilir' });
    }

    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      failedNotifications,
      recentNotifications,
    ] = await Promise.all([
      // Total notifications
      Notification.countDocuments({ silindiMi: false }),

      // Unread notifications
      Notification.countDocuments({ okundu: false, silindiMi: false }),

      // Notifications by type
      Notification.aggregate([
        { $match: { silindiMi: false } },
        { $group: { _id: '$tip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Failed notifications
      Notification.countDocuments({ gonderimDurumu: 'hata' }),

      // Recent notifications (last 24 hours)
      Notification.countDocuments({
        olusturmaTarihi: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        silindiMi: false,
      }),
    ]);

    const socketStats = socketService.getStats();

    res.json({
      message: 'Bildirim istatistikleri',
      stats: {
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        failedNotifications,
        recentNotifications,
        socketConnection: socketStats,
      },
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;
