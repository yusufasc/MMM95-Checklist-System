require('dotenv').config();
const mongoose = require('mongoose');

async function manualFixUsta() {
  try {
    // MongoDB'a bağlan
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('✅ MongoDB bağlandı');

    const db = mongoose.connection.db;

    // Usta rolünü bul
    const ustaRole = await db.collection('roles').findOne({ ad: 'Usta' });
    console.log('Usta rolü:', ustaRole ? 'BULUNDU' : 'YOK');

    if (ustaRole) {
      console.log('Usta ID:', ustaRole._id);
      console.log('Mevcut checklistYetkileri:', ustaRole.checklistYetkileri?.length || 0);
    }

    // Paketlemeci rolünü bul
    const paketlemeciRole = await db.collection('roles').findOne({ ad: 'Paketlemeci' });
    console.log('Paketlemeci rolü:', paketlemeciRole ? 'BULUNDU' : 'YOK');

    if (paketlemeciRole) {
      console.log('Paketlemeci ID:', paketlemeciRole._id);
    }

    // Ortacı rolünü bul
    const ortaciRole = await db.collection('roles').findOne({ ad: 'Ortacı' });
    console.log('Ortacı rolü:', ortaciRole ? 'BULUNDU' : 'YOK');

    if (ortaciRole) {
      console.log('Ortacı ID:', ortaciRole._id);
    }

    if (ustaRole && paketlemeciRole) {
      // Usta rolüne checklistYetkileri ekle
      const checklistYetkileri = [];

      checklistYetkileri.push({
        hedefRol: paketlemeciRole._id,
        gorebilir: true,
        puanlayabilir: true,
        onaylayabilir: true,
      });

      if (ortaciRole) {
        checklistYetkileri.push({
          hedefRol: ortaciRole._id,
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        });
      }

      const result = await db
        .collection('roles')
        .updateOne({ _id: ustaRole._id }, { $set: { checklistYetkileri: checklistYetkileri } });

      console.log('Güncelleme sonucu:', result.modifiedCount > 0 ? 'BAŞARILI' : 'BAŞARISIZ');

      // Doğrula
      const updatedUsta = await db.collection('roles').findOne({ _id: ustaRole._id });
      console.log(
        'Güncellenmiş checklistYetkileri sayısı:',
        updatedUsta.checklistYetkileri?.length || 0,
      );

      if (updatedUsta.checklistYetkileri?.length > 0) {
        console.log('Yetkiler:');
        updatedUsta.checklistYetkileri.forEach((yetki, i) => {
          console.log(
            `  ${i + 1}. Hedef Rol ID: ${yetki.hedefRol} - Görebilir: ${yetki.gorebilir}`,
          );
        });
      }
    } else {
      console.log('❌ Gerekli roller bulunamadı!');
    }
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

manualFixUsta();
