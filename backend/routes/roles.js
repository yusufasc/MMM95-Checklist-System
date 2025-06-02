const express = require('express');
const Role = require('../models/Role');
const { auth, checkModulePermission } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/roles
// @desc    Tüm rolleri listele
// @access  Private (Rol Yönetimi modülü erişim yetkisi)
router.get('/', auth, checkModulePermission('Rol Yönetimi'), async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('moduller.modul', 'ad aciklama')
      .populate('checklistYetkileri.hedefRol', 'ad');

    res.json(roles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/roles/:id
// @desc    Belirli bir rolü getir
// @access  Private (Rol Yönetimi modülü erişim yetkisi)
router.get('/:id', auth, checkModulePermission('Rol Yönetimi'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('moduller.modul', 'ad aciklama')
      .populate('checklistYetkileri.hedefRol', 'ad');

    if (!role) {
      return res.status(404).json({ message: 'Rol bulunamadı' });
    }

    console.log(`🔍 Role API getById - ${role.ad}:`);
    console.log('📋 Raw checklistYetkileri:', JSON.stringify(role.checklistYetkileri, null, 2));

    res.json(role);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Geçersiz rol ID' });
    }
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/roles
// @desc    Yeni rol ekle
// @access  Private (Rol Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Rol Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, moduller, checklistYetkileri } = req.body;

      // Rol adı benzersizlik kontrolü
      let role = await Role.findOne({ ad });
      if (role) {
        return res.status(400).json({ message: 'Bu rol adı zaten kullanılıyor' });
      }

      // Yeni rol oluştur
      role = new Role({
        ad,
        moduller: moduller || [],
        checklistYetkileri: checklistYetkileri || [],
      });

      await role.save();

      // Populate edilmiş hali ile döndür
      const roleResponse = await Role.findById(role.id)
        .populate('moduller.modul', 'ad aciklama')
        .populate('checklistYetkileri.hedefRol', 'ad');

      res.status(201).json(roleResponse);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /api/roles/:id
// @desc    Rol güncelle
// @access  Private (Rol Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id',
  auth,
  checkModulePermission('Rol Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, moduller, checklistYetkileri } = req.body;

      console.log(`💾 Role API PUT - ${ad}:`);
      console.log('📥 Gelen checklistYetkileri:', JSON.stringify(checklistYetkileri, null, 2));

      // Rol adı benzersizlik kontrolü (kendi adı hariç)
      const existingRole = await Role.findOne({ ad, _id: { $ne: req.params.id } });
      if (existingRole) {
        return res.status(400).json({ message: 'Bu rol adı zaten kullanılıyor' });
      }

      const role = await Role.findByIdAndUpdate(
        req.params.id,
        {
          ad,
          moduller: moduller || [],
          checklistYetkileri: checklistYetkileri || [],
          guncellemeTarihi: Date.now(),
        },
        { new: true },
      )
        .populate('moduller.modul', 'ad aciklama')
        .populate('checklistYetkileri.hedefRol', 'ad');

      if (!role) {
        return res.status(404).json({ message: 'Rol bulunamadı' });
      }

      console.log('💾 Kaydedilen rol:');
      console.log(
        '📤 Güncellenmiş checklistYetkileri:',
        JSON.stringify(role.checklistYetkileri, null, 2),
      );

      res.json(role);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz rol ID' });
      }
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   DELETE /api/roles/:id
// @desc    Rol sil
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Rol bulunamadı' });
    }

    res.json({ message: 'Rol silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
