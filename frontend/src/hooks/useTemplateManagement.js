import { useState, useEffect, useCallback } from 'react';
import { qualityControlAPI, rolesAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
  INITIAL_TEMPLATE_FORM_DATA,
  INITIAL_ITEM_FORM_DATA,
  createTemplatePayload,
} from '../utils/templatesConfig';

export const useTemplateManagement = () => {
  const { showSnackbar } = useSnackbar();

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data states
  const [templates, setTemplates] = useState([]);
  const [roles, setRoles] = useState([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Form states
  const [formData, setFormData] = useState(INITIAL_TEMPLATE_FORM_DATA);
  const [itemFormData, setItemFormData] = useState(INITIAL_ITEM_FORM_DATA);

  // Data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, rolesRes] = await Promise.all([
        qualityControlAPI.getTemplates(),
        rolesAPI.getAll(),
      ]);
      setTemplates(templatesRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      showSnackbar(
        `Veriler yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Template operations
  const handleAdd = () => {
    setFormData(INITIAL_TEMPLATE_FORM_DATA);
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = template => {
    // Mevcut maddelere geçici id ekle (düzenleme için)
    const maddelerWithTempIds = (template.maddeler || []).map(
      (madde, index) => ({
        ...madde,
        id: madde._id || `temp_${Date.now()}_${index}`,
      }),
    );

    setFormData({
      ad: template.ad,
      aciklama: template.aciklama,
      rol: template.rol._id,
      aktif: template.aktif,
      maddeler: maddelerWithTempIds,
      degerlendirmeSaatleri: template.degerlendirmeSaatleri || [],
      degerlendirmeSikligi: template.degerlendirmeSikligi || 'Günlük',
      degerlendirmePeriyodu: template.degerlendirmePeriyodu || 2,
    });
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = template => {
    setSelectedTemplate(template);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (forceDelete = false) => {
    try {
      if (forceDelete) {
        await qualityControlAPI.deleteTemplate(selectedTemplate._id, {
          force: true,
        });
        showSnackbar('Şablon ve bağımlılıkları başarıyla silindi', 'success');
      } else {
        await qualityControlAPI.deleteTemplate(selectedTemplate._id);
        showSnackbar('Şablon başarıyla silindi', 'success');
      }

      setDeleteDialogOpen(false);
      setDeleteError(null);
      loadData();
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.canForceDelete
      ) {
        setDeleteError({
          message: error.response.data.message,
          canForceDelete: true,
          dependencyCount: error.response.data.dependencyCount,
        });
      } else {
        showSnackbar(
          `Şablon silinirken hata oluştu: ${error.response?.data?.message || error.message}`,
          'error',
        );
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = createTemplatePayload(formData);

      if (selectedTemplate) {
        await qualityControlAPI.updateTemplate(
          selectedTemplate._id,
          templateData,
        );
        showSnackbar('Şablon başarıyla güncellendi', 'success');
      } else {
        await qualityControlAPI.createTemplate(templateData);
        showSnackbar('Şablon başarıyla oluşturuldu', 'success');
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      showSnackbar(
        'Şablon kaydedilirken hata oluştu: ' +
          (error.response?.data?.message || error.message),
        'error',
      );
    }
  };

  // Form handlers
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemFormChange = (field, value) => {
    setItemFormData(prev => ({ ...prev, [field]: value }));
  };

  // Dialog handlers
  const closeDialog = () => {
    setDialogOpen(false);
    setFormData(INITIAL_TEMPLATE_FORM_DATA);
    setItemFormData(INITIAL_ITEM_FORM_DATA);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  };

  // Items management
  const handleAddItem = () => {
    if (!itemFormData.baslik.trim()) {
      showSnackbar('Madde başlığı gereklidir', 'warning');
      return;
    }

    const newItem = {
      ...itemFormData,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setFormData(prev => ({
      ...prev,
      maddeler: [...prev.maddeler, newItem],
    }));

    setItemFormData(INITIAL_ITEM_FORM_DATA);
  };

  const handleRemoveItem = index => {
    setFormData(prev => ({
      ...prev,
      maddeler: prev.maddeler.filter((_, i) => i !== index),
    }));
  };

  // Schedule management
  const handleAddSchedule = () => {
    if (!formData.newSaat) {
      return;
    }

    const newSaat = {
      saat: formData.newSaat,
      aciklama: formData.newSaatAciklama || 'Değerlendirme',
    };

    setFormData(prev => ({
      ...prev,
      degerlendirmeSaatleri: [...(prev.degerlendirmeSaatleri || []), newSaat],
      newSaat: '',
      newSaatAciklama: '',
    }));
  };

  const handleRemoveSchedule = index => {
    const newSaatler = formData.degerlendirmeSaatleri.filter(
      (_, i) => i !== index,
    );
    setFormData(prev => ({
      ...prev,
      degerlendirmeSaatleri: newSaatler,
    }));
  };

  // Utility functions
  const getTotalScore = maddeler => {
    return maddeler?.reduce((sum, madde) => sum + madde.maksimumPuan, 0) || 0;
  };

  const isFormValid = () => {
    return !!(
      formData.ad.trim() &&
      formData.rol &&
      formData.maddeler.length > 0
    );
  };

  return {
    // Loading state
    loading,

    // Data states
    templates,
    roles,

    // Dialog states
    dialogOpen,
    deleteDialogOpen,
    selectedTemplate,
    deleteError,

    // Form states
    formData,
    itemFormData,

    // Computed values
    totalScore: getTotalScore(formData.maddeler),
    isFormValid: isFormValid(),

    // Template operations
    handleAdd,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleSaveTemplate,

    // Form handlers
    handleFormChange,
    handleItemFormChange,

    // Dialog handlers
    closeDialog,
    closeDeleteDialog,

    // Items management
    handleAddItem,
    handleRemoveItem,

    // Schedule management
    handleAddSchedule,
    handleRemoveSchedule,

    // Utilities
    getTotalScore,
    loadData,
  };
};
