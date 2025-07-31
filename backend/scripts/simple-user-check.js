const mongoose = require('mongoose');
const User = require('../models/User');

async function simpleUserCheck() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    const allUsers = await User.find().select('kullaniciAdi ad soyad aktif');

    console.log(`Toplam ${allUsers.length} kullanıcı bulundu:`);

    allUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.kullaniciAdi} (${user.ad} ${user.soyad}) - Aktif: ${user.aktif}`,
      );
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Hata:', error.message);
    await mongoose.connection.close();
  }
}

simpleUserCheck();
