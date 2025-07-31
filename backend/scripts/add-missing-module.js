const mongoose = require('mongoose');
const Module = require('../models/Module');
const Role = require('../models/Role');
require('dotenv').config();

const addMissingModule = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı kuruldu');

    // 1. "Kişisel Aktivite" modülünü oluştur/güncelle
    const kisiselAktiviteModule = await Module.findOneAndUpdate(
      { ad: 'Kişisel Aktivite' },
      {
        ad: 'Kişisel Aktivite',
        aciklama: 'Kullanıcının kişisel aktivite ve performans takibi',
        ikon: 'Timeline',
        route: '/my-activity',
        aktif: true,
        guncellemeTarihi: new Date(),
      },
      { upsert: true, new: true },
    );

    console.log(
      '✅ "Kişisel Aktivite" modülü eklendi/güncellendi:',
      kisiselAktiviteModule._id,
    );

    // 2. Tüm rolleri getir
    const roles = await Role.find();
    console.log(`📋 ${roles.length} rol bulundu`);

    // 3. Her rol için "Kişisel Aktivite" yetkisi ekle
    for (const role of roles) {
      // Eğer bu modül için yetki yoksa ekle
      const hasPermission = role.modulePermissions.some(
        perm => perm.moduleName === 'Kişisel Aktivite',
      );

      if (!hasPermission) {
        role.modulePermissions.push({
          moduleName: 'Kişisel Aktivite',
          gorebilir: true,
          duzenleyebilir: false, // Sadece görme yetkisi
        });

        await role.save();
        console.log(`✅ ${role.ad} rolüne "Kişisel Aktivite" yetkisi eklendi`);
      } else {
        console.log(
          `⚠️ ${role.ad} rolünde "Kişisel Aktivite" yetkisi zaten mevcut`,
        );
      }
    }

    console.log('🎉 İşlem tamamlandı!');
    console.log('');
    console.log('📊 Sonuçlar:');
    console.log('- "Kişisel Aktivite" modülü eklendi');
    console.log('- Tüm rollere görme yetkisi verildi');
    console.log(
      '- http://localhost:3000/my-activity artık rol yönetiminde görünecek',
    );
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 MongoDB bağlantısı kapatıldı');
  }
};

addMissingModule();
