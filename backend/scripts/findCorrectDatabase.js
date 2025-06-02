const mongoose = require('mongoose');

async function findCorrectDatabase() {
  try {
    // Farklı veritabanı adlarını dene
    const possibleDatabases = [
      'mmm-checklist',
      'mmm-checklist',
      'mmm-checklist',
      'checklist-system',
      'admin',
      'test',
      'mmm',
    ];

    console.log('🔍 Doğru veritabanını arıyor...\n');

    for (const dbName of possibleDatabases) {
      try {
        console.log(`📊 ${dbName} veritabanı kontrol ediliyor...`);
        await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

        // Koleksiyonları listele
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`  📁 Koleksiyonlar: ${collections.map(c => c.name).join(', ')}`);

        // Users koleksiyonu varsa kontrol et
        if (collections.some(c => c.name === 'users')) {
          const users = await mongoose.connection.db.collection('users').find({}).toArray();
          console.log(`  👥 Kullanıcı sayısı: ${users.length}`);

          // paket2, orta1, orta2 kullanıcılarını ara
          const targetUsers = users.filter(user =>
            ['paket2', 'orta1', 'orta2'].includes(user.kullaniciAdi),
          );

          if (targetUsers.length > 0) {
            console.log(`  🎯 HEDEF KULLANICILAR BULUNDU! (${targetUsers.length})`);
            targetUsers.forEach(user => {
              console.log(`    - ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
              console.log(`      └─ Roller: ${user.roller?.length || 0} adet`);
              console.log(`      └─ Seçili makina: ${user.secilenMakinalar?.length || 0} adet`);
            });

            // Roles koleksiyonunu da kontrol et
            if (collections.some(c => c.name === 'roles')) {
              const roles = await mongoose.connection.db.collection('roles').find({}).toArray();
              console.log(`  📋 Rol sayısı: ${roles.length}`);
              roles.forEach(role => {
                console.log(`    - ${role.ad || role.name || 'İsimsiz'} (ID: ${role._id})`);
              });
            }

            // Tasks koleksiyonunu da kontrol et
            if (collections.some(c => c.name === 'tasks')) {
              const tasks = await mongoose.connection.db.collection('tasks').find({}).toArray();
              console.log(`  📋 Görev sayısı: ${tasks.length}`);

              const tasksWithMachine = tasks.filter(task => task.makina);
              console.log(`  🔧 Makinalı görev sayısı: ${tasksWithMachine.length}`);
            }

            console.log(`\n✅ DOĞRU VERİTABANI: ${dbName}`);
            await mongoose.connection.close();
            return dbName;
          }
        }

        await mongoose.connection.close();
        console.log('  ❌ Hedef kullanıcılar yok\n');
      } catch (err) {
        console.log(`  ❌ Bağlantı hatası: ${err.message}\n`);
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
        }
      }
    }

    console.log('❌ Hiçbir veritabanında hedef kullanıcılar bulunamadı');
  } catch (error) {
    console.error('❌ Script hatası:', error);
  }
}

console.log('🚀 Doğru veritabanı arama scripti başlatılıyor...');
findCorrectDatabase();
