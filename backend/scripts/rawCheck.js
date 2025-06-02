const mongoose = require('mongoose');

async function rawCheck() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const db = mongoose.connection.db;

    // Ortacı rolünü RAW olarak al
    const ortaciRole = await db.collection('roles').findOne({ ad: 'Ortacı' });

    console.log('📋 Ortacı rolü RAW data:');
    console.log('  - ID:', ortaciRole._id);
    console.log('  - Ad:', ortaciRole.ad);
    console.log('  - checklistYetkileri sayısı:', ortaciRole.checklistYetkileri?.length);

    if (ortaciRole.checklistYetkileri) {
      console.log('\n📊 Raw checklistYetkileri:');
      ortaciRole.checklistYetkileri.forEach((yetki, index) => {
        console.log(`  ${index}:`);
        console.log(`    hedefRol: ${yetki.hedefRol}`);
        console.log(`    gorebilir: ${yetki.gorebilir} (type: ${typeof yetki.gorebilir})`);
        console.log(
          `    puanlayabilir: ${yetki.puanlayabilir} (type: ${typeof yetki.puanlayabilir})`,
        );
        console.log(
          `    onaylayabilir: ${yetki.onaylayabilir} (type: ${typeof yetki.onaylayabilir})`,
        );
      });

      // Paketlemeci yetkisini özellikle kontrol et
      const paketlemeciRole = await db.collection('roles').findOne({ ad: 'Paketlemeci' });
      const paketlemeciYetki = ortaciRole.checklistYetkileri.find(
        yetki => yetki.hedefRol.toString() === paketlemeciRole._id.toString(),
      );

      if (paketlemeciYetki) {
        console.log('\n🎯 RAW Paketlemeci yetkisi:');
        console.log(
          `  gorebilir: ${paketlemeciYetki.gorebilir} (${typeof paketlemeciYetki.gorebilir})`,
        );
        console.log(
          `  puanlayabilir: ${paketlemeciYetki.puanlayabilir} (${typeof paketlemeciYetki.puanlayabilir})`,
        );
        console.log(
          `  onaylayabilir: ${paketlemeciYetki.onaylayabilir} (${typeof paketlemeciYetki.onaylayabilir})`,
        );

        if (paketlemeciYetki.puanlayabilir === true) {
          console.log('✅ RAW veride puanlayabilir TRUE!');
        } else {
          console.log('❌ RAW veride puanlayabilir FALSE veya undefined!');
        }
      }
    }
  } catch (error) {
    console.error('❌ Script hatası:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📱 MongoDB bağlantısı kapatıldı');
    }
  }
}

console.log('🚀 Raw MongoDB kontrol scripti başlatılıyor...');
rawCheck();
