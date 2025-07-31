const mongoose = require('mongoose');
const HRSettings = require('../models/HRSettings');
const Role = require('../models/Role');

// MongoDB bağlantısı
mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function initHRSettings() {
  try {
    console.log('🔧 İK ayarları başlatılıyor...');

    // Mevcut ayarları kontrol et
    let settings = await HRSettings.findOne();

    if (!settings) {
      console.log('📝 Yeni İK ayarları oluşturuluyor...');
      settings = new HRSettings({});
    }

    // Tüm rolleri getir
    const roles = await Role.find();
    console.log(`📋 ${roles.length} rol bulundu`);

    // Admin rolü için tam yetki ver
    const adminRole = roles.find(r => r.ad === 'Admin');
    if (adminRole) {
      const adminYetkisi = settings.rolYetkileri.find(
        ry => ry.rol.toString() === adminRole._id.toString(),
      );

      if (!adminYetkisi) {
        settings.rolYetkileri.push({
          rol: adminRole._id,
          yetkiler: {
            kullaniciAcabilir: true,
            acabildigiRoller: roles.map(r => r._id),
            kullaniciSilebilir: true,
            silebildigiRoller: roles.map(r => r._id),
            puanlamaYapabilir: true,
            excelYukleyebilir: true,
            raporGorebilir: true,
          },
        });
        console.log('✅ Admin rolü için tam yetki eklendi');
      }

      // Admin rolü için modül erişimi ver
      const adminModulErisim = settings.modulErisimYetkileri.find(
        mey => mey.rol?.toString() === adminRole._id.toString(),
      );

      if (!adminModulErisim) {
        settings.modulErisimYetkileri.push({
          rol: adminRole._id,
          erisimDurumu: 'aktif',
        });
        console.log('✅ Admin rolü için modül erişimi eklendi');
      }
    }

    // İK rolü varsa ona da yetki ver
    const hrRole = roles.find(
      r => r.ad.includes('İnsan Kaynakları') || r.ad.includes('İK'),
    );
    if (hrRole) {
      const hrYetkisi = settings.rolYetkileri.find(
        ry => ry.rol.toString() === hrRole._id.toString(),
      );

      if (!hrYetkisi) {
        settings.rolYetkileri.push({
          rol: hrRole._id,
          yetkiler: {
            kullaniciAcabilir: true,
            acabildigiRoller: roles
              .filter(r => r.ad !== 'Admin')
              .map(r => r._id),
            kullaniciSilebilir: false,
            silebildigiRoller: [],
            puanlamaYapabilir: true,
            excelYukleyebilir: true,
            raporGorebilir: true,
          },
        });
        console.log('✅ İK rolü için yetki eklendi');
      }

      // İK rolü için modül erişimi ver
      const hrModulErisim = settings.modulErisimYetkileri.find(
        mey => mey.rol?.toString() === hrRole._id.toString(),
      );

      if (!hrModulErisim) {
        settings.modulErisimYetkileri.push({
          rol: hrRole._id,
          erisimDurumu: 'aktif',
        });
        console.log('✅ İK rolü için modül erişimi eklendi');
      }
    }

    await settings.save();
    console.log('✅ İK ayarları başarıyla kaydedildi');

    // Ayarları göster
    console.log('\n📊 Mevcut İK Ayarları:');
    console.log('Mesai Puanlama:', settings.mesaiPuanlama);
    console.log('Devamsızlık Puanlama:', settings.devamsizlikPuanlama);
    console.log('Rol Yetkileri:', settings.rolYetkileri.length, 'rol');
    console.log(
      'Modül Erişim Yetkileri:',
      settings.modulErisimYetkileri.length,
      'kayıt',
    );
  } catch (error) {
    console.error('❌ İK ayarları başlatma hatası:', error);
  } finally {
    mongoose.connection.close();
  }
}

initHRSettings();
