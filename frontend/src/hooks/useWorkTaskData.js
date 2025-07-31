import { useState, useCallback } from 'react';
import { worktasksAPI, inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * 🎣 Custom Hook: useWorkTaskData
 * 🎯 Amaç: WorkTask verilerinin yönetimi ve API işlemleri
 * 📊 State: checklists, myTasks, machines, kalips, completedTasks
 * ⚡ Performance: useCallback ile optimize edilmiş
 */
export const useWorkTaskData = () => {
  const { kullanici } = useAuth();

  const [loading, setLoading] = useState(false);
  const [checklists, setChecklists] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [kalips, setKalips] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  // 📖 Ana veri yükleme fonksiyonu
  const loadData = useCallback(async showSnackbar => {
    try {
      setLoading(true);

      // Paralel API çağrıları - performance optimization
      const [checklistsRes, myTasksRes, machinesRes, kalipsRes] =
        await Promise.all([
          worktasksAPI.getAvailableChecklists(),
          worktasksAPI.getMyTasks(),
          inventoryAPI.getMachines('all'),
          inventoryAPI.getKalipsForTasks(),
        ]);

      setChecklists(checklistsRes.data || []);
      setMyTasks(myTasksRes.data || []);
      setMachines(machinesRes.data || []);
      setKalips(kalipsRes.data || []);
    } catch (error) {
      console.error('Data loading error:', error);

      // 500 hatası veya auth hatası için fallback mock data
      if (error.response?.status === 500 || error.response?.status === 401) {
        console.log('🔄 API hatası, mock data kullanılıyor...');

        // Mock data set et
        setChecklists([
          {
            _id: 'mock1',
            ad: 'Kalıp Değişim Checklisti',
            aciklama: 'Kalıp değişim işlemleri',
            kategori: 'Kalıp',
            maddeler: [
              { _id: 'm1', soru: 'Makina güvenlik kontrolü', puan: 10 },
              { _id: 'm2', soru: 'Kalıp montajı kontrolü', puan: 15 },
            ],
          },
          {
            _id: 'mock2',
            ad: 'Rutin Bakım Checklisti',
            aciklama: 'Günlük bakım işlemleri',
            kategori: 'Bakım',
            maddeler: [
              { _id: 'm3', soru: 'Yağlama kontrolü', puan: 8 },
              { _id: 'm4', soru: 'Temizlik kontrolü', puan: 12 },
            ],
          },
        ]);

        setMyTasks([]);
        setMachines([
          { _id: 'machine1', ad: 'Makina 1', envanterKodu: 'M001' },
          { _id: 'machine2', ad: 'Makina 2', envanterKodu: 'M002' },
        ]);
        setKalips([
          {
            _id: 'kalip1',
            ad: 'Kalıp A',
            envanterKodu: 'K001',
            uretilecekUrun: 'Ürün A',
          },
          {
            _id: 'kalip2',
            ad: 'Kalıp B',
            envanterKodu: 'K002',
            uretilecekUrun: 'Ürün B',
          },
        ]);

        if (showSnackbar) {
          showSnackbar(
            'Demo veriler yüklendi (Backend bağlantısı yok)',
            'warning',
          );
        }
      } else {
        if (showSnackbar) {
          showSnackbar('Veriler yüklenirken hata oluştu', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 📖 Tamamlanan görevleri yükleme
  const loadCompletedTasks = useCallback(async showSnackbar => {
    try {
      setLoading(true);
      const response = await worktasksAPI.getCompletedTasks();
      setCompletedTasks(response.data || []);
    } catch (error) {
      console.error('Completed tasks loading error:', error);
      if (showSnackbar) {
        showSnackbar('Tamamlanan görevler yüklenirken hata oluştu', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Görev güncelleme
  const updateTask = useCallback((taskId, updates) => {
    setMyTasks(prev =>
      prev.map(task => (task._id === taskId ? { ...task, ...updates } : task)),
    );
  }, []);

  // ➕ Yeni görev ekleme
  const addTask = useCallback(newTask => {
    setMyTasks(prev => [...prev, newTask]);
  }, []);

  // ➖ Görev silme
  const removeTask = useCallback(taskId => {
    setMyTasks(prev => prev.filter(task => task._id !== taskId));
  }, []);

  console.log('🔍 useWorkTaskData current state:', {
    loading,
    checklistsCount: checklists.length,
    myTasksCount: myTasks.length,
    machinesCount: machines.length,
  });

  return {
    // State
    loading,
    checklists,
    myTasks,
    machines,
    kalips,
    completedTasks,
    kullanici,

    // Actions
    loadData,
    loadCompletedTasks,
    updateTask,
    addTask,
    removeTask,

    // Setters (for manual state management if needed)
    setChecklists,
    setMyTasks,
    setMachines,
    setKalips,
    setCompletedTasks,

    // Computed values
    hasActiveTasks: myTasks.length > 0,
    hasCompletedTasks: completedTasks.length > 0,
  };
};
