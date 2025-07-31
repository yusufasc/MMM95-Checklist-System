import { useState, useCallback } from 'react';

export const useChecklistDialog = () => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    tur: 'iseBagli',
    hedefRol: '',
    hedefDepartman: '',
    periyot: 'gunluk',
    isTuru: '',
    maddeler: [
      {
        soru: '',
        puan: 5,
        resimUrl: '',
        aciklama: '',
        fotografGereklimi: false,
        zorunlu: true,
      },
    ],
    degerlendirmeSaatleri: [],
    degerlendirmePeriyodu: 2,
    degerlendirmeGunleri: [],
    degerlendirmeSikligi: 'Günlük',
    kontrolPuani: 0,
    aktif: true,
    degerlendirmeRolleri: [],
  });

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingChecklist, setDeletingChecklist] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showForceDelete, setShowForceDelete] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({
      ad: '',
      tur: 'iseBagli',
      hedefRol: '',
      hedefDepartman: '',
      periyot: 'gunluk',
      isTuru: '',
      maddeler: [
        {
          soru: '',
          puan: 5,
          resimUrl: '',
          aciklama: '',
          fotografGereklimi: false,
          zorunlu: true,
        },
      ],
      degerlendirmeSaatleri: [],
      degerlendirmePeriyodu: 2,
      degerlendirmeGunleri: [],
      degerlendirmeSikligi: 'Günlük',
      kontrolPuani: 0,
      aktif: true,
      degerlendirmeRolleri: [],
    });
  }, []);

  const handleOpen = useCallback(() => {
    setEditMode(false);
    setEditingId(null);
    resetForm();
    setOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback(checklist => {
    setEditMode(true);
    setEditingId(checklist._id);
    setFormData({
      ad: checklist.ad,
      tur: checklist.tur,
      hedefRol: checklist.hedefRol?._id || checklist.hedefRol,
      hedefDepartman: checklist.hedefDepartman?._id || checklist.hedefDepartman,
      periyot: checklist.periyot,
      isTuru: checklist.isTuru || '',
      maddeler: checklist.maddeler || [
        {
          soru: '',
          puan: 5,
          resimUrl: '',
          aciklama: '',
          fotografGereklimi: false,
          zorunlu: true,
        },
      ],
      degerlendirmeSaatleri: checklist.degerlendirmeSaatleri || [],
      degerlendirmePeriyodu: checklist.degerlendirmePeriyodu || 2,
      degerlendirmeGunleri: checklist.degerlendirmeGunleri || [],
      degerlendirmeSikligi: checklist.degerlendirmeSikligi || 'Günlük',
      kontrolPuani: checklist.kontrolPuani || 0,
      aktif: checklist.aktif !== undefined ? checklist.aktif : true,
      degerlendirmeRolleri: checklist.degerlendirmeRolleri || [],
    });
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditMode(false);
    setEditingId(null);
  }, []);

  const handleChange = useCallback(e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleMaddelerChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newMaddeler = [...prev.maddeler];
      newMaddeler[index][field] = value;
      return {
        ...prev,
        maddeler: newMaddeler,
      };
    });
  }, []);

  const addMadde = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      maddeler: [
        ...prev.maddeler,
        {
          soru: '',
          puan: 5,
          resimUrl: '',
          aciklama: '',
          fotografGereklimi: false,
          zorunlu: true,
        },
      ],
    }));
  }, []);

  const removeMadde = useCallback(index => {
    setFormData(prev => {
      if (prev.maddeler.length > 1) {
        const newMaddeler = prev.maddeler.filter((_, i) => i !== index);
        return {
          ...prev,
          maddeler: newMaddeler,
        };
      }
      return prev;
    });
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.ad.trim()) {
      return 'Checklist adı gereklidir';
    }

    if (!formData.hedefRol) {
      return 'Hedef rol seçin';
    }

    if (!formData.hedefDepartman) {
      return 'Hedef departman seçin';
    }

    if (formData.tur === 'iseBagli' && !formData.isTuru.trim()) {
      return 'İş türü gereklidir';
    }

    // Kontrol puanı validasyonu
    const kontrolPuani = Number(formData.kontrolPuani);
    if (kontrolPuani < 0 || kontrolPuani > 100) {
      return 'Kontrol puanı 0-100 arasında olmalıdır';
    }

    const emptyMaddeler = formData.maddeler.filter(m => !m.soru.trim());
    if (emptyMaddeler.length > 0) {
      return 'Tüm maddelerin soruları doldurulmalıdır';
    }

    return null;
  }, [formData]);

  // Delete Dialog Functions
  const handleDeleteOpen = useCallback(checklist => {
    setDeletingChecklist(checklist);
    setDeleteDialog(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteDialog(false);
    setDeletingChecklist(null);
    setDeleteError(null);
    setShowForceDelete(false);
  }, []);

  const setDeleteErrorState = useCallback(error => {
    setDeleteError(error);
    setShowForceDelete(error?.canForceDelete || false);
  }, []);

  // Schedule management
  const handleAddSchedule = useCallback((saat, aciklama) => {
    if (!saat) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      degerlendirmeSaatleri: [
        ...prev.degerlendirmeSaatleri,
        { saat, aciklama: aciklama || '' },
      ],
    }));
  }, []);

  const handleRemoveSchedule = useCallback(index => {
    setFormData(prev => ({
      ...prev,
      degerlendirmeSaatleri: prev.degerlendirmeSaatleri.filter(
        (_, i) => i !== index,
      ),
    }));
  }, []);

  const handleFormChange = useCallback((field, value) => {
    // KontrolPuani için özel validasyon
    if (field === 'kontrolPuani') {
      const numValue = Number(value);
      if (numValue < 0) {
        value = 0;
      } else if (numValue > 100) {
        value = 100;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return {
    // Form state
    open,
    editMode,
    editingId,
    formData,

    // Form handlers
    handleOpen,
    handleEdit,
    handleClose,
    handleChange,
    handleFormChange,
    handleMaddelerChange,
    addMadde,
    removeMadde,
    validateForm,
    resetForm,

    // Schedule handlers
    handleAddSchedule,
    handleRemoveSchedule,

    // Delete state
    deleteDialog,
    deletingChecklist,
    deleteError,
    showForceDelete,

    // Delete handlers
    handleDeleteOpen,
    handleDeleteClose,
    setDeleteErrorState,
  };
};
