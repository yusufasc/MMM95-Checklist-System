const express = require('express');
const Role = require('../models/Role');
const User = require('../models/User');
const { auth, checkModulePermission } = require('../middleware/auth');
// const { rolesListCache, invalidateCache, cacheService } = require('../middleware/cache');
const router = express.Router();

// @route   GET /api/roles
// @desc    Tüm rolleri listele
// @access  Private (Rol Yönetimi modülü erişim yetkisi)
router.get(
  '/',
  auth,
  checkModulePermission('Rol Yönetimi'),
  // rolesListCache(), // 🚀 CACHE: 60 dakika
  async (req, res) => {
    try {
      const roles = await Role.find()
        .populate('moduller.modul', 'ad aciklama')
        .populate('checklistYetkileri.hedefRol', 'ad');

      // Cache header'ları ekle
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Last-Modified': new Date().toUTCString(),
      });

      res.json(roles);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   GET /api/roles/my-permissions
// @desc    Kullanıcının kendi rollerinin yetkilerini listele
// @access  Private (Herhangi bir kullanıcı kendi rollerini görebilir)
router.get('/my-permissions', auth, async (req, res) => {
  try {
    const User = require('../models/User');

    // Kullanıcının rollerini al
    const user = await User.findById(req.user._id).populate('roller');

    if (!user || !user.roller || user.roller.length === 0) {
      return res.json([]);
    }

    const userRoleIds = user.roller.map(role => role._id);

    // Kullanıcının rollerini detaylı bilgilerle getir
    const roles = await Role.find({ _id: { $in: userRoleIds } })
      .populate('moduller.modul', 'ad aciklama')
      .populate('checklistYetkileri.hedefRol', 'ad');

    res.json(roles);
  } catch (error) {
    console.error('My permissions error:', error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/roles/:id
// @desc    Belirli bir rolü getir
// @access  Private (Rol Yönetimi modülü erişim yetkisi)
router.get(
  '/:id',
  auth,
  checkModulePermission('Rol Yönetimi'),
  async (req, res) => {
    try {
      const role = await Role.findById(req.params.id)
        .populate('moduller.modul', 'ad aciklama')
        .populate('checklistYetkileri.hedefRol', 'ad');

      if (!role) {
        return res.status(404).json({ message: 'Rol bulunamadı' });
      }

      console.log(`🔍 Role API getById - ${role.ad}:`);
      console.log(
        '📋 Raw checklistYetkileri:',
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
        return res
          .status(400)
          .json({ message: 'Bu rol adı zaten kullanılıyor' });
      }

      // Checklist yetkilerini normalize et (onaylayabilir -> puanlayabilir)
      const normalizedChecklistYetkileri = (checklistYetkileri || []).map(
        yetki => ({
          hedefRol: yetki.hedefRol,
          gorebilir: yetki.gorebilir || false,
          puanlayabilir: yetki.puanlayabilir || yetki.onaylayabilir || false,
          onaylayabilir: yetki.onaylayabilir || yetki.puanlayabilir || false, // Backward compatibility
        }),
      );

      // Yeni rol oluştur
      role = new Role({
        ad,
        moduller: moduller || [],
        checklistYetkileri: normalizedChecklistYetkileri,
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
      console.log(
        '📥 Gelen checklistYetkileri:',
        JSON.stringify(checklistYetkileri, null, 2),
      );

      // Checklist yetkilerini normalize et (onaylayabilir -> puanlayabilir)
      const normalizedChecklistYetkileri = (checklistYetkileri || []).map(
        yetki => ({
          hedefRol: yetki.hedefRol,
          gorebilir: yetki.gorebilir || false,
          puanlayabilir: yetki.puanlayabilir || yetki.onaylayabilir || false,
          onaylayabilir: yetki.onaylayabilir || yetki.puanlayabilir || false, // Backward compatibility
        }),
      );

      // Rol adı benzersizlik kontrolü (kendi adı hariç)
      const existingRole = await Role.findOne({
        ad,
        _id: { $ne: req.params.id },
      });
      if (existingRole) {
        return res
          .status(400)
          .json({ message: 'Bu rol adı zaten kullanılıyor' });
      }

      const role = await Role.findByIdAndUpdate(
        req.params.id,
        {
          ad,
          moduller: moduller || [],
          checklistYetkileri: normalizedChecklistYetkileri,
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
// @access  Private (Rol Yönetimi modülü düzenleme yetkisi)
router.delete(
  '/:id',
  auth,
  checkModulePermission('Rol Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      // Rolü kullanan kullanıcı var mı kontrol et
      const usersWithRole = await User.countDocuments({
        roller: req.params.id,
      });

      if (usersWithRole > 0) {
        return res.status(400).json({
          message: `Bu rol ${usersWithRole} kullanıcı tarafından kullanılıyor. Önce kullanıcıların rollerini değiştirin.`,
        });
      }

      const role = await Role.findByIdAndDelete(req.params.id);

      if (!role) {
        return res.status(404).json({ message: 'Rol bulunamadı' });
      }

      res.json({ message: 'Rol başarıyla silindi' });
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz rol ID' });
      }
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

module.exports = router;
