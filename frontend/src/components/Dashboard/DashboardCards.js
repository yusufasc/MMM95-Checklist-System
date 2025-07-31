import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Alert,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';

const DashboardCards = ({
  dashboard,
  categories,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryCreate,
  onFieldTemplateManagement,
  onExcelTemplateDownload,
  onExcelExport,
  canEdit,
  loading,
}) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'grey.300',
                      borderRadius: 1,
                      mr: 2,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        width: '60%',
                        height: 16,
                        bgcolor: 'grey.300',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                    <Box
                      sx={{
                        width: '40%',
                        height: 12,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                </Box>
                <LinearProgress />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const getStatusColor = status => {
    const colors = {
      aktif: 'success',
      bakim: 'warning',
      arizali: 'error',
      hurda: 'default',
      yedek: 'info',
      kirada: 'secondary',
    };
    return colors[status] || 'default';
  };

  return (
    <Grid container spacing={3}>
      {/* Genel İstatistikler */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant='h4' fontWeight='bold'>
                  {dashboard?.genel?.toplamEnvanter || 0}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.8 }}>
                  Toplam Envanter
                </Typography>
              </Box>
              <InventoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant='h4' fontWeight='bold'>
                  {dashboard?.genel?.kategoriler || 0}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.8 }}>
                  Kategori Sayısı
                </Typography>
              </Box>
              <CategoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant='h4' fontWeight='bold'>
                  {dashboard?.genel?.kritikEnvanter || 0}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.8 }}>
                  Kritik Envanter
                </Typography>
              </Box>
              <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant='h4' fontWeight='bold'>
                  {dashboard?.yaklasanBakimlar?.length || 0}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.8 }}>
                  Yaklaşan Bakım
                </Typography>
              </Box>
              <BuildIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Durum Dağılımı */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Durum Dağılımı
            </Typography>
            {dashboard?.durumStats?.map(stat => (
              <Box key={stat._id} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='body2'>
                    {stat._id?.charAt(0).toUpperCase() + stat._id?.slice(1)}
                  </Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {stat.count}
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={
                    (stat.count / (dashboard?.genel?.toplamEnvanter || 1)) * 100
                  }
                  color={getStatusColor(stat._id)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Kategori İstatistikleri */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Kategori İstatistikleri
            </Typography>
            {dashboard?.kategoriStats?.slice(0, 5).map(stat => (
              <Box
                key={stat._id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant='body2'>{stat._id}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='body2' fontWeight='bold'>
                    {stat.count}
                  </Typography>
                  {stat.toplamDeger > 0 && (
                    <Typography variant='caption' color='text.secondary'>
                      (₺{stat.toplamDeger.toLocaleString()})
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Yaklaşan Bakımlar */}
      {dashboard?.yaklasanBakimlar?.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom color='warning.main'>
                Yaklaşan Bakımlar
              </Typography>
              <List dense>
                {dashboard.yaklasanBakimlar.slice(0, 5).map(item => (
                  <ListItem key={item._id} divider>
                    <ListItemIcon>
                      <BuildIcon color='warning' />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.ad}
                      secondary={`${item.kategoriId?.ad} - ${new Date(item.sonrakiBakimTarihi).toLocaleDateString('tr-TR')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Düşük Kalite Envanter */}
      {dashboard?.dusukKaliteEnvanter?.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom color='error.main'>
                Veri Kalitesi Düşük Kayıtlar
              </Typography>
              <List dense>
                {dashboard.dusukKaliteEnvanter.slice(0, 5).map(item => (
                  <ListItem key={item._id} divider>
                    <ListItemIcon>
                      <WarningIcon color='error' />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.ad}
                      secondary={`${item.kategoriId?.ad} - %${item.dataKalitesi?.eksiksizlikSkoru || 0} tamamlanmış`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Kategori Yönetimi */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant='h6'>Kategori Yönetimi</Typography>
              {canEdit && (
                <Button
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={onCategoryCreate}
                  size='small'
                >
                  Yeni Kategori
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              {categories.map(category => (
                <Grid item xs={12} sm={6} md={4} key={category._id}>
                  <Paper variant='outlined' sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: category.renk,
                          }}
                        />
                        <Typography variant='subtitle2' fontWeight='bold'>
                          {category.ad}
                        </Typography>
                      </Box>

                      {canEdit && (
                        <Box>
                          <IconButton
                            size='small'
                            onClick={() => onCategoryEdit(category)}
                            sx={{ mr: 0.5 }}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => onCategoryDelete(category._id)}
                            color='error'
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    {category.aciklama && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 2 }}
                      >
                        {category.aciklama}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size='small'
                        startIcon={<SettingsIcon />}
                        onClick={() => onFieldTemplateManagement(category)}
                        variant='outlined'
                      >
                        Alanlar
                      </Button>
                      <Button
                        size='small'
                        startIcon={<FileDownloadIcon />}
                        onClick={() => onExcelTemplateDownload(category._id)}
                        variant='outlined'
                      >
                        Şablon
                      </Button>
                      <Button
                        size='small'
                        startIcon={<FileUploadIcon />}
                        onClick={() => onExcelExport(category._id)}
                        variant='outlined'
                      >
                        Export
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}

              {categories.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity='info'>
                    Henüz kategori oluşturulmamış. Başlamak için "Yeni Kategori"
                    butonuna tıklayın.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

DashboardCards.propTypes = {
  dashboard: PropTypes.shape({
    genel: PropTypes.shape({
      toplamEnvanter: PropTypes.number,
      kategoriler: PropTypes.number,
      kritikEnvanter: PropTypes.number,
    }),
    durumStats: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        count: PropTypes.number,
      }),
    ),
    kategoriStats: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        count: PropTypes.number,
        toplamDeger: PropTypes.number,
      }),
    ),
    yaklasanBakimlar: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        ad: PropTypes.string,
        kategoriId: PropTypes.shape({
          ad: PropTypes.string,
        }),
        sonrakiBakimTarihi: PropTypes.string,
      }),
    ),
    dusukKaliteEnvanter: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        ad: PropTypes.string,
        kategoriId: PropTypes.shape({
          ad: PropTypes.string,
        }),
        dataKalitesi: PropTypes.shape({
          eksiksizlikSkoru: PropTypes.number,
        }),
      }),
    ),
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      aciklama: PropTypes.string,
      renk: PropTypes.string,
    }),
  ).isRequired,
  onCategoryEdit: PropTypes.func.isRequired,
  onCategoryDelete: PropTypes.func.isRequired,
  onCategoryCreate: PropTypes.func.isRequired,
  onFieldTemplateManagement: PropTypes.func.isRequired,
  onExcelTemplateDownload: PropTypes.func.isRequired,
  onExcelExport: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

DashboardCards.defaultProps = {
  dashboard: {
    genel: {
      toplamEnvanter: 0,
      kategoriler: 0,
      kritikEnvanter: 0,
    },
    durumStats: [],
    kategoriStats: [],
    yaklasanBakimlar: [],
    dusukKaliteEnvanter: [],
  },
};

export default DashboardCards;
