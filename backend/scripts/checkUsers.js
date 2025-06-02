const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const db = mongoose.connection.db;

    // Tüm kullanıcıları listele
    const users = await db.collection('users').find({}).toArray();

    console.log(`👥 Toplam ${users.length} kullanıcı bulundu:`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
      console.log(`   └─ Durum: ${user.durum}`);
      console.log(`   └─ Roller: ${user.roller?.length || 0} adet`);
    });

    // Admin rolü olan kullanıcıları bul
    const adminUsers = users.filter(user => user.roller && user.roller.length > 0);

    console.log(`\n🔑 Rolü olan kullanıcılar: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.kullaniciAdi}: ${user.roller.length} rol`);
    });
  } catch (error) {
    console.error('❌ Script hatası:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📱 MongoDB bağlantısı kapatıldı');
    }
  }
}

console.log('🚀 Kullanıcı kontrol scripti başlatılıyor...');
checkUsers();
