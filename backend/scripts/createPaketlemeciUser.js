const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');

const createPaketlemeciUser = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Paketlemeci rolünü bul
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });

    if (!paketlemeciRole) {
      console.log('❌ Paketlemeci rolü bulunamadı');
      return;
    }

    // Mevcut kullanıcıyı kontrol et
    const existingUser = await User.findOne({ kullaniciAdi: 'paketleme.test' });

    if (existingUser) {
      console.log('⚠️ Test kullanıcısı zaten mevcut: paketleme.test');
      console.log('🔄 Kullanıcı bilgileri güncelleniyor...');

      // Şifreyi güncelle
      const salt = await bcrypt.genSalt(10);
      existingUser.sifreHash = await bcrypt.hash('paket123', salt);
      existingUser.roller = [paketlemeciRole._id];

      await existingUser.save();
      console.log('✅ Mevcut kullanıcı güncellendi');
    } else {
      // Yeni kullanıcı oluştur
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('paket123', salt);

      const newUser = new User({
        ad: 'Paketleme',
        soyad: 'Test',
        kullaniciAdi: 'paketleme.test',
        email: 'paketleme.test@mmm.com',
        sifreHash: hashedPassword,
        roller: [paketlemeciRole._id],
        durum: 'aktif',
        secilenMakinalar: [], // Boş başlayacak
      });

      await newUser.save();
      console.log('✅ Yeni Paketlemeci test kullanıcısı oluşturuldu');
    }

    console.log('\n📋 Test Kullanıcısı Bilgileri:');
    console.log('👤 Kullanıcı Adı: paketleme.test');
    console.log('🔑 Şifre: paket123');
    console.log('🎭 Rol: Paketlemeci');
    console.log('🏭 Seçilen Makinalar: Henüz yok (kullanıcı seçecek)');

    console.log('\n🎯 Paketlemeci Yetkileri:');
    const updatedRole = await Role.findOne({ ad: 'Paketlemeci' }).populate(
      'moduller.modul',
      'ad',
    );

    updatedRole.moduller.forEach(permission => {
      if (permission.erisebilir) {
        console.log(
          `✅ ${permission.modul.ad}: ${permission.duzenleyebilir ? 'Tam Yetki' : 'Sadece Görüntüleme'}`,
        );
      }
    });

    await mongoose.connection.close();
    console.log(
      '\n🎯 Paketlemeci test kullanıcısı hazır! Dashboard\'a giriş yapabilir.',
    );
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

createPaketlemeciUser();
