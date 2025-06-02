const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Role = require('./models/Role');
const Department = require('./models/Department');

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm');

    console.log('👥 Test kullanıcıları oluşturuluyor...');

    // Rolleri al
    const roles = await Role.find({});
    const adminRole = roles.find(r => r.ad === 'Admin');
    const ustaRole = roles.find(r => r.ad === 'Usta');
    const paketlemeciRole = roles.find(r => r.ad === 'Paketlemeci');

    if (!adminRole || !ustaRole || !paketlemeciRole) {
      console.log('❌ Roller bulunamadı!');
      return;
    }

    // Departman oluştur
    let department = await Department.findOne({ ad: 'Üretim' });
    if (!department) {
      department = new Department({ ad: 'Üretim' });
      await department.save();
      console.log('✅ Üretim departmanı oluşturuldu');
    }

    // Şifre hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Kullanıcıları temizle ve yeniden oluştur
    await User.deleteMany({});

    const users = [
      {
        ad: 'Admin',
        soyad: 'User',
        kullaniciAdi: 'admin',
        sifreHash: hashedPassword,
        roller: [adminRole._id],
        departmanlar: [department._id],
        durum: 'aktif',
      },
      {
        ad: 'Ayşe',
        soyad: 'Yılmaz',
        kullaniciAdi: 'ayse.yilmaz',
        sifreHash: hashedPassword,
        roller: [ustaRole._id],
        departmanlar: [department._id],
        durum: 'aktif',
      },
      {
        ad: 'Fatma',
        soyad: 'Demir',
        kullaniciAdi: 'fatma.demir',
        sifreHash: hashedPassword,
        roller: [paketlemeciRole._id],
        departmanlar: [department._id],
        durum: 'aktif',
      },
    ];

    const savedUsers = await User.insertMany(users);

    console.log('✅ Test kullanıcıları başarıyla oluşturuldu:');
    savedUsers.forEach(user => {
      console.log(`  - ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
    });

    console.log('\n🔑 Giriş bilgileri:');
    console.log('  - Kullanıcı: admin, Şifre: 123456 (Admin)');
    console.log('  - Kullanıcı: ayse.yilmaz, Şifre: 123456 (Usta)');
    console.log('  - Kullanıcı: fatma.demir, Şifre: 123456 (Paketlemeci)');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 MongoDB bağlantısı kapatıldı.');
  }
}

createTestUsers();
