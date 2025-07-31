import { useState, useMemo } from 'react';

export const useControlPendingFilters = (controlData, activeTab = 0) => {
  // Filter state
  const [filters, setFilters] = useState({
    sortBy: 'tamamlanmaTarihi',
    sortOrder: 'desc',
    durum: 'all',
    dateFrom: '',
    dateTo: '',
    searchText: '',
  });

  // Get all tasks from controlData - Optimized
  const allTasks = useMemo(() => {
    if (!controlData || typeof controlData !== 'object') {
      return [];
    }

    const tasks = [];
    Object.entries(controlData).forEach(([machineKey, machineData]) => {
      if (machineData?.tasks) {
        machineData.tasks.forEach(task => {
          tasks.push({ ...task, machineKey });
        });
      }
    });

    return tasks;
  }, [controlData]);

  // Apply filters and sorting - Optimized
  const filteredAndSortedData = useMemo(() => {
    if (!controlData || !allTasks.length) {
      return null;
    }

    // Fast filtering with early returns
    const filteredTasks = allTasks.filter(task => {
      // Tab bazlı filtreleme
      if (activeTab === 0 && task.durum !== 'tamamlandi') {
        return false;
      }
      if (
        activeTab === 1 &&
        task.durum !== 'onaylandi' &&
        task.durum !== 'reddedildi'
      ) {
        return false;
      }

      // Additional filters
      if (
        filters.durum !== 'all' &&
        activeTab === 1 &&
        task.durum !== filters.durum
      ) {
        return false;
      }

      if (filters.dateFrom) {
        const taskDate = new Date(
          task.tamamlanmaTarihi || task.olusturulmaTarihi,
        );
        if (taskDate < new Date(filters.dateFrom)) {
          return false;
        }
      }

      if (filters.dateTo) {
        const taskDate = new Date(
          task.tamamlanmaTarihi || task.olusturulmaTarihi,
        );
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (taskDate > toDate) {
          return false;
        }
      }

      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const userName =
          `${task.kullanici?.ad || ''} ${task.kullanici?.soyad || ''}`.toLowerCase();
        const checklistName = (task.checklist?.ad || '').toLowerCase();
        const userLogin = (task.kullanici?.kullaniciAdi || '').toLowerCase();

        if (
          !userName.includes(searchLower) &&
          !checklistName.includes(searchLower) &&
          !userLogin.includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });

    // Optimized sorting
    if (filteredTasks.length > 1) {
      filteredTasks.sort((a, b) => {
        let aValue, bValue;

        switch (filters.sortBy) {
          case 'tamamlanmaTarihi':
            aValue = new Date(a.tamamlanmaTarihi || a.olusturulmaTarihi);
            bValue = new Date(b.tamamlanmaTarihi || b.olusturulmaTarihi);
            break;
          case 'olusturulmaTarihi':
            aValue = new Date(a.olusturulmaTarihi);
            bValue = new Date(b.olusturulmaTarihi);
            break;
          case 'toplamPuan':
            aValue = a.toplamPuan || 0;
            bValue = b.toplamPuan || 0;
            break;
          default:
            aValue = new Date(a.tamamlanmaTarihi || a.olusturulmaTarihi);
            bValue = new Date(b.tamamlanmaTarihi || b.olusturulmaTarihi);
        }

        return filters.sortOrder === 'asc'
          ? aValue > bValue
            ? 1
            : -1
          : aValue < bValue
            ? 1
            : -1;
      });
    }

    // Group back by machine - Optimized
    const groupedData = {};

    // Initialize machines
    Object.keys(controlData).forEach(machineKey => {
      groupedData[machineKey] = {
        ...controlData[machineKey],
        tasks: [],
      };
    });

    // Add filtered tasks
    filteredTasks.forEach(task => {
      if (groupedData[task.machineKey]) {
        groupedData[task.machineKey].tasks.push(task);
      }
    });

    return groupedData;
  }, [controlData, allTasks, filters, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    const total = allTasks.length;
    const filtered = Object.values(filteredAndSortedData || {}).reduce(
      (sum, machineData) => sum + machineData.tasks.length,
      0,
    );

    const byStatus = allTasks.reduce((acc, task) => {
      acc[task.durum] = (acc[task.durum] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      filtered,
      tamamlandi: byStatus.tamamlandi || 0,
      onaylandi: byStatus.onaylandi || 0,
      reddedildi: byStatus.reddedildi || 0,
    };
  }, [allTasks, filteredAndSortedData]);

  return {
    filters,
    setFilters,
    filteredAndSortedData,
    stats,
    allTasks,
  };
};
