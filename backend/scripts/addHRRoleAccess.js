const mongoose = require('mongoose');
const HRSettings = require('../models/HRSettings');
const Role = require('../models/Role');

mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addHRRoleAccess() {
  try {
    console.log('🔧 İnsan Kaynakları rolü için erişim ekleniyor...');

    // İnsan Kaynakları rolünü bul
    const hrRole = await Role.findOne({ ad: 'insan kaynakları' });
    if (!hrRole) {
      console.log('❌ İnsan Kaynakları rolü bulunamadı');
      return;
    }

    console.log('✅ İnsan Kaynakları rolü bulundu:', hrRole.ad);

    // İK ayarlarını getir
    const settings = await HRSettings.getSettings();

    // Rol için modül erişimi kontrol et
    const existingAccess = settings.modulErisimYetkileri.find(
      mey => mey.rol?.toString() === hrRole._id.toString(),
    );

    if (!existingAccess) {
      // Modül erişimi ekle
      settings.modulErisimYetkileri.push({
        rol: hrRole._id,
        erisimDurumu: 'aktif',
      });
      console.log('✅ Modül erişimi eklendi');
    } else {
      console.log('ℹ️ Modül erişimi zaten mevcut');
    }

    // Rol yetkileri kontrol et
    const existingPermissions = settings.rolYetkileri.find(
      ry => ry.rol?.toString() === hrRole._id.toString(),
    );

    if (!existingPermissions) {
      // Tüm rolleri getir (Admin hariç)
      const allRoles = await Role.find({ ad: { $ne: 'Admin' } });

      // Rol yetkileri ekle
      settings.rolYetkileri.push({
        rol: hrRole._id,
        yetkiler: {
          kullaniciAcabilir: true,
          acabildigiRoller: allRoles.map(r => r._id),
          kullaniciSilebilir: false,
          silebildigiRoller: [],
          puanlamaYapabilir: true,
          excelYukleyebilir: true,
          raporGorebilir: true,
        },
      });
      console.log('✅ Rol yetkileri eklendi');
    } else {
      console.log('ℹ️ Rol yetkileri zaten mevcut');
    }

    await settings.save();
    console.log('✅ İK ayarları güncellendi');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
}

addHRRoleAccess();
