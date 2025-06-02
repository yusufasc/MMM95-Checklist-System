const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('\n🔍 mmm-checklist veritabanına bağlanıyor...');
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('✅ Bağlantı başarılı!');

    // Koleksiyonları listele
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Koleksiyonlar (${collections.length}):`);
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Roles koleksiyonu içeriğini detaylı göster
    console.log('\n📋 Roles koleksiyonundaki dökümanlar:');
    try {
      const roles = await mongoose.connection.db.collection('roles').find({}).toArray();
      if (roles.length === 0) {
        console.log('  ❌ Roles koleksiyonu boş!');
      } else {
        console.log(`  📊 Toplam rol sayısı: ${roles.length}`);
        roles.forEach(role => {
          console.log(`  - ${role.ad || role.name || 'İsimsiz'} (ID: ${role._id})`);
          if (role.checklistYetkileri) {
            console.log(`    └─ Checklist yetkileri: ${role.checklistYetkileri.length} adet`);
          }
        });
      }
    } catch (rolesError) {
      console.log('  ❌ Roles koleksiyonu okuma hatası:', rolesError.message);
    }

    // Users koleksiyonu içeriğini detaylı göster
    console.log('\n👥 Users koleksiyonundaki kullanıcılar:');
    try {
      const users = await mongoose.connection.db.collection('users').find({}).toArray();
      if (users.length === 0) {
        console.log('  ❌ Users koleksiyonu boş!');
      } else {
        console.log(`  📊 Toplam kullanıcı sayısı: ${users.length}`);
        users.forEach(user => {
          console.log(`  - ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
          console.log(`    └─ Roller: ${user.roller?.length || 0} adet - ${user.roller || 'Yok'}`);
          console.log(`    └─ Seçili makina: ${user.secilenMakinalar?.length || 0} adet`);
          if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
            console.log(`    └─ Makina ID'leri: ${user.secilenMakinalar.join(', ')}`);
          }
        });
      }
    } catch (usersError) {
      console.log('  ❌ Users koleksiyonu okuma hatası:', usersError.message);
    }

    // Tasks koleksiyonu içeriğini detaylı göster
    console.log('\n📋 Tasks koleksiyonundaki görevler:');
    try {
      const tasks = await mongoose.connection.db.collection('tasks').find({}).toArray();
      if (tasks.length === 0) {
        console.log('  ❌ Tasks koleksiyonu boş!');
      } else {
        console.log(`  📊 Toplam görev sayısı: ${tasks.length}`);

        // Makinalı görevleri bul
        const tasksWithMachine = tasks.filter(task => task.makina);
        console.log(`  🔧 Makinalı görev sayısı: ${tasksWithMachine.length}`);

        tasksWithMachine.slice(0, 5).forEach(task => {
          console.log(`  - Görev: ${task._id}`);
          console.log(`    └─ Kullanıcı: ${task.kullanici}`);
          console.log(`    └─ Makina: ${task.makina}`);
          console.log(`    └─ Durum: ${task.durum}`);
        });
      }
    } catch (tasksError) {
      console.log('  ❌ Tasks koleksiyonu okuma hatası:', tasksError.message);
    }
  } catch (error) {
    console.error('❌ Script hatası:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📱 Bağlantı kapatıldı');
    }
  }
}

console.log('🚀 Veritabanı kontrol scripti başlatılıyor...');
checkDatabase();
