const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

const updateRolePermissions = async () => {
  try {
    console.log('🔧 Rol yetkileri güncelleme scripti başlatılıyor...');

    // MongoDB'ye bağlan
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log('✅ MongoDB bağlantısı başarılı!');

    // Tüm rolleri al
    const roles = await Role.find({});
    console.log(
      'Bulunan roller:',
      roles.map(r => r.ad),
    );

    const ortaciRole = roles.find(r => r.ad === 'Ortacı');
    const ustaRole = roles.find(r => r.ad === 'Usta');
    const paketlemeciRole = roles.find(r => r.ad === 'Paketlemeci');
    const kaliteKontrolRole = roles.find(r => r.ad === 'Kalite Kontrol');

    if (!ortaciRole || !ustaRole || !paketlemeciRole || !kaliteKontrolRole) {
      console.log('❌ Gerekli roller bulunamadı!');
      return;
    }

    // Usta rolüne checklist yetkileri ekle
    console.log('📝 Usta rolüne yetki ekleniyor...');
    await Role.findByIdAndUpdate(ustaRole._id, {
      $set: {
        checklistYetkileri: [
          {
            hedefRol: ortaciRole._id,
            gorebilir: true,
            onaylayabilir: true,
          },
          {
            hedefRol: paketlemeciRole._id,
            gorebilir: true,
            onaylayabilir: true,
          },
        ],
      },
    });

    // Kalite Kontrol rolüne checklist yetkileri ekle
    console.log('📝 Kalite Kontrol rolüne yetki ekleniyor...');
    await Role.findByIdAndUpdate(kaliteKontrolRole._id, {
      $set: {
        checklistYetkileri: [
          {
            hedefRol: ortaciRole._id,
            gorebilir: true,
            onaylayabilir: true,
          },
          {
            hedefRol: ustaRole._id,
            gorebilir: true,
            onaylayabilir: true,
          },
          {
            hedefRol: paketlemeciRole._id,
            gorebilir: true,
            onaylayabilir: true,
          },
        ],
      },
    });

    console.log('✅ Rol yetkileri başarıyla güncellendi!');

    // Güncellenmiş rolleri kontrol et
    const updatedUsta = await Role.findById(ustaRole._id).populate(
      'checklistYetkileri.hedefRol',
    );
    const updatedKalite = await Role.findById(kaliteKontrolRole._id).populate(
      'checklistYetkileri.hedefRol',
    );

    console.log(
      '🔍 Usta rolü yetkileri:',
      updatedUsta.checklistYetkileri.map(
        y =>
          `${y.hedefRol.ad} (${y.gorebilir ? 'G' : ''}${y.onaylayabilir ? 'O' : ''})`,
      ),
    );
    console.log(
      '🔍 Kalite Kontrol yetkileri:',
      updatedKalite.checklistYetkileri.map(
        y =>
          `${y.hedefRol.ad} (${y.gorebilir ? 'G' : ''}${y.onaylayabilir ? 'O' : ''})`,
      ),
    );
  } catch (error) {
    console.error('❌ Rol yetkileri güncellenirken hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Script'i çalıştır
updateRolePermissions();
