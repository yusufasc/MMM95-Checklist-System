const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');

mongoose.connect('mongodb://localhost:27017/mmm-checklist');

async function createAdminUser() {
  try {
    console.log('👤 Admin kullanıcı oluşturuluyor...\n');

    // Admin rolünü bul
    const adminRole = await Role.findOne({ ad: 'Admin' });
    if (!adminRole) {
      console.log('❌ Admin rolü bulunamadı! Önce rolleri oluşturun.');
      return;
    }

    // Zaten admin var mı kontrol et
    const existingAdmin = await User.findOne({ roller: adminRole._id });
    if (existingAdmin) {
      console.log(
        `⚠️  Admin kullanıcı zaten mevcut: ${existingAdmin.kullaniciAdi}`,
      );
      return;
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin kullanıcı oluştur
    const adminUser = new User({
      ad: 'Admin',
      soyad: 'User',
      kullaniciAdi: 'admin',
      sifreHash: hashedPassword,
      roller: [adminRole._id],
      durum: 'aktif',
      secilenMakinalar: [],
      departmanlar: [],
    });

    await adminUser.save();
    console.log('✅ Admin kullanıcı başarıyla oluşturuldu!');
    console.log('   👤 Kullanıcı Adı: admin');
    console.log('   🔑 Şifre: admin123');
    console.log('   📧 Email: admin@serinova.com\n');

    // Test kullanıcıları da oluştur
    const testUsers = [
      {
        ad: 'Velid',
        soyad: 'Test',
        kullaniciAdi: 'velid',
        sifre: 'asd123',
        roleName: 'Ortacı',
      },
      {
        ad: 'Melle',
        soyad: 'Test',
        kullaniciAdi: 'melle',
        sifre: 'asd123',
        roleName: 'Usta',
      },
      {
        ad: 'Salih',
        soyad: 'Test',
        kullaniciAdi: 'salih',
        sifre: 'asd123',
        roleName: 'VARDİYA AMİRİ',
      },
    ];

    for (const userData of testUsers) {
      const role = await Role.findOne({ ad: userData.roleName });
      if (!role) {
        console.log(
          `❌ ${userData.roleName} rolü bulunamadı, ${userData.kullaniciAdi} atlanıyor`,
        );
        continue;
      }

      const hashedTestPassword = await bcrypt.hash(userData.sifre, 10);

      const testUser = new User({
        ad: userData.ad,
        soyad: userData.soyad,
        kullaniciAdi: userData.kullaniciAdi,
        sifreHash: hashedTestPassword,
        roller: [role._id],
        durum: 'aktif',
        secilenMakinalar: [],
        departmanlar: [],
      });

      await testUser.save();
      console.log(
        `✅ ${userData.kullaniciAdi} (${userData.roleName}) kullanıcısı oluşturuldu`,
      );
    }

    console.log('\n🎉 Tüm kullanıcılar başarıyla oluşturuldu!');
    console.log('\n📋 Oluşturulan Kullanıcılar:');
    console.log('   👤 admin / admin123 (Admin)');
    console.log('   👤 velid / asd123 (Ortacı)');
    console.log('   👤 melle / asd123 (Usta)');
    console.log('   👤 salih / asd123 (Vardiya Amiri)\n');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
