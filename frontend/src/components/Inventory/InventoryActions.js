import React from 'react';
import PropTypes from 'prop-types';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

const InventoryActions = ({
  canEdit,
  onItemCreate,
  onCategoryCreate,
  onExcelUploadOpen,
}) => {
  if (!canEdit) {
    return null;
  }

  return (
    <SpeedDial
      ariaLabel='Envanter İşlemleri'
      sx={{ position: 'fixed', bottom: 80, right: 32 }}
      icon={<SpeedDialIcon />}
    >
      <SpeedDialAction
        key='add-item'
        icon={<AddIcon />}
        tooltipTitle='Yeni Envanter Ekle'
        onClick={onItemCreate}
      />
      <SpeedDialAction
        key='add-category'
        icon={<CategoryIcon />}
        tooltipTitle='Kategori Yönetimi'
        onClick={onCategoryCreate}
      />
      <SpeedDialAction
        key='excel-upload'
        icon={<UploadIcon />}
        tooltipTitle='Excel Yükle'
        onClick={onExcelUploadOpen}
      />
    </SpeedDial>
  );
};

InventoryActions.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  onItemCreate: PropTypes.func.isRequired,
  onCategoryCreate: PropTypes.func.isRequired,
  onExcelUploadOpen: PropTypes.func.isRequired,
};

export default InventoryActions;
