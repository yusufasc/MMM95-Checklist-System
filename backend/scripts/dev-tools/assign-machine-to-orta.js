const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function assignMachineToOrta() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    // Ortacı kullanıcısını bul
    const ortaUser = await User.findOne({ kullaniciAdi: 'orta1' });
    if (!ortaUser) {
      console.log('❌ orta1 kullanıcısı bulunamadı');
      process.exit(1);
    }

    console.log(`✅ Ortacı kullanıcısı bulundu: ${ortaUser.ad} ${ortaUser.soyad}`);
    console.log(`   Mevcut seçilen makinalar: ${ortaUser.secilenMakinalar?.length || 0} adet`);

    // Test görevindeki makina ID'sini kullan (paket2'nin görevindeki makina)
    // Veya genel bir makina ID'si kullan
    const testMachineId = '6838670fb8ef045a7e54fbe8'; // Paketlemeci görevlerinde kullanılan makina

    // Makina ataması yap
    ortaUser.secilenMakinalar = [testMachineId];
    await ortaUser.save();

    console.log(`✅ Ortacı kullanıcısına makina atandı: ${testMachineId}`);
    console.log(`   Yeni seçilen makinalar: ${ortaUser.secilenMakinalar.length} adet`);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

assignMachineToOrta();
