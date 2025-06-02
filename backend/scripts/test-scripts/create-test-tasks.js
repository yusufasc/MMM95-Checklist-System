const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Department = require('./models/Department');
const ChecklistTemplate = require('./models/ChecklistTemplate');
const Task = require('./models/Task');

async function createTestTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm');

    console.log('📋 Test görevleri oluşturuluyor...');

    // Kullanıcıları al
    const users = await User.find({}).populate('roller');
    const ustaUser = users.find(u => u.roller.some(r => r.ad === 'Usta'));
    const paketlemeciUser = users.find(u => u.roller.some(r => r.ad === 'Paketlemeci'));

    if (!ustaUser || !paketlemeciUser) {
      console.log('❌ Usta veya Paketlemeci kullanıcısı bulunamadı!');
      return;
    }

    console.log(`👤 Usta: ${ustaUser.ad} ${ustaUser.soyad} (${ustaUser.kullaniciAdi})`);
    console.log(
      `👤 Paketlemeci: ${paketlemeciUser.ad} ${paketlemeciUser.soyad} (${paketlemeciUser.kullaniciAdi})`,
    );

    // Roller ve Departman al
    const ustaRole = await Role.findOne({ ad: 'Usta' });
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    const department = await Department.findOne({ ad: 'Üretim' });

    // Checklist şablonları oluştur
    await ChecklistTemplate.deleteMany({});

    const checklistTemplates = [
      {
        ad: 'Günlük Usta Kontrol',
        tur: 'rutin',
        hedefRol: ustaRole._id,
        hedefDepartman: department._id,
        maddeler: [
          { soru: 'Makine genel durumu kontrol edildi mi?', puan: 15 },
          { soru: 'Ortacı ekibi bilgilendirildi mi?', puan: 10 },
          { soru: 'Günlük üretim planı kontrol edildi mi?', puan: 10 },
          { soru: 'Kalite standartları kontrol edildi mi?', puan: 15 },
        ],
        periyot: 'gunluk',
      },
      {
        ad: 'Paketleme Kontrol',
        tur: 'rutin',
        hedefRol: paketlemeciRole._id,
        hedefDepartman: department._id,
        maddeler: [
          { soru: 'Paketleme malzemeleri hazır mı?', puan: 10 },
          { soru: 'Etiketleme doğru yapıldı mı?', puan: 15 },
          { soru: 'Kalite kontrol yapıldı mı?', puan: 20 },
        ],
        periyot: 'gunluk',
      },
    ];

    const savedTemplates = await ChecklistTemplate.insertMany(checklistTemplates);
    console.log(`✅ ${savedTemplates.length} checklist şablonu oluşturuldu`);

    // Görevleri temizle
    await Task.deleteMany({});

    // Usta için görevler
    const ustaTasks = [
      {
        kullanici: ustaUser._id,
        checklist: savedTemplates[0]._id, // Günlük Usta Kontrol
        maddeler: savedTemplates[0].maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        ustRol: null,
        ustDepartman: department._id,
        durum: 'bekliyor',
        periyot: 'gunluk',
        hedefTarih: new Date(Date.now() + 24 * 60 * 60 * 1000), // Yarın
        otomatikOlusturuldu: false,
      },
      {
        kullanici: ustaUser._id,
        checklist: savedTemplates[0]._id,
        maddeler: savedTemplates[0].maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        ustRol: null,
        ustDepartman: department._id,
        durum: 'bekliyor',
        periyot: 'gunluk',
        hedefTarih: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
        otomatikOlusturuldu: false,
      },
    ];

    // Paketlemeci için görevler
    const paketlemeciTasks = [
      {
        kullanici: paketlemeciUser._id,
        checklist: savedTemplates[1]._id, // Paketleme Kontrol
        maddeler: savedTemplates[1].maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        ustRol: null,
        ustDepartman: department._id,
        durum: 'bekliyor',
        periyot: 'gunluk',
        hedefTarih: new Date(Date.now() + 24 * 60 * 60 * 1000),
        otomatikOlusturuldu: false,
      },
      {
        kullanici: paketlemeciUser._id,
        checklist: savedTemplates[1]._id,
        maddeler: savedTemplates[1].maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        ustRol: null,
        ustDepartman: department._id,
        durum: 'bekliyor',
        periyot: 'gunluk',
        hedefTarih: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        otomatikOlusturuldu: false,
      },
    ];

    const allTasks = [...ustaTasks, ...paketlemeciTasks];
    const savedTasks = await Task.insertMany(allTasks);

    console.log('✅ Test görevleri başarıyla oluşturuldu:');
    console.log(`  - Usta için: ${ustaTasks.length} görev`);
    console.log(`  - Paketlemeci için: ${paketlemeciTasks.length} görev`);
    console.log(`  - Toplam: ${savedTasks.length} görev`);

    console.log('\n📋 Görev detayları:');
    savedTasks.forEach((task, index) => {
      console.log(
        `  ${index + 1}. ${task.checklist ? 'Checklist görev' : 'Test görev'} - Durum: ${task.durum}`,
      );
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 MongoDB bağlantısı kapatıldı.');
  }
}

createTestTasks();
