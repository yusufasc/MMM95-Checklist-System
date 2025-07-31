import { useState } from 'react';

export const useMyActivityFilters = () => {
  // Detailed activity filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    durum: '',
    tarih: '',
  });

  // Score filters
  const [scoreFilters, setScoreFilters] = useState({
    page: 1,
    limit: 10,
    days: 30,
  });

  // Breakdown filters
  const [breakdownFilters, setBreakdownFilters] = useState({
    page: 1,
    limit: 15,
    days: 30,
  });

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset page when filter changes
    }));
  };

  // Handle score filter change
  const handleScoreFilterChange = (field, value) => {
    setScoreFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset page when filter changes
    }));
  };

  // Handle breakdown filter change
  const handleBreakdownFilterChange = (field, value) => {
    setBreakdownFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset page when filter changes
    }));
  };

  // Handle page change
  const handlePageChange = page => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle score page change
  const handleScorePageChange = page => {
    setScoreFilters(prev => ({ ...prev, page }));
  };

  // Handle breakdown page change
  const handleBreakdownPageChange = page => {
    setBreakdownFilters(prev => ({ ...prev, page }));
  };

  return {
    // State
    filters,
    scoreFilters,
    breakdownFilters,

    // Setters
    setFilters,
    setScoreFilters,
    setBreakdownFilters,

    // Handlers
    handleFilterChange,
    handleScoreFilterChange,
    handleBreakdownFilterChange,
    handlePageChange,
    handleScorePageChange,
    handleBreakdownPageChange,
  };
};
