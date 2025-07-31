import { useState, useCallback, useReducer } from 'react';

// Checklist items reducer
const checklistItemsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return action.payload;
    case 'TOGGLE_ITEM':
      return state.map((item, index) =>
        index === action.index ? { ...item, yapildi: !item.yapildi } : item,
      );
    case 'UPDATE_ITEM':
      return state.map((item, index) =>
        index === action.payload.index ? { ...item, ...action.payload } : item,
      );
    case 'RESET':
      return [];
    default:
      return state;
  }
};

export const useWorkTaskDialog = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openWizard, setOpenWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  // Completed tasks states
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCompletedTask, setSelectedCompletedTask] = useState(null);
  const [openCompletedDialog, setOpenCompletedDialog] = useState(false);

  const [checklistItems, dispatchChecklistItems] = useReducer(
    checklistItemsReducer,
    [],
  );

  const handleChecklistClick = useCallback(checklist => {
    setSelectedChecklist(checklist);
    setCurrentTaskId(null); // Yeni görev
    dispatchChecklistItems({
      type: 'SET_ITEMS',
      payload: checklist.maddeler.map(madde => ({
        maddeId: madde._id,
        baslik: madde.baslik,
        aciklama: madde.aciklama,
        puan: madde.puan,
        periyot: madde.periyot,
        tamamlandi: false,
      })),
    });

    // Kalıp değişim görevleri için wizard kullan
    const isKalipTask =
      checklist.ad && checklist.ad.toLowerCase().includes('kalıp');
    if (isKalipTask) {
      setOpenWizard(true);
    } else {
      setOpenDialog(true);
    }
    setActiveStep(0);
  }, []);

  const handleNext = useCallback(
    (formData, showSnackbar) => {
      if (activeStep === 0) {
        // Form validasyonu
        if (
          !formData.makinaId ||
          !formData.indirilenKalip ||
          !formData.baglananHamade
        ) {
          showSnackbar('Lütfen makina ve kalıp seçimlerini yapın', 'warning');
          return false;
        }
        if (formData.bakimaGitsinMi && !formData.bakimSebebi) {
          showSnackbar('Bakım sebebi girmelisiniz', 'warning');
          return false;
        }
      }
      setActiveStep(prev => prev + 1);
      return true;
    },
    [activeStep],
  );

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const handleItemCheck = useCallback(index => {
    dispatchChecklistItems({ type: 'TOGGLE_ITEM', index });
  }, []);

  const calculateProgress = useCallback(() => {
    if (checklistItems.length === 0) {
      return 0;
    }
    // Support both 'yapildi' and 'tamamlandi' fields for compatibility
    const completed = checklistItems.filter(
      item => item.yapildi || item.tamamlandi,
    ).length;
    return Math.round((completed / checklistItems.length) * 100);
  }, [checklistItems]);

  // Unified close handler - reduces code duplication
  const resetState = useCallback(() => {
    setSelectedChecklist(null);
    setCurrentTaskId(null);
    setActiveStep(0);
    dispatchChecklistItems({ type: 'RESET' });
  }, []);

  const handleDialogClose = useCallback(() => {
    setOpenDialog(false);
    resetState();
  }, [resetState]);

  const handleWizardClose = useCallback(() => {
    setOpenWizard(false);
    resetState();
  }, [resetState]);

  const handleCompletedTaskClick = useCallback(task => {
    setSelectedCompletedTask(task);
    setOpenCompletedDialog(true);
  }, []);

  const handleCompletedDialogClose = useCallback(() => {
    setOpenCompletedDialog(false);
    setSelectedCompletedTask(null);
  }, []);

  return {
    // Dialog states
    openDialog,
    setOpenDialog,
    openWizard,
    setOpenWizard,
    activeStep,
    setActiveStep,
    selectedChecklist,
    setSelectedChecklist,
    currentTaskId,
    setCurrentTaskId,

    // Completed task states
    showCompleted,
    setShowCompleted,
    selectedCompletedTask,
    openCompletedDialog,

    // Checklist items
    checklistItems,
    dispatchChecklistItems,

    // Actions
    handleChecklistClick,
    handleNext,
    handleBack,
    handleItemCheck,
    calculateProgress,
    handleDialogClose,
    handleWizardClose,
    handleCompletedTaskClick,
    handleCompletedDialogClose,
  };
};
