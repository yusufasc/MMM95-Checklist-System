const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const ChecklistTemplate = require('../models/ChecklistTemplate');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB bağlantısı başarılı');

    // Paketlemeci kullanıcısını bul
    const paketlemeciUser = await User.findOne({ kullaniciAdi: 'fatma.demir' });
    if (!paketlemeciUser) {
      console.log('❌ fatma.demir kullanıcısı bulunamadı');
      process.exit(1);
    }

    // Paketleme kontrol checklist'ini bul
    const checklist = await ChecklistTemplate.findOne({
      ad: 'Günlük Paketleme Kontrol',
    });
    if (!checklist) {
      console.log('❌ Günlük Paketleme Kontrol checklist\'i bulunamadı');
      process.exit(1);
    }

    console.log('✅ Kullanıcı ve checklist bulundu');

    // Bugün için mevcut görev var mı kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingTask = await Task.findOne({
      kullanici: paketlemeciUser._id,
      checklist: checklist._id,
      hedefTarih: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingTask) {
      console.log('⚠️  Bugün için zaten görev mevcut');
      console.log('   Görev ID:', existingTask._id);
      console.log('   Durum:', existingTask.durum);
      console.log(
        '   Hedef Tarih:',
        existingTask.hedefTarih.toLocaleDateString('tr-TR'),
      );
    } else {
      // Bugün için yeni görev oluştur
      const task = new Task({
        kullanici: paketlemeciUser._id,
        checklist: checklist._id,
        maddeler: checklist.maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        durum: 'bekliyor',
        periyot: 'gunluk',
        hedefTarih: today, // Bugün için
        otomatikOlusturuldu: true,
      });

      await task.save();
      console.log('✅ Bugün için yeni görev oluşturuldu');
      console.log('   Görev ID:', task._id);
      console.log('   Durum:', task.durum);
      console.log(
        '   Hedef Tarih:',
        task.hedefTarih.toLocaleDateString('tr-TR'),
      );
    }

    // Kullanıcının tüm görevlerini listele
    const allTasks = await Task.find({ kullanici: paketlemeciUser._id })
      .populate('checklist', 'ad')
      .sort({ olusturmaTarihi: -1 });

    console.log(
      `\n📊 ${paketlemeciUser.kullaniciAdi} kullanıcısının toplam ${allTasks.length} görevi:`,
    );
    allTasks.forEach((task, index) => {
      console.log(
        `   ${index + 1}. ${task.checklist.ad} - ${task.durum} (${task.hedefTarih.toLocaleDateString('tr-TR')})`,
      );
    });

    await mongoose.disconnect();
    console.log('\n✅ İşlem tamamlandı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
})();
