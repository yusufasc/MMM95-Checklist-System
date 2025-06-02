const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const HRSettings = require('../models/HRSettings');

mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkCurrentUser() {
  try {
    console.log('🔍 Kullanıcı ve İK yetki durumu kontrol ediliyor...');

    // Admin kullanıcısını bul
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' }).populate('roller', 'ad');
    console.log(
      '👤 Admin kullanıcısı:',
      adminUser
        ? {
          ad: adminUser.ad,
          soyad: adminUser.soyad,
          roller: adminUser.roller.map(r => r.ad),
        }
        : 'Bulunamadı',
    );

    // Tüm rolleri listele
    const roles = await Role.find().select('ad');
    console.log(
      '📋 Mevcut roller:',
      roles.map(r => r.ad),
    );

    // İK ayarlarını kontrol et
    const settings = await HRSettings.findOne()
      .populate('modulErisimYetkileri.rol', 'ad')
      .populate('rolYetkileri.rol', 'ad');
    if (settings) {
      console.log('⚙️ İK modül erişim yetkileri:', settings.modulErisimYetkileri.length, 'kayıt');
      settings.modulErisimYetkileri.forEach((mey, index) => {
        console.log(
          `  ${index + 1}. Rol: ${mey.rol?.ad || 'Bilinmiyor'}, Durum: ${mey.erisimDurumu}`,
        );
      });

      console.log('🔐 İK rol yetkileri:', settings.rolYetkileri.length, 'kayıt');
      settings.rolYetkileri.forEach((ry, index) => {
        console.log(`  ${index + 1}. Rol: ${ry.rol?.ad || 'Bilinmiyor'}, Yetkiler:`, ry.yetkiler);
      });
    } else {
      console.log('❌ İK ayarları bulunamadı');
    }
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCurrentUser();
