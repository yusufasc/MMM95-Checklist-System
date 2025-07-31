import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar,
  Alert,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CloudDownload as CloudDownloadIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Computer as ComputerIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { formatUserName, getScoreColor } from '../../utils/hrHelpers';
import { assignmentAPI, equipmentAPI } from '../../services/api';

const HRReports = ({
  summaryReport,
  hrYetkileri,
  filterYear,
  filterMonth,
  onFilterChange,
  onExcelDownload,
}) => {
  const [activeReportTab, setActiveReportTab] = useState(0);
  const [equipmentData, setEquipmentData] = useState([]);
  const [assignmentData, setAssignmentData] = useState([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' },
  ];

  // Load comprehensive HR data
  useEffect(() => {
    const loadComprehensiveData = async () => {
      try {
        const [equipmentRes, assignmentRes] = await Promise.all([
          equipmentAPI.getAll({ status: 'all' }),
          assignmentAPI.getAll({ status: 'all' }),
        ]);

        setEquipmentData(equipmentRes.data || []);
        setAssignmentData(assignmentRes.data || []);
      } catch (error) {
        console.error('Comprehensive data loading error:', error);
      }
    };

    if (hrYetkileri?.raporGorebilir) {
      loadComprehensiveData();
    }
  }, [hrYetkileri]);

  // Comprehensive analytics calculations
  const analytics = useMemo(() => {
    // Ensure summaryReport is always an array
    const reportData = Array.isArray(summaryReport) ? summaryReport : [];

    if (!reportData || reportData.length === 0) {
      return {
        performance: { excellent: 0, good: 0, average: 0, poor: 0 },
        scoring: { positive: 0, negative: 0, total: 0, average: 0 },
        equipment: { total: 0, assigned: 0, available: 0, categories: {} },
        evaluations: { total: 0, thisMonth: 0, templates: 0 },
      };
    }

    // Performance analysis
    const performance = {
      excellent: reportData.filter(u => (u.genelToplam || 0) >= 90).length,
      good: reportData.filter(
        u => (u.genelToplam || 0) >= 70 && (u.genelToplam || 0) < 90,
      ).length,
      average: reportData.filter(
        u => (u.genelToplam || 0) >= 50 && (u.genelToplam || 0) < 70,
      ).length,
      poor: reportData.filter(u => (u.genelToplam || 0) < 50).length,
    };

    // Scoring analysis
    const totalScore = reportData.reduce(
      (sum, u) => sum + (u.genelToplam || 0),
      0,
    );
    const scoring = {
      positive: reportData.filter(u => (u.genelToplam || 0) > 0).length,
      negative: reportData.filter(u => (u.genelToplam || 0) < 0).length,
      total: reportData.length,
      average: reportData.length > 0 ? totalScore / reportData.length : 0,
    };

    // Equipment analysis
    const equipment = {
      total: equipmentData.length,
      assigned: assignmentData.filter(a => a.status === 'active').length,
      available:
        equipmentData.length -
        assignmentData.filter(a => a.status === 'active').length,
      categories: equipmentData.reduce((acc, eq) => {
        acc[eq.category] = (acc[eq.category] || 0) + 1;
        return acc;
      }, {}),
    };

    // Evaluation analysis
    const evaluations = {
      total: reportData.reduce(
        (sum, u) => sum + (u.toplamChecklistPuani || 0),
        0,
      ),
      thisMonth: reportData.length,
      templates: new Set(
        reportData.flatMap(u => u.checklistPuanlari?.map(c => c.sablon) || []),
      ).size,
    };

    return { performance, scoring, equipment, evaluations };
  }, [summaryReport, equipmentData, assignmentData]);

  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  if (!hrYetkileri?.raporGorebilir) {
    return (
      <Alert severity='warning'>
        Rapor görüntüleme yetkisine sahip değilsiniz.
      </Alert>
    );
  }

  const renderKPICards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%',
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
                  {analytics.scoring.total}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Toplam Personel
                </Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%',
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
                  {analytics.scoring.average.toFixed(1)}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Ortalama Puan
                </Typography>
              </Box>
              <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%',
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
                  {analytics.equipment.assigned}/{analytics.equipment.total}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Ekipman Zimmetleme
                </Typography>
              </Box>
              <ComputerIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            height: '100%',
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
                  {analytics.performance.excellent + analytics.performance.good}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Başarılı Performans
                </Typography>
              </Box>
              <StarIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPerformanceAnalysis = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography
        variant='h6'
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <AnalyticsIcon color='primary' />
        Performans Analizi
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant='subtitle2' gutterBottom>
            Performans Dağılımı
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='body2'>Mükemmel (90+)</Typography>
              <Typography
                variant='body2'
                fontWeight='bold'
                color='success.main'
              >
                {analytics.performance.excellent}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={
                (analytics.performance.excellent / analytics.scoring.total) *
                100
              }
              color='success'
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='body2'>İyi (70-89)</Typography>
              <Typography
                variant='body2'
                fontWeight='bold'
                color='primary.main'
              >
                {analytics.performance.good}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={
                (analytics.performance.good / analytics.scoring.total) * 100
              }
              color='primary'
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='body2'>Orta (50-69)</Typography>
              <Typography
                variant='body2'
                fontWeight='bold'
                color='warning.main'
              >
                {analytics.performance.average}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={
                (analytics.performance.average / analytics.scoring.total) * 100
              }
              color='warning'
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='body2'>Düşük (&lt;50)</Typography>
              <Typography variant='body2' fontWeight='bold' color='error.main'>
                {analytics.performance.poor}
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={
                (analytics.performance.poor / analytics.scoring.total) * 100
              }
              color='error'
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant='subtitle2' gutterBottom>
            Ekipman Kategorileri
          </Typography>
          {Object.entries(analytics.equipment.categories).map(
            ([category, count]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='body2'>{category}</Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {count}
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={(count / analytics.equipment.total) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ),
          )}
        </Grid>
      </Grid>
    </Paper>
  );

  const renderDetailedTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.50' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Sıra</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Personel</TableCell>
            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
              Şablon Puanı
            </TableCell>
            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
              Mesai Puanı
            </TableCell>
            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
              Devamsızlık
            </TableCell>
            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
              Genel Toplam
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Performans</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(Array.isArray(summaryReport) ? summaryReport : [])
            .sort((a, b) => (b.genelToplam || 0) - (a.genelToplam || 0))
            .map((item, index) => {
              const performanceColor = getScoreColor(item.genelToplam || 0);
              const performanceLevel =
                (item.genelToplam || 0) >= 90
                  ? 'Mükemmel'
                  : (item.genelToplam || 0) >= 70
                    ? 'İyi'
                    : (item.genelToplam || 0) >= 50
                      ? 'Orta'
                      : 'Düşük';

              return (
                <TableRow
                  key={item.kullanici?._id || index}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:nth-of-type(odd)': { bgcolor: 'action.selected' },
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: index < 3 ? 'primary.main' : 'grey.300',
                        color: index < 3 ? 'white' : 'text.primary',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {item.kullanici?.ad?.[0] || 'U'}
                        {item.kullanici?.soyad?.[0] || 'N'}
                      </Avatar>
                      <Box>
                        <Typography variant='subtitle2' fontWeight='medium'>
                          {formatUserName(item.kullanici)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {item.kullanici?.departman?.ad ||
                            'Departman belirtilmemiş'}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {item.kullanici?.roller?.map(rol => (
                            <Chip
                              key={rol.ad}
                              label={rol.ad}
                              size='small'
                              variant='outlined'
                              sx={{ mr: 0.5, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight='medium'>
                      {item.toplamChecklistPuani || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      sx={{ color: 'success.main', fontWeight: 'medium' }}
                    >
                      +{item.toplamMesaiPuani || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      sx={{ color: 'error.main', fontWeight: 'medium' }}
                    >
                      {item.toplamDevamsizlikPuani || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography
                      variant='h6'
                      sx={{
                        fontWeight: 'bold',
                        color:
                          (item.genelToplam || 0) >= 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {item.genelToplam || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={performanceLevel}
                        size='small'
                        color={performanceColor}
                        sx={{ fontWeight: 'medium', minWidth: 70 }}
                      />
                      <Box sx={{ width: 60 }}>
                        <LinearProgress
                          variant='determinate'
                          value={Math.min(
                            100,
                            Math.max(0, (item.genelToplam || 0) + 50),
                          )}
                          color={performanceColor}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title='Detayları Görüntüle'>
                        <IconButton size='small' color='primary'>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Excel İndir'>
                        <IconButton size='small' color='success'>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          {(Array.isArray(summaryReport) ? summaryReport : []).length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align='center' sx={{ py: 4 }}>
                <Typography color='text.secondary'>
                  Seçilen dönem için rapor verisi bulunmamaktadır.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderEquipmentReport = () => (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          mb: 3,
        }}
      >
        <ComputerIcon sx={{ color: '#FF6B35' }} />
        Ekipman Durum Raporu
      </Typography>

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ComputerIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
            <Typography variant='h3' fontWeight='bold'>
              {analytics.equipment.total}
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.9 }}>
              Toplam Ekipman
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(245, 87, 108, 0.4)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(245, 87, 108, 0.6)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <AssignmentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
            <Typography variant='h3' fontWeight='bold'>
              {analytics.equipment.assigned}
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.9 }}>
              Zimmetli Ekipman
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(79, 172, 254, 0.4)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(79, 172, 254, 0.6)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
            <Typography variant='h3' fontWeight='bold'>
              {analytics.equipment.available}
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.9 }}>
              Müsait Ekipman
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              textAlign: 'center',
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(250, 112, 154, 0.6)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <WarningIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
            <Typography variant='h3' fontWeight='bold'>
              {Math.round(
                (analytics.equipment.assigned /
                  Math.max(analytics.equipment.total, 1)) *
                  100,
              )}
              %
            </Typography>
            <Typography variant='body1' sx={{ opacity: 0.9 }}>
              Kullanım Oranı
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Kategori Analizi */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <AssessmentIcon color='primary' />
              Kategori Dağılımı
            </Typography>
            {Object.entries(analytics.equipment.categories).length > 0 ? (
              Object.entries(analytics.equipment.categories).map(
                ([category, count]) => (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant='body2' fontWeight='medium'>
                        {category}
                      </Typography>
                      <Chip
                        label={count}
                        size='small'
                        color='primary'
                        sx={{ fontWeight: 'bold', minWidth: 40 }}
                      />
                    </Box>
                    <LinearProgress
                      variant='determinate'
                      value={
                        (count / Math.max(analytics.equipment.total, 1)) * 100
                      }
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background:
                            'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        },
                      }}
                    />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      %
                      {Math.round(
                        (count / Math.max(analytics.equipment.total, 1)) * 100,
                      )}{' '}
                      toplam içinde
                    </Typography>
                  </Box>
                ),
              )
            ) : (
              <Alert severity='info' sx={{ borderRadius: 2 }}>
                Henüz ekipman kategorisi verisi bulunmamaktadır.
              </Alert>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <TrendingUpIcon color='success' />
              Ekipman İstatistikleri
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Chip
                    icon={<ComputerIcon />}
                    label='Aktif'
                    color='primary'
                    size='small'
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Aktif Ekipman Sayısı'
                  secondary={`${analytics.equipment.total} adet`}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Chip
                    icon={<AssignmentIcon />}
                    label='Zimmet'
                    color='warning'
                    size='small'
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Zimmetli Ekipman'
                  secondary={`${analytics.equipment.assigned} adet`}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label='Müsait'
                    color='success'
                    size='small'
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Müsait Ekipman'
                  secondary={`${analytics.equipment.available} adet`}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>

              <Divider sx={{ my: 1 }} />

              <ListItem>
                <ListItemIcon>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label='Oran'
                    color='info'
                    size='small'
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Kullanım Oranı'
                  secondary={`%${Math.round((analytics.equipment.assigned / Math.max(analytics.equipment.total, 1)) * 100)}`}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant='outlined'
                startIcon={<VisibilityIcon />}
                size='small'
                sx={{ mr: 1 }}
              >
                Detaylı Görünüm
              </Button>
              <Button
                variant='outlined'
                startIcon={<CloudDownloadIcon />}
                size='small'
                color='success'
              >
                Excel İndir
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Ekipman Tablosu */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ComputerIcon color='primary' />
          Ekipman Detay Listesi
        </Typography>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, maxHeight: 400 }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}>
                  Ekipman Adı
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}>
                  Kategori
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}
                  align='center'
                >
                  Durum
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}
                  align='center'
                >
                  Zimmetli
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}
                  align='center'
                >
                  İşlemler
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipmentData.length > 0 ? (
                equipmentData.slice(0, 10).map((equipment, index) => (
                  <TableRow
                    key={equipment._id || index}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:nth-of-type(odd)': { bgcolor: 'action.selected' },
                    }}
                  >
                    <TableCell>
                      <Typography variant='subtitle2' fontWeight='medium'>
                        {equipment.name || 'İsimsiz Ekipman'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {equipment.description || 'Açıklama yok'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={equipment.category || 'Kategori Yok'}
                        size='small'
                        variant='outlined'
                        color='primary'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={equipment.isActive ? 'Aktif' : 'Pasif'}
                        size='small'
                        color={equipment.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Typography variant='body2' fontWeight='medium'>
                        {equipment.totalAssigned || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'center',
                        }}
                      >
                        <Tooltip title='Detayları Görüntüle'>
                          <IconButton size='small' color='primary'>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Zimmet Ver'>
                          <IconButton size='small' color='success'>
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                    <Alert severity='info' sx={{ borderRadius: 2 }}>
                      Henüz ekipman verisi bulunmamaktadır.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {equipmentData.length > 10 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant='outlined' size='small'>
              Tümünü Göster ({equipmentData.length} ekipman)
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box>
      {/* Header with Filters */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant='h4'
            fontWeight='bold'
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <span role='img' aria-label='Bar chart'>
              📊
            </span>{' '}
            HR Kapsamlı Raporlama
          </Typography>
          <Button
            variant='contained'
            startIcon={<CloudDownloadIcon />}
            onClick={onExcelDownload}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Excel İndir
          </Button>
        </Box>

        <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 3 }}>
          {filterYear}/{filterMonth} dönemi için kapsamlı HR analizi ve
          raporları
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Yıl</InputLabel>
                <Select
                  value={filterYear}
                  label='Yıl'
                  onChange={e => handleFilterChange('year', e.target.value)}
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Ay</InputLabel>
                <Select
                  value={filterMonth}
                  label='Ay'
                  onChange={e => handleFilterChange('month', e.target.value)}
                >
                  {months.map(month => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant='body2' color='text.secondary'>
                Son güncelleme: {new Date().toLocaleString('tr-TR')}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Report Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeReportTab}
          onChange={(_, newValue) => setActiveReportTab(newValue)}
          variant='fullWidth'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AssessmentIcon />} label='Performans Analizi' />
          <Tab icon={<ComputerIcon />} label='Ekipman Raporu' />
          <Tab icon={<PeopleIcon />} label='Detaylı Tablo' />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeReportTab === 0 && renderPerformanceAnalysis()}
          {activeReportTab === 1 && renderEquipmentReport()}
          {activeReportTab === 2 && renderDetailedTable()}
        </Box>
      </Paper>
    </Box>
  );
};

export default HRReports;
