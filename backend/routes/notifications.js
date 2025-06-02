const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// @route   GET /api/notifications
// @desc    Bildirimleri listele
// @access  Private
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .sort({ tarih: -1 });

    res.json(notifications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/notifications
// @desc    Yeni bildirim oluştur
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { kullanici, mesaj } = req.body;

    const notification = new Notification({
      kullanici,
      mesaj,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
