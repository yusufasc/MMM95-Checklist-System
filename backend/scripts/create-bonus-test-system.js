const mongoose = require('mongoose');
require('dotenv').config();
const BonusEvaluationTemplate = require('../models/BonusEvaluationTemplate');
const BonusEvaluation = require('../models/BonusEvaluation');
const Role = require('../models/Role');
const User = require('../models/User');

// Backend ile aynı database'i kullan
const DB_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';

console.log('MongoDB URI:', DB_URI);

mongoose
  .connect(DB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createBonusTestSystem() {
  try {
    console.log('🎯 Bonus Değerlendirme test sistemi oluşturuluyor...');

    // 1. Admin kullanıcısını bul
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin kullanıcısı bulunamadı.');
      return;
    }
    console.log('✅ Admin kullanıcısı bulundu:', adminUser.kullaniciAdi);

    // 2. Roller bul
    const ustaRole = await Role.findOne({ ad: 'Usta' });
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });

    if (!ustaRole || !ortaciRole || !paketlemeciRole) {
      console.log('❌ Gerekli roller bulunamadı.');
      console.log(
        'Usta:',
        ustaRole?.ad,
        'Ortacı:',
        ortaciRole?.ad,
        'Paketlemeci:',
        paketlemeciRole?.ad,
      );
      return;
    }

    console.log('✅ Roller bulundu:', {
      usta: ustaRole.ad,
      ortaci: ortaciRole.ad,
      paketlemeci: paketlemeciRole.ad,
    });

    // 3. Test şablonları oluştur
    console.log('📝 Bonus değerlendirme şablonları oluşturuluyor...');

    // Usta için şablon
    const ustaTemplate = await BonusEvaluationTemplate.findOneAndUpdate(
      { ad: 'Aylık Performans Bonusu - Usta' },
      {
        ad: 'Aylık Performans Bonusu - Usta',
        aciklama: 'Usta personeli için aylık performans değerlendirmesi',
        rol: ustaRole._id,
        bonusKategorisi: 'Performans Bonusu',
        bonusKatsayisi: 2.5,
        degerlendirmePeriyodu: 30, // 30 gün
        minBasariYuzdesi: 70,
        aktif: true,
        olusturanKullanici: adminUser._id,
        maddeler: [
          {
            siraNo: 1,
            baslik: 'İş Kalitesi',
            aciklama: 'Üretilen işin kalite standartlarına uygunluğu',
            maksimumPuan: 25,
            agirlik: 25,
          },
          {
            siraNo: 2,
            baslik: 'Zamanında Teslim',
            aciklama: 'Görevlerin belirlenen sürede tamamlanması',
            maksimumPuan: 20,
            agirlik: 20,
          },
          {
            siraNo: 3,
            baslik: 'Ekip Çalışması',
            aciklama: 'Takım arkadaşları ile koordinasyon ve işbirliği',
            maksimumPuan: 20,
            agirlik: 20,
          },
          {
            siraNo: 4,
            baslik: 'İnisiyatif Alma',
            aciklama: 'Problemleri çözme ve öneriler sunma',
            maksimumPuan: 15,
            agirlik: 15,
          },
          {
            siraNo: 5,
            baslik: 'İş Güvenliği',
            aciklama: 'İş güvenliği kurallarına uyum',
            maksimumPuan: 20,
            agirlik: 20,
          },
        ],
      },
      { upsert: true, new: true },
    );

    // Ortacı için şablon
    const ortaciTemplate = await BonusEvaluationTemplate.findOneAndUpdate(
      { ad: 'Haftalık Verimlilik Bonusu - Ortacı' },
      {
        ad: 'Haftalık Verimlilik Bonusu - Ortacı',
        aciklama: 'Ortacı personeli için haftalık verimlilik değerlendirmesi',
        rol: ortaciRole._id,
        bonusKategorisi: 'Verimlilik Bonusu',
        bonusKatsayisi: 1.8,
        degerlendirmePeriyodu: 7, // 7 gün
        minBasariYuzdesi: 80,
        aktif: true,
        olusturanKullanici: adminUser._id,
        maddeler: [
          {
            siraNo: 1,
            baslik: 'Üretim Hızı',
            aciklama: 'Birim zamanda üretilen miktar',
            maksimumPuan: 30,
            agirlik: 30,
          },
          {
            siraNo: 2,
            baslik: 'Hata Oranı',
            aciklama: 'Üretimde yapılan hata sayısı',
            maksimumPuan: 25,
            agirlik: 25,
          },
          {
            siraNo: 3,
            baslik: 'Makine Kullanımı',
            aciklama: 'Makine ve ekipmanları doğru kullanma',
            maksimumPuan: 25,
            agirlik: 25,
          },
          {
            siraNo: 4,
            baslik: 'Düzen ve Temizlik',
            aciklama: 'Çalışma alanının düzeni ve temizliği',
            maksimumPuan: 20,
            agirlik: 20,
          },
        ],
      },
      { upsert: true, new: true },
    );

    // Paketlemeci için şablon
    const paketlemeciTemplate = await BonusEvaluationTemplate.findOneAndUpdate(
      { ad: 'Günlük Performans Bonusu - Paketlemeci' },
      {
        ad: 'Günlük Performans Bonusu - Paketlemeci',
        aciklama:
          'Paketlemeci personeli için günlük performans değerlendirmesi',
        rol: paketlemeciRole._id,
        bonusKategorisi: 'Günlük Bonus',
        bonusKatsayisi: 1.2,
        degerlendirmePeriyodu: 1, // 1 gün
        minBasariYuzdesi: 85,
        aktif: true,
        olusturanKullanici: adminUser._id,
        maddeler: [
          {
            siraNo: 1,
            baslik: 'Paketleme Hızı',
            aciklama: 'Birim zamanda paketlenen ürün miktarı',
            maksimumPuan: 40,
            agirlik: 40,
          },
          {
            siraNo: 2,
            baslik: 'Paket Kalitesi',
            aciklama: 'Paketlerin düzgünlüğü ve kalitesi',
            maksimumPuan: 35,
            agirlik: 35,
          },
          {
            siraNo: 3,
            baslik: 'Etiketleme Doğruluğu',
            aciklama: 'Ürün etiketlerinin doğru yerleştirilmesi',
            maksimumPuan: 25,
            agirlik: 25,
          },
        ],
      },
      { upsert: true, new: true },
    );

    console.log('✅ Şablonlar oluşturuldu:', {
      ustaTemplate: ustaTemplate.ad,
      ortaciTemplate: ortaciTemplate.ad,
      paketlemeciTemplate: paketlemeciTemplate.ad,
    });

    // 4. Test kullanıcıları bul
    console.log('👥 Test kullanıcıları kontrol ediliyor...');

    const testUsers = await User.find({
      durum: 'aktif',
      roller: { $in: [ustaRole._id, ortaciRole._id, paketlemeciRole._id] },
    }).populate('roller', 'ad');

    console.log(`✅ ${testUsers.length} test kullanıcısı bulundu:`);
    testUsers.forEach(user => {
      console.log(
        `   - ${user.ad} ${user.soyad} (${user.roller.map(r => r.ad).join(', ')})`,
      );
    });

    // 5. Örnek değerlendirmeler oluştur (opsiyonel - sadece 1-2 örnek)
    console.log('📊 Örnek değerlendirmeler oluşturuluyor...');

    // Test için 1 örnek değerlendirme (daha önce yapılmış gibi)
    const sampleUser = testUsers.find(user =>
      user.roller.some(role => role.ad === 'Paketlemeci'),
    );

    if (sampleUser) {
      // 2 gün önce yapılmış bir değerlendirme
      const sampleEvaluation = await BonusEvaluation.findOneAndUpdate(
        {
          degerlendirilenKullanici: sampleUser._id,
          sablon: paketlemeciTemplate._id,
        },
        {
          sablon: paketlemeciTemplate._id,
          degerlendirilenKullanici: sampleUser._id,
          degerlendirenKullanici: adminUser._id,
          departman: sampleUser.departman,
          degerlendirmeDonemi: '2025-01',
          puanlamalar: [
            {
              maddeId: 'madde_0',
              maddeBaslik: 'Paketleme Hızı',
              puan: 35,
              maksimumPuan: 40,
            },
            {
              maddeId: 'madde_1',
              maddeBaslik: 'Paket Kalitesi',
              puan: 30,
              maksimumPuan: 35,
            },
            {
              maddeId: 'madde_2',
              maddeBaslik: 'Etiketleme Doğruluğu',
              puan: 23,
              maksimumPuan: 25,
            },
          ],
          toplamPuan: 88,
          maksimumPuan: 100,
          basariYuzdesi: 88,
          bonusOnayi: 'Onaylandı',
          notlar: 'Test için oluşturulmuş örnek değerlendirme',
          yoneticiYorumu: 'Performans başarılı',
          olusturmaTarihi: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
        },
        { upsert: true, new: true },
      );

      console.log('✅ Örnek değerlendirme oluşturuldu:', {
        user: `${sampleUser.ad} ${sampleUser.soyad}`,
        template: paketlemeciTemplate.ad,
        score: sampleEvaluation.basariYuzdesi + '%',
      });
    }

    console.log('\n🎉 Bonus Değerlendirme test sistemi başarıyla oluşturuldu!');
    console.log('\n📋 Test Planı:');
    console.log('1. Admin olarak giriş yapın (klarimin)');
    console.log(
      '2. http://localhost:3000/bonus-evaluation-management sayfasına gidin',
    );
    console.log('3. Oluşturulan şablonları kontrol edin');
    console.log('4. http://localhost:3000/bonus-evaluation sayfasına gidin');
    console.log('5. Şablon seçin ve personel değerlendirmesi yapın');
    console.log('6. Periyot kontrollerini test edin');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Hata:', error);
    mongoose.connection.close();
  }
}

createBonusTestSystem();
