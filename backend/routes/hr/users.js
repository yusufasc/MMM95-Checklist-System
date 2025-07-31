// HR Users Routes - User Management with Role-based Access
// Refactored from: hr.js (1050 satır → modüler yapı)
// 🎯 Amaç: HR kullanıcı yönetimi (yetkili CRUD)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const HRTemplate = require('../../models/HRTemplate');

// Kullanıcı listesi (yetki kontrolü ile)
router.get('/', async (req, res) => {
  try {
    const { sablonId, forManualEntry } = req.query;
    const query = { durum: 'aktif' }; // Sadece aktif kullanıcıları getir

    console.log('🔍 HR Users API - Request params:', {
      sablonId,
      forManualEntry,
    });

    // Mesai/devamsızlık girişi için TÜM kullanıcıları göster
    if (forManualEntry === 'true') {
      console.log('📝 HR Users API - Manual entry mode: returning all users');
      // Yetki kontrolü yapma, tüm aktif kullanıcıları dön
    } else if (sablonId) {
      // Şablon ID'si varsa, sadece o şablonun hedef rollerindeki kullanıcıları getir
      const template = await HRTemplate.findById(sablonId)
        .select('hedefRoller')
        .populate('hedefRoller', 'ad');

      console.log('📋 HR Users API - Template found:', {
        templateId: template?._id,
        templateName: template?.ad,
        hedefRoller: template?.hedefRoller?.map(r => ({
          id: r._id,
          ad: r.ad,
        })),
      });

      if (template && template.hedefRoller && template.hedefRoller.length > 0) {
        const hedefRolIds = template.hedefRoller.map(rol => rol._id);
        query.roller = { $in: hedefRolIds };
        console.log('🎯 HR Users API - Filtering by roles:', hedefRolIds);
      } else {
        console.log(
          '⚠️ HR Users API - No target roles found, returning empty list',
        );
        return res.json([]);
      }
    } else {
      // Normal yetki kontrolü
      if (
        !req.hrYetkileri.kullaniciAcabilir &&
        !req.hrYetkileri.kullaniciSilebilir
      ) {
        return res.json([]);
      }

      // Açabildiği veya silebildiği rollerdeki kullanıcıları getir
      const allowedRoles = new Set();
      if (req.hrYetkileri.acabildigiRoller) {
        req.hrYetkileri.acabildigiRoller.forEach(rol => {
          const rolId = rol._id ? rol._id.toString() : rol.toString();
          allowedRoles.add(rolId);
        });
      }
      if (req.hrYetkileri.silebildigiRoller) {
        req.hrYetkileri.silebildigiRoller.forEach(rol => {
          const rolId = rol._id ? rol._id.toString() : rol.toString();
          allowedRoles.add(rolId);
        });
      }

      if (allowedRoles.size > 0) {
        query.roller = { $in: Array.from(allowedRoles) };
      }
    }

    const users = await User.find(query)
      .select('ad soyad kullaniciAdi roller departmanlar durum')
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .sort('ad soyad');

    console.log('👥 HR Users API - Final query:', query);
    console.log('📊 HR Users API - Found users:', users.length);
    console.log(
      '📋 HR Users API - Users list:',
      users.map(
        u => `${u.ad} ${u.soyad} (${u.roller?.map(r => r.ad).join(', ')})`,
      ),
    );

    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı oluştur (yetki kontrolü ile)
router.post('/', async (req, res) => {
  try {
    if (!req.hrYetkileri.kullaniciAcabilir) {
      return res
        .status(403)
        .json({ message: 'Kullanıcı oluşturma yetkiniz yok' });
    }

    const { ad, soyad, kullaniciAdi, sifre, roller, departmanlar } = req.body;

    // Rol kontrolü - sadece izin verilen rollerde kullanıcı açabilir
    const allowedRoles = req.hrYetkileri.acabildigiRoller.map(r => {
      return r._id ? r._id.toString() : r.toString();
    });
    const invalidRoles = roller.filter(rolId => !allowedRoles.includes(rolId));

    if (invalidRoles.length > 0) {
      return res
        .status(403)
        .json({ message: 'Bu rollerde kullanıcı açma yetkiniz yok' });
    }

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ kullaniciAdi });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Yeni kullanıcı oluştur
    const user = new User({
      ad,
      soyad,
      kullaniciAdi,
      sifreHash: hashedPassword,
      roller,
      departmanlar,
      durum: 'aktif',
    });

    await user.save();
    await user.populate('roller', 'ad');
    await user.populate('departmanlar', 'ad');

    // Şifreyi response'dan çıkar
    const userObj = user.toObject();
    delete userObj.sifre;

    res.json(userObj);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Kullanıcı sil (yetki kontrolü ile)
router.delete('/:id', async (req, res) => {
  try {
    if (!req.hrYetkileri.kullaniciSilebilir) {
      return res.status(403).json({ message: 'Kullanıcı silme yetkiniz yok' });
    }

    const user = await User.findById(req.params.id).populate('roller');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Rol kontrolü - sadece izin verilen rollerdeki kullanıcıları silebilir
    const allowedRoles = req.hrYetkileri.silebildigiRoller.map(r => {
      return r._id ? r._id.toString() : r.toString();
    });
    const userRoles = user.roller.map(r => r._id.toString());

    const hasPermission = userRoles.some(rolId => allowedRoles.includes(rolId));

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: 'Bu roldeki kullanıcıyı silme yetkiniz yok' });
    }

    await user.deleteOne();
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
