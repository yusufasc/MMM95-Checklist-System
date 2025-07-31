import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTemplateManagement } from '../../hooks/useTemplateManagement';
import TemplateTable from './Templates/TemplateTable';
import TemplateFormDialog from './Templates/TemplateFormDialog';
import TemplateDeleteDialog from './Templates/TemplateDeleteDialog';
import { BUTTON_STYLES } from '../../utils/templatesConfig';

const QualityControlTemplates = () => {
  const { hasModulePermission } = useAuth();
  const {
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
    totalScore,
    isFormValid,

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
  } = useTemplateManagement();

  const canEdit = hasModulePermission('Kalite Kontrol', 'duzenleyebilir');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Başlık ve Ekle Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
          Değerlendirme Şablonları
        </Typography>
        {canEdit && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={BUTTON_STYLES.primary}
          >
            Yeni Şablon
          </Button>
        )}
      </Box>

      {/* Şablon Tablosu */}
      <TemplateTable
        templates={templates}
        canEdit={canEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Şablon Form Dialog */}
      <TemplateFormDialog
        open={dialogOpen}
        selectedTemplate={selectedTemplate}
        formData={formData}
        itemFormData={itemFormData}
        roles={roles}
        totalScore={totalScore}
        isFormValid={isFormValid}
        onClose={closeDialog}
        onSave={handleSaveTemplate}
        onFormChange={handleFormChange}
        onItemFormChange={handleItemFormChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onAddSchedule={handleAddSchedule}
        onRemoveSchedule={handleRemoveSchedule}
      />

      {/* Silme Onay Dialog */}
      <TemplateDeleteDialog
        open={deleteDialogOpen}
        selectedTemplate={selectedTemplate}
        deleteError={deleteError}
        onClose={closeDeleteDialog}
        onConfirmDelete={confirmDelete}
      />
    </Box>
  );
};

export default QualityControlTemplates;
