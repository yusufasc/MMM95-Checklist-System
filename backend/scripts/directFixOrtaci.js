const mongoose = require('mongoose');

async function directFixOrtaci() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    // Direkt MongoDB update komutları kullan
    const db = mongoose.connection.db;

    // Ortacı rolünü bul
    const ortaciRole = await db.collection('roles').findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    // Paketlemeci rolünü bul
    const paketlemeciRole = await db.collection('roles').findOne({ ad: 'Paketlemeci' });
    if (!paketlemeciRole) {
      console.log('❌ Paketlemeci rolü bulunamadı');
      return;
    }

    console.log(`📋 Ortacı ID: ${ortaciRole._id}`);
    console.log(`📋 Paketlemeci ID: ${paketlemeciRole._id}`);

    // Mevcut checklist yetkileri
    console.log('\n📋 Mevcut checklist yetkileri:');
    if (ortaciRole.checklistYetkileri) {
      ortaciRole.checklistYetkileri.forEach((yetki, index) => {
        console.log(
          `  ${index}: hedefRol=${yetki.hedefRol}, gorebilir=${yetki.gorebilir}, puanlayabilir=${yetki.puanlayabilir}`,
        );
      });
    }

    // Tüm checklist yetkilerini güncelle
    const updatedYetkileri = ortaciRole.checklistYetkileri.map(yetki => {
      // Paketlemeci için özel ayar
      if (yetki.hedefRol.toString() === paketlemeciRole._id.toString()) {
        return {
          hedefRol: yetki.hedefRol,
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: false,
        };
      }
      // Diğerleri için false
      return {
        hedefRol: yetki.hedefRol,
        gorebilir: yetki.gorebilir || false,
        puanlayabilir: false,
        onaylayabilir: false,
      };
    });

    // MongoDB'de güncelle
    const updateResult = await db.collection('roles').updateOne(
      { _id: ortaciRole._id },
      {
        $set: {
          checklistYetkileri: updatedYetkileri,
          guncellemeTarihi: new Date(),
        },
      },
    );

    console.log('\n✅ Güncelleme sonucu:', updateResult);

    // Kontrol et
    const updatedRole = await db.collection('roles').findOne({ _id: ortaciRole._id });
    const paketlemeciYetkisi = updatedRole.checklistYetkileri.find(
      yetki => yetki.hedefRol.toString() === paketlemeciRole._id.toString(),
    );

    if (paketlemeciYetkisi) {
      console.log('\n📊 Güncellenmiş Paketlemeci yetkisi:');
      console.log(`   └─ Görebilir: ${paketlemeciYetkisi.gorebilir}`);
      console.log(`   └─ Puanlayabilir: ${paketlemeciYetkisi.puanlayabilir}`);
      console.log(`   └─ Onaylayabilir: ${paketlemeciYetkisi.onaylayabilir}`);
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

console.log('🚀 Direkt Ortacı rol düzeltme scripti başlatılıyor...');
directFixOrtaci();
