const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const ChecklistTemplate = require('./models/ChecklistTemplate');

async function recreateTodayTask() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    // Paket1 kullanıcısını bul
    const paket1 = await User.findOne({ kullaniciAdi: 'paket1' });
    console.log(`✅ Paket1: ${paket1.ad} ${paket1.soyad}`);

    // Bugünkü görevleri sil
    const today = new Date();
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    const deleteResult = await Task.deleteMany({
      kullanici: paket1._id,
      tamamlanmaTarihi: { $gte: dayStart, $lte: dayEnd },
    });
    console.log(`🗑️ ${deleteResult.deletedCount} bugünkü görev silindi`);

    // PAKET RÜTÜN template'ini bul
    const template = await ChecklistTemplate.findOne({ ad: 'PAKET RÜTÜN' });
    console.log(`✅ Template: ${template.ad} (Kategori: ${template.kategori})`);

    // Yeni görev oluştur
    const newTask = new Task({
      kullanici: paket1._id,
      checklist: template._id,
      durum: 'tamamlandi',
      periyot: 'gunluk',
      maddeler: template.maddeler.map(madde => ({
        baslik: madde.baslik,
        aciklama: madde.aciklama,
        soru: madde.soru || madde.baslik,
        tamamlandi: true,
        tamamlanmaTarihi: new Date(),
        puan: madde.maxPuan,
        maxPuan: madde.maxPuan,
        resimUrl: null,
        not: 'Yeniden oluşturulan test görevi',
      })),
      tamamlanmaTarihi: new Date(),
      olusturmaTarihi: new Date(),
      hedefTarih: new Date(),
      toplamPuan: 18, // Daha yüksek puan
    });

    const savedTask = await newTask.save();
    console.log(`✅ Yeni görev oluşturuldu: ${savedTask._id}`);
    console.log(`   Toplam Puan: ${savedTask.toplamPuan}`);

    // Kontrol et
    const checkTask = await Task.findById(savedTask._id).populate('checklist');
    console.log('\n🔍 KONTROL:');
    console.log(`   Task ID: ${checkTask._id}`);
    console.log(`   Checklist: ${checkTask.checklist?.ad || 'YOK'}`);
    console.log(`   Kategori: ${checkTask.checklist?.kategori || 'YOK'}`);
    console.log(`   Puan: ${checkTask.toplamPuan}`);
    console.log(`   Tarih: ${checkTask.tamamlanmaTarihi}`);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

recreateTodayTask();
