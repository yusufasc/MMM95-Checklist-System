import { useState, useCallback } from 'react';
import { myActivityAPI } from '../services/api';

export const useMyActivityData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Summary data
  const [summary, setSummary] = useState(null);
  const [dailyPerformance, setDailyPerformance] = useState([]);

  // Detailed activity data
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({});

  // Score details data
  const [scoreDetails, setScoreDetails] = useState([]);
  const [scorePagination, setScorePagination] = useState({});

  // Score breakdown data
  const [scoreBreakdown, setScoreBreakdown] = useState([]);
  const [breakdownPagination, setBreakdownPagination] = useState({});
  const [breakdownStats, setBreakdownStats] = useState(null);

  // Monthly totals data
  const [monthlyTotals, setMonthlyTotals] = useState(null);

  // HR scores data (for integration with ScoreBreakdown)
  const [hrScores, setHrScores] = useState([]);
  const [hrScoresLoading, setHrScoresLoading] = useState(false);

  // WorkTask scores data (for integration with ScoreBreakdown)
  const [workTaskScores, setWorkTaskScores] = useState([]);
  const [workTaskScoresLoading, setWorkTaskScoresLoading] = useState(false);

  // Quality scores state
  const [qualityScores, setQualityScores] = useState([]);
  const [qualityScoresLoading, setQualityScoresLoading] = useState(false);

  // Bonus evaluations state
  const [bonusEvaluations, setBonusEvaluations] = useState([]);
  const [bonusEvaluationsLoading, setBonusEvaluationsLoading] = useState(false);

  // Load summary data
  const loadSummaryData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Test endpoint
      console.log('🔍 Test endpoint çağırılıyor...');
      try {
        const testRes = await myActivityAPI.test();
        console.log('✅ Test başarılı:', testRes.data);
      } catch (testError) {
        console.error('❌ Test endpoint hatası:', testError);
        setError('Test endpoint hatası: ' + testError.message);
        return;
      }

      // Summary endpoint
      console.log('📊 Summary endpoint çağırılıyor...');
      try {
        const summaryRes = await myActivityAPI.getSummary(30);
        console.log('✅ Summary başarılı:', summaryRes.data);
        setSummary(summaryRes.data);
      } catch (summaryError) {
        console.error('❌ Summary endpoint hatası:', summaryError);
        setError('Summary endpoint hatası: ' + summaryError.message);
        return;
      }

      // Daily performance
      console.log('📈 Daily performance endpoint çağırılıyor...');
      try {
        const dailyRes = await myActivityAPI.getDailyPerformance(30);
        console.log('✅ Daily performance başarılı:', dailyRes.data);
        setDailyPerformance(dailyRes.data.performansVerileri || []);
      } catch (dailyError) {
        console.error('❌ Daily performance endpoint hatası:', dailyError);
        setError('Daily performance endpoint hatası: ' + dailyError.message);
        return;
      }

      console.log('📊 Kişisel aktivite verileri yüklendi');
    } catch (error) {
      console.error('❌ Aktivite verisi yükleme hatası:', error);
      setError('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load detailed activities
  const loadDetailedActivities = useCallback(async filters => {
    try {
      const response = await myActivityAPI.getDetailed(filters);
      setActivities(response.data.activities || []);
      setPagination(response.data.sayfalama || {});
    } catch (error) {
      console.error('❌ Detaylı aktivite yükleme hatası:', error);
    }
  }, []);

  // Load score details
  const loadScoreDetails = useCallback(async scoreFilters => {
    try {
      const response = await myActivityAPI.getScoresDetail(scoreFilters);
      console.log(
        `✅ Score details loaded for tip: ${scoreFilters.tip}, count: ${response.data.scoreDetails?.length || 0}`,
      );
      setScoreDetails(response.data.scoreDetails || []);
      setScorePagination(response.data.sayfalama || {});
    } catch (error) {
      console.error('❌ Puanlama detayları yükleme hatası:', error);
    }
  }, []);

  // Load score breakdown
  const loadScoreBreakdown = useCallback(async breakdownFilters => {
    try {
      setLoading(true);
      console.log(
        '🔍 Score breakdown çağırılıyor... Filters:',
        breakdownFilters,
      );

      const response = await myActivityAPI.getScoreBreakdown(breakdownFilters);
      console.log('✅ Score breakdown response:', response);

      setScoreBreakdown(response.data.scoreBreakdown || []);
      setBreakdownPagination(response.data.sayfalama || {});
      setBreakdownStats(response.data.istatistikler || null);
      console.log('✅ Puan breakdown yüklendi:', response.data);
    } catch (error) {
      console.error('❌ Puan breakdown yükleme hatası:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError('Puan breakdown yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load monthly totals
  const loadMonthlyTotals = useCallback(async filters => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Monthly totals çağırılıyor... Filters:', filters);

      const response = await myActivityAPI.getMonthlyTotals(filters);
      console.log('✅ Full API Response:', response);
      console.log('✅ Response Data:', response.data);

      // Backend response struktur kontrolü
      if (response && response.data) {
        console.log('📊 Monthly totals data structure:', {
          hasIk: !!response.data.ik,
          hasKaliteKontrol: !!response.data.kaliteKontrol,
          hasChecklistSablonlari: !!response.data.checklistSablonlari,
          hasGenelToplam: !!response.data.genelToplam,
          hasDonem: !!response.data.donem,
          fullKeys: Object.keys(response.data),
          fullData: response.data,
        });

        // Backend'den gelen data'nın içindeki data field'ını kontrol et
        if (response.data.data) {
          console.log('📊 Nested data structure found:', {
            hasIk: !!response.data.data.ik,
            hasKaliteKontrol: !!response.data.data.kaliteKontrol,
            hasChecklistSablonlari: !!response.data.data.checklistSablonlari,
            hasGenelToplam: !!response.data.data.genelToplam,
            hasDonem: !!response.data.data.donem,
            nestedKeys: Object.keys(response.data.data),
          });
          setMonthlyTotals(response.data.data);
        } else {
          setMonthlyTotals(response.data);
        }
      } else {
        console.error('❌ Response data boş veya undefined');
        setError('API response boş döndü');
      }
    } catch (error) {
      console.error('❌ Aylık toplam yükleme hatası:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError('Aylık toplam yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load HR scores
  const loadHRScores = useCallback(async filters => {
    try {
      setHrScoresLoading(true);
      console.log('🔍 HR scores çağırılıyor... Filters:', filters);

      const response = await myActivityAPI.getScoresDetail({
        ...filters,
        tip: 'hr',
      });

      console.log('✅ HR scores response:', response);

      if (response && response.data && response.data.scoreDetails) {
        const hrData = response.data.scoreDetails.filter(s =>
          s.tip?.includes('hr_'),
        );
        setHrScores(hrData);
        console.log('📊 HR Scores filtered data:', hrData);
      } else {
        setHrScores([]);
      }
    } catch (error) {
      console.error('❌ HR scores yükleme hatası:', error);
      setHrScores([]);
    } finally {
      setHrScoresLoading(false);
    }
  }, []);

  // Load WorkTask scores
  const loadWorkTaskScores = useCallback(async filters => {
    try {
      setWorkTaskScoresLoading(true);
      console.log('🔍 WorkTask scores çağırılıyor... Filters:', filters);

      const response = await myActivityAPI.getScoresDetail({
        ...filters,
        tip: 'worktask',
      });

      console.log('✅ WorkTask scores response:', response);

      if (response && response.data && response.data.scoreDetails) {
        const workTaskData = response.data.scoreDetails.filter(
          s => s.tip === 'worktask',
        );
        setWorkTaskScores(workTaskData);
        console.log('📊 WorkTask Scores filtered data:', workTaskData);
      } else {
        setWorkTaskScores([]);
      }
    } catch (error) {
      console.error('❌ WorkTask scores yükleme hatası:', error);
      setWorkTaskScores([]);
    } finally {
      setWorkTaskScoresLoading(false);
    }
  }, []);

  // Load Quality scores
  const loadQualityScores = useCallback(async filters => {
    try {
      setQualityScoresLoading(true);
      console.log('🔍 Quality scores çağırılıyor... Filters:', filters);

      const response = await myActivityAPI.getScoresDetail({
        ...filters,
        tip: 'quality_control',
      });

      console.log('✅ Quality scores response:', response);

      if (response && response.data && response.data.scoreDetails) {
        const qualityData = response.data.scoreDetails.filter(
          s => s.tip === 'quality_control',
        );
        setQualityScores(qualityData);
        console.log('📊 Quality Scores filtered data:', qualityData);
      } else {
        setQualityScores([]);
      }
    } catch (error) {
      console.error('❌ Quality scores yükleme hatası:', error);
      setQualityScores([]);
    } finally {
      setQualityScoresLoading(false);
    }
  }, []);

  // Load Bonus evaluations
  const loadBonusEvaluations = useCallback(async filters => {
    try {
      setBonusEvaluationsLoading(true);
      console.log('🔍 Bonus evaluations çağırılıyor... Filters:', filters);

      const response = await myActivityAPI.getScoresDetail({
        ...filters,
        tip: 'bonus_evaluation',
      });

      console.log('✅ Bonus evaluations response:', response);

      if (response && response.data && response.data.scoreDetails) {
        const bonusData = response.data.scoreDetails.filter(
          s =>
            s.tip === 'bonus_evaluation' ||
            s.tip === 'kalip_degisim_evaluation',
        );
        setBonusEvaluations(bonusData);
        console.log(
          '📊 Bonus Evaluations filtered data (including Kalıp Değişim):',
          bonusData,
        );
      } else {
        setBonusEvaluations([]);
      }
    } catch (error) {
      console.error('❌ Bonus evaluations yükleme hatası:', error);
      setBonusEvaluations([]);
    } finally {
      setBonusEvaluationsLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,

    // Summary data
    summary,
    dailyPerformance,

    // Activities data
    activities,
    pagination,

    // Score data
    scoreDetails,
    scorePagination,

    // Breakdown data
    scoreBreakdown,
    breakdownPagination,
    breakdownStats,

    // Monthly totals data
    monthlyTotals,

    // HR scores data
    hrScores,
    hrScoresLoading,

    // WorkTask scores data
    workTaskScores,
    workTaskScoresLoading,

    // Quality scores data
    qualityScores,
    qualityScoresLoading,

    // Bonus evaluations data
    bonusEvaluations,
    bonusEvaluationsLoading,

    // Methods
    loadSummaryData,
    loadDetailedActivities,
    loadScoreDetails,
    loadScoreBreakdown,
    loadMonthlyTotals,
    loadHRScores,
    loadWorkTaskScores,
    loadQualityScores,
    loadBonusEvaluations,
  };
};
