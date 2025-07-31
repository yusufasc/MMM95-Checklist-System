import { useEffect, useState, useCallback } from 'react';
import { useMyActivityData } from './useMyActivityData';
import controlScoresAPI from '../services/controlScoresAPI';

/**
 * ScoreBreakdown component için veri yönetimi hook'u
 * Geçmiş problemler: NaN display, field mapping, populate errors
 * Çözümler: Güvenli fallbacks, field mapping, doğru populate
 */
export const useScoreBreakdownData = filters => {
  // Hook'dan sadece gerekli verileri al
  const {
    monthlyTotals: hookMonthlyTotals,
    hrScores,
    hrScoresLoading,
    workTaskScores,
    bonusEvaluations,
    bonusEvaluationsLoading,
    qualityScores,
    loading,
    error,
    loadHRScores,
    loadWorkTaskScores,
    loadBonusEvaluations,
    loadMonthlyTotals,
  } = useMyActivityData();

  // Kontrol puanları için state
  const [controlSummary, setControlSummary] = useState(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState(null);

  // Filters'dan değerleri al
  const selectedMonth = filters?.month || new Date().getMonth() + 1;
  const selectedYear = filters?.year || new Date().getFullYear();

  // Kontrol puanları yükleme fonksiyonu
  const loadControlScores = useCallback(async () => {
    try {
      setControlLoading(true);
      setControlError(null);

      const summaryParams = {
        year: selectedYear,
        month: selectedMonth,
      };

      const summaryRes = await controlScoresAPI.getSummary(summaryParams);
      setControlSummary(summaryRes);
    } catch (err) {
      console.error('❌ Kontrol puanları özeti yüklenirken hata:', err);
      setControlError(
        err.response?.data?.message ||
          'Kontrol puanları yüklenirken hata oluştu',
      );
    } finally {
      setControlLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // İlk yükleme
  useEffect(() => {
    // İK puanlarını yükle
    loadHRScores({
      month: selectedMonth,
      year: selectedYear,
    });

    // WorkTask puanlarını yükle
    loadWorkTaskScores({
      month: selectedMonth,
      year: selectedYear,
    });

    // Monthly totals yükle
    loadMonthlyTotals({
      month: selectedMonth,
      year: selectedYear,
      department: 'all',
      taskType: 'all',
    });

    // Kontrol puanlarını yükle
    loadControlScores();

    // Bonus evaluations yükle
    loadBonusEvaluations({
      month: selectedMonth,
      year: selectedYear,
    });
  }, [
    loadHRScores,
    loadWorkTaskScores,
    loadMonthlyTotals,
    loadControlScores,
    loadBonusEvaluations,
    selectedMonth,
    selectedYear,
  ]);

  // Yenile fonksiyonu
  const refreshAllData = useCallback(() => {
    // İK puanlarını da yenile
    loadHRScores({
      month: selectedMonth,
      year: selectedYear,
    });

    // WorkTask puanlarını da yenile
    loadWorkTaskScores({
      month: selectedMonth,
      year: selectedYear,
    });

    // Monthly totals da yenile
    loadMonthlyTotals({
      month: selectedMonth,
      year: selectedYear,
      department: 'all',
      taskType: 'all',
    });

    // Kontrol puanlarını da yenile
    loadControlScores();

    // Bonus evaluations da yenile
    loadBonusEvaluations({
      month: selectedMonth,
      year: selectedYear,
    });
  }, [
    loadHRScores,
    loadWorkTaskScores,
    loadMonthlyTotals,
    loadControlScores,
    loadBonusEvaluations,
    selectedMonth,
    selectedYear,
  ]);

  return {
    // Data
    monthlyTotals: hookMonthlyTotals,
    hrScores,
    workTaskScores,
    bonusEvaluations,
    qualityScores,
    controlSummary,

    // Loading states
    hrScoresLoading,
    bonusEvaluationsLoading,
    controlLoading,
    loading,

    // Error states
    error,
    controlError,

    // Actions
    refreshAllData,

    // Filters
    selectedMonth,
    selectedYear,
  };
};
