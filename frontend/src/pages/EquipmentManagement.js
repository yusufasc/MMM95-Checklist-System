import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useSnackbar } from '../contexts/SnackbarContext';

const EquipmentManagement = () => {
  const [equipments, setEquipments] = useState([]);
  // const [loading, setLoading] = useState(false); // Removed unused variable
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    tip: '',
    durum: 'musait',
    aciklama: '',
    zimmetli: null,
  });

  const { showSnackbar } = useSnackbar();

  const mockEquipments = useMemo(
    () => [
      {
        id: 1,
        ad: 'Laptop Dell XPS',
        tip: 'Elektronik',
        durum: 'musait',
        aciklama: 'İş kullanımı için laptop',
        zimmetli: null,
      },
      {
        id: 2,
        ad: 'Projeksiyon Cihazı',
        tip: 'Görsel',
        durum: 'kullaniliyor',
        aciklama: 'Sunum için kullanılıyor',
        zimmetli: 'Ahmet Yılmaz',
      },
      {
        id: 3,
        ad: 'Yazıcı HP LaserJet',
        tip: 'Ofis',
        durum: 'musait',
        aciklama: 'Ofis yazıcısı',
        zimmetli: null,
      },
    ],
    [],
  );

  const loadEquipments = useCallback(async () => {
    try {
      // Mock data kullanıyoruz
      setTimeout(() => {
        setEquipments(mockEquipments);
      }, 500);
    } catch (error) {
      showSnackbar(
        'Ekipmanlar yüklenirken hata oluştu: ' + error.message,
        'error',
      );
    }
  }, [showSnackbar, mockEquipments]);

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  const handleAdd = () => {
    setSelectedEquipment(null);
    setFormData({
      ad: '',
      tip: '',
      durum: 'musait',
      aciklama: '',
      zimmetli: null,
    });
    setDialogOpen(true);
  };

  const handleEdit = equipment => {
    setSelectedEquipment(equipment);
    setFormData({
      ad: equipment.ad,
      tip: equipment.tip,
      durum: equipment.durum,
      aciklama: equipment.aciklama,
      zimmetli: equipment.zimmetli,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Mock save operation
      showSnackbar(
        selectedEquipment ? 'Ekipman güncellendi' : 'Ekipman eklendi',
        'success',
      );
      setDialogOpen(false);
      loadEquipments();
    } catch (error) {
      showSnackbar('Kaydetme sırasında hata oluştu: ' + error.message, 'error');
    }
  };

  const handleDelete = async _id => {
    try {
      // Mock delete operation
      showSnackbar('Ekipman silindi', 'success');
      loadEquipments();
    } catch (error) {
      showSnackbar('Silme sırasında hata oluştu: ' + error.message, 'error');
    }
  };

  const getDurumColor = durum => {
    switch (durum) {
      case 'musait':
        return 'success';
      case 'zimmetli':
        return 'primary';
      case 'bakimda':
        return 'warning';
      case 'arizali':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDurumText = durum => {
    switch (durum) {
      case 'musait':
        return 'Müsait';
      case 'zimmetli':
        return 'Zimmetli';
      case 'bakimda':
        return 'Bakımda';
      case 'arizali':
        return 'Arızalı';
      default:
        return durum;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' component='h1'>
          <InventoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Ekipman Yönetimi
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          }}
        >
          Yeni Ekipman
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Toplam Ekipman
              </Typography>
              <Typography variant='h4'>{equipments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Müsait
              </Typography>
              <Typography variant='h4' sx={{ color: 'success.main' }}>
                {equipments.filter(e => e.durum === 'musait').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Zimmetli
              </Typography>
              <Typography variant='h4' sx={{ color: 'primary.main' }}>
                {equipments.filter(e => e.durum === 'zimmetli').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Bakım/Arıza
              </Typography>
              <Typography variant='h4' sx={{ color: 'warning.main' }}>
                {
                  equipments.filter(
                    e => e.durum === 'bakimda' || e.durum === 'arizali',
                  ).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Equipment Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ekipman Adı</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Zimmetli</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Oluşturma</TableCell>
                <TableCell align='right'>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipments.map(equipment => (
                <TableRow key={equipment._id || equipment.id}>
                  <TableCell>
                    <Typography variant='subtitle2'>{equipment.ad}</Typography>
                  </TableCell>
                  <TableCell>{equipment.tip}</TableCell>
                  <TableCell>
                    <Chip
                      label={getDurumText(equipment.durum)}
                      color={getDurumColor(equipment.durum)}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    {equipment.zimmetli ? (
                      <Typography variant='body2'>
                        {equipment.zimmetli.ad} {equipment.zimmetli.soyad}
                      </Typography>
                    ) : (
                      <Typography variant='body2' color='textSecondary'>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' noWrap>
                      {equipment.aciklama}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(equipment.olusturmaTarihi).toLocaleDateString(
                      'tr-TR',
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton
                      size='small'
                      onClick={() => handleEdit(equipment)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => handleDelete(equipment._id)}
                      color='error'
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {selectedEquipment ? 'Ekipman Düzenle' : 'Yeni Ekipman'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Ekipman Adı'
                value={formData.ad}
                onChange={e => setFormData({ ...formData, ad: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Tip'
                value={formData.tip}
                onChange={e =>
                  setFormData({ ...formData, tip: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={formData.durum}
                  label='Durum'
                  onChange={e =>
                    setFormData({ ...formData, durum: e.target.value })
                  }
                >
                  <MenuItem value='musait'>Müsait</MenuItem>
                  <MenuItem value='zimmetli'>Zimmetli</MenuItem>
                  <MenuItem value='bakimda'>Bakımda</MenuItem>
                  <MenuItem value='arizali'>Arızalı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Açıklama'
                multiline
                rows={3}
                value={formData.aciklama}
                onChange={e =>
                  setFormData({ ...formData, aciklama: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSave} variant='contained'>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Alert */}
      <Alert severity='info' sx={{ mt: 3 }}>
        <span role='img' aria-label='ampul'>
          💡
        </span>{' '}
        Bu sayfa demo amaçlı mock data kullanmaktadır. Gerçek ekipman yönetimi
        için API entegrasyonu gereklidir.
      </Alert>
    </Box>
  );
};

export default EquipmentManagement;
