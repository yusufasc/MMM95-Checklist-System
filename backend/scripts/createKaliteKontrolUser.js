const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

const createKaliteKontrolUser = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Kalite Kontrol rolünü bul
    const kaliteKontrolRole = await Role.findOne({ ad: 'Kalite Kontrol' });
    if (!kaliteKontrolRole) {
      console.log('❌ Kalite Kontrol rolü bulunamadı');
      return;
    }

    // Mevcut kullanıcıyı kontrol et
    const existingUser = await User.findOne({ kullaniciAdi: 'kalite.test' });
    if (existingUser) {
      console.log('✅ Kalite Kontrol test kullanıcısı zaten mevcut');
      console.log('📋 Kullanıcı Bilgileri:');
      console.log(`   Kullanıcı Adı: ${existingUser.kullaniciAdi}`);
      console.log('   Şifre: kalite123');
      console.log(`   Ad Soyad: ${existingUser.ad} ${existingUser.soyad}`);
      await mongoose.connection.close();
      return;
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash('kalite123', 10);

    // Yeni kullanıcı oluştur
    const kaliteUser = new User({
      ad: 'Kalite',
      soyad: 'Kontrol',
      kullaniciAdi: 'kalite.test',
      sifreHash: hashedPassword,
      roller: [kaliteKontrolRole._id],
      departmanlar: [], // Boş array
      durum: 'aktif',
    });

    await kaliteUser.save();
    console.log('✅ Kalite Kontrol test kullanıcısı oluşturuldu');
    console.log('📋 Giriş Bilgileri:');
    console.log('   Kullanıcı Adı: kalite.test');
    console.log('   Şifre: kalite123');
    console.log('   Rol: Kalite Kontrol');

    await mongoose.connection.close();
    console.log(
      '\n🎯 Test kullanıcısı hazır! Frontend\'de giriş yapabilirsiniz.',
    );
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

createKaliteKontrolUser();
