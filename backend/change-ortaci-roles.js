const mongoose = require('mongoose');
require('dotenv').config();

async function changeOrtaciRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./models/User');
    const Role = require('./models/Role');
    
    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortaci' });
    const ustaRole = await Role.findOne({ ad: 'Usta' });
    
    if (!ortaciRole || !ustaRole) {
      console.log('❌ Roller bulunamadı!');
      process.exit(1);
    }
    
    console.log('🔄 Ortacı rolündeki kullanıcıları Usta rolüne değiştiriliyor...');
    
    // Ortacı rolündeki kullanıcıları bul
    const users = await User.find({ roller: ortaciRole._id });
    
    for (const user of users) {
      // Ortacı rolünü kaldır, Usta rolünü ekle
      user.roller = user.roller.filter(roleId => !roleId.equals(ortaciRole._id));
      user.roller.push(ustaRole._id);
      
      await user.save();
      console.log('✅ ' + user.ad + ' ' + user.soyad + ' → Usta rolüne değiştirildi');
    }
    
    console.log('\n🎯 TOPLAM DEĞİŞTİRİLEN: ' + users.length + ' kullanıcı');
    console.log('✅ Artık Ortacı rolünü silebilirsiniz!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

changeOrtaciRoles();