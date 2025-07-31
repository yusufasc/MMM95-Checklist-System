// Makina entegrasyonu
// Otomatik oluşturuldu: 2025-02-05T23:15:00.000Z
// Orijinal: tasks.js
// Updated: 2025-02-06 - Birleştirilmiş inventory API kullanımı
// Updated: 2025-02-08 - Vardiya bazlı makina seçimi eklendi

const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const axios = require('axios');

// Models
const User = require('../models/User');
const UserShiftMachine = require('../models/UserShiftMachine');

// @route   GET /inventory-machines
// @desc    Envanter sisteminden makina listesi getir (Birleştirilmiş API kullanır)
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get(
  '/inventory-machines',
  auth,
  checkModulePermission('Görev Yönetimi'),
  async (req, res) => {
    try {
      console.log(
        '🔍 Envanter makina listesi istendi, kullanıcı:',
        req.user.kullaniciAdi,
      );

      // Birleştirilmiş inventory/machines API'yi kullan
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const response = await axios.get(`${baseUrl}/api/inventory/machines`, {
        headers: {
          Authorization: req.headers.authorization,
        },
        params: {
          source: 'all', // Hem Machine hem InventoryItem kayıtlarını getir
        },
      });

      const allMachines = response.data;
      console.log(
        `✅ ${allMachines.length} makina bulundu (birleştirilmiş API)`,
      );

      // Frontend'in beklediği formata göre ayarla
      const formattedMachines = allMachines.map(machine => ({
        _id: machine._id,
        ad: machine.ad,
        makinaNo: machine.makinaNo,
        envanterKodu: machine.envanterKodu,
        lokasyon: machine.lokasyon,
        kategori:
          machine.tip === 'inventoryItem'
            ? 'Plastik Enjeksiyon Makinası'
            : 'Makina',
        durum: machine.durum,
        qrKodu: machine.qrKodu,
        guncelDeger: machine.dinamikAlanlar?.guncelDeger,
        // Eski format uyumluluğu
        name: machine.ad,
        machineCode: machine.kod,
        // Ek bilgiler
        aciklama: machine.aciklama,
        tip: machine.tip,
        kaynak: machine.kaynak,
      }));

      res.json(formattedMachines);
    } catch (error) {
      console.error(
        '❌ Envanter makina listesi getirme hatası:',
        error.message,
      );
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// @route   POST /select-machines
// @desc    Kullanıcının çalıştığı makinaları seç (Vardiya bazlı)
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.post(
  '/select-machines',
  auth,
  checkModulePermission('Görev Yönetimi'),
  async (req, res) => {
    try {
      const { selectedMachines } = req.body;

      // Seçilen makinaları string ID olarak sakla (hem Machine hem InventoryItem ID'leri)
      const machineIds = Array.isArray(selectedMachines)
        ? selectedMachines
        : [];

      // Paketlemeci rolü için makina seçim limiti kontrolü
      const user = await User.findById(req.user._id).populate('roller');
      const isPaketlemeci = user.roller.some(rol => rol.ad === 'Paketlemeci');

      if (isPaketlemeci && machineIds.length > 1) {
        return res.status(400).json({
          message: 'Paketlemeci rolü maksimum 1 makina seçebilir.',
          error: 'PAKETLEMECI_MAKINA_LIMIT',
          maxAllowed: 1,
          attempted: machineIds.length,
        });
      }

      // Eski User model'ini de güncelle (backward compatibility)
      await User.findByIdAndUpdate(req.user._id, {
        secilenMakinalar: machineIds,
      });

      // Vardiya bazlı makina seçimi oluştur
      const vardiya = await UserShiftMachine.olusturVardiya(
        req.user._id,
        machineIds,
      );

      console.log('✅ Makina seçimi güncellendi:', {
        kullanici: req.user.kullaniciAdi,
        makinaSayisi: machineIds.length,
        vardiyaTipi: vardiya.vardiyaTipi,
        vardiyaBaslangic: vardiya.vardiyaBaslangic,
        vardiyaBitis: vardiya.vardiyaBitis,
      });

      res.json({
        message: `Makina seçimi başarıyla kaydedildi (${vardiya.vardiyaTipi} vardiyası)`,
        selectedMachines: machineIds,
        shift: {
          type: vardiya.vardiyaTipi,
          start: vardiya.vardiyaBaslangic,
          end: vardiya.vardiyaBitis,
        },
      });
    } catch (error) {
      console.error('❌ Makina seçimi hatası:', error.message);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  },
);

// @route   GET /my-selected-machines
// @desc    Kullanıcının aktif vardiyasındaki seçtiği makinaları getir
// @access  Private (Görev Yönetimi, Kalite Kontrol, Dashboard, Performans modülü erişim yetkisi)
router.get(
  '/my-selected-machines',
  auth,
  (req, res, next) => {
    // Çoklu modül yetkisi kontrolü - daha esnek yetki sistemi
    const allowedModules = [
      'Görev Yönetimi',
      'Kalite Kontrol',
      'Dashboard',
      'Performans',
      'Yaptım',
      'Kontrol Bekleyenler',
    ];

    // Admin kontrolü
    const isAdmin = req.user.roller?.some(rol => rol.ad === 'Admin');
    if (isAdmin) {
      return next();
    }

    // Kullanıcının rollerindeki modül yetkilerini kontrol et
    let hasPermission = false;

    for (const rol of req.user.roller || []) {
      // Modern modulePermissions yapısını kontrol et
      if (rol.modulePermissions && Array.isArray(rol.modulePermissions)) {
        const modulePermission = rol.modulePermissions.find(
          perm => allowedModules.includes(perm.moduleName) && perm.gorebilir,
        );
        if (modulePermission) {
          hasPermission = true;
          break;
        }
      }

      // Eski moduller yapısını da destekle (backward compatibility)
      if (rol.moduller && Array.isArray(rol.moduller)) {
        for (const modulYetkisi of rol.moduller) {
          if (
            modulYetkisi.modul &&
            allowedModules.includes(modulYetkisi.modul.ad) &&
            modulYetkisi.erisebilir
          ) {
            hasPermission = true;
            break;
          }
        }
      }

      if (hasPermission) {
        break;
      }
    }

    if (!hasPermission) {
      console.log('❌ Makina erişim yetkisi yok:', {
        kullanici: req.user.kullaniciAdi,
        roller: req.user.roller?.map(r => ({
          ad: r.ad,
          moduller: r.moduller?.map(m => ({
            modul: m.modul?.ad,
            erisebilir: m.erisebilir,
          })),
        })),
      });
      return res.status(403).json({
        message: 'Bu işlem için yetkiniz bulunmuyor',
        requiredModules: allowedModules,
      });
    }

    next();
  },
  async (req, res) => {
    try {
      // Önce aktif vardiyadan makina seçimini kontrol et
      const aktifVardiya = await UserShiftMachine.getAktifVardiya(req.user._id);

      let selectedMachineIds = [];
      let shiftInfo = null;

      if (aktifVardiya && aktifVardiya.secilenMakinalar.length > 0) {
        // Aktif vardiya var, vardiya bazlı makina seçimi kullan
        selectedMachineIds = aktifVardiya.secilenMakinalar.map(m =>
          m._id.toString(),
        );
        shiftInfo = {
          type: aktifVardiya.vardiyaTipi,
          start: aktifVardiya.vardiyaBaslangic,
          end: aktifVardiya.vardiyaBitis,
          isActive: true,
        };

        console.log('✅ Aktif vardiya makina seçimi kullanıldı:', {
          kullanici: req.user.kullaniciAdi,
          vardiyaTipi: aktifVardiya.vardiyaTipi,
          makinaSayisi: selectedMachineIds.length,
        });
      } else {
        // Fallback: User model'inden makina seçimi
        const user = await User.findById(req.user._id);
        if (user && user.secilenMakinalar && user.secilenMakinalar.length > 0) {
          selectedMachineIds = user.secilenMakinalar.map(m => m.toString());
          console.log('⚠️ Fallback: User model makina seçimi kullanıldı');
        }
      }

      if (selectedMachineIds.length === 0) {
        return res.json([]);
      }

      // Birleştirilmiş API kullanarak makina detaylarını getir
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const response = await axios.get(`${baseUrl}/api/inventory/machines`, {
        headers: {
          Authorization: req.headers.authorization,
        },
        params: {
          source: 'all',
        },
      });

      const allMachines = response.data;

      // Seçili makinaları filtrele
      const selectedMachines = allMachines.filter(machine =>
        selectedMachineIds.includes(machine._id),
      );

      // Frontend uyumlu format
      const formattedMachines = selectedMachines.map(machine => ({
        _id: machine._id,
        ad: machine.ad,
        kod: machine.kod || machine.makinaNo,
        makinaNo: machine.makinaNo,
        envanterKodu: machine.envanterKodu,
        lokasyon: machine.lokasyon,
        durum: machine.durum,
        tip: machine.tip,
        kaynak: machine.kaynak,
      }));

      console.log(`✅ ${formattedMachines.length} seçili makina döndürüldü`);

      // Shift bilgisi varsa dahil et
      const response_data = formattedMachines;
      if (shiftInfo) {
        res.json({
          machines: response_data,
          shift: shiftInfo,
        });
      } else {
        res.json(response_data);
      }
    } catch (error) {
      console.error('❌ Seçili makina listesi hatası:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// @route   GET /current-shift
// @desc    Kullanıcının aktif vardiya bilgisini getir
// @access  Private
router.get('/current-shift', auth, async (req, res) => {
  try {
    const aktifVardiya = await UserShiftMachine.getAktifVardiya(req.user._id);

    if (!aktifVardiya) {
      return res.json({
        hasActiveShift: false,
        message: 'Aktif vardiya bulunamadı',
      });
    }

    res.json({
      hasActiveShift: true,
      shift: {
        id: aktifVardiya._id,
        type: aktifVardiya.vardiyaTipi,
        start: aktifVardiya.vardiyaBaslangic,
        end: aktifVardiya.vardiyaBitis,
        machineCount: aktifVardiya.secilenMakinalar.length,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('❌ Aktif vardiya getirme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /end-shift
// @desc    Kullanıcının aktif vardiyasını sonlandır
// @access  Private
router.post('/end-shift', auth, async (req, res) => {
  try {
    const result = await UserShiftMachine.updateMany(
      { kullanici: req.user._id, aktif: true },
      { aktif: false },
    );

    console.log('✅ Vardiya sonlandırıldı:', {
      kullanici: req.user.kullaniciAdi,
      sonlandirilanVardiyaSayisi: result.modifiedCount,
    });

    res.json({
      message: 'Vardiya başarıyla sonlandırıldı',
      endedShifts: result.modifiedCount,
    });
  } catch (error) {
    console.error('❌ Vardiya sonlandırma hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
