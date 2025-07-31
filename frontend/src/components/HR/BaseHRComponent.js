import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import LoadingWrapper from '../common/LoadingWrapper';
import useApiCall from '../../hooks/useApiCall';
import useDialog from '../../hooks/useDialog';

/**
 * Base HR Component - spageti kod çözümü
 * HR modülündeki tüm duplicate pattern'ları birleştir
 */
const BaseHRComponent = ({
  title,
  apiEndpoint,
  columns,
  renderRowData,
  onAdd,
  onEdit,
  onDelete,
  showActions = true,
  additionalActions = [],
  cardView = false,
}) => {
  const {
    data,
    loading,
    error,
    refetch: _refetch,
  } = useApiCall(() => fetch(apiEndpoint).then(res => res.json()));
  const { openConfirm } = useDialog();

  const handleDelete = item => {
    openConfirm({
      title: 'Silme Onayı',
      message: `${item.ad || item.isim || 'Bu öğeyi'} silmek istediğinizden emin misiniz?`,
      onConfirm: () => onDelete(item),
    });
  };

  const renderTableView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell key={column.field} align={column.align || 'left'}>
                {column.headerName}
              </TableCell>
            ))}
            {showActions && <TableCell align='center'>İşlemler</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map(item => (
            <TableRow key={item._id || item.id}>
              {columns.map(column => (
                <TableCell key={column.field} align={column.align || 'left'}>
                  {renderRowData
                    ? renderRowData(item, column)
                    : item[column.field]}
                </TableCell>
              ))}
              {showActions && (
                <TableCell align='center'>
                  <Box
                    sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}
                  >
                    {onEdit && (
                      <IconButton
                        size='small'
                        onClick={() => onEdit(item)}
                        color='primary'
                      >
                        <EditIcon fontSize='small' />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        size='small'
                        onClick={() => handleDelete(item)}
                        color='error'
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    )}
                    {additionalActions.map((action, index) => (
                      <IconButton
                        key={index}
                        size='small'
                        onClick={() => action.onClick(item)}
                        color={action.color || 'default'}
                        title={action.title}
                      >
                        {action.icon}
                      </IconButton>
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
    <Grid container spacing={2}>
      {data?.map(item => (
        <Grid item xs={12} sm={6} md={4} key={item._id || item.id}>
          <Card>
            <CardContent>
              {columns.map(column => (
                <Typography key={column.field} variant='body2' sx={{ mb: 1 }}>
                  <strong>{column.headerName}:</strong>{' '}
                  {renderRowData
                    ? renderRowData(item, column)
                    : item[column.field]}
                </Typography>
              ))}
              {showActions && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {onEdit && (
                    <Button
                      size='small'
                      onClick={() => onEdit(item)}
                      startIcon={<EditIcon />}
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
        </Grid>
      ))}
    </Grid>
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
          <Typography variant='h5' fontWeight='bold'>
            {title}
          </Typography>
          {onAdd && (
            <Button variant='contained' startIcon={<AddIcon />} onClick={onAdd}>
              Yeni Ekle
            </Button>
          )}
        </Box>

        <Card>
          <CardContent>
            {cardView ? renderCardView() : renderTableView()}
          </CardContent>
        </Card>
      </Box>
    </LoadingWrapper>
  );
};

export default BaseHRComponent;
