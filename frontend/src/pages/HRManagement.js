import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useHRManagementData } from '../hooks/useHRManagementData';
import { useHRManagementDialogs } from '../hooks/useHRManagementDialogs';

import TemplatesTab from '../components/HRManagement/TemplatesTab';
import SettingsTab from '../components/HRManagement/SettingsTab';
import RolePermissionsTab from '../components/HRManagement/RolePermissionsTab';
import TemplateDialog from '../components/HRManagement/TemplateDialog';
import SettingsDialog from '../components/HRManagement/SettingsDialog';
import PermissionsDialog from '../components/HRManagement/PermissionsDialog';

const HRManagement = () => {
  const { hasModulePermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState(0);

  // Data management hook
  const {
    templates,
    settings,
    roles,
    loading,
    loadData,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings,
    updateRolePermissions,
  } = useHRManagementData();

  // Dialog management hook
  const {
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
    updateDialogRolePermissions,

    // Snackbar
    snackbar,
    showSnackbar,
    closeSnackbar,
  } = useHRManagementDialogs();

  // Load data on component mount
  useEffect(() => {
    if (hasModulePermission('İnsan Kaynakları Yönetimi', 'duzenleyebilir')) {
      console.log('🔧 Frontend: Loading HR Management data...');
      loadData().then(success => {
        if (!success) {
          showSnackbar('Veri yüklenirken hata oluştu', 'error');
        }
      });
    }
  }, [hasModulePermission, loadData, showSnackbar]);

  // Permission check
  if (!hasModulePermission('İnsan Kaynakları Yönetimi', 'duzenleyebilir')) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        Bu sayfaya erişim yetkiniz yok
      </Alert>
    );
  }

  // Template handlers
  const handleTemplateSubmit = async () => {
    const validationError = validateTemplateForm();
    if (validationError) {
      showSnackbar(validationError, 'error');
      return;
    }

    const result = templateDialog.template
      ? await updateTemplate(templateDialog.template._id, templateForm)
      : await createTemplate(templateForm);

    showSnackbar(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      closeTemplateDialog();
    }
  };

  const handleDeleteTemplate = async id => {
    if (window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      const result = await deleteTemplate(id);
      showSnackbar(result.message, result.success ? 'success' : 'error');
    }
  };

  // Settings handlers
  const handleSettingsSubmit = async () => {
    const result = await updateSettings(settingsForm);
    showSnackbar(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      closeSettingsDialog();
    }
  };

  // Permissions handlers
  const handlePermissionsSubmit = async () => {
    if (!permissionsDialog.role) {
      console.log('❌ Role missing in permissions dialog');
      return;
    }

    console.log('🔧 Frontend: Submitting permissions:', {
      roleId: permissionsDialog.role._id,
      roleName: permissionsDialog.role.ad,
      selectedPermissions,
    });

    const result = await updateRolePermissions(
      permissionsDialog.role._id,
      selectedPermissions,
    );

    console.log('📤 Frontend: Submit result:', result);

    showSnackbar(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      closePermissionsDialog();
    }
  };

  const handleEditPermissions = (role, currentPermissions) => {
    openPermissionsDialog(role, currentPermissions);
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          fontWeight='bold'
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          İnsan Kaynakları Yönetimi
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Personel değerlendirme şablonları, puanlama ayarları ve rol
          yetkilerini yönetin
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'medium',
            },
            '& .Mui-selected': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            },
          }}
        >
          <Tab
            icon={<PeopleIcon />}
            iconPosition='start'
            label='Değerlendirme Şablonları'
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition='start'
            label='Puanlama Ayarları'
          />
          <Tab
            icon={<SecurityIcon />}
            iconPosition='start'
            label='Rol Yetkileri'
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <TemplatesTab
          templates={templates}
          roles={roles}
          onAddTemplate={() => openTemplateDialog()}
          onEditTemplate={openTemplateDialog}
          onDeleteTemplate={handleDeleteTemplate}
        />
      )}

      {activeTab === 1 && (
        <SettingsTab
          settings={settings}
          onEditSettings={() => openSettingsDialog(settings)}
        />
      )}

      {activeTab === 2 && (
        <RolePermissionsTab
          roles={roles}
          settings={settings}
          onEditPermissions={handleEditPermissions}
        />
      )}

      {/* Dialogs */}
      <TemplateDialog
        open={templateDialog.open}
        onClose={closeTemplateDialog}
        template={templateDialog.template}
        templateForm={templateForm}
        roles={roles}
        onFormChange={updateTemplateForm}
        onMaddelerChange={updateTemplateMadde}
        onAddMadde={addTemplateMadde}
        onRemoveMadde={removeTemplateMadde}
        onSubmit={handleTemplateSubmit}
      />

      <SettingsDialog
        open={settingsDialog.open}
        onClose={closeSettingsDialog}
        settingsForm={settingsForm}
        onSettingsChange={updateSettingsForm}
        onSubmit={handleSettingsSubmit}
      />

      <PermissionsDialog
        open={permissionsDialog.open}
        onClose={closePermissionsDialog}
        role={permissionsDialog.role}
        roles={roles}
        selectedPermissions={selectedPermissions}
        onPermissionChange={updatePermissions}
        onRolePermissionChange={updateDialogRolePermissions}
        onSubmit={handlePermissionsSubmit}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HRManagement;
