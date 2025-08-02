const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { auth, checkModulePermission } = require('../middleware/auth');
// const { usersListCache, invalidateCache, cacheService } = require('../middleware/cache');
const router = express.Router();

// @route   GET /api/users
// @desc    Tüm kullanıcıları listele
// @access  Private (Kullanıcı Yönetimi modülü erişim yetkisi)
router.get(
  '/',
  auth,
  checkModulePermission('Kullanıcı Yönetimi'),
  // usersListCache(), // 🚀 CACHE: 30 dakika
  async (req, res) => {
    try {
      const users = await User.find({ durum: 'aktif' })
        .populate('roller', 'ad')
        .populate('departmanlar', 'ad')
        .select('-sifreHash');

      res.json(users);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   GET /api/users/active-workers
// @desc    Aktif çalışanları listele (kalite kontrol için)
// @access  Private (Kalite Kontrol modülü erişim yetkisi)
router.get(
  '/active-workers',
  auth,
  checkModulePermission('Kalite Kontrol'),
  async (req, res) => {
    try {
      const workers = await User.find({ durum: 'aktif' })
        .populate('roller', 'ad')
        .populate('departmanlar', 'ad')
        .select('-sifreHash')
        .sort('ad soyad');

      res.json(workers);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   POST /api/users
// @desc    Yeni kullanıcı ekle
// @access  Private (Kullanıcı Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Kullanıcı Yönetimi', 'duzenleyebilir'),
  // invalidateCache([
  //   () => cacheService.invalidateUser(), // 🗑️ CACHE: Kullanıcı cache'lerini temizle
  //   'users:*',
  // ]),
  async (req, res) => {
    try {
      console.log('👤 Kullanıcı ekleme isteği alındı:', {
        body: req.body,
        userId: req.user?._id,
        userRoles: req.user?.roller?.map(r => r.ad),
      });

      const { ad, soyad, kullaniciAdi, sifre, roller, departmanlar, durum } =
        req.body;

      // Şifre uzunluk kontrolü
      if (sifre.length < 6) {
        return res
          .status(400)
          .json({ message: 'Şifre en az 6 karakter olmalıdır' });
      }

      // Kullanıcı adı benzersizlik kontrolü
      let user = await User.findOne({ kullaniciAdi });
      if (user) {
        return res
          .status(400)
          .json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }

      // Şifreyi hashle
      const salt = await bcrypt.genSalt(10);
      const sifreHash = await bcrypt.hash(sifre, salt);

      // Yeni kullanıcı oluştur
      user = new User({
        ad,
        soyad,
        kullaniciAdi,
        sifreHash,
        roller,
        departmanlar,
        durum: durum || 'aktif',
      });

      await user.save();
      console.log('✅ Kullanıcı başarıyla kaydedildi:', {
        id: user._id,
        kullaniciAdi: user.kullaniciAdi,
        ad: user.ad,
        soyad: user.soyad,
      });

      // Şifreyi response'dan çıkar
      const userResponse = await User.findById(user.id)
        .populate('roller', 'ad')
        .populate('departmanlar', 'ad')
        .select('-sifreHash');

      console.log('📤 Response gönderiliyor:', {
        id: userResponse._id,
        kullaniciAdi: userResponse.kullaniciAdi,
      });

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('❌ Kullanıcı ekleme hatası:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  },
);

// @route   PUT /api/users/:id
// @desc    Kullanıcı güncelle
// @access  Private (Kullanıcı Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id',
  auth,
  checkModulePermission('Kullanıcı Yönetimi', 'duzenleyebilir'),
  // invalidateCache([
  //   (req) => cacheService.invalidateUser(req.params.id), // 🗑️ CACHE: Belirli kullanıcı cache'ini temizle
  //   'users:*',
  // ]),
  async (req, res) => {
    try {
      const { ad, soyad, kullaniciAdi, sifre, roller, departmanlar, durum } =
        req.body;

      // Kullanıcıyı bul
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      // Kullanıcı adı değiştirilmişse benzersizlik kontrolü yap
      if (kullaniciAdi && kullaniciAdi !== user.kullaniciAdi) {
        const existingUser = await User.findOne({ kullaniciAdi });
        if (existingUser) {
          return res
            .status(400)
            .json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
        }
      }

      // Güncelleme verilerini hazırla
      const updateData = {
        ad: ad || user.ad,
        soyad: soyad || user.soyad,
        kullaniciAdi: kullaniciAdi || user.kullaniciAdi,
        roller: roller || user.roller,
        departmanlar: departmanlar || user.departmanlar,
        durum: durum || user.durum,
        guncellemeTarihi: Date.now(),
      };

      // Şifre değiştirilecekse hashle
      if (sifre) {
        if (sifre.length < 6) {
          return res
            .status(400)
            .json({ message: 'Şifre en az 6 karakter olmalıdır' });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.sifreHash = await bcrypt.hash(sifre, salt);
      }

      // Kullanıcıyı güncelle
      user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      })
        .populate('roller', 'ad')
        .populate('departmanlar', 'ad')
        .select('-sifreHash');

      res.json(user);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz kullanıcı ID' });
      }
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// @route   DELETE /api/users/:id
// @desc    Kullanıcı sil (soft delete)
// @access  Private (Kullanıcı Yönetimi modülü düzenleme yetkisi)
router.delete(
  '/:id',
  auth,
  checkModulePermission('Kullanıcı Yönetimi', 'duzenleyebilir'),
  // invalidateCache([
  //   (req) => cacheService.invalidateUser(req.params.id), // 🗑️ CACHE: Belirli kullanıcı cache'ini temizle
  //   'users:*',
  // ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      // Admin kendini silemesin
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Kendinizi silemezsiniz' });
      }

      // Soft delete - durumu pasif yap
      user.durum = 'pasif';
      user.guncellemeTarihi = Date.now();
      await user.save();

      res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz kullanıcı ID' });
      }
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

module.exports = router;
