import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  formatCurrency,
  formatDate,
  truncateText,
  getStatusLabel,
  getStatusColor,
  getStatusIconName,
  ROWS_PER_PAGE_OPTIONS,
} from '../../utils/inventoryConfig';

// Icon mapping function
const getStatusIcon = status => {
  const iconName = getStatusIconName(status);
  const iconProps = { fontSize: 'small' };

  switch (iconName) {
    case 'CheckCircle':
      return <CheckCircleIcon {...iconProps} />;
    case 'Build':
      return <BuildIcon {...iconProps} />;
    case 'Warning':
      return <WarningIcon {...iconProps} />;
    case 'Cancel':
      return <CancelIcon {...iconProps} />;
    case 'Schedule':
      return <ScheduleIcon {...iconProps} />;
    case 'Inventory':
    default:
      return <InventoryIcon {...iconProps} />;
  }
};

const InventoryTable = ({
  loading,
  items,
  pagination,
  sortConfig,
  selectedItems,
  page,
  rowsPerPage,
  canEdit,
  onSort,
  onPageChange,
  onRowsPerPageChange,
  onSelectItem,
  onSelectAll,
  onItemEdit,
  onItemDelete,
  onBulkDelete,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} variant='text' height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        {/* Tablo Başlığı ve Toplu İşlemler */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant='h6'>
              Envanter Listesi ({pagination?.totalItems || 0})
            </Typography>
            {selectedItems.length > 0 && (
              <Typography variant='body2' color='primary'>
                {selectedItems.length} öğe seçildi
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedItems.length > 0 && canEdit && (
              <Button
                variant='outlined'
                color='error'
                startIcon={<DeleteIcon />}
                onClick={onBulkDelete}
                size='small'
              >
                Seçilenleri Sil
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding='checkbox'>
                  <Checkbox
                    indeterminate={
                      selectedItems.length > 0 &&
                      selectedItems.length < items.length
                    }
                    checked={
                      items.length > 0 && selectedItems.length === items.length
                    }
                    onChange={onSelectAll}
                  />
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'envanterKodu'}
                    direction={sortConfig.direction}
                    onClick={() => onSort('envanterKodu')}
                  >
                    Envanter Kodu
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'ad'}
                    direction={sortConfig.direction}
                    onClick={() => onSort('ad')}
                  >
                    Ad
                  </TableSortLabel>
                </TableCell>

                <TableCell>Kategori</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Lokasyon</TableCell>
                <TableCell>Sorumlu</TableCell>

                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'guncelDeger'}
                    direction={sortConfig.direction}
                    onClick={() => onSort('guncelDeger')}
                  >
                    Değer
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'olusturmaTarihi'}
                    direction={sortConfig.direction}
                    onClick={() => onSort('olusturmaTarihi')}
                  >
                    Oluşturma
                  </TableSortLabel>
                </TableCell>

                <TableCell align='center'>İşlemler</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map(item => (
                <TableRow
                  key={item._id}
                  hover
                  selected={selectedItems.includes(item._id)}
                >
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={selectedItems.includes(item._id)}
                      onChange={() => onSelectItem(item._id)}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      {item.envanterKodu}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography variant='body2' fontWeight='medium'>
                        {item.ad}
                      </Typography>
                      {item.aciklama && (
                        <Typography variant='caption' color='text.secondary'>
                          {truncateText(item.aciklama, 50)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    {item.kategoriId && (
                      <Chip
                        label={item.kategoriId.ad}
                        size='small'
                        sx={{
                          backgroundColor: item.kategoriId.renk + '20',
                          color: item.kategoriId.renk,
                          border: `1px solid ${item.kategoriId.renk}40`,
                        }}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={getStatusIcon(item.durum)}
                      label={getStatusLabel(item.durum)}
                      color={getStatusColor(item.durum)}
                      size='small'
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant='body2'>
                      {item.lokasyon || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.sorumluKisi ? (
                      <Typography variant='body2'>
                        {item.sorumluKisi.ad} {item.sorumluKisi.soyad}
                      </Typography>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        -
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      {formatCurrency(item.guncelDeger)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant='body2'>
                      {formatDate(item.olusturmaTarihi)}
                    </Typography>
                  </TableCell>

                  <TableCell align='center'>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title='Görüntüle'>
                        <IconButton
                          size='small'
                          onClick={() => onItemEdit(item)}
                        >
                          <ViewIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>

                      {canEdit && (
                        <>
                          <Tooltip title='Düzenle'>
                            <IconButton
                              size='small'
                              onClick={() => onItemEdit(item)}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title='Sil'>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => onItemDelete(item._id)}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align='center' sx={{ py: 6 }}>
                    <Typography variant='h6' color='text.secondary'>
                      Envanter öğesi bulunamadı
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mt: 1 }}
                    >
                      Filtreleri temizleyerek tekrar deneyin veya yeni envanter
                      ekleyin
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          component='div'
          count={pagination?.totalItems || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage='Sayfa başına:'
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
          }
        />
      </CardContent>
    </Card>
  );
};

InventoryTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      envanterKodu: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      aciklama: PropTypes.string,
      durum: PropTypes.string.isRequired,
      lokasyon: PropTypes.string,
      guncelDeger: PropTypes.number,
      olusturmaTarihi: PropTypes.string.isRequired,
      kategoriId: PropTypes.shape({
        ad: PropTypes.string.isRequired,
        renk: PropTypes.string.isRequired,
      }),
      sorumluKisi: PropTypes.shape({
        ad: PropTypes.string,
        soyad: PropTypes.string,
      }),
    }),
  ).isRequired,
  pagination: PropTypes.shape({
    totalItems: PropTypes.number.isRequired,
  }).isRequired,
  sortConfig: PropTypes.shape({
    field: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
  selectedItems: PropTypes.arrayOf(PropTypes.string).isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onSort: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  onSelectItem: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onItemEdit: PropTypes.func.isRequired,
  onItemDelete: PropTypes.func.isRequired,
  onBulkDelete: PropTypes.func.isRequired,
};

export default InventoryTable;
