const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
require('dotenv').config();

const createMoreUsers = async () => {
  try {
    console.log('👥 Daha fazla test kullanıcısı oluşturuluyor...');

    // MongoDB'ye bağlan
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log('✅ MongoDB bağlantısı başarılı!');

    // Rolleri ve departmanları al
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    const uretimDept = await Department.findOne({ ad: 'Üretim' });

    if (!paketlemeciRole || !ortaciRole || !uretimDept) {
      console.log('❌ Gerekli rol veya departman bulunamadı!');
      return;
    }

    const salt = await bcrypt.genSalt(10);

    // Paketlemeci kullanıcıları
    const paketlemeciUsers = [
      {
        ad: 'Fatma',
        soyad: 'Demir',
        kullaniciAdi: 'fatma.demir',
        sifreHash: await bcrypt.hash('123456', salt),
        roller: [paketlemeciRole._id],
        departmanlar: [uretimDept._id],
        durum: 'aktif',
      },
      {
        ad: 'Hasan',
        soyad: 'Çelik',
        kullaniciAdi: 'hasan.celik',
        sifreHash: await bcrypt.hash('123456', salt),
        roller: [paketlemeciRole._id],
        departmanlar: [uretimDept._id],
        durum: 'aktif',
      },
      {
        ad: 'Zeynep',
        soyad: 'Aydın',
        kullaniciAdi: 'zeynep.aydin',
        sifreHash: await bcrypt.hash('123456', salt),
        roller: [paketlemeciRole._id],
        departmanlar: [uretimDept._id],
        durum: 'aktif',
      },
    ];

    // Ortacı kullanıcıları
    const ortaciUsers = [
      {
        ad: 'Mustafa',
        soyad: 'Özkan',
        kullaniciAdi: 'mustafa.ozkan',
        sifreHash: await bcrypt.hash('123456', salt),
        roller: [ortaciRole._id],
        departmanlar: [uretimDept._id],
        durum: 'aktif',
      },
      {
        ad: 'Elif',
        soyad: 'Şahin',
        kullaniciAdi: 'elif.sahin',
        sifreHash: await bcrypt.hash('123456', salt),
        roller: [ortaciRole._id],
        departmanlar: [uretimDept._id],
        durum: 'aktif',
      },
    ];

    // Kullanıcıları oluştur
    const allUsers = [...paketlemeciUsers, ...ortaciUsers];

    for (const userData of allUsers) {
      // Kullanıcı zaten var mı kontrol et
      const existingUser = await User.findOne({
        kullaniciAdi: userData.kullaniciAdi,
      });
      if (existingUser) {
        console.log(`⚠️  ${userData.kullaniciAdi} zaten mevcut, atlanıyor`);
        continue;
      }

      const user = new User(userData);
      await user.save();
      console.log(
        `✅ ${userData.kullaniciAdi} oluşturuldu (${userData.ad} ${userData.soyad})`,
      );
    }

    // Toplam kullanıcı sayılarını göster
    const totalPaketlemeci = await User.countDocuments({
      roller: paketlemeciRole._id,
    });
    const totalOrtaci = await User.countDocuments({ roller: ortaciRole._id });

    console.log(`📊 Toplam Paketlemeci: ${totalPaketlemeci}`);
    console.log(`📊 Toplam Ortacı: ${totalOrtaci}`);
  } catch (error) {
    console.error('❌ Kullanıcılar oluşturulurken hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

createMoreUsers();
