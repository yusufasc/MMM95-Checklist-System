// HR Middleware - Auth & Permission Controls
// Refactored from: hr.js (1050 satır → modüler yapı)
// 🎯 Amaç: HR modülü erişim kontrollerini merkezileştirmek

const HRSettings = require('../../models/HRSettings');
const Role = require('../../models/Role');

// İK modülüne erişim yetkisi kontrolü
const checkHRAccess = async (req, res, next) => {
  try {
    // 🎯 Kalıp Değişim Buddy Sistemi: forManualEntry=true ile users endpoint'ine erişim bypass
    if (req.path === '/users' && req.query.forManualEntry === 'true') {
      console.log('🔓 HR Access Bypass - Manual Entry Mode:', {
        kullaniciId: req.user.id,
        kullaniciRolleri: req.user.roller?.map(r => r.ad),
        reason: 'ForManualEntry bypass for buddy selection',
      });

      // Minimal yetki vererek devam et (sadece user listesi için)
      req.hrYetkileri = {
        kullaniciAcabilir: false,
        kullaniciSilebilir: false,
        puanlamaYapabilir: false,
        excelYukleyebilir: false,
        raporGorebilir: false,
        acabildigiRoller: [],
        silebildigiRoller: [],
      };
      return next();
    }

    const settings = await HRSettings.getSettings();
    const kullaniciId = req.user.id;
    const kullaniciRolleri = req.user.roller;

    console.log('🔍 İK erişim kontrolü:', {
      kullaniciId,
      kullaniciRolleri: kullaniciRolleri.map(r => r.ad),
      isAdmin: kullaniciRolleri.some(rol => rol.ad === 'Admin'),
      settingsExists: !!settings,
      modulErisimCount: settings?.modulErisimYetkileri?.length || 0,
      rolYetkileriCount: settings?.rolYetkileri?.length || 0,
    });

    // Admin her zaman erişebilir
    if (kullaniciRolleri.some(rol => rol.ad === 'Admin')) {
      req.hrYetkileri = {
        kullaniciAcabilir: true,
        kullaniciSilebilir: true,
        puanlamaYapabilir: true,
        excelYukleyebilir: true,
        raporGorebilir: true,
        acabildigiRoller: await Role.find().select('_id'),
        silebildigiRoller: await Role.find().select('_id'),
      };
      return next();
    }

    // Kullanıcı bazlı erişim kontrolü
    const kullaniciErisim = settings.modulErisimYetkileri.find(
      mey =>
        mey.kullanici?.toString() === kullaniciId &&
        mey.erisimDurumu === 'aktif',
    );

    if (kullaniciErisim) {
      // Kullanıcının rolüne göre yetkileri al
      const userRole = kullaniciRolleri[0]; // İlk rolü al
      const rolYetkisi = settings.rolYetkileri.find(
        ry => ry.rol.toString() === userRole._id.toString(),
      );

      if (rolYetkisi) {
        req.hrYetkileri = rolYetkisi.yetkiler;
        return next();
      }
    }

    // Rol bazlı erişim kontrolü - Direkt rol yetkilerini kontrol et
    for (const rol of kullaniciRolleri) {
      const rolYetkisi = settings.rolYetkileri.find(
        ry => ry.rol.toString() === rol._id.toString(),
      );

      if (
        rolYetkisi &&
        (rolYetkisi.yetkiler?.puanlamaYapabilir ||
          rolYetkisi.yetkiler?.raporGorebilir)
      ) {
        console.log('✅ İK erişim onaylandı (rol bazlı):', {
          rol: rol.ad,
          puanlamaYapabilir: rolYetkisi.yetkiler?.puanlamaYapabilir,
          raporGorebilir: rolYetkisi.yetkiler?.raporGorebilir,
        });

        req.hrYetkileri = rolYetkisi.yetkiler;
        return next();
      }
    }

    console.log('❌ İK erişim reddedildi:', {
      kullaniciId,
      kullaniciRolleri: kullaniciRolleri.map(r => r.ad),
      reason: 'No matching permissions found',
    });

    return res
      .status(403)
      .json({ message: 'İnsan Kaynakları modülüne erişim yetkiniz yok' });
  } catch (error) {
    console.error('HR erişim kontrolü hatası:', error);
    res.status(500).send('Sunucu hatası');
  }
};

module.exports = {
  checkHRAccess,
};
