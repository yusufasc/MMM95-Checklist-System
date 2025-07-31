const mongoose = require('mongoose');
const User = require('../models/User');

async function cleanOldMachineReferences() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📱 MongoDB bağlantısı başarılı');

    // Tüm kullanıcıları al
    const users = await User.find({}).select('kullaniciAdi secilenMakinalar');
    console.log(`👥 ${users.length} kullanıcı bulundu`);

    let cleanedCount = 0;
    for (const user of users) {
      if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
        console.log(
          `🔧 ${user.kullaniciAdi} kullanıcısında ${user.secilenMakinalar.length} makina referansı temizleniyor...`,
        );

        // Seçilen makinaları temizle
        await User.findByIdAndUpdate(user._id, {
          $unset: { secilenMakinalar: 1 },
        });

        cleanedCount++;
      }
    }

    console.log(
      `✅ ${cleanedCount} kullanıcıdan eski makina referansları temizlendi`,
    );
    console.log('ℹ️  Kullanıcılar şimdi envanterden makina seçebilir');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📱 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  cleanOldMachineReferences();
}

module.exports = cleanOldMachineReferences;
