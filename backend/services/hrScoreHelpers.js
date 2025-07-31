const HRScore = require('../models/HRScore');

/**
 * HR Score & API Logic Helper
 *
 * REFACTORING STATUS: Module 3/4 (EXTRACTED FROM myActivityHelpers.js)
 * RESPONSIBILITY: HR Score Operations & API Logic
 * ESTIMATED SIZE: ~350 lines
 * RISK LEVEL: DÜŞÜK-ORTA (HR API integration)
 *
 * EXTRACTED METHODS:
 * ✅ getHRScoresFromAPI() - HR API logic and database operations
 * ✅ formatHRScoreData() - HR data formatting with field mapping
 * ✅ validateHRScoreData() - HR data validation and safety checks
 * ✅ processHRScoreAggregation() - Multi-source HR data aggregation
 * ✅ calculateHRStatistics() - HR statistics calculation
 *
 * PRESERVED LEGACY PATTERNS:
 * ✅ Field mapping patterns (geçmiş field mapping hatalarından öğrenilen)
 * ✅ NaN prevention (geçmiş NaN display hatalarından öğrenilen)
 * ✅ Null/undefined safety checks (geçmiş validation hatalarından öğrenilen)
 * ✅ Populate optimization (geçmiş populate hatalarından öğrenilen)
 * ✅ Debug logging sistemi (geçmiş troubleshooting deneyiminden)
 * ✅ Error handling consistency (geçmiş error pattern'larından)
 */

class HRScoreHelpers {
  /**
   * HR API'den şablon bazlı değerlendirme puanlarını çek
   *
   * PRESERVED PATTERNS:
   * - Field mapping consistency (bachend ↔ frontend)
   * - NaN prevention in calculations
   * - Safe fallbacks for null/undefined
   * - Comprehensive error handling
   */
  static async getHRScoresFromAPI(userId, month, year) {
    try {
      console.log('🏥 HRScoreHelpers - Starting HR score fetch:', {
        userId: userId?.toString(),
        month,
        year,
        timestamp: new Date().toISOString(),
      });

      // ✅ PRESERVED: Input validation (geçmiş validation hatalarından)
      if (!userId) {
        console.warn('⚠️ HRScoreHelpers - No userId provided');
        return [];
      }

      // ✅ PRESERVED: Date filter logic (geçmiş date handling hatalarından)
      let dateFilter = {};
      if (month && year) {
        const parsedMonth = parseInt(month);
        const parsedYear = parseInt(year);

        // ✅ NaN PREVENTION: Safe parsing
        if (!isNaN(parsedMonth) && !isNaN(parsedYear)) {
          dateFilter = {
            'donem.yil': parsedYear,
            'donem.ay': parsedMonth,
          };
        }
      }

      // ✅ PRESERVED: Populate optimization (geçmiş populate hatalarından öğrenilen)
      const hrScores = await HRScore.find({
        kullanici: userId,
        ...dateFilter,
      })
        .populate('checklistPuanlari.sablon', 'ad aciklama') // ✅ Selective populate
        .sort({ 'donem.yil': -1, 'donem.ay': -1 });

      console.log('🔍 HRScoreHelpers - Database query result:', {
        userId: userId?.toString(),
        dateFilter,
        hrScoresFound: hrScores?.length || 0,
        month,
        year,
      });

      // ✅ PRESERVED: Safe array handling
      if (!Array.isArray(hrScores) || hrScores.length === 0) {
        console.log(
          'ℹ️ HRScoreHelpers - No HR scores found, returning empty array',
        );
        return [];
      }

      // ✅ ENHANCED: HR data formatting with comprehensive safety checks
      const formattedScores = this.formatHRScoreData(hrScores, month, year);

      console.log('✅ HRScoreHelpers - HR scores processed successfully:', {
        totalFormatted: formattedScores?.length || 0,
        scoreTypes: this.calculateHRScoreStatistics(formattedScores),
        processingTime: Date.now(),
      });

      return formattedScores;
    } catch (error) {
      console.error('❌ HRScoreHelpers - HR API scores error:', {
        error: error.message,
        stack: error.stack,
        userId: userId?.toString(),
        month,
        year,
      });

      // ✅ PRESERVED: Safe fallback (geçmiş error handling pattern'ından)
      return [];
    }
  }

  /**
   * HR Score verilerini format et
   *
   * GEÇMIŞ HATALARDAN ÖĞRENILENLER:
   * - Field mapping tutarlılığı
   * - NaN prevention in calculations
   * - Null/undefined safety checks
   * - Consistent data structure
   */
  static formatHRScoreData(hrScores, month, year) {
    const formattedScores = [];

    // ✅ NaN PREVENTION: Safe array check
    if (!Array.isArray(hrScores)) {
      console.warn(
        '⚠️ HRScoreHelpers - formatHRScoreData: Invalid hrScores input',
      );
      return [];
    }

    hrScores.forEach((hrScore, index) => {
      try {
        console.log(`🔍 HRScoreHelpers - Processing HR score ${index + 1}:`, {
          hrScoreId: hrScore?._id?.toString(),
          checklistCount: hrScore?.checklistPuanlari?.length || 0,
          mesaiCount: hrScore?.mesaiKayitlari?.length || 0,
          devamsizlikCount: hrScore?.devamsizlikKayitlari?.length || 0,
        });

        // 1. Checklist puanları processing
        this.processChecklistScores(hrScore, formattedScores, month, year);

        // 2. Mesai puanları processing
        this.processMesaiScores(hrScore, formattedScores, month, year);

        // 3. Devamsızlık puanları processing
        this.processDevamsizlikScores(hrScore, formattedScores, month, year);
      } catch (error) {
        console.error(
          '❌ HRScoreHelpers - Error processing individual HR score:',
          {
            error: error.message,
            hrScoreId: hrScore?._id?.toString(),
            index,
          },
        );
        // ✅ Continue processing other scores
      }
    });

    return formattedScores;
  }

  /**
   * Checklist puanlarını işle
   *
   * GEÇMIŞ FIELD MAPPING HATALARINDAN KORUNMA
   */
  static processChecklistScores(hrScore, formattedScores, month, year) {
    const checklistPuanlari = hrScore?.checklistPuanlari;

    if (!Array.isArray(checklistPuanlari)) {
      return; // ✅ Safe exit
    }

    checklistPuanlari.forEach((puanlama, puanlamaIndex) => {
      try {
        // ✅ NaN PREVENTION: Safe date handling
        const puanlamaTarihi = puanlama?.tarih;
        if (!puanlamaTarihi || !(puanlamaTarihi instanceof Date)) {
          console.warn('⚠️ HRScoreHelpers - Invalid checklist puanlama date');
          return;
        }

        const puanlamaAy = puanlamaTarihi.getMonth() + 1;
        const puanlamaYil = puanlamaTarihi.getFullYear();

        // ✅ PRESERVED: Month/year filtering logic
        const monthMatches = !month || puanlamaAy === parseInt(month);
        const yearMatches = !year || puanlamaYil === parseInt(year);

        if (monthMatches && yearMatches) {
          // ✅ FIELD MAPPING: Consistent field names (geçmiş field mapping hatalarından)
          const formattedScore = {
            id: `hr_checklist_${hrScore._id}_${puanlamaTarihi.getTime()}`,
            tip: 'hr_checklist', // ✅ Consistent naming
            checklistAdi: puanlama?.sablon?.ad || 'İK Değerlendirmesi', // ✅ Safe fallback
            kategori: 'İK Checklist',
            tamamlanmaTarihi: puanlamaTarihi,
            puanlar: {
              toplam: this.safeNumber(puanlama?.madde?.puan), // ✅ NaN prevention
              maksimum: this.safeNumber(puanlama?.madde?.maksimumPuan, 100), // ✅ Safe fallback
              basariYuzdesi: this.calculateSuccessPercentage(
                puanlama?.madde?.puan,
                puanlama?.madde?.maksimumPuan,
              ), // ✅ NaN-safe calculation
            },
            donem: {
              ay: puanlamaAy,
              yil: puanlamaYil,
            },
            // ✅ PRESERVED: Additional metadata for debugging
            metadata: {
              type: 'checklist',
              source: 'hrScore',
              processed: new Date().toISOString(),
            },
          };

          formattedScores.push(formattedScore);
        }
      } catch (error) {
        console.error('❌ HRScoreHelpers - Error processing checklist score:', {
          error: error.message,
          puanlamaIndex,
          hrScoreId: hrScore?._id?.toString(),
        });
      }
    });
  }

  /**
   * Mesai puanlarını işle
   *
   * GEÇMIŞ NaN HATALARINDAN KORUNMA
   */
  static processMesaiScores(hrScore, formattedScores, month, year) {
    const mesaiKayitlari = hrScore?.mesaiKayitlari;

    if (!Array.isArray(mesaiKayitlari)) {
      return; // ✅ Safe exit
    }

    mesaiKayitlari.forEach((mesai, mesaiIndex) => {
      try {
        // ✅ NaN PREVENTION: Safe date handling
        const mesaiTarihi = mesai?.tarih;
        if (!mesaiTarihi || !(mesaiTarihi instanceof Date)) {
          console.warn('⚠️ HRScoreHelpers - Invalid mesai date');
          return;
        }

        const mesaiAy = mesaiTarihi.getMonth() + 1;
        const mesaiYil = mesaiTarihi.getFullYear();

        const monthMatches = !month || mesaiAy === parseInt(month);
        const yearMatches = !year || mesaiYil === parseInt(year);

        if (monthMatches && yearMatches) {
          const mesaiPuan = this.safeNumber(mesai?.puan);

          const formattedScore = {
            id: `hr_mesai_${hrScore._id}_${mesaiTarihi.getTime()}`,
            tip: 'hr_mesai',
            checklistAdi: 'Fazla Mesai Puanlaması',
            kategori: 'İK Mesai',
            tamamlanmaTarihi: mesaiTarihi,
            puanlar: {
              toplam: mesaiPuan, // ✅ Already safe from safeNumber()
              maksimum: Math.abs(mesaiPuan), // ✅ Safe abs calculation
              basariYuzdesi: mesaiPuan >= 0 ? 100 : 0, // ✅ Simple success logic
            },
            donem: {
              ay: mesaiAy,
              yil: mesaiYil,
            },
            metadata: {
              type: 'mesai',
              source: 'hrScore',
              processed: new Date().toISOString(),
            },
          };

          formattedScores.push(formattedScore);
        }
      } catch (error) {
        console.error('❌ HRScoreHelpers - Error processing mesai score:', {
          error: error.message,
          mesaiIndex,
          hrScoreId: hrScore?._id?.toString(),
        });
      }
    });
  }

  /**
   * Devamsızlık puanlarını işle
   *
   * GEÇMIŞ VALIDATION HATALARINDAN KORUNMA
   */
  static processDevamsizlikScores(hrScore, formattedScores, month, year) {
    const devamsizlikKayitlari = hrScore?.devamsizlikKayitlari;

    if (!Array.isArray(devamsizlikKayitlari)) {
      return; // ✅ Safe exit
    }

    devamsizlikKayitlari.forEach((devamsizlik, devamsizlikIndex) => {
      try {
        // ✅ NaN PREVENTION: Safe date handling
        const devamsizlikTarihi = devamsizlik?.tarih;
        if (!devamsizlikTarihi || !(devamsizlikTarihi instanceof Date)) {
          console.warn('⚠️ HRScoreHelpers - Invalid devamsizlik date');
          return;
        }

        const devamsizlikAy = devamsizlikTarihi.getMonth() + 1;
        const devamsizlikYil = devamsizlikTarihi.getFullYear();

        const monthMatches = !month || devamsizlikAy === parseInt(month);
        const yearMatches = !year || devamsizlikYil === parseInt(year);

        if (monthMatches && yearMatches) {
          const devamsizlikPuan = this.safeNumber(devamsizlik?.puan);

          const formattedScore = {
            id: `hr_devamsizlik_${hrScore._id}_${devamsizlikTarihi.getTime()}`,
            tip: 'hr_devamsizlik',
            checklistAdi: 'Devamsızlık Puanlaması',
            kategori: 'İK Devamsızlık',
            tamamlanmaTarihi: devamsizlikTarihi,
            puanlar: {
              toplam: devamsizlikPuan, // ✅ Already safe
              maksimum: Math.abs(devamsizlikPuan), // ✅ Safe abs calculation
              basariYuzdesi: devamsizlikPuan >= 0 ? 100 : 0, // ✅ Simple logic
            },
            donem: {
              ay: devamsizlikAy,
              yil: devamsizlikYil,
            },
            metadata: {
              type: 'devamsizlik',
              source: 'hrScore',
              processed: new Date().toISOString(),
            },
          };

          formattedScores.push(formattedScore);
        }
      } catch (error) {
        console.error(
          '❌ HRScoreHelpers - Error processing devamsizlik score:',
          {
            error: error.message,
            devamsizlikIndex,
            hrScoreId: hrScore?._id?.toString(),
          },
        );
      }
    });
  }

  /**
   * Güvenli sayı dönüştürme (NaN prevention)
   *
   * GEÇMIŞ NaN HATALARINDAN ÖĞRENILEN GÜVENLİK KATMANI
   */
  static safeNumber(value, defaultValue = 0) {
    // ✅ NaN PREVENTION: Comprehensive safety checks
    if (value === null || value === undefined) {
      return defaultValue;
    }

    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Güvenli başarı yüzdesi hesaplama (NaN prevention)
   *
   * GEÇMIŞ NaN DISPLAY HATALARINDAN ÖĞRENILEN ÇÖZÜM
   */
  static calculateSuccessPercentage(toplam, maksimum) {
    const safeToplamam = this.safeNumber(toplam);
    const safeMaksimum = this.safeNumber(maksimum, 100);

    // ✅ DIVISION BY ZERO PROTECTION (geçmiş 0/0 hatalarından)
    if (safeMaksimum === 0) {
      return 0;
    }

    const percentage = Math.round((safeToplamam / safeMaksimum) * 100);

    // ✅ BOUNDARY PROTECTION
    return Math.max(0, Math.min(100, percentage));
  }

  /**
   * HR Score istatistikleri hesapla
   *
   * GEÇMIŞ AGGREGATION HATALARINDAN KORUNMA
   */
  static calculateHRScoreStatistics(formattedScores) {
    if (!Array.isArray(formattedScores) || formattedScores.length === 0) {
      return {
        hr_checklist: 0,
        hr_mesai: 0,
        hr_devamsizlik: 0,
        total: 0,
      };
    }

    // ✅ NaN-SAFE AGGREGATION
    return formattedScores.reduce(
      (acc, score) => {
        const tip = score?.tip || 'unknown';
        acc[tip] = (acc[tip] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      },
      {
        hr_checklist: 0,
        hr_mesai: 0,
        hr_devamsizlik: 0,
        total: 0,
      },
    );
  }

  /**
   * HR Score veri validasyonu
   *
   * GEÇMIŞ VALIDATION HATALARINDAN ÖĞRENILEN KORUMA
   */
  static validateHRScoreData(hrScoreData) {
    const errors = [];

    if (!hrScoreData) {
      errors.push('HR Score data is required');
      return { isValid: false, errors };
    }

    if (!hrScoreData.kullanici) {
      errors.push('User ID is required');
    }

    if (!hrScoreData.donem) {
      errors.push('Period (donem) is required');
    } else {
      if (!hrScoreData.donem.yil || isNaN(hrScoreData.donem.yil)) {
        errors.push('Valid year is required');
      }

      if (
        !hrScoreData.donem.ay ||
        isNaN(hrScoreData.donem.ay) ||
        hrScoreData.donem.ay < 1 ||
        hrScoreData.donem.ay > 12
      ) {
        errors.push('Valid month (1-12) is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * HR Score aggregation processing
   *
   * GEÇMIŞ MULTI-SOURCE HATALARINDAN KORUNMA
   */
  static processHRScoreAggregation(hrScores, options = {}) {
    const {
      groupBy = 'month',
      includeStatistics = true,
      includeMetadata = false,
    } = options;

    console.log('🔍 HRScoreHelpers - Processing aggregation:', {
      hrScoreCount: hrScores?.length || 0,
      groupBy,
      includeStatistics,
      includeMetadata,
    });

    if (!Array.isArray(hrScores) || hrScores.length === 0) {
      return {
        groups: {},
        statistics: includeStatistics
          ? this.calculateHRScoreStatistics([])
          : null,
        metadata: includeMetadata
          ? { processed: new Date().toISOString() }
          : null,
      };
    }

    // ✅ SAFE GROUPING (geçmiş grouping hatalarından korunma)
    const groups = {};

    hrScores.forEach((score, index) => {
      try {
        const groupKey = this.getGroupKey(score, groupBy);

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }

        groups[groupKey].push(score);
      } catch (error) {
        console.error('❌ HRScoreHelpers - Error grouping score:', {
          error: error.message,
          index,
          scoreId: score?.id,
        });
      }
    });

    const result = { groups };

    if (includeStatistics) {
      result.statistics = this.calculateHRScoreStatistics(hrScores);
    }

    if (includeMetadata) {
      result.metadata = {
        processed: new Date().toISOString(),
        totalScores: hrScores.length,
        groupCount: Object.keys(groups).length,
      };
    }

    return result;
  }

  /**
   * Group key generator
   *
   * GEÇMIŞ GROUPING HATALARINDAN KORUNMA
   */
  static getGroupKey(score, groupBy) {
    if (!score || !score.donem) {
      return 'unknown';
    }

    switch (groupBy) {
    case 'month':
      return `${score.donem.yil}-${String(score.donem.ay).padStart(2, '0')}`;

    case 'year':
      return String(score.donem.yil);

    case 'type':
      return score.tip || 'unknown';

    default:
      return 'default';
    }
  }
}

module.exports = HRScoreHelpers;
