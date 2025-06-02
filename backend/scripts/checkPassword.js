const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function checkPassword() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const user = await User.findOne({ kullaniciAdi: 'orta1' });
    if (!user) {
      console.log('❌ orta1 kullanıcısı bulunamadı');
      return;
    }

    console.log('👤 Kullanıcı bulundu:', user.ad, user.soyad);
    console.log('🔑 Şifre hash:', user.sifreHash.substring(0, 20) + '...');

    // Test şifreleri
    const testPasswords = ['123456', 'orta1', 'password', '123123', 'admin', '111111'];

    for (const testPass of testPasswords) {
      const isMatch = await bcrypt.compare(testPass, user.sifreHash);
      console.log(`🔍 Şifre "${testPass}": ${isMatch ? '✅ DOĞRU' : '❌ yanlış'}`);
      if (isMatch) {
        console.log(`🎯 DOĞRU ŞİFRE BULUNDU: "${testPass}"`);
        break;
      }
    }

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkPassword();
