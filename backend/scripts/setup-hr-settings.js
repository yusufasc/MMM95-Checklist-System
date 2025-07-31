const mongoose = require('mongoose');
const HRSettings = require('../models/HRSettings');
const Role = require('../models/Role');

async function setupHRSettings() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');

    // Mevcut ayarları kontrol et
    let settings = await HRSettings.findOne();

    if (!settings) {
      // Yeni ayarlar oluştur
      settings = new HRSettings({
        mesaiPuanlama: {
          aktif: true,
          saatBasinaPuan: 3,
          gunlukMaksimumSaat: 4,
        },
        devamsizlikPuanlama: {
          aktif: true,
          gunBasinaPuan: -5,
          saatBasinaPuan: -1,
        },
        rolYetkileri: [],
      });
    }

    // İK rolünü bul veya oluştur
    let ikRole = await Role.findOne({ ad: 'İK' });
    if (!ikRole) {
      ikRole = await Role.create({
        ad: 'İK',
        aciklama: 'İnsan Kaynakları Personeli',
        aktif: true,
      });
      console.log('İK rolü oluşturuldu');
    }

    // İK rolü için yetkileri ayarla
    const ikYetkiIndex = settings.rolYetkileri.findIndex(
      ry => ry.rol.toString() === ikRole._id.toString(),
    );

    if (ikYetkiIndex === -1) {
      settings.rolYetkileri.push({
        rol: ikRole._id,
        yetkiler: {
          kullaniciAcabilir: true,
          acabildigiRoller: [],
          kullaniciSilebilir: true,
          silebildigiRoller: [],
          puanlamaYapabilir: true,
          excelYukleyebilir: true,
          raporGorebilir: true,
        },
      });
    } else {
      settings.rolYetkileri[ikYetkiIndex].yetkiler = {
        kullaniciAcabilir: true,
        acabildigiRoller: [],
        kullaniciSilebilir: true,
        silebildigiRoller: [],
        puanlamaYapabilir: true,
        excelYukleyebilir: true,
        raporGorebilir: true,
      };
    }

    await settings.save();
    console.log('✅ HR ayarları başarıyla güncellendi');

    // Test için ayarları göster
    console.log('\n📊 Mesai puanlama ayarları:');
    console.log('- Aktif:', settings.mesaiPuanlama.aktif);
    console.log('- Saat başına puan:', settings.mesaiPuanlama.saatBasinaPuan);
    console.log(
      '- Günlük maksimum saat:',
      settings.mesaiPuanlama.gunlukMaksimumSaat,
    );

    console.log('\n📊 Devamsızlık puanlama ayarları:');
    console.log('- Aktif:', settings.devamsizlikPuanlama.aktif);
    console.log(
      '- Gün başına puan:',
      settings.devamsizlikPuanlama.gunBasinaPuan,
    );
    console.log(
      '- Saat başına puan:',
      settings.devamsizlikPuanlama.saatBasinaPuan,
    );

    // İK modülü yetkisini kontrol et
    const Module = require('../models/Module');
    let hrModule = await Module.findOne({ ad: 'İK' });

    if (!hrModule) {
      hrModule = await Module.create({
        ad: 'İK',
        aciklama: 'İnsan Kaynakları Yönetimi',
        route: '/hr',
        icon: 'People',
        aktif: true,
      });
      console.log('\n✅ İK modülü oluşturuldu');
    }

    // İK rolüne İK modülü yetkisi ver
    const roleWithModules = await Role.findById(ikRole._id);

    // modulYetkileri array'ini kontrol et ve gerekirse oluştur
    if (!roleWithModules.modulYetkileri) {
      roleWithModules.modulYetkileri = [];
    }

    const hasHRModule = roleWithModules.modulYetkileri.some(
      my => my.modul.toString() === hrModule._id.toString(),
    );

    if (!hasHRModule) {
      roleWithModules.modulYetkileri.push({
        modul: hrModule._id,
        okuma: true,
        yazma: true,
        silme: true,
      });
      await roleWithModules.save();
      console.log('✅ İK rolüne İK modülü yetkisi verildi');
    }

    // Test kullanıcısı oluştur
    const User = require('../models/User');
    let ikUser = await User.findOne({ kullaniciAdi: 'ik.test' });

    if (!ikUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('ik123', 10);

      ikUser = await User.create({
        ad: 'İK',
        soyad: 'Test',
        kullaniciAdi: 'ik.test',
        sifreHash: hashedPassword,
        roller: [ikRole._id],
        aktif: true,
      });
      console.log('\n✅ İK test kullanıcısı oluşturuldu');
      console.log('Kullanıcı adı: ik.test');
      console.log('Şifre: ik123');
    }

    await mongoose.connection.close();
    console.log('\n✅ İşlem tamamlandı');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

setupHRSettings();
