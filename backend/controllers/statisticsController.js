const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const { buildDateFilter } = require('../utils/qualityControlHelpers');

/**
 * Kalite kontrol istatistiklerini getir
 * Complex MongoDB aggregations ile
 */
const getStatistics = async (req, res) => {
  try {
    const { tarihBaslangic, tarihBitis } = req.query;

    const dateFilter = buildDateFilter(tarihBaslangic, tarihBitis);

    // Parallel aggregation queries
    const [
      toplamDegerlendirme,
      ortalamaPuan,
      rolBazliIstatistikler,
      kullaniciBazliIstatistikler,
    ] = await Promise.all([
      // Toplam değerlendirme sayısı
      getTotalEvaluationCount(dateFilter),

      // Ortalama başarı yüzdesi
      getAverageSuccessRate(dateFilter),

      // Rol bazlı istatistikler
      getRoleBasedStatistics(dateFilter),

      // Kullanıcı bazlı en iyi performans
      getTopPerformingUsers(dateFilter),
    ]);

    res.json({
      toplamDegerlendirme,
      ortalamaBasariYuzdesi: ortalamaPuan[0]?.ortalamaBasari || 0,
      rolBazliIstatistikler,
      enIyiPerformans: kullaniciBazliIstatistikler,
    });
  } catch (error) {
    console.error('Statistics error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Toplam değerlendirme sayısını getir
 */
const getTotalEvaluationCount = async dateFilter => {
  return await QualityControlEvaluation.countDocuments(dateFilter);
};

/**
 * Ortalama başarı yüzdesini hesapla
 */
const getAverageSuccessRate = async dateFilter => {
  return await QualityControlEvaluation.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        ortalamaBasari: { $avg: '$basariYuzdesi' },
      },
    },
  ]);
};

/**
 * Rol bazlı istatistikleri getir
 */
const getRoleBasedStatistics = async dateFilter => {
  return await QualityControlEvaluation.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'degerlendirilenKullanici',
        foreignField: '_id',
        as: 'kullanici',
      },
    },
    { $unwind: '$kullanici' },
    {
      $lookup: {
        from: 'roles',
        localField: 'kullanici.rol',
        foreignField: '_id',
        as: 'rol',
      },
    },
    { $unwind: '$rol' },
    {
      $group: {
        _id: '$rol.ad',
        sayac: { $sum: 1 },
        ortalamaBasari: { $avg: '$basariYuzdesi' },
      },
    },
    { $sort: { ortalamaBasari: -1 } },
  ]);
};

/**
 * En iyi performans gösteren kullanıcıları getir
 */
const getTopPerformingUsers = async dateFilter => {
  return await QualityControlEvaluation.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$degerlendirilenKullanici',
        sayac: { $sum: 1 },
        ortalamaBasari: { $avg: '$basariYuzdesi' },
      },
    },
    { $sort: { ortalamaBasari: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'kullanici',
      },
    },
    { $unwind: '$kullanici' },
    {
      $project: {
        kullanici: {
          ad: '$kullanici.ad',
          soyad: '$kullanici.soyad',
        },
        sayac: 1,
        ortalamaBasari: 1,
      },
    },
  ]);
};

module.exports = {
  getStatistics,
};
