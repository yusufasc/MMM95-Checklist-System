import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Custom Hooks
import { useChecklistsData } from '../hooks/useChecklistsData';
import { useChecklistDialog } from '../hooks/useChecklistDialog';

// Components
import ChecklistHeader from '../components/Checklists/ChecklistHeader';
import ChecklistCard from '../components/Checklists/ChecklistCard';
import ChecklistDialog from '../components/Checklists/ChecklistDialog';
import DeleteDialog from '../components/Checklists/DeleteDialog';

const Checklists = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Data Hook
  const {
    checklists,
    roles,
    departments,
    loading,
    error,
    success,
    loadData,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    forceDeleteChecklist,
    clearMessages,
  } = useChecklistsData();

  // Dialog Hook
  const {
    open,
    editMode,
    editingId,
    formData,
    handleOpen,
    handleEdit,
    handleClose,
    handleChange,
    handleFormChange,
    handleMaddelerChange,
    addMadde,
    removeMadde,
    validateForm,
    handleAddSchedule,
    handleRemoveSchedule,
    deleteDialog,
    deletingChecklist,
    deleteError,
    showForceDelete,
    handleDeleteOpen,
    handleDeleteClose,
    setDeleteErrorState,
  } = useChecklistDialog();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, error, clearMessages]);

  const handleSubmit = async () => {
    console.log('🎯 handleSubmit çağrıldı');
    const validationError = validateForm();
    if (validationError) {
      console.log('❌ Validation hatası:', validationError);
      return;
    }

    console.log('📝 Form verileri:', formData);
    const success = editMode
      ? await updateChecklist(editingId, formData)
      : await createChecklist(formData);

    if (success) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    const result = await deleteChecklist(deletingChecklist._id);

    if (result.success) {
      handleDeleteClose();
    } else if (result.error) {
      setDeleteErrorState(result.error);
    }
  };

  const handleForceDelete = async () => {
    const success = await forceDeleteChecklist(deletingChecklist._id);
    if (success) {
      handleDeleteClose();
    }
  };

  // Loading State
  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='60vh'
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <ChecklistHeader
        checklistCount={checklists.length}
        onAddClick={handleOpen}
      />

      {/* Success/Error Messages */}
      {success && (
        <Alert severity='success' sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Checklists Grid */}
      <Grid container spacing={3}>
        {checklists.map((checklist, index) => (
          <Grid item xs={12} md={6} lg={4} key={checklist._id}>
            <ChecklistCard
              checklist={checklist}
              roles={roles}
              departments={departments}
              onEdit={handleEdit}
              onDelete={handleDeleteOpen}
              index={index}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {checklists.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography variant='h6' gutterBottom>
            Henüz checklist şablonu oluşturulmamış
          </Typography>
          <Typography variant='body2' sx={{ mb: 3 }}>
            İlk checklist şablonunuzu oluşturmak için aşağıdaki butona tıklayın
          </Typography>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            İlk Checklist'i Oluştur
          </Button>
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color='primary'
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Checklist Dialog */}
      <ChecklistDialog
        open={open}
        onClose={handleClose}
        editMode={editMode}
        formData={formData}
        onFormChange={handleChange}
        handleFormChange={handleFormChange}
        onMaddelerChange={handleMaddelerChange}
        onAddMadde={addMadde}
        onRemoveMadde={removeMadde}
        onAddSchedule={handleAddSchedule}
        onRemoveSchedule={handleRemoveSchedule}
        roles={roles}
        departments={departments}
        onSubmit={handleSubmit}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialog}
        onClose={handleDeleteClose}
        checklist={deletingChecklist}
        deleteError={deleteError}
        showForceDelete={showForceDelete}
        onDelete={handleDelete}
        onForceDelete={handleForceDelete}
      />
    </Box>
  );
};

export default Checklists;
