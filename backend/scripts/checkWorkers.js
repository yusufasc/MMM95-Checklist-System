const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');

const checkWorkers = async () => {
  try {
    // MongoDB bağlantısı (local fallback)
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';
    await mongoose.connect(mongoUri);
    console.log('📊 Quality Control Workers Check');
    console.log('================================');

    // 4 saat öncesi
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    // Tüm aktif kullanıcıları getir
    const allUsers = await User.find({
      durum: 'aktif',
      $and: [{ 'roller.0': { $exists: true } }, { 'roller.0': { $ne: null } }],
    })
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .sort('ad');

    console.log(`👥 Toplam aktif kullanıcı: ${allUsers.length}`);
    console.log('\n--- TÜM KULLANICILAR ---');
    allUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.ad} ${user.soyad} (${user.kullaniciAdi}) - Rol: ${user.roller?.[0]?.ad || 'Rol Yok'}`,
      );
    });

    // Filtreleme yap
    const workers = allUsers.filter(user => {
      const roleName = user.roller?.[0]?.ad?.toLowerCase() || '';
      const shouldExclude =
        roleName.includes('kalite kontrol') ||
        roleName.includes('admin') ||
        roleName.includes('yönetici');
      return !shouldExclude;
    });

    console.log(`\n🎯 Filtreleme sonrası çalışan sayısı: ${workers.length}`);
    console.log('\n--- FİLTRELENMİŞ ÇALIŞANLAR ---');
    workers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.ad} ${worker.soyad} - Rol: ${worker.roller?.[0]?.ad}`);
    });

    // Son değerlendirmeleri kontrol et
    const recentEvaluations = await QualityControlEvaluation.find({
      degerlendirmeTarihi: { $gte: fourHoursAgo },
    })
      .populate('degerlendirilenKullanici', 'ad soyad')
      .sort('-degerlendirmeTarihi');

    console.log(`\n📊 Son 4 saat içinde değerlendirme sayısı: ${recentEvaluations.length}`);

    // Değerlendirilen kullanıcıları map'le
    const evaluatedUserIds = new Set();
    recentEvaluations.forEach(evaluation => {
      evaluatedUserIds.add(evaluation.degerlendirilenKullanici._id.toString());
      console.log(
        `📝 ${evaluation.degerlendirilenKullanici.ad} ${evaluation.degerlendirilenKullanici.soyad} - ${evaluation.degerlendirmeTarihi}`,
      );
    });

    // Puanlanabilir çalışanları belirle
    const scoreableWorkers = workers.filter(worker => {
      return !evaluatedUserIds.has(worker._id.toString());
    });

    console.log(`\n✅ Puanlanabilir çalışan sayısı: ${scoreableWorkers.length}`);
    console.log('\n--- PUANLANABİLİR ÇALIŞANLAR ---');
    scoreableWorkers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.ad} ${worker.soyad} - Rol: ${worker.roller?.[0]?.ad}`);
    });

    console.log(`\n❌ Puanlanamayacak çalışan sayısı: ${workers.length - scoreableWorkers.length}`);

    if (scoreableWorkers.length === 0) {
      console.log('\n🚨 SORUN TESPİT EDİLDİ:');
      console.log('   - Hiç puanlanabilir çalışan yok');
      console.log('   - Tüm çalışanlar son 4 saat içinde puanlanmış olabilir');
      console.log('   - Veya hiç çalışan bulunmuyor');
    }

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

checkWorkers();
