const express = require('express');
const Machine = require('../models/Machine');
const User = require('../models/User');
const { auth, checkModulePermission } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/machines
// @desc    Tüm makinaları listele
// @access  Private (Envanter Yönetimi modülü erişim yetkisi)
router.get('/', auth, checkModulePermission('Envanter Yönetimi'), async (req, res) => {
  try {
    const machines = await Machine.find()
      .populate('departman', 'ad')
      .populate('sorumluRoller', 'ad')
      .sort({ makinaNo: 1 });

    res.json(machines);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/machines/my-accessible
// @desc    Kullanıcının erişebileceği makinaları listele
// @access  Private
router.get('/my-accessible', auth, async (req, res) => {
  try {
    // Kullanıcının rollerini al
    const user = await User.findById(req.user._id).populate('roller');

    if (!user || !user.roller || user.roller.length === 0) {
      return res.json([]);
    }

    const userRoleIds = user.roller.map(role => role._id);

    // Kullanıcının rollerinin sorumlu olduğu makinaları bul
    const machines = await Machine.find({
      sorumluRoller: { $in: userRoleIds },
      durum: 'aktif',
    })
      .populate('departman', 'ad')
      .populate('sorumluRoller', 'ad')
      .sort({ makinaNo: 1 });

    res.json(machines);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/machines
// @desc    Yeni makina ekle
// @access  Private (Envanter Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, makinaNo, departman, sorumluRoller, durum, aciklama } = req.body;

      // Makina numarası benzersiz mi kontrol et
      const existingMachine = await Machine.findOne({ makinaNo });
      if (existingMachine) {
        return res.status(400).json({ message: 'Bu makina numarası zaten kullanılıyor' });
      }

      const machine = new Machine({
        ad,
        makinaNo,
        departman,
        sorumluRoller: sorumluRoller || [],
        durum: durum || 'aktif',
        aciklama,
      });

      await machine.save();

      // Populate edilmiş hali ile döndür
      const populatedMachine = await Machine.findById(machine._id)
        .populate('departman', 'ad')
        .populate('sorumluRoller', 'ad');

      res.status(201).json(populatedMachine);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /api/machines/:id
// @desc    Makina güncelle
// @access  Private (Envanter Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, makinaNo, departman, sorumluRoller, durum, aciklama } = req.body;

      // Makina numarası benzersiz mi kontrol et (kendisi hariç)
      const existingMachine = await Machine.findOne({
        makinaNo,
        _id: { $ne: req.params.id },
      });
      if (existingMachine) {
        return res.status(400).json({ message: 'Bu makina numarası zaten kullanılıyor' });
      }

      const machine = await Machine.findByIdAndUpdate(
        req.params.id,
        {
          ad,
          makinaNo,
          departman,
          sorumluRoller: sorumluRoller || [],
          durum,
          aciklama,
          guncellemeTarihi: Date.now(),
        },
        { new: true },
      )
        .populate('departman', 'ad')
        .populate('sorumluRoller', 'ad');

      if (!machine) {
        return res.status(404).json({ message: 'Makina bulunamadı' });
      }

      res.json(machine);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz makina ID' });
      }
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   DELETE /api/machines/:id
// @desc    Makina sil
// @access  Private (Envanter Yönetimi modülü düzenleme yetkisi)
router.delete(
  '/:id',
  auth,
  checkModulePermission('Envanter Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const machine = await Machine.findById(req.params.id);

      if (!machine) {
        return res.status(404).json({ message: 'Makina bulunamadı' });
      }

      await Machine.findByIdAndDelete(req.params.id);

      res.json({ message: 'Makina başarıyla silindi' });
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz makina ID' });
      }
      res.status(500).send('Sunucu hatası');
    }
  },
);

module.exports = router;
