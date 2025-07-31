const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { kullaniciAdi, sifre } = req.body;
    console.log('🔍 Login attempt:', { kullaniciAdi, sifre: '***' });

    // Kullanıcıyı bul ve rol bilgilerini tam olarak populate et
    const user = await User.findOne({ kullaniciAdi })
      .populate({
        path: 'roller',
        populate: [
          {
            path: 'moduller.modul',
            model: 'Module',
          },
          {
            path: 'checklistYetkileri.hedefRol',
            model: 'Role',
            select: 'ad',
          },
        ],
      })
      .populate('departmanlar', 'ad');

    if (!user) {
      console.log('❌ User not found:', kullaniciAdi);
      return res
        .status(400)
        .json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    console.log('✅ User found:', user.kullaniciAdi, user.ad, user.soyad);

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(sifre, user.sifreHash);
    console.log('🔐 Password check:', isMatch);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', kullaniciAdi);
      return res
        .status(400)
        .json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    // Kullanıcı aktif mi?
    if (user.durum !== 'aktif') {
      return res.status(400).json({ message: 'Hesabınız pasif durumda' });
    }

    // JWT token oluştur - Sadece gerekli minimal bilgileri dahil et
    const payload = {
      user: {
        id: user.id,
        kullaniciAdi: user.kullaniciAdi,
        // Roller ve departmanlar sadece ID'ler olarak (boyut optimizasyonu için)
        rollerIds: user.roller.map(r => r._id),
        departmanlarIds: user.departmanlar.map(d => d._id),
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          throw err;
        }
        res.json({
          token,
          user: {
            id: user.id,
            ad: user.ad,
            soyad: user.soyad,
            kullaniciAdi: user.kullaniciAdi,
            roller: user.roller, // Tam populate edilmiş rol bilgileri
            departmanlar: user.departmanlar,
            durum: user.durum,
          },
        });
      },
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/auth/me
// @desc    Giriş yapmış kullanıcı bilgilerini getir
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Auth middleware'den gelen user id'sini kullan
    const userId = req.user.id;
    console.log('🔍 Auth/me - User ID:', userId);

    // Kullanıcıyı bul ve tüm rol bilgilerini tam olarak populate et
    const user = await User.findById(userId)
      .populate({
        path: 'roller',
        populate: [
          {
            path: 'moduller.modul',
            model: 'Module',
          },
          {
            path: 'checklistYetkileri.hedefRol',
            model: 'Role',
            select: 'ad',
          },
        ],
      })
      .populate('departmanlar', 'ad');

    if (!user) {
      console.log('❌ Auth/me - Kullanıcı bulunamadı, ID:', userId);
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    console.log('✅ Auth/me - Kullanıcı bulundu:', user.ad, user.soyad);
    console.log('📋 Auth/me - Roller sayısı:', user.roller?.length || 0);
    if (user.roller) {
      user.roller.forEach((rol, i) => {
        console.log(
          `  Rol ${i + 1}: ${rol.ad} (checklistYetkileri: ${rol.checklistYetkileri?.length || 0})`,
        );
      });
    }

    const response = {
      id: user.id,
      ad: user.ad,
      soyad: user.soyad,
      kullaniciAdi: user.kullaniciAdi,
      roller: user.roller, // Tam populate edilmiş rol ve checklist yetkileri
      departmanlar: user.departmanlar,
      durum: user.durum,
    };

    console.log(
      '📤 Auth/me - Response roller:',
      response.roller?.map(r => r.ad),
    );
    res.json(response);
  } catch (error) {
    console.error('❌ Auth/me hatası:', error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
