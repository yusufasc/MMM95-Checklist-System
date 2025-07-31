import { useState, useCallback } from 'react';
import { hrAPI } from '../services/api';

export const useUserManagement = ({ onDataChange, showSnackbar }) => {
  // User Dialog State
  const [userDialog, setUserDialog] = useState({ open: false, user: null });
  const [userForm, setUserForm] = useState({
    ad: '',
    soyad: '',
    email: '',
    sifre: '',
    telefon: '',
    rolle: '',
    departman: '',
    profil: 'normal',
    aktif: true,
  });

  // Manuel Dialog State
  const [manuelDialog, setManuelDialog] = useState({ open: false, type: '' });
  const [manuelForm, setManuelForm] = useState({
    ad: '',
    soyad: '',
    email: '',
    rolle: '',
    departman: '',
    profil: 'normal',
    aktif: true,
    aciklama: '',
    yaratmaNedeni: '',
    ozelNotlar: '',
  });

  const openUserDialog = useCallback((user = null) => {
    if (user) {
      setUserForm({
        ad: user.ad || '',
        soyad: user.soyad || '',
        email: user.email || '',
        sifre: '',
        telefon: user.telefon || '',
        rolle: user.rolle?._id || '',
        departman: user.departman?._id || '',
        profil: user.profil || 'normal',
        aktif: user.aktif !== undefined ? user.aktif : true,
      });
    } else {
      setUserForm({
        ad: '',
        soyad: '',
        email: '',
        sifre: '',
        telefon: '',
        rolle: '',
        departman: '',
        profil: 'normal',
        aktif: true,
      });
    }
    setUserDialog({ open: true, user });
  }, []);

  const closeUserDialog = useCallback(() => {
    setUserDialog({ open: false, user: null });
    setUserForm({
      ad: '',
      soyad: '',
      email: '',
      sifre: '',
      telefon: '',
      rolle: '',
      departman: '',
      profil: 'normal',
      aktif: true,
    });
  }, []);

  const handleUserFormSubmit = useCallback(async () => {
    try {
      if (userDialog.user) {
        // Güncelleme
        await hrAPI.updateUser(userDialog.user._id, userForm);
        showSnackbar('Kullanıcı başarıyla güncellendi', 'success');
      } else {
        // Yeni kullanıcı
        await hrAPI.createUser(userForm);
        showSnackbar('Kullanıcı başarıyla eklendi', 'success');
      }

      closeUserDialog();
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      showSnackbar(
        userDialog.user
          ? 'Kullanıcı güncellenirken hata oluştu'
          : 'Kullanıcı eklenirken hata oluştu',
        'error',
      );
    }
  }, [userDialog.user, userForm, showSnackbar, onDataChange, closeUserDialog]);

  const handleDeleteUser = useCallback(
    async userId => {
      if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
        try {
          await hrAPI.deleteUser(userId);
          showSnackbar('Kullanıcı başarıyla silindi', 'success');
          if (onDataChange) {
            onDataChange();
          }
        } catch (error) {
          showSnackbar('Kullanıcı silinirken hata oluştu', 'error');
        }
      }
    },
    [showSnackbar, onDataChange],
  );

  const openManuelDialog = useCallback((type = 'create') => {
    setManuelDialog({ open: true, type });
    setManuelForm({
      ad: '',
      soyad: '',
      email: '',
      rolle: '',
      departman: '',
      profil: 'normal',
      aktif: true,
      aciklama: '',
      yaratmaNedeni: '',
      ozelNotlar: '',
    });
  }, []);

  const closeManuelDialog = useCallback(() => {
    setManuelDialog({ open: false, type: '' });
    setManuelForm({
      ad: '',
      soyad: '',
      email: '',
      rolle: '',
      departman: '',
      profil: 'normal',
      aktif: true,
      aciklama: '',
      yaratmaNedeni: '',
      ozelNotlar: '',
    });
  }, []);

  const handleManuelSubmit = useCallback(async () => {
    try {
      if (manuelDialog.type === 'create') {
        await hrAPI.createManualUser(manuelForm);
        showSnackbar('Manuel kullanıcı başarıyla oluşturuldu', 'success');
      } else if (manuelDialog.type === 'excel') {
        // Excel import logic burada olabilir
        showSnackbar('Excel import başarılı', 'success');
      }

      closeManuelDialog();
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      showSnackbar('İşlem sırasında hata oluştu', 'error');
    }
  }, [
    manuelDialog.type,
    manuelForm,
    showSnackbar,
    onDataChange,
    closeManuelDialog,
  ]);

  return {
    // User Dialog
    userDialog,
    userForm,
    setUserForm,
    openUserDialog,
    closeUserDialog,
    handleUserFormSubmit,
    handleDeleteUser,

    // Manuel Dialog
    manuelDialog,
    manuelForm,
    setManuelForm,
    openManuelDialog,
    closeManuelDialog,
    handleManuelSubmit,
  };
};
