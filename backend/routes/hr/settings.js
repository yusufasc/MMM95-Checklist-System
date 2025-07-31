// HR Settings Routes - Settings & Permissions Management
// Refactored from: hr.js (1050 satır → modüler yapı)
// 🎯 Amaç: HR ayarları ve yetki yönetimi

const express = require('express');
const router = express.Router();
const HRSettings = require('../../models/HRSettings');

// İK ayarlarını getir
router.get('/', async (req, res) => {
  try {
    const settings = await HRSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK ayarlarını güncelle
router.put('/', async (req, res) => {
  try {
    const {
      mesaiPuanlama,
      devamsizlikPuanlama,
      digerPuanlama,
      modulErisimYetkileri,
      rolYetkileri,
    } = req.body;

    const settings = await HRSettings.getSettings();

    if (mesaiPuanlama) {
      settings.mesaiPuanlama = mesaiPuanlama;
    }
    if (devamsizlikPuanlama) {
      settings.devamsizlikPuanlama = devamsizlikPuanlama;
    }
    if (digerPuanlama) {
      settings.digerPuanlama = digerPuanlama;
    }
    if (modulErisimYetkileri) {
      settings.modulErisimYetkileri = modulErisimYetkileri;
    }
    if (rolYetkileri) {
      settings.rolYetkileri = rolYetkileri;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Rol yetkilerini güncelle
router.post('/role-permissions', async (req, res) => {
  try {
    const { rolId, yetkiler } = req.body;

    console.log('🔧 HR Role Permissions Update:', {
      rolId,
      yetkiler,
      userId: req.user?.id,
      userRoles: req.user?.roller?.map(r => r.ad),
    });

    const settings = await HRSettings.getSettings();

    console.log('📋 Current settings structure:', {
      modulErisimCount: settings.modulErisimYetkileri?.length || 0,
      rolYetkileriCount: settings.rolYetkileri?.length || 0,
      existingRolePermissions: settings.rolYetkileri?.map(ry => ({
        rol: ry.rol,
        permissions: Object.keys(ry.yetkiler || {}),
      })),
    });

    // Mevcut rol yetkisini bul veya oluştur
    const existingIndex = settings.rolYetkileri.findIndex(
      ry => ry.rol.toString() === rolId,
    );

    console.log('🔍 Role permission search:', {
      rolId,
      existingIndex,
      found: existingIndex !== -1,
    });

    if (existingIndex !== -1) {
      console.log('📝 Updating existing role permissions');
      settings.rolYetkileri[existingIndex].yetkiler = yetkiler;
    } else {
      console.log('➕ Adding new role permissions');
      settings.rolYetkileri.push({ rol: rolId, yetkiler });
    }

    console.log('💾 Saving updated settings...');
    await settings.save();

    console.log('✅ Role permissions updated successfully');
    res.json(settings);
  } catch (error) {
    console.error('❌ HR role permissions update error:', error);
    res.status(500).send('Sunucu hatası');
  }
});

// Modül erişim yetkilerini güncelle
router.post('/module-access', async (req, res) => {
  try {
    const { itemId, itemType, action } = req.body;

    const settings = await HRSettings.getSettings();

    // Mevcut erişimi bul
    const existingIndex = settings.modulErisimYetkileri.findIndex(mey => {
      if (itemType === 'user') {
        return mey.kullanici?.toString() === itemId;
      } else {
        return mey.rol?.toString() === itemId;
      }
    });

    if (action === 'toggle') {
      if (existingIndex !== -1) {
        // Var olan erişimi toggle et
        const currentStatus =
          settings.modulErisimYetkileri[existingIndex].erisimDurumu;
        settings.modulErisimYetkileri[existingIndex].erisimDurumu =
          currentStatus === 'aktif' ? 'pasif' : 'aktif';
      } else {
        // Yeni erişim ekle
        const newAccess = {
          erisimDurumu: 'aktif',
          verilisTarihi: Date.now(),
        };

        if (itemType === 'user') {
          newAccess.kullanici = itemId;
        } else {
          newAccess.rol = itemId;
        }

        settings.modulErisimYetkileri.push(newAccess);
      }
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
