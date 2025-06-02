const mongoose = require('mongoose');
const HRTemplate = require('../models/HRTemplate');
const User = require('../models/User');

// MongoDB bağlantısı
mongoose.connect('mongodb://127.0.0.1:27017/mmm-checklist', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestHRTemplate() {
  try {
    console.log('🔧 Test İK şablonu oluşturuluyor...');

    // Admin kullanıcısını bul
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' });
    if (!adminUser) {
      console.error('❌ Admin kullanıcısı bulunamadı');
      return;
    }

    // Mevcut şablonu kontrol et
    const existingTemplate = await HRTemplate.findOne({ ad: 'Genel Personel Değerlendirme' });
    if (existingTemplate) {
      console.log('✅ Test şablonu zaten mevcut');
      console.log('Şablon ID:', existingTemplate._id);
      console.log('Maddeler:', existingTemplate.maddeler.length);
      return;
    }

    // Yeni şablon oluştur
    const template = new HRTemplate({
      ad: 'Genel Personel Değerlendirme',
      aciklama: 'Personel performans değerlendirmesi için genel şablon',
      maddeler: [
        {
          baslik: 'İş Kalitesi',
          aciklama: 'Yapılan işin kalitesi ve doğruluğu',
          puan: 10,
          periyot: 'aylik',
          aktif: true,
          siraNo: 1,
        },
        {
          baslik: 'Zamanında Teslim',
          aciklama: 'Görevlerin zamanında tamamlanması',
          puan: 8,
          periyot: 'aylik',
          aktif: true,
          siraNo: 2,
        },
        {
          baslik: 'Takım Çalışması',
          aciklama: 'Ekip ile uyumlu çalışma',
          puan: 5,
          periyot: 'aylik',
          aktif: true,
          siraNo: 3,
        },
        {
          baslik: 'İletişim Becerisi',
          aciklama: 'Etkili iletişim kurma',
          puan: 5,
          periyot: 'aylik',
          aktif: true,
          siraNo: 4,
        },
        {
          baslik: 'Geç Kalma',
          aciklama: 'İşe geç kalma durumu',
          puan: -3,
          periyot: 'gunluk',
          aktif: true,
          siraNo: 5,
        },
        {
          baslik: 'Kural İhlali',
          aciklama: 'Şirket kurallarına uymama',
          puan: -10,
          periyot: 'aylik',
          aktif: true,
          siraNo: 6,
        },
      ],
      aktif: true,
      olusturanKullanici: adminUser._id,
    });

    await template.save();
    console.log('✅ Test İK şablonu oluşturuldu');
    console.log('Şablon ID:', template._id);
    console.log('Maddeler:', template.maddeler.length);

    // Madde ID'lerini göster
    template.maddeler.forEach((madde, index) => {
      console.log(`Madde ${index + 1}: ${madde.baslik} (ID: ${madde._id})`);
    });
  } catch (error) {
    console.error('❌ Test şablonu oluşturma hatası:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestHRTemplate();
