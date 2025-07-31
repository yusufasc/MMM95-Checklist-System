const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Rolleri getir
    const roles = await Role.find();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.ad] = role._id;
    });

    // Test kullanıcıları
    const testUsers = [
      {
        kullaniciAdi: 'usta.test',
        sifre: 'usta123',
        ad: 'Test',
        soyad: 'Usta',
        rolAdi: 'Usta',
        departman: 'Üretim',
      },
      {
        kullaniciAdi: 'ortaci.test',
        sifre: 'ortaci123',
        ad: 'Test',
        soyad: 'Ortacı',
        rolAdi: 'Ortacı',
        departman: 'Üretim',
      },
      {
        kullaniciAdi: 'paketlemeci.test',
        sifre: 'paket123',
        ad: 'Test',
        soyad: 'Paketlemeci',
        rolAdi: 'Paketlemeci',
        departman: 'Paketleme',
      },
      {
        kullaniciAdi: 'kalite.test',
        sifre: 'kalite123',
        ad: 'Test',
        soyad: 'Kalite',
        rolAdi: 'Kalite Kontrol',
        departman: 'Kalite',
      },
    ];

    console.log('📋 TEST KULLANICILARI OLUŞTURULUYOR:');
    console.log('=====================================\n');

    for (const userData of testUsers) {
      // Kullanıcı var mı kontrol et
      let user = await User.findOne({ kullaniciAdi: userData.kullaniciAdi });

      if (!user) {
        // Rol ID'sini al
        const roleId = roleMap[userData.rolAdi];
        if (!roleId) {
          console.log(`❌ ${userData.rolAdi} rolü bulunamadı!`);
          continue;
        }

        // Yeni kullanıcı oluştur
        const hashedPassword = await bcrypt.hash(userData.sifre, 10);
        user = new User({
          kullaniciAdi: userData.kullaniciAdi,
          sifreHash: hashedPassword,
          ad: userData.ad,
          soyad: userData.soyad,
          roller: [roleId],
          departman: userData.departman,
          durum: 'aktif',
        });
        await user.save();
        console.log(`✅ ${userData.kullaniciAdi} kullanıcısı oluşturuldu`);
      } else {
        console.log(`ℹ️  ${userData.kullaniciAdi} kullanıcısı zaten mevcut`);
      }

      console.log(`   Kullanıcı Adı: ${userData.kullaniciAdi}`);
      console.log(`   Şifre: ${userData.sifre}`);
      console.log(`   Rol: ${userData.rolAdi}`);
      console.log(`   Departman: ${userData.departman}`);
      console.log('');
    }

    // Kullanıcıların modül yetkilerini kontrol et
    console.log('\n📊 KULLANICILARIN MODÜL YETKİLERİ:');
    console.log('=====================================\n');

    const users = await User.find({
      kullaniciAdi: { $in: testUsers.map(u => u.kullaniciAdi) },
    }).populate({
      path: 'roller',
      populate: {
        path: 'moduller.modul',
      },
    });

    for (const user of users) {
      console.log(
        `🔹 ${user.kullaniciAdi.toUpperCase()} (${user.roller[0]?.ad}):`,
      );

      const dashboardPermission = user.roller.some(rol =>
        rol.moduller?.some(m => m.modul?.ad === 'Dashboard' && m.erisebilir),
      );

      console.log(`   Dashboard Yetkisi: ${dashboardPermission ? '✅' : '❌'}`);

      // Diğer önemli modülleri de kontrol et
      const modules = [
        'Görev Yönetimi',
        'Kontrol Bekleyenler',
        'Performans',
        'Yaptım',
      ];
      for (const moduleName of modules) {
        const hasPermission = user.roller.some(rol =>
          rol.moduller?.some(m => m.modul?.ad === moduleName && m.erisebilir),
        );
        console.log(`   ${moduleName}: ${hasPermission ? '✅' : '❌'}`);
      }
      console.log('');
    }

    console.log('\n💡 TEST TALİMATLARI:');
    console.log('====================');
    console.log('1. Frontend\'i açın (http://localhost:3000)');
    console.log('2. Yukarıdaki kullanıcılardan biriyle giriş yapın');
    console.log('3. Her kullanıcı kendi rolüne özel dashboard\'u görmeli:');
    console.log('   - usta.test → UstaDashboard');
    console.log('   - ortaci.test → OrtaDashboard');
    console.log('   - paketlemeci.test → PackagingDashboard');
    console.log('   - kalite.test → KaliteKontrolDashboard');
    console.log('\n⚠️  NOT: Dashboard yetki kontrollerini kaldırdık!');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

createTestUsers();
