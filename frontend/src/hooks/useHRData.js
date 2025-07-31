import { useState, useEffect, useCallback } from 'react';
import { hrAPI, departmentsAPI } from '../services/api';

const useHRData = () => {
  // Data States
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Mesai girişi için tüm kullanıcılar
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [scores, setScores] = useState([]);
  const [summaryReport, setSummaryReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hrYetkileri, setHrYetkileri] = useState(null);

  // Filter States
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterUser, setFilterUser] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, deptsRes, templatesRes] = await Promise.all([
        hrAPI.getUsers(),
        hrAPI.getRoles(),
        departmentsAPI.getAll(),
        hrAPI.getActiveTemplates(),
      ]);

      setUsers(usersRes.data);
      setOriginalUsers(usersRes.data);
      setRoles(rolesRes.data);
      setDepartments(deptsRes.data);
      setTemplates(templatesRes.data);

      // Yetkileri backend'den al
      try {
        const yetkileriRes = await hrAPI.getPermissions();
        console.log('🔍 HR Yetkileri API Response:', yetkileriRes.data);
        setHrYetkileri(yetkileriRes.data);
      } catch (error) {
        console.error('❌ HR Yetkileri API Hatası:', error);
        setHrYetkileri({
          kullaniciAcabilir: false,
          kullaniciSilebilir: false,
          puanlamaYapabilir: false,
          excelYukleyebilir: false,
          raporGorebilir: false,
        });
      }
    } catch (error) {
      console.error('HR data loading error:', error);
      throw new Error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mesai/devamsızlık girişi için TÜM kullanıcıları yükle
  const loadAllUsersForManualEntry = useCallback(async () => {
    try {
      console.log('📝 Loading all users for manual entry...');
      const response = await hrAPI.getUsers({ forManualEntry: 'true' });
      setAllUsers(response.data);
      console.log('✅ All users loaded:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('All users loading error:', error);
      throw new Error('Tüm kullanıcılar yüklenirken hata oluştu');
    }
  }, []);

  const loadScores = useCallback(
    async (filterYear, filterMonth, filterUser) => {
      try {
        const response = await hrAPI.getScores({
          yil: filterYear,
          ay: filterMonth,
          kullaniciId: filterUser,
        });
        setScores(response.data);
      } catch (error) {
        console.error('Scores loading error:', error);
        throw new Error('Puanlama verileri yüklenirken hata oluştu');
      }
    },
    [],
  );

  const loadSummaryReport = useCallback(async (filterYear, filterMonth) => {
    try {
      const response = await hrAPI.getSummaryReport({
        yil: filterYear,
        ay: filterMonth,
      });
      setSummaryReport(response.data);
    } catch (error) {
      console.error('Summary report loading error:', error);
      throw new Error('Rapor yüklenirken hata oluştu');
    }
  }, []);

  const restoreOriginalUsers = () => {
    setUsers(originalUsers);
  };

  // Filter handlers
  const setFilters = useCallback((year, month, user = '') => {
    setFilterYear(year);
    setFilterMonth(month);
    setFilterUser(user);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // Data
    users,
    originalUsers,
    allUsers,
    roles,
    departments,
    templates,
    scores,
    summaryReport,
    loading,
    hrYetkileri,

    // Setters
    setUsers,
    setOriginalUsers,
    setAllUsers,
    setScores,
    setSummaryReport,

    // Functions
    loadData,
    loadAllUsersForManualEntry,
    loadScores,
    loadSummaryReport,
    restoreOriginalUsers,

    // Filters
    filterYear,
    filterMonth,
    filterUser,
    setFilters,
  };
};

export default useHRData;
