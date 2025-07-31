import { useState } from 'react';

const useHRFilters = () => {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterUser, setFilterUser] = useState('');

  const setFilters = filters => {
    if (filters.year !== undefined) {
      setFilterYear(filters.year);
    }
    if (filters.month !== undefined) {
      setFilterMonth(filters.month);
    }
    if (filters.user !== undefined) {
      setFilterUser(filters.user);
    }
  };

  const resetFilters = () => {
    setFilterYear(new Date().getFullYear());
    setFilterMonth(new Date().getMonth() + 1);
    setFilterUser('');
  };

  return {
    filterYear,
    filterMonth,
    filterUser,
    setFilterYear,
    setFilterMonth,
    setFilterUser,
    setFilters,
    resetFilters,
  };
};

export default useHRFilters;
