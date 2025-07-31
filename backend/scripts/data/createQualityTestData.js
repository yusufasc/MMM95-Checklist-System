const mongoose = require('mongoose');
const QualityControlTemplate = require('../../models/QualityControlTemplate');
const QualityControlEvaluation = require('../../models/QualityControlEvaluation');
const User = require('../../models/User');
const Role = require('../../models/Role');

const createQualityTestData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist',
    );
    console.log('✅ MongoDB bağlantısı başarılı');

    // Kalite Kontrol rolünü bul
    const kaliteKontrolRole = await Role.findOne({ ad: 'Kalite Kontrol' });
    if (!kaliteKontrolRole) {
      console.log('❌ Kalite Kontrol rolü bulunamadı');
      return;
    }

    // Test kullanıcıları bul
    const users = await User.find().limit(5);
    if (users.length === 0) {
      console.log('❌ Test için kullanıcı bulunamadı');
      return;
    }

    console.log(`📋 ${users.length} kullanıcı bulundu`);

    // 1. Test şablonu oluştur
    const existingTemplate = await QualityControlTemplate.findOne({
      ad: 'Test Kalite Şablonu',
    });
    let testTemplate;

    if (!existingTemplate) {
      testTemplate = new QualityControlTemplate({
        ad: 'Test Kalite Şablonu',
        rol: kaliteKontrolRole._id,
        maddeler: [
          {
            baslik: 'Ürün Kalitesi',
            aciklama: 'Ürünün genel kalite durumu',
            maksimumPuan: 20,
            zorunlu: true,
            siraNo: 1,
          },
          {
            baslik: 'Temizlik',
            aciklama: 'Çalışma alanının temizlik durumu',
            maksimumPuan: 15,
            zorunlu: true,
            siraNo: 2,
          },
          {
            baslik: 'Güvenlik',
            aciklama: 'Güvenlik kurallarına uyum',
            maksimumPuan: 25,
            zorunlu: true,
            siraNo: 3,
          },
        ],
        aktif: true,
        degerlendirmeSaatleri: [
          { saat: '08:00', aciklama: 'Sabah Kontrolü' },
          { saat: '14:00', aciklama: 'Öğle Kontrolü' },
        ],
        degerlendirmePeriyodu: 2,
        degerlendirmeGunleri: [
          'Pazartesi',
          'Salı',
          'Çarşamba',
          'Perşembe',
          'Cuma',
        ],
        degerlendirmeSikligi: 'Günlük',
        olusturanKullanici: users[0]._id,
      });

      await testTemplate.save();
      console.log('✅ Test şablonu oluşturuldu');
    } else {
      testTemplate = existingTemplate;
      console.log('✅ Mevcut test şablonu kullanılıyor');
    }

    // 2. Test değerlendirmeleri oluştur (son 30 gün)
    const existingEvaluations = await QualityControlEvaluation.countDocuments();
    console.log(`📊 Mevcut değerlendirme sayısı: ${existingEvaluations}`);

    if (existingEvaluations < 20) {
      console.log('📝 Test değerlendirmeleri oluşturuluyor...');

      const evaluations = [];
      const today = new Date();

      // Son 30 gün için rastgele değerlendirmeler
      for (let i = 0; i < 30; i++) {
        const evaluationDate = new Date(today);
        evaluationDate.setDate(today.getDate() - i);

        // Her gün 1-3 değerlendirme
        const dailyEvaluations = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < dailyEvaluations; j++) {
          const degerlendirilen =
            users[Math.floor(Math.random() * users.length)];
          const degerlendiren = users[Math.floor(Math.random() * users.length)];

          // Rastgele puanlar (60-100 arası)
          const puanlamalar = testTemplate.maddeler.map(madde => ({
            maddeId: madde._id.toString(),
            maddeBaslik: madde.baslik,
            puan: Math.floor(Math.random() * 40) + 60, // 60-100 arası
            maksimumPuan: madde.maksimumPuan,
            aciklama: `${madde.baslik} değerlendirmesi`,
          }));

          const evaluation = new QualityControlEvaluation({
            degerlendirilenKullanici: degerlendirilen._id,
            degerlendirenKullanici: degerlendiren._id,
            sablon: testTemplate._id,
            vardiya: ['Sabah', 'Öğle', 'Akşam'][Math.floor(Math.random() * 3)],
            degerlendirmeTarihi: evaluationDate,
            puanlamalar,
            durum: 'Tamamlandı',
            notlar: 'Test değerlendirmesi',
          });

          evaluations.push(evaluation);
        }
      }

      await QualityControlEvaluation.insertMany(evaluations);
      console.log(`✅ ${evaluations.length} test değerlendirmesi oluşturuldu`);
    }

    // 3. Dashboard verilerini test et
    console.log('\n📊 Dashboard Verileri Test Ediliyor...');

    // Aktif şablonlar
    const activeTemplates = await QualityControlTemplate.countDocuments({
      aktif: true,
    });
    console.log(`📋 Aktif şablonlar: ${activeTemplates}`);

    // Bu ay yapılan değerlendirmeler
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyEvaluations = await QualityControlEvaluation.countDocuments({
      createdAt: { $gte: thisMonth },
    });
    console.log(`📅 Bu ay değerlendirmeler: ${monthlyEvaluations}`);

    // Bugün yapılan değerlendirmeler
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvaluations = await QualityControlEvaluation.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });
    console.log(`📅 Bugün değerlendirmeler: ${todayEvaluations}`);

    // Ortalama puan
    const avgScoreResult = await QualityControlEvaluation.aggregate([
      { $match: { createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, avgScore: { $avg: '$toplamPuan' } } },
    ]);

    const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;
    console.log(`⭐ Ortalama puan: ${avgScore.toFixed(1)}`);

    // Son değerlendirmeler
    const recentEvaluations = await QualityControlEvaluation.find()
      .populate('degerlendirilenKullanici', 'ad soyad')
      .populate('degerlendirenKullanici', 'ad soyad')
      .populate('sablon', 'ad')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`📋 Son ${recentEvaluations.length} değerlendirme:`);
    recentEvaluations.forEach((evaluation, index) => {
      console.log(
        `  ${index + 1}. ${evaluation.degerlendirilenKullanici?.ad} ${evaluation.degerlendirilenKullanici?.soyad} - ${evaluation.toplamPuan} puan`,
      );
    });

    await mongoose.connection.close();
    console.log(
      '\n🎯 Test verileri hazır! Kalite Kontrol Dashboard test edilebilir.',
    );
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

createQualityTestData();
