const BonusEvaluation = require('../models/BonusEvaluation');

/**
 * 🎁 Bonus Evaluation Helper Service
 * Extracted from myActivityHelpers.js
 *
 * PRESERVED PATTERNS:
 * - ✅ Field mapping sistemi korundu
 * - ✅ Error handling patterns korundu
 * - ✅ Debug logging sistemli
 * - ✅ Populate optimization
 */
class BonusEvaluationHelpers {
  /**
   * Bonus evaluation verilerini çek ve formatla
   * ORIGINAL: myActivityHelpers.getBonusEvaluations()
   */
  static async getBonusEvaluations(userId, month, year) {
    try {
      const dateFilter = { degerlendirilenKullanici: userId };

      if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter.degerlendirmeTarihi = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // ✅ PRESERVED: Populate optimization pattern
      const bonusEvaluations = await BonusEvaluation.find(dateFilter)
        .populate('sablon', 'ad bonusKategorisi degerlendirmePeriyodu')
        .populate('degerlendirmeTarafindan', 'ad soyad')
        .populate('departman', 'ad')
        .sort({ degerlendirmeTarihi: -1 });

      // ✅ PRESERVED: Debug logging pattern
      console.log('🎁 Bonus Evaluations from database:', {
        userId,
        dateFilter,
        bonusEvaluationsFound: bonusEvaluations.length,
        month,
        year,
      });

      // ✅ PRESERVED: Field mapping and formatting logic
      const formattedBonusEvaluations =
        this.formatBonusEvaluations(bonusEvaluations);

      console.log('✅ Bonus Evaluations formatted:', {
        totalFormatted: formattedBonusEvaluations.length,
        averageScore:
          formattedBonusEvaluations.length > 0
            ? Math.round(
              formattedBonusEvaluations.reduce(
                (sum, evaluation) => sum + evaluation.puanlar.basariYuzdesi,
                0,
              ) / formattedBonusEvaluations.length,
            )
            : 0,
      });

      return formattedBonusEvaluations;
    } catch (error) {
      // ✅ PRESERVED: Error handling pattern
      console.error('❌ Bonus Evaluation scores error:', error);
      return [];
    }
  }

  /**
   * Bonus evaluation verilerini MyActivity formatına çevir
   * NEW METHOD: Extracted formatting logic
   */
  static formatBonusEvaluations(bonusEvaluations) {
    return bonusEvaluations.map(evaluation => {
      const evaluationDate = new Date(evaluation.degerlendirmeTarihi);

      // ✅ PRESERVED: Güvenli calculation pattern (NaN fix legacy)
      const toplamPuan = evaluation.puanlamalar.reduce(
        (sum, p) => sum + (p.puan || 0),
        0,
      );
      const maksimumPuan = evaluation.puanlamalar.reduce(
        (sum, p) => sum + (p.maksimumPuan || 0),
        0,
      );
      const basariYuzdesi =
        maksimumPuan > 0 ? Math.round((toplamPuan / maksimumPuan) * 100) : 0;

      // ✅ PRESERVED: Field mapping pattern for frontend compatibility
      return {
        id: `bonus_evaluation_${evaluation._id}`,
        tip: 'bonus_evaluation',
        checklistAdi: evaluation.sablon?.ad || 'Bonus Değerlendirmesi',
        kategori: evaluation.sablon?.bonusKategorisi || 'Bonus',
        tamamlanmaTarihi: evaluationDate,
        puanlar: {
          toplam: toplamPuan,
          maksimum: maksimumPuan,
          basariYuzdesi: basariYuzdesi,
        },
        donem: {
          ay: evaluationDate.getMonth() + 1,
          yil: evaluationDate.getFullYear(),
        },
        degerlendiren: evaluation.degerlendirmeTarafindan,
        departman: evaluation.departman,
        bonusOnayi: evaluation.bonusOnayi,
        degerlendirmeDonemi: evaluation.degerlendirmeDonemi,
        notlar: evaluation.notlar,
        yoneticiYorumu: evaluation.yoneticiYorumu,
        maddeDetaylari: evaluation.puanlamalar,
      };
    });
  }

  /**
   * Bonus puanlarını hesapla ve doğrula
   * NEW METHOD: Extracted scoring logic
   */
  static processBonusScoring(bonusEvaluations) {
    if (!Array.isArray(bonusEvaluations) || bonusEvaluations.length === 0) {
      return {
        toplamPuan: 0,
        ortalamaPuan: 0,
        degerlendirmeSayisi: 0,
        basariOrtalamasi: 0,
      };
    }

    let toplamPuan = 0;
    let toplamBasariYuzdesi = 0;
    let gecerliDegerlendirmeSayisi = 0;

    bonusEvaluations.forEach(evaluation => {
      if (evaluation.puanlar && typeof evaluation.puanlar.toplam === 'number') {
        toplamPuan += evaluation.puanlar.toplam;
        toplamBasariYuzdesi += evaluation.puanlar.basariYuzdesi || 0;
        gecerliDegerlendirmeSayisi++;
      }
    });

    // ✅ PRESERVED: Güvenli calculation (NaN fix legacy)
    const ortalamaPuan =
      gecerliDegerlendirmeSayisi > 0
        ? Math.round((toplamPuan / gecerliDegerlendirmeSayisi) * 100) / 100
        : 0;

    const basariOrtalamasi =
      gecerliDegerlendirmeSayisi > 0
        ? Math.round(toplamBasariYuzdesi / gecerliDegerlendirmeSayisi)
        : 0;

    return {
      toplamPuan,
      ortalamaPuan,
      degerlendirmeSayisi: gecerliDegerlendirmeSayisi,
      basariOrtalamasi,
    };
  }

  /**
   * Bonus evaluation verilerini doğrula
   * NEW METHOD: Data validation
   */
  static validateBonusData(evaluation) {
    const errors = [];

    if (!evaluation) {
      errors.push('Evaluation data is required');
      return { isValid: false, errors };
    }

    if (!evaluation.degerlendirilenKullanici) {
      errors.push('Değerlendirilen kullanıcı gerekli');
    }

    if (!evaluation.degerlendirmeTarihi) {
      errors.push('Değerlendirme tarihi gerekli');
    }

    if (
      !Array.isArray(evaluation.puanlamalar) ||
      evaluation.puanlamalar.length === 0
    ) {
      errors.push('En az bir puanlama gerekli');
    }

    // Puanlama detaylarını kontrol et
    if (evaluation.puanlamalar) {
      evaluation.puanlamalar.forEach((puanlama, index) => {
        if (typeof puanlama.puan !== 'number' || puanlama.puan < 0) {
          errors.push(`Puanlama ${index + 1}: Geçerli puan gerekli`);
        }
        if (
          typeof puanlama.maksimumPuan !== 'number' ||
          puanlama.maksimumPuan <= 0
        ) {
          errors.push(`Puanlama ${index + 1}: Geçerli maksimum puan gerekli`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Bonus evaluation istatistiklerini hesapla
   * NEW METHOD: Statistics calculation
   */
  static calculateBonusStatistics(bonusEvaluations, options = {}) {
    const {
      groupByMonth = false,
      groupByDepartment = false,
      includeTrends = false,
    } = options;

    if (!Array.isArray(bonusEvaluations) || bonusEvaluations.length === 0) {
      return {
        genel: {
          toplamDegerlendirme: 0,
          ortalamaPuan: 0,
          enYuksekPuan: 0,
          enDusukPuan: 0,
        },
        aylik: {},
        departmanBazlı: {},
        trendler: [],
      };
    }

    // Genel istatistikler
    const puanlar = bonusEvaluations
      .map(e => e.puanlar?.toplam || 0)
      .filter(p => p > 0);

    const genel = {
      toplamDegerlendirme: bonusEvaluations.length,
      ortalamaPuan:
        puanlar.length > 0
          ? Math.round(
            (puanlar.reduce((sum, p) => sum + p, 0) / puanlar.length) * 100,
          ) / 100
          : 0,
      enYuksekPuan: puanlar.length > 0 ? Math.max(...puanlar) : 0,
      enDusukPuan: puanlar.length > 0 ? Math.min(...puanlar) : 0,
    };

    let aylik = {};
    let departmanBazlı = {};
    let trendler = [];

    // Aylık gruplama
    if (groupByMonth) {
      aylik = this.groupBonusByMonth(bonusEvaluations);
    }

    // Departman bazlı gruplama
    if (groupByDepartment) {
      departmanBazlı = this.groupBonusByDepartment(bonusEvaluations);
    }

    // Trend analizi
    if (includeTrends) {
      trendler = this.calculateBonusTrends(bonusEvaluations);
    }

    return {
      genel,
      aylik,
      departmanBazlı,
      trendler,
    };
  }

  /**
   * Bonus evaluations'ı aya göre grupla
   */
  static groupBonusByMonth(bonusEvaluations) {
    const monthlyData = {};

    bonusEvaluations.forEach(evaluation => {
      if (evaluation.donem) {
        const key = `${evaluation.donem.yil}-${evaluation.donem.ay}`;
        if (!monthlyData[key]) {
          monthlyData[key] = {
            ay: evaluation.donem.ay,
            yil: evaluation.donem.yil,
            degerlendirmeSayisi: 0,
            toplamPuan: 0,
            ortalamaPuan: 0,
          };
        }

        monthlyData[key].degerlendirmeSayisi++;
        monthlyData[key].toplamPuan += evaluation.puanlar?.toplam || 0;
        monthlyData[key].ortalamaPuan =
          Math.round(
            (monthlyData[key].toplamPuan /
              monthlyData[key].degerlendirmeSayisi) *
              100,
          ) / 100;
      }
    });

    return monthlyData;
  }

  /**
   * Bonus evaluations'ı departmana göre grupla
   */
  static groupBonusByDepartment(bonusEvaluations) {
    const departmentData = {};

    bonusEvaluations.forEach(evaluation => {
      const departmentName = evaluation.departman?.ad || 'Bilinmeyen';

      if (!departmentData[departmentName]) {
        departmentData[departmentName] = {
          departman: departmentName,
          degerlendirmeSayisi: 0,
          toplamPuan: 0,
          ortalamaPuan: 0,
          enYuksekPuan: 0,
        };
      }

      const puan = evaluation.puanlar?.toplam || 0;
      departmentData[departmentName].degerlendirmeSayisi++;
      departmentData[departmentName].toplamPuan += puan;
      departmentData[departmentName].ortalamaPuan =
        Math.round(
          (departmentData[departmentName].toplamPuan /
            departmentData[departmentName].degerlendirmeSayisi) *
            100,
        ) / 100;

      if (puan > departmentData[departmentName].enYuksekPuan) {
        departmentData[departmentName].enYuksekPuan = puan;
      }
    });

    return departmentData;
  }

  /**
   * Bonus evaluation trendlerini hesapla
   */
  static calculateBonusTrends(bonusEvaluations) {
    // Son 6 aylık trend hesapla
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentEvaluations = bonusEvaluations.filter(
      evaluation => evaluation.tamamlanmaTarihi >= sixMonthsAgo,
    );

    const monthlyTrends = this.groupBonusByMonth(recentEvaluations);

    // Trend analizi
    const trendData = Object.values(monthlyTrends)
      .sort(
        (a, b) =>
          new Date(a.yil, a.ay - 1).getTime() -
          new Date(b.yil, b.ay - 1).getTime(),
      )
      .map(month => ({
        tarih: `${month.yil}-${month.ay.toString().padStart(2, '0')}`,
        ortalamaPuan: month.ortalamaPuan,
        degerlendirmeSayisi: month.degerlendirmeSayisi,
      }));

    return trendData;
  }
}

module.exports = BonusEvaluationHelpers;
