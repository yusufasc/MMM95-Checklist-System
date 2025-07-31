const mongoose = require('mongoose');
require('dotenv').config();
const Module = require('../../models/Module');

const DB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist';

console.log('MongoDB URI:', DB_URI);

mongoose
  .connect(DB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createStandardModules() {
  try {
    console.log('🎯 Standart sistem modülleri oluşturuluyor...');

    const standardModules = [
      {
        ad: 'Dashboard',
        aciklama: 'Ana sayfa ve istatistikler',
        route: '/dashboard',
        aktif: true,
      },
      {
        ad: 'Kullanıcı Yönetimi',
        aciklama: 'Kullanıcı yönetimi',
        route: '/users',
        aktif: true,
      },
      {
        ad: 'Rol Yönetimi',
        aciklama: 'Rol ve yetki yönetimi',
        route: '/roles',
        aktif: true,
      },
      {
        ad: 'Departman Yönetimi',
        aciklama: 'Departman yönetimi',
        route: '/departments',
        aktif: true,
      },
      {
        ad: 'Checklist Yönetimi',
        aciklama: 'Checklist şablonu yönetimi',
        route: '/checklists',
        aktif: true,
      },
      {
        ad: 'Görev Yönetimi',
        aciklama: 'Kullanıcının görevleri',
        route: '/tasks',
        aktif: true,
      },
      {
        ad: 'Kontrol Bekleyenler',
        aciklama: 'Onay bekleyen görevler',
        route: '/control-pending',
        aktif: true,
      },
      {
        ad: 'Performans',
        aciklama:
          'Performans raporları ve kişisel aktivite takibi (/my-activity)',
        route: '/my-activity',
        aktif: true,
      },
      {
        ad: 'Envanter Yönetimi',
        aciklama: 'Envanter ve stok yönetimi',
        route: '/inventory',
        aktif: true,
      },
      {
        ad: 'Yaptım',
        aciklama: 'İşe bağlı checklistleri doldurma ve tamamlama modülü',
        route: '/worktasks',
        aktif: true,
      },
      {
        ad: 'Kalite Kontrol',
        aciklama: 'Kalite kontrol değerlendirmeleri',
        route: '/quality-control',
        aktif: true,
      },
      {
        ad: 'Kalite Kontrol Yönetimi',
        aciklama: 'Kalite kontrol şablonları yönetimi',
        route: '/quality-control-management',
        aktif: true,
      },
      {
        ad: 'İnsan Kaynakları',
        aciklama: 'İK mesai ve devamsızlık yönetimi',
        route: '/hr',
        aktif: true,
      },
      {
        ad: 'İnsan Kaynakları Yönetimi',
        aciklama: 'İK şablonları ve ayarları yönetimi',
        route: '/hr-management',
        aktif: true,
      },
      {
        ad: 'Personel Takip',
        aciklama: 'Personel makina takip sistemi',
        route: '/personnel-tracking',
        aktif: true,
      },
    ];

    console.log('\n📋 Standart modüller oluşturuluyor...');
    let createdCount = 0;
    let existingCount = 0;

    for (const moduleData of standardModules) {
      const existingModule = await Module.findOne({ ad: moduleData.ad });

      if (!existingModule) {
        const module = new Module(moduleData);
        await module.save();
        console.log(`✅ Modül oluşturuldu: ${moduleData.ad}`);
        createdCount++;
      } else {
        console.log(`⏭️ Modül mevcut: ${moduleData.ad}`);
        existingCount++;
      }
    }

    // Toplam sonuç
    const totalModules = await Module.countDocuments();
    const activeModules = await Module.countDocuments({ aktif: true });

    console.log('\n🎉 Standart modüller hazır!');
    console.log(`📊 Yeni oluşturulan: ${createdCount}`);
    console.log(`📁 Zaten mevcut: ${existingCount}`);
    console.log(`📊 Toplam modül: ${totalModules}`);
    console.log(`✅ Aktif modül: ${activeModules}`);

    console.log('\n🔗 Bonus Değerlendirme modülleri:');
    console.log(
      '✅ Bonus Değerlendirme Yönetimi: /bonus-evaluation-management',
    );
    console.log('✅ Bonus Değerlendirme: /bonus-evaluation');

    console.log('\n📄 Test URL\'leri:');
    console.log('- Rol Yönetimi: http://localhost:3000/roles');
    console.log(
      '- Bonus Yönetimi: http://localhost:3000/bonus-evaluation-management',
    );
    console.log(
      '- Bonus Değerlendirme: http://localhost:3000/bonus-evaluation',
    );
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Script'i çalıştır
createStandardModules();
