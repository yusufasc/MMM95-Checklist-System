import React, { useState } from 'react';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useInventoryData } from '../hooks/useInventoryData';

// Components
import DashboardCards from '../components/Dashboard/DashboardCards';
import CategoryDialog from '../components/Inventory/CategoryDialog';
import ExcelUploadDialog from '../components/Inventory/ExcelUploadDialog';
import FieldTemplateDialog from '../components/Inventory/FieldTemplateDialog';
import InventoryActions from '../components/Inventory/InventoryActions';
import InventoryFilters from '../components/Inventory/InventoryFilters';
import InventoryTable from '../components/Inventory/InventoryTable';
import ItemDialog from '../components/Inventory/ItemDialog';

const Inventory = () => {
  const { hasModulePermission } = useAuth();

  // Custom hook ile tÃ¼m data ve iÅŸlemler
  const {
    loading,
    categories,
    items,
    fieldTemplates,
    pagination,
    dashboard,
    departments,
    users,
    filters,
    sortConfig,
    page,
    rowsPerPage,
    selectedItems,
    view,
    error,
    success,
    actionLoading,
    setView,
    setError,
    setSuccess,
    loadFieldTemplates,
    handleFilterChange,
    clearFilters,
    handleSort,
    handlePageChange,
    handleRowsPerPageChange,
    handleSelectItem,
    handleSelectAll,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    handleBulkDelete,
    downloadExcelTemplate,
    exportExcel,
    createFieldTemplate,
  } = useInventoryData();

  // Dialog state'leri
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [excelUploadOpen, setExcelUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Yetki kontrolleri
  const canEdit = hasModulePermission('Envanter YÃ¶netimi', 'duzenleyebilir');
  const canView = hasModulePermission('Envanter YÃ¶netimi');

  if (!canView) {
    return (
      <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
        <Alert severity='error'>Bu sayfaya eriÅŸim yetkiniz yok.</Alert>
      </Container>
    );
  }

  // Dialog iÅŸlemleri
  const handleCategoryCreate = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleCategoryEdit = category => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleItemCreate = async () => {
    if (categories.length === 0) {
      setError('Ã–nce en az bir kategori oluÅŸturmalÄ±sÄ±nÄ±z');
      return;
    }
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleItemEdit = async item => {
    console.log('ğŸ¯ handleItemEdit called with item:', item);

    try {
      setSelectedItem(item);

      if (item.kategoriId) {
        // kategoriId object ise _id'yi al, string ise direkt kullan
        const categoryId =
          typeof item.kategoriId === 'object'
            ? item.kategoriId._id
            : item.kategoriId;
        console.log('ğŸ”§ Field templates yÃ¼kleniyor, categoryId:', categoryId);
        console.log(
          'ğŸ” loadFieldTemplates function type:',
          typeof loadFieldTemplates,
        );
        console.log('ğŸ” loadFieldTemplates function:', loadFieldTemplates);

        console.log('â³ About to call loadFieldTemplates...');
        await loadFieldTemplates(categoryId);
        console.log('âœ… loadFieldTemplates completed successfully');
      }

      setItemDialogOpen(true);
      console.log('âœ… Item dialog opened successfully');
    } catch (error) {
      console.error('âŒ Error in handleItemEdit:', error);
      console.error('ğŸ” Error stack:', error.stack);
      setError('Field templates yÃ¼klenirken hata oluÅŸtu: ' + error.message);
    }
  };

  const handleFieldTemplateManagement = category => {
    setSelectedCategory(category);
    setFieldDialogOpen(true);
  };

  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        open={actionLoading}
      >
        <CircularProgress color='inherit' />
      </Backdrop>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <InventoryIcon
              sx={{ mr: 2, verticalAlign: 'middle', color: '#1976d2' }}
            />
            Envanter YÃ¶netimi
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            Ekipman ve envanter kayÄ±tlarÄ±nÄ±zÄ± yÃ¶netin
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* View Toggle */}
          <Button
            variant={view === 'dashboard' ? 'contained' : 'outlined'}
            startIcon={<DashboardIcon />}
            onClick={() => setView('dashboard')}
            size='small'
          >
            Dashboard
          </Button>
          <Button
            variant={view === 'table' ? 'contained' : 'outlined'}
            startIcon={<InventoryIcon />}
            onClick={() => setView('table')}
            size='small'
          >
            Tablo
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <DashboardCards
          dashboard={dashboard}
          categories={categories}
          onCategoryEdit={handleCategoryEdit}
          onCategoryDelete={deleteCategory}
          onCategoryCreate={handleCategoryCreate}
          onFieldTemplateManagement={handleFieldTemplateManagement}
          onExcelTemplateDownload={downloadExcelTemplate}
          onExcelExport={exportExcel}
          canEdit={canEdit}
          loading={loading}
        />
      )}

      {/* Table View */}
      {view === 'table' && (
        <>
          <InventoryFilters
            filters={filters}
            categories={categories}
            users={users}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />

          <InventoryTable
            loading={loading}
            items={items}
            fieldTemplates={fieldTemplates}
            pagination={pagination}
            sortConfig={sortConfig}
            selectedItems={selectedItems}
            page={page}
            rowsPerPage={rowsPerPage}
            canEdit={canEdit}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onItemEdit={handleItemEdit}
            onItemDelete={deleteItem}
            onBulkDelete={handleBulkDelete}
          />
        </>
      )}

      {/* Speed Dial Actions */}
      <InventoryActions
        canEdit={canEdit}
        onItemCreate={handleItemCreate}
        onCategoryCreate={handleCategoryCreate}
        onExcelUploadOpen={() => setExcelUploadOpen(true)}
      />

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        category={selectedCategory}
        onSave={async categoryData => {
          if (selectedCategory) {
            await updateCategory(selectedCategory._id, categoryData);
          } else {
            await createCategory(categoryData);
          }
        }}
      />

      <ItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        item={selectedItem}
        categories={categories}
        fieldTemplates={fieldTemplates}
        departments={departments}
        users={users}
        onCategoryChange={loadFieldTemplates}
        onSave={async itemData => {
          if (selectedItem) {
            await updateItem(selectedItem._id, itemData);
          } else {
            await createItem(itemData);
          }
        }}
      />

      <FieldTemplateDialog
        open={fieldDialogOpen}
        onClose={() => setFieldDialogOpen(false)}
        category={selectedCategory}
        categories={categories}
        onSave={async fieldData => {
          if (selectedCategory) {
            await createFieldTemplate(selectedCategory._id, fieldData);
          }
        }}
      />

      <ExcelUploadDialog
        open={excelUploadOpen}
        onClose={() => setExcelUploadOpen(false)}
        categories={categories}
        onUploadSuccess={result => {
          setSuccess(
            `${result.basariliSayisi} Ã¶ÄŸe baÅŸarÄ±yla yÃ¼klendi. ${result.hataSayisi} hata oluÅŸtu.`,
          );
        }}
      />
    </Container>
  );
};

export default Inventory;

