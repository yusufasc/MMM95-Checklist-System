const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const ChecklistTemplate = require('./models/ChecklistTemplate');

async function createTestTask() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    // Paketlemeci kullanıcısını bul
    const paketUser = await User.findOne({ kullaniciAdi: 'paket2' });
    if (!paketUser) {
      console.log('❌ paket2 kullanıcısı bulunamadı');
      process.exit(1);
    }

    console.log(`✅ Paket kullanıcısı bulundu: ${paketUser.ad} ${paketUser.soyad}`);

    // Checklist template bul
    const template = await ChecklistTemplate.findOne({ ad: { $exists: true } });
    if (!template) {
      console.log('❌ Checklist template bulunamadı');
      process.exit(1);
    }

    console.log(`✅ Template bulundu: ${template.ad}`);

    // Test görevi oluştur
    const testTask = new Task({
      kullanici: paketUser._id,
      checklist: template._id,
      durum: 'tamamlandi', // Tamamlanmış ama puanlanmamış
      periyot: 'gunluk', // Gerekli alan
      maddeler: template.maddeler.map(madde => ({
        baslik: madde.baslik,
        aciklama: madde.aciklama,
        soru: madde.soru || madde.baslik, // Gerekli alan
        tamamlandi: true,
        tamamlanmaTarihi: new Date(),
        puan: madde.maxPuan, // Tam puan ver
        maxPuan: madde.maxPuan,
        resimUrl: null,
        not: 'Test görevi',
      })),
      tamamlanmaTarihi: new Date(),
      olusturmaTarihi: new Date(),
      hedefTarih: new Date(),
      // toplamPuan alanını kasıtlı olarak boş bırak
    });

    const savedTask = await testTask.save();
    console.log(`✅ Test görevi oluşturuldu: ${savedTask._id}`);
    console.log(`   Kullanıcı: ${paketUser.ad} ${paketUser.soyad}`);
    console.log(`   Durum: ${savedTask.durum}`);
    console.log(`   Toplam Puan: ${savedTask.toplamPuan || 'YOK (kontrol bekliyor)'}`);
    console.log(`   Template: ${template.ad}`);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

createTestTask();
