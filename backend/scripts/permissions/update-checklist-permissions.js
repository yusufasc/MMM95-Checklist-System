const mongoose = require('mongoose');
const Role = require('../models/Role');

const updateChecklistPermissions = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Tüm rolleri al
    const roles = await Role.find();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.ad] = role._id;
    });

    console.log('📋 Bulunan roller:', Object.keys(roleMap).join(', '));

    // Önce tüm rollerin checklist yetkilerini temizle
    await Role.updateMany({}, { $set: { checklistYetkileri: [] } });
    console.log('🧹 Tüm checklist yetkileri temizlendi');

    // Admin rolüne yetki ekle - Herkesi görebilir/puanlayabilir
    const adminRole = await Role.findOne({ ad: 'Admin' });
    if (adminRole) {
      adminRole.checklistYetkileri = [
        {
          hedefRol: roleMap['Ortacı'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Paketlemeci'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Usta'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Kalite Kontrol'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
      ];
      await adminRole.save();
      console.log('✅ Admin rolüne checklist yetkileri eklendi');
    }

    // VARDİYA AMİRİ rolüne yetki ekle - Herkesi görebilir/puanlayabilir
    const vardiyaAmiriRole = await Role.findOne({ ad: 'VARDİYA AMİRİ' });
    if (vardiyaAmiriRole) {
      vardiyaAmiriRole.checklistYetkileri = [
        {
          hedefRol: roleMap['Ortacı'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Paketlemeci'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Usta'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
      ];
      await vardiyaAmiriRole.save();
      console.log('✅ VARDİYA AMİRİ rolüne checklist yetkileri eklendi');
    }

    // Usta rolüne yetki ekle - Ortacı ve Paketlemeci'yi görebilir/puanlayabilir
    const ustaRole = await Role.findOne({ ad: 'Usta' });
    if (ustaRole) {
      ustaRole.checklistYetkileri = [
        {
          hedefRol: roleMap['Ortacı'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Paketlemeci'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
      ];
      await ustaRole.save();
      console.log('✅ Usta rolüne checklist yetkileri eklendi');
    }

    // Ortacı rolüne yetki ekle - Paketlemeci'yi görebilir/puanlayabilir
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (ortaciRole) {
      ortaciRole.checklistYetkileri = [
        {
          hedefRol: roleMap['Paketlemeci'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
      ];
      await ortaciRole.save();
      console.log('✅ Ortacı rolüne checklist yetkileri eklendi');
    }

    // Kalite Kontrol rolüne yetki ekle - Herkesi görebilir/puanlayabilir
    const kaliteKontrolRole = await Role.findOne({ ad: 'Kalite Kontrol' });
    if (kaliteKontrolRole) {
      kaliteKontrolRole.checklistYetkileri = [
        {
          hedefRol: roleMap['Ortacı'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Paketlemeci'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
        {
          hedefRol: roleMap['Usta'],
          gorebilir: true,
          puanlayabilir: true,
          onaylayabilir: true,
        },
      ];
      await kaliteKontrolRole.save();
      console.log('✅ Kalite Kontrol rolüne checklist yetkileri eklendi');
    }

    console.log('\n🎯 Checklist yetkileri başarıyla güncellendi!');

    // Kontrol için yetkileri listele
    console.log('\n📋 Güncel checklist yetkileri:');
    const updatedRoles = await Role.find().populate(
      'checklistYetkileri.hedefRol',
      'ad',
    );
    updatedRoles.forEach(role => {
      if (role.checklistYetkileri && role.checklistYetkileri.length > 0) {
        console.log(`\n${role.ad}:`);
        role.checklistYetkileri.forEach(yetki => {
          console.log(
            `  - ${yetki.hedefRol?.ad || 'Bilinmeyen'}: Görebilir=${yetki.gorebilir}, Puanlayabilir=${yetki.puanlayabilir}`,
          );
        });
      }
    });

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

updateChecklistPermissions();
