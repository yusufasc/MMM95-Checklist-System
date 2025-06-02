const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function resetPassword() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const user = await User.findOne({ kullaniciAdi: 'orta1' });
    if (!user) {
      console.log('❌ orta1 kullanıcısı bulunamadı');
      return;
    }

    console.log('👤 Kullanıcı bulundu:', user.ad, user.soyad);

    // Yeni şifre: 123456
    const newPassword = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.findByIdAndUpdate(user._id, { sifreHash: hashedPassword });

    console.log('✅ Şifre başarıyla güncellendi!');
    console.log('🔑 Yeni şifre: 123456');

    // Test edelim
    const isMatch = await bcrypt.compare('123456', hashedPassword);
    console.log('🧪 Test sonucu:', isMatch ? '✅ BAŞARILI' : '❌ HATALI');

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

resetPassword();
