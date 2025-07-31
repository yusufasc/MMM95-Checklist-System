import { useState, useCallback } from 'react';

export const useHRManagementDialogs = () => {
  // Template dialog state
  const [templateDialog, setTemplateDialog] = useState({
    open: false,
    template: null,
  });

  const [templateForm, setTemplateForm] = useState({
    ad: '',
    aciklama: '',
    maddeler: [],
    hedefRoller: [],
  });

  // Settings dialog state
  const [settingsDialog, setSettingsDialog] = useState({ open: false });
  const [settingsForm, setSettingsForm] = useState({
    mesaiPuanlama: { aktif: true, saatBasinaPuan: 3, gunlukMaksimumSaat: 4 },
    devamsizlikPuanlama: { aktif: true, gunBasinaPuan: -5, saatBasinaPuan: -1 },
  });

  // Permissions dialog state
  const [permissionsDialog, setPermissionsDialog] = useState({
    open: false,
    role: null,
  });
  const [selectedPermissions, setSelectedPermissions] = useState({});

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Template Dialog Functions
  const openTemplateDialog = useCallback((template = null) => {
    if (template) {
      // Backend'den gelen hedef rolleri ID'lere çevir
      const hedefRolIds = template.hedefRoller
        ? template.hedefRoller
            .map(rol => {
              if (typeof rol === 'object' && rol._id) {
                return rol._id;
              }
              return rol;
            })
            .filter(Boolean)
        : [];

      setTemplateForm({
        ad: template.ad,
        aciklama: template.aciklama || '',
        maddeler: template.maddeler || [],
        hedefRoller: hedefRolIds,
      });
    } else {
      setTemplateForm({
        ad: '',
        aciklama: '',
        maddeler: [
          { baslik: '', aciklama: '', puan: 0, periyot: 'aylik', aktif: true },
        ],
        hedefRoller: [],
      });
    }
    setTemplateDialog({ open: true, template });
  }, []);

  const closeTemplateDialog = useCallback(() => {
    setTemplateDialog({ open: false, template: null });
  }, []);

  const updateTemplateForm = useCallback((field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const addTemplateMadde = useCallback(() => {
    setTemplateForm(prev => ({
      ...prev,
      maddeler: [
        ...prev.maddeler,
        { baslik: '', aciklama: '', puan: 0, periyot: 'aylik', aktif: true },
      ],
    }));
  }, []);

  const updateTemplateMadde = useCallback((index, field, value) => {
    setTemplateForm(prev => {
      const newMaddeler = [...prev.maddeler];
      newMaddeler[index] = { ...newMaddeler[index], [field]: value };
      return { ...prev, maddeler: newMaddeler };
    });
  }, []);

  const removeTemplateMadde = useCallback(index => {
    setTemplateForm(prev => ({
      ...prev,
      maddeler: prev.maddeler.filter((_, i) => i !== index),
    }));
  }, []);

  // Settings Dialog Functions
  const openSettingsDialog = useCallback(currentSettings => {
    setSettingsForm({
      mesaiPuanlama: currentSettings?.mesaiPuanlama || {
        aktif: true,
        saatBasinaPuan: 3,
        gunlukMaksimumSaat: 4,
      },
      devamsizlikPuanlama: currentSettings?.devamsizlikPuanlama || {
        aktif: true,
        gunBasinaPuan: -5,
        saatBasinaPuan: -1,
      },
    });
    setSettingsDialog({ open: true });
  }, []);

  const closeSettingsDialog = useCallback(() => {
    setSettingsDialog({ open: false });
  }, []);

  const updateSettingsForm = useCallback((section, field, value) => {
    setSettingsForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }, []);

  // Permissions Dialog Functions
  const openPermissionsDialog = useCallback((role, currentPermissions = {}) => {
    setSelectedPermissions(currentPermissions);
    setPermissionsDialog({ open: true, role });
  }, []);

  const closePermissionsDialog = useCallback(() => {
    setPermissionsDialog({ open: false, role: null });
    setSelectedPermissions({});
  }, []);

  const updatePermissions = useCallback((permission, value) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permission]: value,
    }));
  }, []);

  const updateRolePermissions = useCallback((permission, roleId, checked) => {
    setSelectedPermissions(prev => {
      const current = prev[permission] || [];
      if (checked) {
        return {
          ...prev,
          [permission]: [...current, roleId],
        };
      } else {
        return {
          ...prev,
          [permission]: current.filter(id => id !== roleId),
        };
      }
    });
  }, []);

  // Snackbar Functions
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Validation Functions
  const validateTemplateForm = useCallback(() => {
    if (!templateForm.ad.trim()) {
      return 'Şablon adı gereklidir';
    }
    if (!templateForm.maddeler || templateForm.maddeler.length === 0) {
      return 'En az bir madde gereklidir';
    }
    for (let i = 0; i < templateForm.maddeler.length; i++) {
      const madde = templateForm.maddeler[i];
      if (!madde.baslik.trim()) {
        return `${i + 1}. maddenin başlığı gereklidir`;
      }
    }
    return null;
  }, [templateForm]);

  return {
    // Template Dialog
    templateDialog,
    templateForm,
    openTemplateDialog,
    closeTemplateDialog,
    updateTemplateForm,
    addTemplateMadde,
    updateTemplateMadde,
    removeTemplateMadde,
    validateTemplateForm,

    // Settings Dialog
    settingsDialog,
    settingsForm,
    openSettingsDialog,
    closeSettingsDialog,
    updateSettingsForm,

    // Permissions Dialog
    permissionsDialog,
    selectedPermissions,
    openPermissionsDialog,
    closePermissionsDialog,
    updatePermissions,
    updateRolePermissions,

    // Snackbar
    snackbar,
    showSnackbar,
    closeSnackbar,
  };
};
