const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');

const createTestUsers = async () => {
  try {
    // MongoDB bağlantısı
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';
    await mongoose.connect(mongoUri);
    console.log('📊 Test Users Creation for Quality Control');
    console.log('==========================================');

    // Mevcut roller ve departmanları getir
    const roles = await Role.find().sort('ad');
    const departments = await Department.find().sort('ad');

    console.log(`🎭 Mevcut roller: ${roles.map(r => r.ad).join(', ')}`);
    console.log(`🏢 Mevcut departmanlar: ${departments.map(d => d.ad).join(', ')}`);

    // Eğer rol/departman yoksa oluştur
    if (roles.length === 0 || departments.length === 0) {
      console.log('❌ Roller veya departmanlar eksik! Önce seed data çalıştırın.');
      process.exit(1);
    }

    // Test kullanıcıları
    const testUsers = [
      {
        ad: 'Mehmet',
        soyad: 'Yılmaz',
        kullaniciAdi: 'mehmet.yilmaz',
        rol: 'Ortacı',
        departman: 'Üretim',
      },
      {
        ad: 'Fatma',
        soyad: 'Kaya',
        kullaniciAdi: 'fatma.kaya',
        rol: 'Usta',
        departman: 'Üretim',
      },
      {
        ad: 'Ahmet',
        soyad: 'Demir',
        kullaniciAdi: 'ahmet.demir',
        rol: 'Paketlemeci',
        departman: 'Üretim',
      },
      {
        ad: 'Zeynep',
        soyad: 'Özkan',
        kullaniciAdi: 'zeynep.ozkan',
        rol: 'Ortacı',
        departman: 'Üretim',
      },
      {
        ad: 'Mustafa',
        soyad: 'Güler',
        kullaniciAdi: 'mustafa.guler',
        rol: 'Usta',
        departman: 'Bakım',
      },
    ];

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);

    for (const userData of testUsers) {
      // Kullanıcı zaten var mı kontrol et
      const existingUser = await User.findOne({ kullaniciAdi: userData.kullaniciAdi });

      if (existingUser) {
        console.log(`⏭️  ${userData.kullaniciAdi} zaten mevcut, atlanıyor`);
        continue;
      }

      // Rol ve departman bul
      const userRole = roles.find(r => r.ad === userData.rol);
      const userDepartment = departments.find(d => d.ad === userData.departman);

      if (!userRole || !userDepartment) {
        console.log(`❌ ${userData.kullaniciAdi} için rol/departman bulunamadı, atlanıyor`);
        continue;
      }

      // Kullanıcıyı oluştur
      const newUser = new User({
        ad: userData.ad,
        soyad: userData.soyad,
        kullaniciAdi: userData.kullaniciAdi,
        sifreHash: defaultPassword,
        roller: [userRole._id],
        departmanlar: [userDepartment._id],
        durum: 'aktif',
      });

      await newUser.save();
      console.log(
        `✅ ${userData.ad} ${userData.soyad} (${userData.kullaniciAdi}) oluşturuldu - Rol: ${userData.rol}`,
      );
    }

    // Final kontrol
    const totalUsers = await User.countDocuments({ durum: 'aktif' });
    console.log(`\n📊 Toplam aktif kullanıcı sayısı: ${totalUsers}`);

    // Kalite kontrol hariç çalışanları göster
    const workers = await User.find({
      durum: 'aktif',
      $and: [{ 'roller.0': { $exists: true } }, { 'roller.0': { $ne: null } }],
    }).populate('roller', 'ad');

    const nonQcWorkers = workers.filter(user => {
      const roleName = user.roller?.[0]?.ad?.toLowerCase() || '';
      return !roleName.includes('kalite kontrol') && !roleName.includes('admin');
    });

    console.log(`\n🎯 Kalite kontrol için puanlanabilir çalışan sayısı: ${nonQcWorkers.length}`);
    nonQcWorkers.forEach(worker => {
      console.log(`   - ${worker.ad} ${worker.soyad} (${worker.roller[0].ad})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

createTestUsers();
