const mongoose = require('mongoose');
const ChecklistTemplate = require('../../models/ChecklistTemplate');
const Task = require('../../models/Task');
const User = require('../../models/User');
const Role = require('../../models/Role');
require('dotenv').config();

const createTestTasks = async () => {
  try {
    console.log('🔧 Test görevleri oluşturma scripti başlatılıyor...');

    // MongoDB'ye bağlan
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );

    console.log('✅ MongoDB bağlantısı başarılı!');

    // Kullanıcıları ve checklist şablonlarını al
    const users = await User.find({}).populate('roller');
    const checklists = await ChecklistTemplate.find({}).populate('hedefRol');

    console.log(
      'Bulunan kullanıcılar:',
      users.map(
        u => `${u.kullaniciAdi} (${u.roller.map(r => r.ad).join(', ')})`,
      ),
    );
    console.log(
      'Bulunan checklist şablonları:',
      checklists.map(c => `${c.ad} (${c.hedefRol.ad})`),
    );

    // Ortacı kullanıcısını bul
    const ortaciUser = users.find(u => u.roller.some(r => r.ad === 'Ortacı'));
    const paketlemeciUser = users.find(u =>
      u.roller.some(r => r.ad === 'Paketlemeci'),
    );

    if (!ortaciUser) {
      console.log('❌ Ortacı kullanıcısı bulunamadı!');
      return;
    }

    // Ortacı için checklist şablonunu bul
    const ortaciChecklist = checklists.find(c => c.hedefRol.ad === 'Ortacı');

    if (!ortaciChecklist) {
      console.log('❌ Ortacı checklist şablonu bulunamadı!');
      return;
    }

    // Test görevleri oluştur
    const testTasks = [];

    // 1. Tamamlanmış görev
    const completedTask = new Task({
      kullanici: ortaciUser._id,
      checklist: ortaciChecklist._id,
      maddeler: ortaciChecklist.maddeler.map(madde => ({
        soru: madde.soru,
        cevap: true,
        puan: madde.puan,
        maxPuan: madde.puan,
        yorum: 'Test yorumu',
        resimUrl: '',
      })),
      durum: 'tamamlandi',
      periyot: 'gunluk',
      hedefTarih: new Date(),
      tamamlanmaTarihi: new Date(),
      toplamPuan: ortaciChecklist.maddeler.reduce((sum, m) => sum + m.puan, 0),
      otomatikOlusturuldu: false,
    });

    testTasks.push(completedTask);

    // 2. Bekleyen görev
    const pendingTask = new Task({
      kullanici: ortaciUser._id,
      checklist: ortaciChecklist._id,
      maddeler: ortaciChecklist.maddeler.map(madde => ({
        soru: madde.soru,
        cevap: false,
        puan: 0,
        maxPuan: madde.puan,
        yorum: '',
        resimUrl: '',
      })),
      durum: 'bekliyor',
      periyot: 'gunluk',
      hedefTarih: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün sonra
      otomatikOlusturuldu: false,
    });

    testTasks.push(pendingTask);

    // Paketlemeci kullanıcısı varsa onun için de görev oluştur
    if (paketlemeciUser) {
      const paketlemeciTask = new Task({
        kullanici: paketlemeciUser._id,
        checklist: ortaciChecklist._id, // Ortacı checklist'ini kullan
        maddeler: ortaciChecklist.maddeler.map(madde => ({
          soru: madde.soru,
          cevap: true,
          puan: madde.puan,
          maxPuan: madde.puan,
          yorum: 'Paketlemeci test yorumu',
          resimUrl: '',
        })),
        durum: 'tamamlandi',
        periyot: 'gunluk',
        hedefTarih: new Date(),
        tamamlanmaTarihi: new Date(),
        toplamPuan: ortaciChecklist.maddeler.reduce(
          (sum, m) => sum + m.puan,
          0,
        ),
        otomatikOlusturuldu: false,
      });

      testTasks.push(paketlemeciTask);
    }

    // Görevleri kaydet
    const savedTasks = await Task.insertMany(testTasks);

    console.log(`✅ ${savedTasks.length} test görevi başarıyla oluşturuldu!`);
    savedTasks.forEach(task => {
      console.log(`📋 Görev: ${task.durum} - Kullanıcı: ${task.kullanici}`);
    });
  } catch (error) {
    console.error('❌ Test görevleri oluşturulurken hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Script'i çalıştır
createTestTasks();
