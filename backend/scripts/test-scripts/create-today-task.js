const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const ChecklistTemplate = require('./models/ChecklistTemplate');

async function createTodayTask() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    // Paket1 kullanıcısını bul
    const paket1 = await User.findOne({ kullaniciAdi: 'paket1' });
    if (!paket1) {
      console.log('❌ paket1 kullanıcısı bulunamadı');
      process.exit(1);
    }

    console.log(`✅ Paket1 kullanıcısı: ${paket1.ad} ${paket1.soyad}`);

    // PAKET RÜTÜN template'ini bul
    const template = await ChecklistTemplate.findOne({ ad: 'PAKET RÜTÜN' });
    if (!template) {
      console.log('❌ PAKET RÜTÜN template bulunamadı');
      process.exit(1);
    }

    console.log(`✅ Template bulundu: ${template.ad} (Kategori: ${template.kategori})`);

    // Bugünkü tarih
    const today = new Date();

    // Bugün için test görevi oluştur
    const todayTask = new Task({
      kullanici: paket1._id,
      checklist: template._id,
      durum: 'tamamlandi', // Tamamlanmış olarak oluştur
      periyot: 'gunluk',
      maddeler: template.maddeler.map(madde => ({
        baslik: madde.baslik,
        aciklama: madde.aciklama,
        soru: madde.soru || madde.baslik,
        tamamlandi: true,
        tamamlanmaTarihi: today,
        puan: madde.maxPuan,
        maxPuan: madde.maxPuan,
        resimUrl: null,
        not: 'Bugünkü test görevi',
      })),
      tamamlanmaTarihi: today,
      olusturmaTarihi: today,
      hedefTarih: today,
      toplamPuan: 15, // Ortacı tarafından verilmiş puan
    });

    const savedTask = await todayTask.save();
    console.log(`✅ Bugünkü test görevi oluşturuldu: ${savedTask._id}`);
    console.log(`   Kullanıcı: ${paket1.ad} ${paket1.soyad}`);
    console.log(`   Durum: ${savedTask.durum}`);
    console.log(`   Toplam Puan: ${savedTask.toplamPuan}`);
    console.log(`   Template: ${template.ad} (${template.kategori})`);
    console.log(`   Tarih: ${savedTask.tamamlanmaTarihi}`);

    console.log('\n🎯 Bu görev bugünkü puanlara şu şekilde yansıyacak:');
    console.log(`   Checklist kategorisi: +${savedTask.toplamPuan} puan`);
    console.log('   Diğer kategoriler: Demo puanları (94, 81, 88, 92, 95)');

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

createTodayTask();
