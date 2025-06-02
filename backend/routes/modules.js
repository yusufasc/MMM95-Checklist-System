const express = require('express');
const Module = require('../models/Module');
const router = express.Router();

// @route   GET /api/modules
// @desc    Tüm modülleri listele
// @access  Private
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find();
    res.json(modules);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/modules
// @desc    Yeni modül ekle
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const { ad, aciklama } = req.body;

    const module = new Module({
      ad,
      aciklama,
    });

    await module.save();
    res.status(201).json(module);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
