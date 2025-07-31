const mongoose = require('mongoose');
const Role = require('../models/Role');
const Module = require('../models/Module');

mongoose.connect('mongodb://localhost:27017/mmm-checklist');

async function recreateRoles() {
  try {
    console.log('🔧 Rolleri yeniden oluşturuyor...\n');

    // Önce modülleri kontrol et
    const modules = await Module.find();
    console.log(
      '📋 Mevcut modüller:',
      modules.map(m => m.ad),
    );

    // Gerekli modülleri oluştur
    const requiredModules = [
      'Görev Yönetimi',
      'Kontrol Bekleyenler',
      'Kullanıcı Yönetimi',
      'Envanter Yönetimi',
      'Yaptım',
      'Performans',
      'Kalite Kontrol',
    ];

    for (const moduleName of requiredModules) {
      const existingModule = await Module.findOne({ ad: moduleName });
      if (!existingModule) {
        const newModule = new Module({
          ad: moduleName,
          aciklama: `${moduleName} modülü`,
        });
        await newModule.save();
        console.log(`✅ ${moduleName} modülü oluşturuldu`);
      }
    }

    // Güncel modül listesi
    const allModules = await Module.find();

    // Temel rolleri oluştur
    const rolesToCreate = [
      {
        ad: 'Admin',
        aciklama: 'Sistem yöneticisi',
        modules: allModules.map(m => ({
          modul: m._id,
          erisebilir: true,
          duzenleyebilir: true,
        })),
      },
      {
        ad: 'Ortacı',
        aciklama: 'Ortacı personeli',
        modules: [
          {
            modulName: 'Görev Yönetimi',
            erisebilir: true,
            duzenleyebilir: false,
          },
          { modulName: 'Yaptım', erisebilir: true, duzenleyebilir: true },
          { modulName: 'Performans', erisebilir: true, duzenleyebilir: false },
        ],
      },
      {
        ad: 'Usta',
        aciklama: 'Usta personeli',
        modules: [
          {
            modulName: 'Görev Yönetimi',
            erisebilir: true,
            duzenleyebilir: false,
          },
          {
            modulName: 'Kontrol Bekleyenler',
            erisebilir: true,
            duzenleyebilir: true,
          },
          { modulName: 'Yaptım', erisebilir: true, duzenleyebilir: true },
          { modulName: 'Performans', erisebilir: true, duzenleyebilir: false },
        ],
      },
      {
        ad: 'Paketlemeci',
        aciklama: 'Paketlemeci personeli',
        modules: [
          {
            modulName: 'Görev Yönetimi',
            erisebilir: true,
            duzenleyebilir: false,
          },
          { modulName: 'Yaptım', erisebilir: true, duzenleyebilir: true },
          { modulName: 'Performans', erisebilir: true, duzenleyebilir: false },
        ],
      },
      {
        ad: 'VARDİYA AMİRİ',
        aciklama: 'Vardiya amiri',
        modules: [
          {
            modulName: 'Görev Yönetimi',
            erisebilir: true,
            duzenleyebilir: true,
          },
          {
            modulName: 'Kontrol Bekleyenler',
            erisebilir: true,
            duzenleyebilir: true,
          },
          { modulName: 'Performans', erisebilir: true, duzenleyebilir: true },
        ],
      },
    ];

    for (const roleData of rolesToCreate) {
      // Rol zaten var mı kontrol et
      const existingRole = await Role.findOne({ ad: roleData.ad });
      if (existingRole) {
        console.log(`⚠️  ${roleData.ad} rolü zaten mevcut, atlanıyor`);
        continue;
      }

      let moduller = [];

      if (roleData.ad === 'Admin') {
        moduller = roleData.modules;
      } else {
        // Normal roller için modül eşleştirme
        moduller = roleData.modules
          .map(modulePermission => {
            const module = allModules.find(
              m => m.ad === modulePermission.modulName,
            );
            if (module) {
              return {
                modul: module._id,
                erisebilir: modulePermission.erisebilir,
                duzenleyebilir: modulePermission.duzenleyebilir,
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      const newRole = new Role({
        ad: roleData.ad,
        aciklama: roleData.aciklama,
        moduller: moduller,
        checklistYetkileri: [],
      });

      await newRole.save();
      console.log(
        `✅ ${roleData.ad} rolü oluşturuldu (${moduller.length} modül yetkisi)`,
      );
    }

    console.log('\n🎉 Roller başarıyla oluşturuldu!');

    // Kontrol için roller listesini göster
    const roles = await Role.find().populate('moduller.modul');
    console.log('\n📋 Oluşturulan Roller:');
    roles.forEach(role => {
      console.log(`\n🎯 ${role.ad}:`);
      role.moduller.forEach(modulYetkisi => {
        if (modulYetkisi.modul) {
          console.log(
            `  📌 ${modulYetkisi.modul.ad}: ${modulYetkisi.erisebilir ? 'ERİŞEBİLİR' : 'ERİŞEMEZ'}`,
          );
        }
      });
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
}

recreateRoles();
