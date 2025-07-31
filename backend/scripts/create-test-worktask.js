const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const WorkTask = require('../models/WorkTask');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const InventoryItem = require('../models/InventoryItem');

async function createTestWorkTask() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('✅ MongoDB bağlantısı başarılı');

    // 1. Usta kullanıcısını bul
    const ustaRole = await Role.findOne({ ad: 'Usta' });
    const ustaUser = await User.findOne({
      roller: ustaRole._id,
      aktif: true,
    });

    if (!ustaUser) {
      console.log('❌ Usta kullanıcısı bulunamadı');
      return;
    }

    console.log(`🔧 Usta kullanıcısı bulundu: ${ustaUser.kullaniciAdi}`);

    // 2. İşe bağlı checklist template bul veya oluştur
    let checklistTemplate = await ChecklistTemplate.findOne({
      tur: 'iseBagli',
      aktif: true,
    });

    if (!checklistTemplate) {
      console.log('📋 İşe bağlı checklist template oluşturuluyor...');

      checklistTemplate = new ChecklistTemplate({
        ad: 'Kalıp Değişim Checklist',
        aciklama: 'Kalıp değişim süreci için test checklist',
        tur: 'iseBagli',
        periyot: 'olayBazli',
        hedefRol: [ustaRole._id],
        aktif: true,
        maddeler: [
          {
            baslik: 'Makina durduruldu',
            aciklama: 'Makina güvenli şekilde durduruldu',
            zorunlu: true,
            fotografGereklimi: false,
          },
          {
            baslik: 'Eski kalıp çıkarıldı',
            aciklama: 'Eski kalıp güvenli şekilde çıkarıldı',
            zorunlu: true,
            fotografGereklimi: true,
          },
          {
            baslik: 'Yeni kalıp takıldı',
            aciklama: 'Yeni kalıp doğru şekilde takıldı',
            zorunlu: true,
            fotografGereklimi: true,
          },
          {
            baslik: 'Test üretim yapıldı',
            aciklama: 'Test üretim başarılı şekilde yapıldı',
            zorunlu: true,
            fotografGereklimi: false,
          },
        ],
      });

      await checklistTemplate.save();
      console.log('✅ Checklist template oluşturuldu');
    } else {
      console.log('✅ Checklist template bulundu');
    }

    // 3. Makina bul veya oluştur
    let makina = await InventoryItem.findOne({
      kategori: { $regex: /makina/i },
    });

    if (!makina) {
      console.log('🔧 Test makina oluşturuluyor...');

      makina = new InventoryItem({
        envanterKodu: 'TEST-MAKINA-001',
        ad: 'Test Makina',
        kategori: 'Makina',
        durum: 'Aktif',
        lokasyon: 'Üretim Hattı 1',
      });

      await makina.save();
      console.log('✅ Test makina oluşturuldu');
    } else {
      console.log('✅ Makina bulundu');
    }

    // 4. Test WorkTask oluştur
    const testWorkTask = new WorkTask({
      kullanici: ustaUser._id,
      checklist: checklistTemplate._id,
      makina: makina._id,
      durum: 'tamamlandi',
      indirilenKalip: 'KALIP-001',
      baglananHamade: 'HAMMADDE-001',
      makinaDurmaSaati: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
      yeniKalipAktifSaati: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 saat önce
      bakimaGitsinMi: false,
      tamamlanmaTarihi: new Date(Date.now() - 30 * 60 * 1000), // 30 dakika önce
      maddeler: checklistTemplate.maddeler.map((madde, index) => ({
        maddeId: madde._id,
        tamamlandi: true,
        tamamlanmaTarihi: new Date(Date.now() - (30 - index * 5) * 60 * 1000),
        notlar: `Test notu ${index + 1}`,
      })),
    });

    await testWorkTask.save();
    console.log('✅ Test WorkTask oluşturuldu');

    // 5. Kontrol
    const recentWorkTasks = await WorkTask.find({
      durum: 'tamamlandi',
    })
      .populate('kullanici', 'kullaniciAdi ad soyad')
      .populate('checklist', 'ad')
      .populate('makina', 'envanterKodu ad')
      .sort({ tamamlanmaTarihi: -1 })
      .limit(5);

    console.log(`\n📋 ${recentWorkTasks.length} tamamlanmış WorkTask bulundu:`);
    recentWorkTasks.forEach((task, index) => {
      console.log(
        `${index + 1}. ${task.kullanici?.kullaniciAdi} - ${task.checklist?.ad}`,
      );
      console.log(
        `   Makina: ${task.makina?.envanterKodu} | Durum: ${task.durum}`,
      );
      console.log(
        `   Tamamlanma: ${task.tamamlanmaTarihi?.toLocaleString('tr-TR')}`,
      );
    });

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
  }
}

createTestWorkTask();
