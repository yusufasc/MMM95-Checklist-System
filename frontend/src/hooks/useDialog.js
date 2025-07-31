import { useState, useCallback } from 'react';

/**
 * Ortak dialog management hook - spageti kod çözümü
 * Tüm dialog state management'ları için standardize edilmiş pattern
 */
const useDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mode, setMode] = useState('create'); // 'create', 'edit', 'view'

  const openDialog = useCallback((item = null, dialogMode = 'create') => {
    setSelectedItem(item);
    setMode(dialogMode);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
    setMode('create');
  }, []);

  const openCreateDialog = useCallback(() => {
    openDialog(null, 'create');
  }, [openDialog]);

  const openEditDialog = useCallback(
    item => {
      openDialog(item, 'edit');
    },
    [openDialog],
  );

  const openViewDialog = useCallback(
    item => {
      openDialog(item, 'view');
    },
    [openDialog],
  );

  return {
    isOpen,
    selectedItem,
    mode,
    openDialog,
    closeDialog,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    isCreateMode: mode === 'create',
    isEditMode: mode === 'edit',
    isViewMode: mode === 'view',
  };
};

/**
 * Confirm dialog için özel hook
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Onaylayın',
    message: 'Bu işlemi gerçekleştirmek istediğinizden emin misiniz?',
    confirmText: 'Evet',
    cancelText: 'Hayır',
    onConfirm: () => {},
  });

  const openConfirm = useCallback((options = {}) => {
    setConfig(prev => ({
      ...prev,
      ...options,
    }));
    setIsOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      await config.onConfirm();
      closeConfirm();
    } catch (error) {
      console.error('Confirm action error:', error);
      // Dialog'u açık bırak hata durumunda
    }
  }, [config, closeConfirm]);

  return {
    isOpen,
    config,
    openConfirm,
    closeConfirm,
    handleConfirm,
  };
};

export default useDialog;
