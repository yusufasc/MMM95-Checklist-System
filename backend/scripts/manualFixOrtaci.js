const mongoose = require('mongoose');

async function manualFixOrtaci() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı');

    const db = mongoose.connection.db;

    // Ortacı ve Paketlemeci rollerini bul
    const ortaciRole = await db.collection('roles').findOne({ ad: 'Ortacı' });
    const paketlemeciRole = await db
      .collection('roles')
      .findOne({ ad: 'Paketlemeci' });

    console.log('🔍 Ortacı rolü bulundu:', !!ortaciRole);
    console.log('🔍 Paketlemeci rolü bulundu:', !!paketlemeciRole);

    if (!ortaciRole || !paketlemeciRole) {
      console.log('❌ Roller bulunamadı');
      return;
    }

    // Paketlemeci'nin tam ID'sini logla
    console.log(`📋 Paketlemeci tam ID: "${paketlemeciRole._id}"`);
    console.log(`📋 Paketlemeci ID type: ${typeof paketlemeciRole._id}`);

    // Mevcut yetkiler
    console.log('\n📋 Mevcut checklist yetkileri:');
    ortaciRole.checklistYetkileri.forEach((yetki, index) => {
      console.log(
        `  ${index}: hedefRol="${yetki.hedefRol}" (type: ${typeof yetki.hedefRol})`,
      );
      console.log(
        `      gorebilir=${yetki.gorebilir}, puanlayabilir=${yetki.puanlayabilir}`,
      );
      console.log(
        `      Paketlemeci ile eşit mi: ${yetki.hedefRol.toString() === paketlemeciRole._id.toString()}`,
      );
    });

    // YENİ YAKLAŞIM: Tüm undefined/null değerleri düzelt
    const fixedYetkileri = ortaciRole.checklistYetkileri.map((yetki, index) => {
      console.log(`\n🔧 Yetki ${index} düzeltiliyor...`);

      const newYetki = {
        hedefRol: yetki.hedefRol,
        gorebilir: yetki.gorebilir || false,
        puanlayabilir: false, // Önce hepsini false yap
        onaylayabilir: false,
      };

      // Eğer Paketlemeci ise özel ayar
      if (yetki.hedefRol.toString() === paketlemeciRole._id.toString()) {
        newYetki.gorebilir = true;
        newYetki.puanlayabilir = true;
        console.log(
          '  ✅ Paketlemeci yetkisi: görebilir=true, puanlayabilir=true',
        );
      } else {
        console.log(
          `  ℹ️  Diğer rol: görebilir=${newYetki.gorebilir}, puanlayabilir=false`,
        );
      }

      return newYetki;
    });

    console.log('\n🔄 MongoDB güncelleniyor...');

    // İlk olarak checklistYetkileri alanını tamamen sil
    await db
      .collection('roles')
      .updateOne(
        { _id: ortaciRole._id },
        { $unset: { checklistYetkileri: '' } },
      );
    console.log('🗑️  Eski checklistYetkileri silindi');

    // Sonra yeni değerlerle tekrar oluştur
    const updateResult = await db.collection('roles').updateOne(
      { _id: ortaciRole._id },
      {
        $set: {
          checklistYetkileri: fixedYetkileri,
          guncellemeTarihi: new Date(),
        },
      },
    );

    console.log('✅ Güncelleme sonucu:', updateResult);

    // DOĞRULAMA: Yeniden oku
    console.log('\n🔍 Doğrulama yapılıyor...');
    const verifiedRole = await db
      .collection('roles')
      .findOne({ _id: ortaciRole._id });

    console.log('📊 Güncellenmiş checklistYetkileri:');
    verifiedRole.checklistYetkileri.forEach((yetki, index) => {
      const roleName =
        yetki.hedefRol.toString() === paketlemeciRole._id.toString()
          ? 'Paketlemeci'
          : 'Diğer';
      console.log(
        `  ${index}: ${roleName} - görebilir=${yetki.gorebilir}, puanlayabilir=${yetki.puanlayabilir}, onaylayabilir=${yetki.onaylayabilir}`,
      );
    });

    const paketlemeciYetkisi = verifiedRole.checklistYetkileri.find(
      yetki => yetki.hedefRol.toString() === paketlemeciRole._id.toString(),
    );

    if (paketlemeciYetkisi) {
      console.log('\n🎯 SONUÇ - Paketlemeci yetkisi:');
      console.log(`   ✅ Görebilir: ${paketlemeciYetkisi.gorebilir}`);
      console.log(`   ✅ Puanlayabilir: ${paketlemeciYetkisi.puanlayabilir}`);
      console.log(`   ✅ Onaylayabilir: ${paketlemeciYetkisi.onaylayabilir}`);

      if (paketlemeciYetkisi.puanlayabilir === true) {
        console.log(
          '\n🎉 BAŞARILI! Ortacı artık Paketlemeci checklistlerini puanlayabilir!',
        );
      } else {
        console.log('\n❌ BAŞARISIZ! Puanlayabilir hala true değil');
      }
    } else {
      console.log('\n❌ Paketlemeci yetkisi bulunamadı!');
    }
  } catch (error) {
    console.error('❌ Script hatası:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📱 MongoDB bağlantısı kapatıldı');
    }
  }
}

console.log('🚀 Manuel Ortacı düzeltme scripti başlatılıyor...');
manualFixOrtaci();
