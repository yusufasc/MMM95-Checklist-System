const mongoose = require('mongoose');
const Module = require('../models/Module');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

const updateModules = async () => {
  try {
    console.log('🔄 Modüller güncelleniyor...');

    // Modül güncellemeleri
    const moduleUpdates = [
      { ad: 'Dashboard', ikon: 'Dashboard', route: '/dashboard', aktif: true },
      { ad: 'Kullanıcı Yönetimi', ikon: 'People', route: '/users', aktif: true },
      { ad: 'Rol Yönetimi', ikon: 'Security', route: '/roles', aktif: true },
      { ad: 'Departman Yönetimi', ikon: 'Business', route: '/departments', aktif: true },
      { ad: 'Checklist Yönetimi', ikon: 'PlaylistAddCheck', route: '/checklists', aktif: true },
      { ad: 'Görev Yönetimi', ikon: 'Assignment', route: '/tasks', aktif: true },
      { ad: 'Yaptım', ikon: 'Build', route: '/worktasks', aktif: true },
      { ad: 'Envanter Yönetimi', ikon: 'Inventory2', route: '/inventory', aktif: true },
      { ad: 'Kalite Kontrol', ikon: 'FactCheck', route: '/quality-control', aktif: true },
      {
        ad: 'Kalite Kontrol Yönetimi',
        ikon: 'AdminPanelSettings',
        route: '/quality-control-management',
        aktif: true,
      },
      { ad: 'İnsan Kaynakları', ikon: 'People', route: '/hr', aktif: true },
      {
        ad: 'İnsan Kaynakları Yönetimi',
        ikon: 'AdminPanelSettings',
        route: '/hr-management',
        aktif: true,
      },
      { ad: 'Kontrol Bekleyenler', ikon: 'HourglassEmpty', route: '/control-pending', aktif: true },
      { ad: 'Performans', ikon: 'Analytics', route: '/performance', aktif: true },
    ];

    // Her modülü güncelle
    for (const moduleData of moduleUpdates) {
      const result = await Module.findOneAndUpdate(
        { ad: moduleData.ad },
        {
          ikon: moduleData.ikon,
          route: moduleData.route,
          aktif: moduleData.aktif,
        },
        { new: true },
      );

      if (result) {
        console.log(`✅ ${moduleData.ad} modülü güncellendi`);
      } else {
        console.log(`❌ ${moduleData.ad} modülü bulunamadı`);
      }
    }

    console.log('🎉 Modül güncellemeleri tamamlandı!');

    // Güncellenmiş modülleri listele
    const allModules = await Module.find().sort({ ad: 1 });
    console.log('\n📋 Güncellenmiş modüller:');
    allModules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.ad}`);
      console.log(`   Route: ${module.route}`);
      console.log(`   İkon: ${module.ikon}`);
      console.log(`   Aktif: ${module.aktif ? 'Evet' : 'Hayır'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Script'i çalıştır
const runScript = async () => {
  await connectDB();
  await updateModules();
};

runScript();
