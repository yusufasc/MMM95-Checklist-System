const mongoose = require('mongoose');
require('dotenv').config();
const BonusEvaluationTemplate = require('../models/BonusEvaluationTemplate');
const Role = require('../models/Role');
const User = require('../models/User');

const DB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist';

console.log('MongoDB URI:', DB_URI);

mongoose
  .connect(DB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createBonusTestData() {
  try {
    console.log('🎯 Bonus Değerlendirme test verileri oluşturuluyor...');

    // 1. Admin kullanıcısını bul
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' });
    if (!adminUser) {
      console.log(
        '❌ Admin kullanıcısı bulunamadı. Önce admin kullanıcısı oluşturun.',
      );
      return;
    }

    // 2. Roller ve kullanıcıları bul
    const ustaRole = await Role.findOne({ ad: 'Usta' });
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });

    console.log('✅ Roller bulundu:', {
      usta: ustaRole?._id,
      ortaci: ortaciRole?._id,
      paketlemeci: paketlemeciRole?._id,
    });

    // Eğer roller yoksa, ilk rolü oluştur
    let defaultRole = ustaRole || ortaciRole || paketlemeciRole;
    if (!defaultRole) {
      console.log('⚠️ Hiçbir rol bulunamadı, varsayılan rol oluşturuluyor...');
      defaultRole = new Role({
        ad: 'Test Rolü',
        moduller: [],
      });
      await defaultRole.save();
      console.log('✅ Test rolü oluşturuldu:', defaultRole._id);
    }

    // 3. Bonus değerlendirme şablonları oluştur
    const templates = [
      {
        ad: 'Genel Performans Bonusu - Test',
        aciklama: 'Genel performans değerlendirmesi için test şablonu',
        rol: defaultRole._id,
        bonusKategorisi: 'Performans',
        bonusCarpani: 1.5,
        degerlendirmePeriyodu: 'Aylık',
        minimumPuan: 70,
        aktif: true,
        olusturanKullanici: adminUser._id,
        maddeler: [
          {
            baslik: 'İş Kalitesi',
            aciklama: 'Yapılan işlerin kalite standartlarına uygunluğu',
            maksimumPuan: 10,
            siraNo: 1,
            zorunlu: true,
          },
          {
            baslik: 'Verimlilik',
            aciklama: 'Belirlenen sürelerde işleri tamamlama oranı',
            maksimumPuan: 10,
            siraNo: 2,
            zorunlu: true,
          },
          {
            baslik: 'Takım Çalışması',
            aciklama: 'Ekip içi işbirliği ve iletişim',
            maksimumPuan: 10,
            siraNo: 3,
            zorunlu: true,
          },
          {
            baslik: 'İnovasyon',
            aciklama: 'Yenilikçi çözümler önerme ve uygulama',
            maksimumPuan: 10,
            siraNo: 4,
            zorunlu: false,
          },
        ],
      },
      {
        ad: 'Liderlik Bonusu - Test',
        aciklama: 'Liderlik becerileri için test değerlendirmesi',
        rol: defaultRole._id,
        bonusKategorisi: 'Liderlik',
        bonusCarpani: 2.0,
        degerlendirmePeriyodu: 'Üç Aylık',
        minimumPuan: 80,
        aktif: true,
        olusturanKullanici: adminUser._id,
        maddeler: [
          {
            baslik: 'Ekip Yönetimi',
            aciklama: 'Ekibi yönlendirme ve motive etme becerisi',
            maksimumPuan: 15,
            siraNo: 1,
            zorunlu: true,
          },
          {
            baslik: 'Karar Verme',
            aciklama: 'Etkili ve hızlı karar verme yeteneği',
            maksimumPuan: 15,
            siraNo: 2,
            zorunlu: true,
          },
          {
            baslik: 'İletişim',
            aciklama: 'Açık ve etkili iletişim kurma',
            maksimumPuan: 10,
            siraNo: 3,
            zorunlu: true,
          },
        ],
      },
    ];

    // 4. Şablonları veritabanına kaydet
    console.log('\n📋 Bonus değerlendirme şablonları oluşturuluyor...');
    for (const templateData of templates) {
      const existingTemplate = await BonusEvaluationTemplate.findOne({
        ad: templateData.ad,
      });

      if (!existingTemplate) {
        const template = new BonusEvaluationTemplate(templateData);
        await template.save();
        console.log(`✅ Şablon oluşturuldu: ${templateData.ad}`);
      } else {
        console.log(`⏭️ Şablon mevcut: ${templateData.ad}`);
      }
    }

    // 5. Test sonuçları
    const totalTemplates = await BonusEvaluationTemplate.countDocuments();
    const activeTemplates = await BonusEvaluationTemplate.countDocuments({
      aktif: true,
    });

    console.log('\n🎉 Bonus Değerlendirme test verileri hazır!');
    console.log(`📊 Toplam şablon: ${totalTemplates}`);
    console.log(`✅ Aktif şablon: ${activeTemplates}`);
    console.log('\n📄 Test kullanıcıları:');
    console.log('- Admin kullanıcısı: admin / admin123');
    console.log('- VARDİYA AMİRİ: mehmet.kaya / 123456');
    console.log('\n🔗 Test sayfaları:');
    console.log('- Admin: http://localhost:3000/bonus-evaluation-management');
    console.log('- Değerlendirme: http://localhost:3000/bonus-evaluation');
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Script'i çalıştır
createBonusTestData();
