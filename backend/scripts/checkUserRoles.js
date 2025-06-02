const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

async function checkUserRoles() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const user = await User.findOne({ kullaniciAdi: 'orta1' }).populate('roller', 'ad');

    if (!user) {
      console.log('❌ orta1 kullanıcısı bulunamadı');
      return;
    }

    console.log('👤 Kullanıcı:', user.ad, user.soyad);
    console.log('📋 Raw roller array:', user.roller);
    console.log('📋 Rol sayısı:', user.roller?.length || 0);

    if (user.roller && user.roller.length > 0) {
      console.log('📊 Kullanıcının rolleri:');
      user.roller.forEach((rol, i) => {
        console.log(`  ${i + 1}: ${rol.ad} (ID: ${rol._id})`);
      });
    } else {
      console.log('❌ Kullanıcının hiç rolü yok!');

      // Ortacı rolünü ekleyelim
      const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
      if (ortaciRole) {
        user.roller = [ortaciRole._id];
        await user.save();
        console.log('✅ Ortacı rolü kullanıcıya eklendi!');
      }
    }

    mongoose.disconnect();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkUserRoles();
