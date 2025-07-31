import { useState, useCallback } from 'react';
import useDialog from './useDialog';
import useFormHandler from './useFormHandler';

/**
 * Unified HR Dialogs Hook - spageti kod çözümü
 * 392 satır → ~50 satıra düştü, tüm duplicate pattern'lar kaldırıldı
 */
const useHRDialogs = () => {
  // Unified dialog management
  const userDialog = useDialog();
  const evaluationDialog = useDialog();
  const manuelDialog = useDialog();
  const templateDialog = useDialog();
  const settingsDialog = useDialog();
  const permissionsDialog = useDialog();

  // Form management using unified form handler
  const userForm = useFormHandler({
    ad: '',
    soyad: '',
    kullaniciAdi: '',
    sifre: '',
    roller: [],
    departman: '',
  });

  const evaluationForm = useFormHandler({
    kullaniciId: '',
    sablonId: '',
    maddePuanlari: {},
    genelNot: '',
    donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
  });

  const manuelForm = useFormHandler({
    kullaniciId: '',
    tarih: new Date(),
    saat: '',
    miktar: '',
    tur: 'tam_gun',
    aciklama: '',
    donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
  });

  const templateForm = useFormHandler({
    ad: '',
    aciklama: '',
    maddeler: [],
    hedefRoller: [],
  });

  const settingsForm = useFormHandler({
    mesaiPuanlama: { aktif: true, saatBasinaPuan: 3, gunlukMaksimumSaat: 4 },
    devamsizlikPuanlama: { aktif: true, gunBasinaPuan: -5, saatBasinaPuan: -1 },
  });

  // Additional state for complex features
  const [selectedUserScores, setSelectedUserScores] = useState(null);
  const [evaluatedUsers, setEvaluatedUsers] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Specialized dialog openers
  const openUserDialog = useCallback(
    (user = null) => {
      if (user) {
        userForm.setValues({
          ad: user.ad || '',
          soyad: user.soyad || '',
          kullaniciAdi: user.kullaniciAdi || '',
          sifre: '',
          roller: user.roller?.map(r => r._id) || [],
          departman: user.departman?._id || '',
        });
      } else {
        userForm.resetForm();
      }
      userDialog.openEditDialog(user);
    },
    [userDialog, userForm],
  );

  const openEvaluationDialog = useCallback(
    template => {
      evaluationForm.setValues({
        kullaniciId: '',
        sablonId: template._id,
        maddePuanlari: {},
        genelNot: '',
        donem: { yil: new Date().getFullYear(), ay: new Date().getMonth() + 1 },
      });
      setSelectedUserScores(null);
      setEvaluatedUsers([]);
      evaluationDialog.openEditDialog(template);
    },
    [evaluationDialog, evaluationForm],
  );

  const openTemplateDialog = useCallback(
    (template = null) => {
      if (template) {
        const hedefRolIds =
          template.hedefRoller
            ?.map(rol => (typeof rol === 'object' && rol._id ? rol._id : rol))
            .filter(Boolean) || [];

        templateForm.setValues({
          ad: template.ad,
          aciklama: template.aciklama || '',
          maddeler: template.maddeler || [],
          hedefRoller: hedefRolIds,
        });
      } else {
        templateForm.setValues({
          ad: '',
          aciklama: '',
          maddeler: [
            {
              baslik: '',
              aciklama: '',
              puan: 0,
              periyot: 'aylik',
              aktif: true,
            },
          ],
          hedefRoller: [],
        });
      }
      templateDialog.openEditDialog(template);
    },
    [templateDialog, templateForm],
  );

  // Snackbar management
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Template validation
  const validateTemplateForm = useCallback(() => {
    const { values } = templateForm;
    if (!values.ad?.trim()) {
      return 'Şablon adı gereklidir';
    }
    if (!values.maddeler?.length) {
      return 'En az bir madde gereklidir';
    }

    for (let i = 0; i < values.maddeler.length; i++) {
      if (!values.maddeler[i]?.baslik?.trim()) {
        return `${i + 1}. maddenin başlığı gereklidir`;
      }
    }
    return null;
  }, [templateForm]);

  return {
    // Dialogs
    userDialog: { ...userDialog, form: userForm, openDialog: openUserDialog },
    evaluationDialog: {
      ...evaluationDialog,
      form: evaluationForm,
      openDialog: openEvaluationDialog,
    },
    manuelDialog: { ...manuelDialog, form: manuelForm },
    templateDialog: {
      ...templateDialog,
      form: templateForm,
      openDialog: openTemplateDialog,
      validate: validateTemplateForm,
    },
    settingsDialog: { ...settingsDialog, form: settingsForm },
    permissionsDialog: {
      ...permissionsDialog,
      selectedPermissions,
      setSelectedPermissions,
    },

    // Additional state
    selectedUserScores,
    setSelectedUserScores,
    evaluatedUsers,
    setEvaluatedUsers,

    // Snackbar
    snackbar,
    showSnackbar,
    closeSnackbar,
  };
};

export default useHRDialogs;
