const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');
const { auth } = require('../middleware/auth');

/**
 * @route   GET /api/cache/stats
 * @desc    Cache istatistiklerini getir
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = cacheService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Cache istatistikleri alınamadı',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/cache/clear
 * @desc    Tüm cache'i temizle
 * @access  Private (Admin only)
 */
router.post('/clear', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.roller.some(role => role.ad === 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli',
      });
    }

    await cacheService.clear();

    res.json({
      success: true,
      message: 'Cache başarıyla temizlendi',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      message: 'Cache temizlenemedi',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/cache/key/:key
 * @desc    Belirli bir cache key'ini sil
 * @access  Private (Admin only)
 */
router.delete('/key/:key', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.roller.some(role => role.ad === 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli',
      });
    }

    const { key } = req.params;
    await cacheService.del(key);

    res.json({
      success: true,
      message: `Cache key '${key}' başarıyla silindi`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Cache key silinemedi',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/cache/pattern/:pattern
 * @desc    Pattern'e uyan cache key'lerini sil
 * @access  Private (Admin only)
 */
router.delete('/pattern/:pattern', auth, async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.roller.some(role => role.ad === 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli',
      });
    }

    const { pattern } = req.params;
    await cacheService.delPattern(pattern);

    res.json({
      success: true,
      message: `Pattern '${pattern}' ile eşleşen cache key'leri silindi`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache pattern delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Cache pattern silinemedi',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/cache/invalidate/user/:userId
 * @desc    Kullanıcı cache'ini temizle
 * @access  Private
 */
router.post('/invalidate/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Kullanıcı sadece kendi cache'ini temizleyebilir veya admin olmalı
    if (
      req.user.id !== userId &&
      !req.user.roller.some(role => role.ad === 'Admin')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetki yok',
      });
    }

    await cacheService.invalidateUser(userId);

    res.json({
      success: true,
      message: `Kullanıcı ${userId} cache'i temizlendi`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('User cache invalidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı cache\'i temizlenemedi',
      error: error.message,
    });
  }
});

module.exports = router;
