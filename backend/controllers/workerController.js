const QualityControlTemplate = require('../models/QualityControlTemplate');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const User = require('../models/User');
// const Task = require('../models/Task'); // Şimdilik kullanılmıyor
const { getDateRanges } = require('../utils/qualityControlHelpers');

/**
 * Belirli bir şablonun rolüne göre aktif çalışanları listele
 * Complex business logic ile 4 saatlik değerlendirme kuralı
 */
const getActiveWorkersByTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    // Şablonu getir
    const template = await QualityControlTemplate.findById(templateId).populate(
      'rol',
      'ad',
    );
    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    // Tarih aralıklarını hesapla
    const { todayStart, fourHoursAgo } = getDateRanges();

    console.log('🔍 DEBUG - Active Workers for Template:', template.ad);
    console.log(
      '🎯 Target Role:',
      template.rol.ad,
      '(ID:',
      template.rol._id,
      ')',
    );
    console.log('📅 Today start:', todayStart);
    console.log('⏰ Four hours ago:', fourHoursAgo);

    // Önce bu role sahip tüm kullanıcıları kontrol et
    const allUsersWithRole = await User.find({
      roller: template.rol._id,
    }).select('ad soyad durum roller');

    console.log(
      `🔍 ${template.rol.ad} rolüne sahip tüm kullanıcılar:`,
      allUsersWithRole.map(u => `${u.ad} ${u.soyad} (${u.durum})`),
    );

    // Sadece şablonun atandığı roldeki aktif kullanıcıları getir
    const workers = await User.find({
      durum: 'aktif',
      roller: template.rol._id, // Sadece bu role sahip kullanıcılar
    })
      .populate('roller', 'ad')
      .select('ad soyad kullaniciAdi roller') // Sadece gerekli alanları seç
      .sort('ad soyad');

    console.log(
      `👥 ${template.rol.ad} rolündeki aktif kullanıcı sayısı: ${workers.length}`,
    );

    // Makina eşlemelerini al (şimdilik kullanılmıyor, ileride gerekli olabilir)
    // const machineMap = await getMachineMapping(todayStart);

    // Son değerlendirmeleri al ve map'le
    const evaluationMap = await getRecentEvaluations(fourHoursAgo);

    // Workers array'ini evaluation bilgileri ile zenginleştir
    const workersWithEvaluations = workers.map(worker => {
      const userId = worker._id.toString();
      const evaluationData = evaluationMap.get(userId);

      let puanlanabilir = true;
      let puanlanamaSebebi = '';

      if (evaluationData) {
        const timeDiff = new Date() - new Date(evaluationData.sonDegerlendirme);
        const hoursDiff = timeDiff / (60 * 60 * 1000);

        if (hoursDiff <= 4) {
          puanlanabilir = false;
          puanlanamaSebebi = `Son değerlendirmeden ${hoursDiff.toFixed(1)} saat geçti (4 saat gerekli)`;
        }
      }

      console.log(
        `👤 ${worker.ad} ${worker.soyad}: ${puanlanabilir ? 'Puanlanabilir' : `Puanlanamaz - ${puanlanamaSebebi}`}`,
      );

      return {
        _id: worker._id,
        ad: worker.ad,
        soyad: worker.soyad,
        puanlanabilir,
        sonDegerlendirme: evaluationData?.sonDegerlendirme || null,
        basariYuzdesi: evaluationData?.basariYuzdesi || null,
        toplamPuan: evaluationData?.toplamPuan || null,
        maksimumPuan: evaluationData?.maksimumPuan || null,
        degerlendirmeSayisi: evaluationData?.degerlendirmeSayisi || 0,
        puanlanamaSebebi: puanlanamaSebebi || null,
      };
    });

    // Ad soyada göre sırala
    const sortedWorkers = workersWithEvaluations.sort((a, b) => {
      return `${a.ad} ${a.soyad}`.localeCompare(`${b.ad} ${b.soyad}`);
    });

    const puanlanabilirSayisi = sortedWorkers.filter(
      w => w.puanlanabilir,
    ).length;
    const puanlanamayacakSayisi = sortedWorkers.filter(
      w => !w.puanlanabilir,
    ).length;

    console.log('📋 ÖZET:');
    console.log(
      `   - ${template.rol.ad} rolündeki toplam çalışan: ${sortedWorkers.length}`,
    );
    console.log(`   - Puanlanabilir: ${puanlanabilirSayisi}`);
    console.log(`   - Puanlanamayacak: ${puanlanamayacakSayisi}`);

    res.json(sortedWorkers);
  } catch (error) {
    console.error('❌ Active workers endpoint hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Bugün makina seçimi yapmış kullanıcıları bul ve map'le
 * (Şimdilik kullanılmıyor, ileride gerekli olabilir)
 */
/*
const getMachineMapping = async (todayStart) => {
  const activeTasks = await Task.find({
    createdAt: { $gte: todayStart },
    makina: { $exists: true, $ne: null },
    durum: { $in: ['beklemede', 'yapiliyor', 'tamamlandi'] },
  })
    .populate('atananKullanici', '_id')
    .populate('makina', 'kod ad');

  console.log(
    `📋 Bugün makina seçimi yapmış görev sayısı: ${activeTasks.length}`,
  );

  const machineMap = new Map();
  activeTasks.forEach((task) => {
    if (task.atananKullanici && task.makina) {
      machineMap.set(task.atananKullanici._id.toString(), task.makina);
      console.log(
        `🏭 Makina eşlemesi: ${task.atananKullanici._id} -> ${task.makina.kod}`,
      );
    }
  });

  return machineMap;
};
*/

/**
 * Son 4 saat içinde değerlendirmeleri al ve map'le
 */
const getRecentEvaluations = async fourHoursAgo => {
  const recentEvaluations = await QualityControlEvaluation.find({
    degerlendirmeTarihi: { $gte: fourHoursAgo },
  })
    .populate('degerlendirilenKullanici', 'ad soyad')
    .sort('-degerlendirmeTarihi');

  console.log(
    `📊 Son 4 saat içinde değerlendirme sayısı: ${recentEvaluations.length}`,
  );

  const evaluationMap = new Map();
  recentEvaluations.forEach(evaluation => {
    const userId = evaluation.degerlendirilenKullanici._id.toString();
    const userName = `${evaluation.degerlendirilenKullanici.ad} ${evaluation.degerlendirilenKullanici.soyad}`;

    if (!evaluationMap.has(userId)) {
      evaluationMap.set(userId, {
        sonDegerlendirme: evaluation.degerlendirmeTarihi,
        basariYuzdesi: evaluation.basariYuzdesi,
        toplamPuan: evaluation.toplamPuan,
        maksimumPuan: evaluation.maksimumPuan,
        degerlendirmeSayisi: 1,
      });
      console.log(
        `📝 Son değerlendirme: ${userName} - ${evaluation.degerlendirmeTarihi}`,
      );
    } else {
      // Aynı kullanıcının bugünkü değerlendirme sayısını artır
      evaluationMap.get(userId).degerlendirmeSayisi++;
      console.log(
        `📝 Ek değerlendirme: ${userName} - Toplam: ${evaluationMap.get(userId).degerlendirmeSayisi}`,
      );
    }
  });

  return evaluationMap;
};

module.exports = {
  getActiveWorkersByTemplate,
};
