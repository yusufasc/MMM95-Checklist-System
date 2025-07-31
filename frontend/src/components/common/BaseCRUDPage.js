import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import LoadingWrapper from './LoadingWrapper';
import useApiCall from '../../hooks/useApiCall';
import useDialog from '../../hooks/useDialog';

/**
 * Base CRUD Page Component - spageti kod çözümü
 * Users, Roles, Departments, Machines sayfalarının duplicate pattern'ları
 */
const BaseCRUDPage = ({
  title,
  apiEndpoint,
  columns,
  onAdd,
  onEdit,
  onView,
  onDelete,
  renderCustomCell,
  showActions = true,
  showAddButton = true,
  customActions = [],
  cardView = false,
}) => {
  const {
    data,
    loading,
    error,
    refetch: _refetch,
  } = useApiCall(() => fetch(apiEndpoint).then(res => res.json()));

  const confirmDialog = useDialog();

  const handleDelete = item => {
    confirmDialog.openConfirmDialog({
      title: 'Silme Onayı',
      message: `${item.ad || item.isim || item.name || 'Bu öğeyi'} silmek istediğinizden emin misiniz?`,
      onConfirm: () => onDelete(item),
    });
  };

  const renderTableView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell key={column.key} align={column.align || 'left'}>
                {column.label}
              </TableCell>
            ))}
            {showActions && <TableCell align='center'>İşlemler</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map(item => (
            <TableRow key={item._id || item.id}>
              {columns.map(column => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {renderCustomCell
                    ? renderCustomCell(item, column)
                    : column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                </TableCell>
              ))}
              {showActions && (
                <TableCell align='center'>
                  <Box
                    sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}
                  >
                    {onView && (
                      <Tooltip title='Görüntüle'>
                        <IconButton
                          size='small'
                          onClick={() => onView(item)}
                          color='info'
                        >
                          <ViewIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip title='Düzenle'>
                        <IconButton
                          size='small'
                          onClick={() => onEdit(item)}
                          color='primary'
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title='Sil'>
                        <IconButton
                          size='small'
                          onClick={() => handleDelete(item)}
                          color='error'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                    {customActions.map((action, index) => (
                      <Tooltip key={index} title={action.title}>
                        <IconButton
                          size='small'
                          onClick={() => action.onClick(item)}
                          color={action.color || 'default'}
                        >
                          {action.icon}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardView = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      }}
    >
      {data?.map(item => (
        <Card key={item._id || item.id} sx={{ p: 2 }}>
          <CardContent>
            {columns.map(column => (
              <Box key={column.key} sx={{ mb: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  {column.label}:
                </Typography>
                <Typography variant='body2' sx={{ ml: 1 }}>
                  {renderCustomCell
                    ? renderCustomCell(item, column)
                    : column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                </Typography>
              </Box>
            ))}
            {showActions && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 2,
                  justifyContent: 'flex-end',
                }}
              >
                {onView && (
                  <Button
                    size='small'
                    onClick={() => onView(item)}
                    startIcon={<ViewIcon />}
                  >
                    Görüntüle
                  </Button>
                )}
                {onEdit && (
                  <Button
                    size='small'
                    onClick={() => onEdit(item)}
                    startIcon={<EditIcon />}
                    color='primary'
                  >
                    Düzenle
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size='small'
                    onClick={() => handleDelete(item)}
                    startIcon={<DeleteIcon />}
                    color='error'
                  >
                    Sil
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <LoadingWrapper loading={loading} error={error}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant='h4' fontWeight='bold'>
            {title}
          </Typography>
          {showAddButton && onAdd && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={onAdd}
              size='large'
            >
              Yeni Ekle
            </Button>
          )}
        </Box>

        <Card>
          <CardContent>
            {data?.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='h6' color='text.secondary'>
                  Henüz {title.toLowerCase()} bulunmuyor.
                </Typography>
                {showAddButton && onAdd && (
                  <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    sx={{ mt: 2 }}
                  >
                    İlk {title.split(' ')[0]}'ı Ekle
                  </Button>
                )}
              </Box>
            ) : cardView ? (
              renderCardView()
            ) : (
              renderTableView()
            )}
          </CardContent>
        </Card>
      </Box>
    </LoadingWrapper>
  );
};

export default BaseCRUDPage;
