const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const users = await User.find({}, 'kullaniciAdi ad soyad');

    console.log('👥 Sistemdeki kullanıcılar:');
    users.forEach(user => {
      console.log(`- ${user.kullaniciAdi} | ${user.ad} ${user.soyad}`);
    });

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

listUsers();
