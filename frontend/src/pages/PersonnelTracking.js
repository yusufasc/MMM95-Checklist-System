import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Badge,
  TextField,
} from '@mui/material';
import {
  People as PeopleIcon,
  Build as MachineIcon,
  Business as DepartmentIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Assignment as RoleIcon,
  AccessTime as TimeIcon,
  Engineering as EngineeringIcon,
  FilterList as FilterListIcon,
  Settings as SettingsIcon,
  SwapHorizontalCircle as SwapIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useSnackbar } from '../contexts/SnackbarContext';
import { personnelTrackingAPI } from '../services/api';

const PersonnelTracking = () => {
  const { showSnackbar } = useSnackbar();

  // State management
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [machineBasedData, setMachineBasedData] = useState(null);
  const [kalipDegisimData, setKalipDegisimData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [searchTerm] = useState('');

  // Kalıp değişim dialog state
  const [kalipHistoryDialog, setKalipHistoryDialog] = useState(false);
  const [selectedMachineHistory, setSelectedMachineHistory] = useState(null);
  const [machineHistory, setMachineHistory] = useState([]);

  // Değerlendirme dialog state
  const [evaluationDialog, setEvaluationDialog] = useState(false);
  const [selectedWorkTask, setSelectedWorkTask] = useState(null);
  const [selectedEvaluationType, setSelectedEvaluationType] = useState(null);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState({
    maddeler: [],
    genelNot: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await personnelTrackingAPI.getCurrentStatus();
      setData(response.data);
    } catch (error) {
      showSnackbar(
        'Personel takip verileri yüklenirken hata oluştu: ' + error.message,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Load machine-based data with role filter
  const loadMachineBasedData = useCallback(
    async (roleFilter = '') => {
      try {
        setLoading(true);
        console.log(
          '🔄 Makina bazlı veri yükleniyor, rol filtresi:',
          roleFilter,
        );

        const response =
          await personnelTrackingAPI.getMachineBasedData(roleFilter);

        // API response formatı: { success: true, data: { machines: [], stats: {} } }
        if (response.data && response.data.success) {
          setMachineBasedData(response.data.data);
          console.log(
            '✅ Makina bazlı veri yüklendi:',
            response.data.data.stats,
          );
        } else {
          showSnackbar('Makina bazlı veri yüklenirken hata oluştu', 'error');
        }
      } catch (error) {
        console.error('Machine-based data error:', error);
        showSnackbar(
          'Makina bazlı veri yüklenirken hata oluştu: ' + error.message,
          'error',
        );
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar],
  );

  // Load kalıp değişim data
  const loadKalipDegisimData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Kalıp değişim verileri yükleniyor...');

      const response = await personnelTrackingAPI.getKalipDegisimData();

      // API response formatı: { success: true, data: { machines: [], stats: {} } }
      if (response?.data?.success && response.data.data) {
        setKalipDegisimData(response.data.data);
        console.log(
          '✅ Kalıp değişim verileri yüklendi:',
          response.data.data.stats,
        );
      } else {
        // Fallback data
        setKalipDegisimData({
          machines: [],
          stats: {
            totalMachines: 0,
            machinesWithKalipChange: 0,
            machinesWithoutKalipChange: 0,
            recentKalipChanges: 0,
          },
        });
        showSnackbar('Kalıp değişim verileri bulunamadı', 'warning');
      }
    } catch (error) {
      console.error('Kalıp değişim data error:', error);
      // Error durumunda fallback data
      setKalipDegisimData({
        machines: [],
        stats: {
          totalMachines: 0,
          machinesWithKalipChange: 0,
          machinesWithoutKalipChange: 0,
          recentKalipChanges: 0,
        },
      });
      showSnackbar(
        'Kalıp değişim verileri yüklenirken hata oluştu: ' + error.message,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Load machine history
  const loadMachineHistory = useCallback(
    async (machineId, machineName) => {
      try {
        console.log(`🔄 ${machineName} için geçmiş yükleniyor...`);

        const response =
          await personnelTrackingAPI.getKalipDegisimHistory(machineId);

        // API response formatı: { success: true, data: { machine: {}, history: [] } }
        if (response.data && response.data.success) {
          setMachineHistory(response.data.data.history);
          setSelectedMachineHistory({
            ...response.data.data.machine,
            ad: machineName,
          });
          setKalipHistoryDialog(true);
          console.log(
            '✅ Makina geçmişi yüklendi:',
            response.data.data.history.length,
            'kayıt',
          );
        } else {
          showSnackbar('Makina geçmişi yüklenirken hata oluştu', 'error');
        }
      } catch (error) {
        console.error('Machine history error:', error);
        showSnackbar(
          'Makina geçmişi yüklenirken hata oluştu: ' + error.message,
          'error',
        );
      }
    },
    [showSnackbar],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load machine-based data when tab changes to machine-based
  useEffect(() => {
    if (activeTab === 0) {
      loadMachineBasedData(selectedRoleFilter);
    }
  }, [activeTab, selectedRoleFilter, loadMachineBasedData]);

  // Load kalıp değişim data when tab changes to kalıp değişim
  useEffect(() => {
    if (activeTab === 1) {
      // Kalıp Değişim tab
      loadKalipDegisimData();
    }
  }, [activeTab, loadKalipDegisimData]);

  // Değerlendirme fonksiyonu
  const handleEvaluate = async (kalipDegisimItem, evaluationType) => {
    console.log('🎯 Değerlendirme başlatılıyor:', {
      machine: kalipDegisimItem.machine.ad,
      type: evaluationType,
      usta: kalipDegisimItem.lastKalipChange?.usta,
      buddy: kalipDegisimItem.lastKalipChange?.buddy,
    });

    try {
      // 1. Template türünü belirle (MAKİNA AYARLARI 1 veya 2)
      const templateType =
        evaluationType === 1 ? 'makina_ayarlari_1' : 'makina_ayarlari_2';

      // 2. Kullanıcının bu template türü için yetkisi var mı kontrol et
      const templatesResponse = await import(
        '../services/kalipDegisimEvaluationAPI'
      ).then(module => module.default.getEvaluationTemplates());

      console.log('🔍 Debug - Templates response:', templatesResponse.data);
      console.log('🔍 Debug - Looking for templateType:', templateType);
      console.log(
        '🔍 Debug - Looking for template ad:',
        templateType === 'makina_ayarlari_1'
          ? 'MAKİNA AYARLARI 1'
          : 'MAKİNA AYARLARI 2',
      );

      const availableTemplate = templatesResponse.data.find(
        template =>
          template.ad ===
          (templateType === 'makina_ayarlari_1'
            ? 'MAKİNA AYARLARI 1'
            : 'MAKİNA AYARLARI 2'),
      );

      console.log('🔍 Debug - Found template:', availableTemplate);

      if (!availableTemplate) {
        showSnackbar(
          `${templateType === 'makina_ayarlari_1' ? 'MAKİNA AYARLARI 1' : 'MAKİNA AYARLARI 2'} şablonu bulunamadı veya bu şablonu değerlendirme yetkiniz yok`,
          'error',
        );
        return;
      }

      // 3. Bu WorkTask zaten değerlendirilmiş mi kontrol et
      const statusResponse = await import(
        '../services/kalipDegisimEvaluationAPI'
      ).then(module =>
        module.default.getWorkTaskStatus(
          kalipDegisimItem.lastKalipChange._id,
          availableTemplate._id,
        ),
      );

      if (statusResponse.data.evaluated) {
        showSnackbar(
          `Bu kalıp değişimi ${availableTemplate.ad} şablonu ile zaten değerlendirilmiş`,
          'warning',
        );
        return;
      }

      // 4. Değerlendirme dialog'unu aç
      setSelectedWorkTask(kalipDegisimItem.lastKalipChange);
      setSelectedEvaluationType(evaluationType);
      setSelectedTemplate(availableTemplate);
      setEvaluationForm({
        maddeler: availableTemplate.maddeler.map(madde => ({
          _id: madde._id,
          soru: madde.soru,
          puan: madde.puan,
          alinanPuan: 0,
          aciklama: '',
        })),
        genelNot: '',
      });

      // State update'i beklemek için setTimeout kullan
      setTimeout(() => {
        setEvaluationDialog(true);
      }, 100);
    } catch (error) {
      console.error('Değerlendirme başlatma hatası:', error);
      showSnackbar(
        'Değerlendirme başlatılırken hata oluştu: ' + error.message,
        'error',
      );
    }
  };

  // Filter data based on search term
  const filterData = (items, searchField = 'ad') => {
    if (!searchTerm) {
      return items;
    }
    return items.filter(
      item =>
        item[searchField]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.soyad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kullaniciAdi?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // Get role color
  const getRoleColor = role => {
    const colors = {
      Admin: 'error',
      'VARDİYA AMİRİ': 'warning',
      Usta: 'info',
      Ortacı: 'success',
      Paketlemeci: 'primary',
      'Kalite Kontrol': 'secondary',
    };
    return colors[role] || 'default';
  };

  // Statistics Cards Component
  const StatisticsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            bgcolor: 'primary.50',
            borderLeft: 4,
            borderColor: 'primary.main',
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography
                  variant='h5'
                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                >
                  {activeTab === 1 && kalipDegisimData?.stats
                    ? kalipDegisimData.stats.totalMachines
                    : data?.stats?.toplamPersonel || 0}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {activeTab === 1 ? 'Toplam Makina' : 'Toplam Personel'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            bgcolor: 'success.50',
            borderLeft: 4,
            borderColor: 'success.main',
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <MachineIcon />
              </Avatar>
              <Box>
                <Typography
                  variant='h5'
                  sx={{ fontWeight: 'bold', color: 'success.main' }}
                >
                  {activeTab === 1 && kalipDegisimData?.stats
                    ? kalipDegisimData.stats.machinesWithKalipChange
                    : data?.stats?.toplamMakina || 0}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {activeTab === 1 ? 'Kalıp Değişimi Olan' : 'Toplam Makina'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            bgcolor: 'warning.50',
            borderLeft: 4,
            borderColor: 'warning.main',
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <SwapIcon />
              </Avatar>
              <Box>
                <Typography
                  variant='h5'
                  sx={{ fontWeight: 'bold', color: 'warning.main' }}
                >
                  {activeTab === 1 && kalipDegisimData?.stats
                    ? kalipDegisimData.stats.recentKalipChanges
                    : data?.stats?.aktifPersonel || 0}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {activeTab === 1 ? 'Son 7 Günde Değişim' : 'Aktif Personel'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            bgcolor: 'error.50',
            borderLeft: 4,
            borderColor: 'error.main',
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <TimeIcon />
              </Avatar>
              <Box>
                <Typography
                  variant='h5'
                  sx={{ fontWeight: 'bold', color: 'error.main' }}
                >
                  {activeTab === 1 && kalipDegisimData?.stats
                    ? kalipDegisimData.stats.machinesWithoutKalipChange
                    : data?.stats?.gunlukOrtalama || 0}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {activeTab === 1
                    ? 'Kalıp Değişimi Olmayan'
                    : 'Günlük Ortalama'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Kalıp Değişim View Component
  const KalipDegisimView = () => {
    if (!kalipDegisimData?.machines) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Kalıp değişim verileri yükleniyor...
          </Typography>
        </Box>
      );
    }

    // Filter machines based on search term
    const filteredMachines = kalipDegisimData.machines.filter(
      item =>
        item.machine.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.machine.envanterKodu
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );

    return (
      <Box>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SettingsIcon color='primary' />
          Kalıp Değişim Takibi
          <Chip
            label={`${filteredMachines.length} Makina`}
            size='small'
            color='primary'
            variant='outlined'
          />
        </Typography>

        <Grid container spacing={3}>
          {filteredMachines.map(item => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.machine._id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  border: item.lastKalipChange ? '2px solid' : '1px solid',
                  borderColor: item.lastKalipChange
                    ? 'success.main'
                    : 'grey.300',
                }}
              >
                {/* Makina ikonu köşede */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: item.lastKalipChange ? 'success.100' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EngineeringIcon
                    sx={{
                      color: item.lastKalipChange ? 'success.main' : 'grey.500',
                      fontSize: 20,
                    }}
                  />
                </Box>

                <CardContent sx={{ pb: 1 }}>
                  {/* Makina Bilgileri */}
                  <Typography
                    variant='h6'
                    sx={{ fontWeight: 600, mb: 1, pr: 5 }}
                  >
                    {item.machine.ad}
                  </Typography>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {item.machine.envanterKodu} • {item.machine.kategori}
                  </Typography>

                  {item.lastKalipChange ? (
                    <Box>
                      {/* Usta Bilgisi */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.main',
                          }}
                        >
                          {item.lastKalipChange.usta.ad.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {item.lastKalipChange.usta.ad}{' '}
                            {item.lastKalipChange.usta.soyad}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            @{item.lastKalipChange.usta.kullaniciAdi}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Buddy Bilgisi */}
                      {item.lastKalipChange.buddy && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2,
                            p: 1,
                            bgcolor: 'info.50',
                            borderRadius: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: 'info.main',
                              fontSize: '0.8rem',
                            }}
                          >
                            {item.lastKalipChange.buddy.ad.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant='caption'
                              color='info.main'
                              sx={{ fontWeight: 600 }}
                            >
                              Buddy:
                            </Typography>
                            <Typography
                              variant='body2'
                              sx={{ fontSize: '0.85rem' }}
                            >
                              {item.lastKalipChange.buddy.ad}{' '}
                              {item.lastKalipChange.buddy.soyad}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Kalıp Bilgileri */}
                      <Box sx={{ mb: 2 }}>
                        {item.lastKalipChange.indirilenKalip && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant='caption'
                              color='error.main'
                              sx={{ fontWeight: 500 }}
                            >
                              İndirilen:
                            </Typography>
                            <Typography variant='body2'>
                              {item.lastKalipChange.indirilenKalip.ad}
                            </Typography>
                          </Box>
                        )}

                        {item.lastKalipChange.baglananKalip && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant='caption'
                              color='success.main'
                              sx={{ fontWeight: 500 }}
                            >
                              Bağlanan:
                            </Typography>
                            <Typography variant='body2'>
                              {item.lastKalipChange.baglananKalip.ad}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Zaman Bilgileri */}
                      <Box sx={{ mb: 2 }}>
                        {/* Makina Durdurma Saati */}
                        {item.lastKalipChange.makinaDurmaSaati && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                              p: 1,
                              bgcolor: 'warning.50',
                              borderRadius: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'warning.main',
                              }}
                            />
                            <Box>
                              <Typography
                                variant='caption'
                                color='warning.main'
                                sx={{ fontWeight: 600 }}
                              >
                                Makina Durdurma:
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{ fontSize: '0.85rem' }}
                              >
                                {new Date(
                                  item.lastKalipChange.makinaDurmaSaati,
                                ).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Makina Başlatma Saati */}
                        {item.lastKalipChange.yeniKalipAktifSaati && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                              p: 1,
                              bgcolor: 'success.50',
                              borderRadius: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'success.main',
                              }}
                            />
                            <Box>
                              <Typography
                                variant='caption'
                                color='success.main'
                                sx={{ fontWeight: 600 }}
                              >
                                Makina Başlatma:
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{ fontSize: '0.85rem' }}
                              >
                                {new Date(
                                  item.lastKalipChange.yeniKalipAktifSaati,
                                ).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Kalıp Değişim Süresi Hesaplama */}
                        {item.lastKalipChange.makinaDurmaSaati &&
                          item.lastKalipChange.yeniKalipAktifSaati && (
                            <Box
                              sx={{
                                p: 1,
                                bgcolor: 'primary.50',
                                borderRadius: 0.5,
                                border: '1px solid',
                                borderColor: 'primary.200',
                              }}
                            >
                              <Typography
                                variant='caption'
                                color='primary.main'
                                sx={{ fontWeight: 600 }}
                              >
                                Değişim Süresi:
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{ fontWeight: 600, color: 'primary.main' }}
                              >
                                {(() => {
                                  const durma = new Date(
                                    item.lastKalipChange.makinaDurmaSaati,
                                  );
                                  const baslama = new Date(
                                    item.lastKalipChange.yeniKalipAktifSaati,
                                  );
                                  const farkMs = baslama - durma;
                                  const farkDakika = Math.round(
                                    farkMs / (1000 * 60),
                                  );

                                  if (farkDakika < 60) {
                                    return `${farkDakika} dakika`;
                                  } else {
                                    const saat = Math.floor(farkDakika / 60);
                                    const dakika = farkDakika % 60;
                                    return `${saat}s ${dakika}dk`;
                                  }
                                })()}
                              </Typography>
                            </Box>
                          )}
                      </Box>

                      {/* Tamamlanma Tarihi */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <TimeIcon
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant='caption' color='text.secondary'>
                          Tamamlandı:{' '}
                          {new Date(
                            item.lastKalipChange.tamamlanmaTarihi,
                          ).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>

                      {/* Değerlendirme ve Geçmiş Butonları */}
                      <Box sx={{ mt: 2 }}>
                        {/* Değerlendirme Butonları */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Button
                            size='small'
                            variant='contained'
                            color='primary'
                            startIcon={<StarIcon />}
                            onClick={() => handleEvaluate(item, 1)}
                            sx={{ flex: 1 }}
                          >
                            Değerlendir 1
                          </Button>
                          <Button
                            size='small'
                            variant='contained'
                            color='secondary'
                            startIcon={<StarIcon />}
                            onClick={() => handleEvaluate(item, 2)}
                            sx={{ flex: 1 }}
                          >
                            Değerlendir 2
                          </Button>
                        </Box>

                        {/* Geçmiş Butonu */}
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<HistoryIcon />}
                          onClick={() =>
                            loadMachineHistory(
                              item.machine._id,
                              item.machine.ad,
                            )
                          }
                          sx={{ width: '100%' }}
                        >
                          Geçmiş
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 2 }}
                      >
                        Henüz kalıp değişimi yapılmamış
                      </Typography>
                      <Chip
                        label='Veri Yok'
                        size='small'
                        color='warning'
                        variant='outlined'
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Değerlendirme Dialog Component
  const EvaluationDialog = () => {
    const handleFormChange = (index, field, value) => {
      setEvaluationForm(prev => ({
        ...prev,
        maddeler: prev.maddeler.map((madde, i) =>
          i === index ? { ...madde, [field]: value } : madde,
        ),
      }));
    };

    const handleGenelNotChange = value => {
      setEvaluationForm(prev => ({ ...prev, genelNot: value }));
    };

    const handleSubmitEvaluation = async () => {
      try {
        const kalipDegisimEvaluationAPI = await import(
          '../services/kalipDegisimEvaluationAPI'
        ).then(module => module.default);

        console.log('🔍 Debug - selectedWorkTask:', selectedWorkTask);
        console.log('🔍 Debug - selectedTemplate:', selectedTemplate);
        console.log('🔍 Debug - usta field:', selectedWorkTask?.usta);
        console.log('🔍 Debug - makina field:', selectedWorkTask?.makina);
        console.log(
          '🔍 Debug - evaluationForm.maddeler:',
          evaluationForm.maddeler,
        );

        const evaluationData = {
          workTaskId: selectedWorkTask?._id,
          templateId: selectedTemplate?._id,
          degerlendirmeTipi:
            selectedEvaluationType === 1
              ? 'DEGERLENDIRME_1'
              : 'DEGERLENDIRME_2',
          maddeler: evaluationForm.maddeler.map(madde => ({
            maddeId: madde._id,
            soru: madde.soru,
            maxPuan: madde.puan,
            verilenPuan: madde.alinanPuan,
            yorum: madde.aciklama || '',
            resimUrl: madde.resimUrl || '',
          })),
          genelYorum: evaluationForm.genelNot,
          // Buddy bilgisini ekle
          buddyId: selectedWorkTask?.buddy?._id,
        };

        console.log('📤 Gönderilen evaluationData:', evaluationData);

        await kalipDegisimEvaluationAPI.createEvaluation(evaluationData);

        showSnackbar('Değerlendirme başarıyla kaydedildi', 'success');
        setEvaluationDialog(false);

        // Kalıp değişim verilerini yenile
        loadKalipDegisimData();
      } catch (error) {
        console.error('Değerlendirme kaydetme hatası:', error);
        showSnackbar(
          'Değerlendirme kaydedilirken hata oluştu: ' + error.message,
          'error',
        );
      }
    };

    const totalPuan = evaluationForm.maddeler.reduce(
      (sum, madde) => sum + madde.alinanPuan,
      0,
    );
    const maxPuan = evaluationForm.maddeler.reduce(
      (sum, madde) => sum + madde.puan,
      0,
    );

    return (
      <Dialog
        open={evaluationDialog}
        onClose={() => setEvaluationDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color='primary' />
            <Typography variant='h6'>
              {selectedTemplate?.ad} - Değerlendirme
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedWorkTask && selectedTemplate && selectedTemplate.ad && (
            <Box>
              {/* Değerlendirme Bilgileri */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle2' color='primary'>
                      Ana Çalışan
                    </Typography>
                    <Typography variant='body2'>
                      {selectedWorkTask?.usta?.ad}{' '}
                      {selectedWorkTask?.usta?.soyad}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle2' color='primary'>
                      Buddy
                    </Typography>
                    <Typography variant='body2'>
                      {selectedWorkTask?.buddy
                        ? `${selectedWorkTask.buddy.ad} ${selectedWorkTask.buddy.soyad}`
                        : 'Buddy atanmamış'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle2' color='primary'>
                      Makina
                    </Typography>
                    <Typography variant='body2'>
                      {selectedWorkTask?.makina?.ad || 'Bilinmiyor'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle2' color='primary'>
                      Toplam Puan
                    </Typography>
                    <Typography variant='body2'>
                      {totalPuan} / {maxPuan}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Değerlendirme Maddeleri */}
              <Typography variant='h6' sx={{ mb: 2 }}>
                Değerlendirme Maddeleri
              </Typography>

              {evaluationForm.maddeler.map((madde, index) => (
                <Paper key={madde._id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant='subtitle1' sx={{ mb: 1 }}>
                    {madde.soru}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mb: 1 }}
                        >
                          Puan (Max: {madde.puan})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {[...Array(madde.puan + 1)].map((_, score) => (
                            <Button
                              key={score}
                              variant={
                                madde.alinanPuan === score
                                  ? 'contained'
                                  : 'outlined'
                              }
                              size='small'
                              onClick={() =>
                                handleFormChange(index, 'alinanPuan', score)
                              }
                              color={
                                score === madde.puan
                                  ? 'success'
                                  : score >= madde.puan * 0.7
                                    ? 'primary'
                                    : score >= madde.puan * 0.4
                                      ? 'warning'
                                      : 'error'
                              }
                            >
                              {score}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label='Açıklama'
                        multiline
                        rows={2}
                        value={madde.aciklama}
                        onChange={e =>
                          handleFormChange(index, 'aciklama', e.target.value)
                        }
                        placeholder='Değerlendirme açıklaması...'
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {/* Genel Not */}
              <TextField
                fullWidth
                label='Genel Not'
                multiline
                rows={3}
                value={evaluationForm.genelNot}
                onChange={e => handleGenelNotChange(e.target.value)}
                placeholder='Genel değerlendirme notunuzu yazın...'
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEvaluationDialog(false)}>İptal</Button>
          <Button
            variant='contained'
            onClick={handleSubmitEvaluation}
            disabled={evaluationForm.maddeler.length === 0 || !selectedTemplate}
          >
            Değerlendirmeyi Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Kalıp Geçmişi Dialog Component
  const KalipHistoryDialog = () => (
    <Dialog
      open={kalipHistoryDialog}
      onClose={() => setKalipHistoryDialog(false)}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color='primary' />
          <Typography variant='h6'>
            {selectedMachineHistory?.ad} - Kalıp Değişim Geçmişi
          </Typography>
        </Box>
        <IconButton onClick={() => setKalipHistoryDialog(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {machineHistory.length > 0 ? (
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usta</TableCell>
                  <TableCell>Buddy</TableCell>
                  <TableCell>İndirilen Kalıp</TableCell>
                  <TableCell>Bağlanan Kalıp</TableCell>
                  <TableCell>Durdurma</TableCell>
                  <TableCell>Başlatma</TableCell>
                  <TableCell>Süre</TableCell>
                  <TableCell>Tamamlanma</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {machineHistory.map(history => (
                  <TableRow key={history._id}>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: 'primary.main',
                          }}
                        >
                          {history.usta.ad.charAt(0)}
                        </Avatar>
                        <Typography variant='body2'>
                          {history.usta.ad} {history.usta.soyad}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {history.buddy ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              bgcolor: 'info.main',
                              fontSize: '0.7rem',
                            }}
                          >
                            {history.buddy.ad.charAt(0)}
                          </Avatar>
                          <Typography
                            variant='body2'
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {history.buddy.ad} {history.buddy.soyad}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.indirilenKalip ? (
                        <Tooltip title={history.indirilenKalip.envanterKodu}>
                          <Typography variant='body2' color='error.main'>
                            {history.indirilenKalip.ad}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.baglananKalip ? (
                        <Tooltip title={history.baglananKalip.envanterKodu}>
                          <Typography variant='body2' color='success.main'>
                            {history.baglananKalip.ad}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.makinaDurmaSaati ? (
                        <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                          {new Date(
                            history.makinaDurmaSaati,
                          ).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.yeniKalipAktifSaati ? (
                        <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                          {new Date(
                            history.yeniKalipAktifSaati,
                          ).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.makinaDurmaSaati &&
                      history.yeniKalipAktifSaati ? (
                        <Chip
                          label={(() => {
                            const durma = new Date(history.makinaDurmaSaati);
                            const baslama = new Date(
                              history.yeniKalipAktifSaati,
                            );
                            const farkMs = baslama - durma;
                            const farkDakika = Math.round(farkMs / (1000 * 60));

                            if (farkDakika < 60) {
                              return `${farkDakika}dk`;
                            } else {
                              const saat = Math.floor(farkDakika / 60);
                              const dakika = farkDakika % 60;
                              return `${saat}s ${dakika}dk`;
                            }
                          })()}
                          size='small'
                          color={(() => {
                            const durma = new Date(history.makinaDurmaSaati);
                            const baslama = new Date(
                              history.yeniKalipAktifSaati,
                            );
                            const farkDakika = Math.round(
                              (baslama - durma) / (1000 * 60),
                            );

                            if (farkDakika > 120) {
                              return 'error';
                            }
                            if (farkDakika > 60) {
                              return 'warning';
                            }
                            return 'success';
                          })()}
                        />
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                        {new Date(history.tamamlanmaTarihi).toLocaleDateString(
                          'tr-TR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color='text.secondary'>
              Bu makina için kalıp değişim geçmişi bulunamadı.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setKalipHistoryDialog(false)}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );

  // Machine Personnel View with role filtering and scoring
  const MachinePersonnelView = () => {
    const machineData =
      machineBasedData?.machinePersonnelData || data?.machinePersonnel || {};

    return (
      <Box>
        {/* Role Filter Controls */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FilterListIcon color='primary' />
            <Typography variant='h6' color='primary'>
              Personel Rol Filtresi
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label='Tümü'
              variant={selectedRoleFilter === '' ? 'filled' : 'outlined'}
              color={selectedRoleFilter === '' ? 'primary' : 'default'}
              onClick={() => setSelectedRoleFilter('')}
              clickable
            />
            <Chip
              label='Paketlemeci'
              variant={
                selectedRoleFilter === 'paketlemeci' ? 'filled' : 'outlined'
              }
              color={
                selectedRoleFilter === 'paketlemeci' ? 'secondary' : 'default'
              }
              onClick={() => setSelectedRoleFilter('paketlemeci')}
              clickable
            />
            <Chip
              label='Ortacı'
              variant={selectedRoleFilter === 'ortaci' ? 'filled' : 'outlined'}
              color={selectedRoleFilter === 'ortaci' ? 'warning' : 'default'}
              onClick={() => setSelectedRoleFilter('ortaci')}
              clickable
            />
            <Chip
              label='Usta'
              variant={selectedRoleFilter === 'usta' ? 'filled' : 'outlined'}
              color={selectedRoleFilter === 'usta' ? 'info' : 'default'}
              onClick={() => setSelectedRoleFilter('usta')}
              clickable
            />
          </Box>

          {/* Statistics for filtered data */}
          {machineBasedData && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Toplam Makina
                  </Typography>
                  <Typography variant='h6' color='primary'>
                    {machineBasedData.stats.totalMachines}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Toplam Personel
                  </Typography>
                  <Typography variant='h6' color='primary'>
                    {machineBasedData.stats.totalPersonnel}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Ortalama Puan
                  </Typography>
                  <Typography
                    variant='h6'
                    color={
                      machineBasedData.stats.avgSystemScore >= 70
                        ? 'success.main'
                        : 'warning.main'
                    }
                  >
                    {machineBasedData.stats.avgSystemScore}/100
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Filtre
                  </Typography>
                  <Typography variant='h6' color='info.main'>
                    {selectedRoleFilter || 'Tümü'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Machine List */}
        {Object.entries(machineData).map(([machineKey, machineInfo]) => (
          <Accordion
            key={machineKey}
            expanded={expandedAccordion === machineKey}
            onChange={(event, isExpanded) =>
              setExpandedAccordion(isExpanded ? machineKey : false)
            }
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                }}
              >
                <MachineIcon color='primary' />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                    {machineInfo.machine?.envanterKodu ||
                      machineInfo.machine?.kod}{' '}
                    - {machineInfo.machine?.ad}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {machineInfo.machine?.kategori}
                    {machineInfo.avgMachineScore && (
                      <> • Ortalama Puan: {machineInfo.avgMachineScore}/100</>
                    )}
                  </Typography>
                </Box>
                <Badge
                  badgeContent={
                    machineInfo.personnelCount ||
                    machineInfo.personnel?.length ||
                    0
                  }
                  color='primary'
                >
                  <PeopleIcon />
                </Badge>
                {machineInfo.avgMachineScore && (
                  <Chip
                    label={`${machineInfo.avgMachineScore}/100`}
                    size='small'
                    color={
                      machineInfo.avgMachineScore >= 80
                        ? 'success'
                        : machineInfo.avgMachineScore >= 60
                          ? 'warning'
                          : 'error'
                    }
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {(machineInfo.personnel || []).map(person => (
                  <Grid item xs={12} sm={6} md={4} key={person._id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {person.ad.charAt(0)}
                            {person.soyad.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant='subtitle1'
                              sx={{ fontWeight: 'bold' }}
                            >
                              {person.ad} {person.soyad}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              @{person.kullaniciAdi}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            gutterBottom
                          >
                            Roller:
                          </Typography>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                          >
                            {person.roller.map((role, index) => (
                              <Chip
                                key={index}
                                label={role}
                                size='small'
                                color={getRoleColor(role)}
                                variant='outlined'
                              />
                            ))}
                          </Box>
                        </Box>

                        {/* Performance and Activity Data (if available) */}
                        {machineBasedData && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              gutterBottom
                            >
                              Performans:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                              <Chip
                                label={`${person.avgControlScore || 0}/100`}
                                size='small'
                                color={
                                  (person.avgControlScore || 0) >= 80
                                    ? 'success'
                                    : (person.avgControlScore || 0) >= 60
                                      ? 'warning'
                                      : 'error'
                                }
                              />
                              <Chip
                                label={person.performanceStatus || 'Veri Yok'}
                                size='small'
                                variant='outlined'
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Chip
                                label={`Görev: ${person.totalTasks || 0}`}
                                size='small'
                                color='info'
                                variant='outlined'
                              />
                              <Chip
                                label={`Kalite: ${person.totalQualityEvaluations || 0}`}
                                size='small'
                                color='secondary'
                                variant='outlined'
                              />
                            </Box>
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant='body2' color='text.secondary'>
                            {person.departmanlar?.join(', ') || 'Atanmamış'}
                          </Typography>
                          <Chip
                            label={`${person.makinaSayisi || 0} Makina`}
                            size='small'
                            color='info'
                            variant='outlined'
                          />
                        </Box>

                        {/* Last Activity */}
                        {machineBasedData && person.lastActivity && (
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Son Aktivite:{' '}
                              {new Date(person.lastActivity).toLocaleDateString(
                                'tr-TR',
                              )}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {Object.keys(machineData).length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <MachineIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant='h6' color='text.secondary'>
              {selectedRoleFilter
                ? `${selectedRoleFilter} rolünde makina atanmış personel bulunamadı`
                : 'Makina atanmış personel bulunamadı'}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  // Department Personnel View
  const DepartmentPersonnelView = () => (
    <Box>
      {Object.entries(data?.departmentPersonnel || {}).map(
        ([deptName, personnel]) => (
          <Paper key={deptName} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <DepartmentIcon color='primary' />
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                {deptName}
              </Typography>
              <Chip
                label={`${personnel.length} Personel`}
                color='primary'
                variant='outlined'
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Personel</TableCell>
                    <TableCell>Roller</TableCell>
                    <TableCell>Makina Sayısı</TableCell>
                    <TableCell>Son Giriş</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(personnel).map(person => (
                    <TableRow key={person._id}>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: 'primary.main',
                              width: 32,
                              height: 32,
                            }}
                          >
                            {person.ad.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant='subtitle2'>
                              {person.ad} {person.soyad}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              @{person.kullaniciAdi}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {person.roller.map((role, index) => (
                            <Chip
                              key={index}
                              label={role}
                              size='small'
                              color={getRoleColor(role)}
                              variant='outlined'
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={person.makinaSayisi}
                          size='small'
                          color='info'
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {person.guncellemeTarihi
                            ? new Date(
                                person.guncellemeTarihi,
                              ).toLocaleDateString('tr-TR')
                            : 'Henüz giriş yapmamış'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ),
      )}
    </Box>
  );

  // Role Personnel View
  const RolePersonnelView = () => (
    <Box>
      {Object.entries(data?.rolePersonnel || {}).map(
        ([roleName, personnel]) => (
          <Paper key={roleName} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <RoleIcon color='primary' />
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                {roleName}
              </Typography>
              <Chip
                label={`${personnel.length} Personel`}
                color='primary'
                variant='outlined'
              />
            </Box>

            <Grid container spacing={2}>
              {filterData(personnel).map(person => (
                <Grid item xs={12} sm={6} md={4} key={person._id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              getRoleColor(roleName) === 'default'
                                ? 'primary.main'
                                : `${getRoleColor(roleName)}.main`,
                          }}
                        >
                          {person.ad.charAt(0)}
                          {person.soyad.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography
                            variant='subtitle1'
                            sx={{ fontWeight: 'bold' }}
                          >
                            {person.ad} {person.soyad}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {person.departmanlar?.join(', ') || 'Atanmamış'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant='body2' color='text.secondary'>
                          @{person.kullaniciAdi}
                        </Typography>
                        <Chip
                          label={`${person.makinaSayisi} Makina`}
                          size='small'
                          color='info'
                          variant='outlined'
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        ),
      )}
    </Box>
  );

  // All Personnel View
  const AllPersonnelView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Personel</TableCell>
            <TableCell>Departman</TableCell>
            <TableCell>Roller</TableCell>
            <TableCell>Makina Sayısı</TableCell>
            <TableCell>Son Giriş</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filterData(data?.personnel || []).map(person => (
            <TableRow key={person._id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {person.ad.charAt(0)}
                    {person.soyad.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle2'>
                      {person.ad} {person.soyad}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      @{person.kullaniciAdi}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={person.departmanlar?.join(', ') || 'Atanmamış'}
                  size='small'
                  color='default'
                  variant='outlined'
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {person.roller.map((role, index) => (
                    <Chip
                      key={index}
                      label={role}
                      size='small'
                      color={getRoleColor(role)}
                      variant='outlined'
                    />
                  ))}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={person.makinaSayisi || 0}
                  size='small'
                  color='info'
                  variant='outlined'
                />
              </TableCell>
              <TableCell>
                <Typography variant='body2' color='text.secondary'>
                  {person.guncellemeTarihi
                    ? new Date(person.guncellemeTarihi).toLocaleDateString(
                        'tr-TR',
                      )
                    : 'Henüz giriş yapmamış'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
            Personel Takip
          </Typography>
          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error Boundary */}
        {!loading && (
          <>
            <StatisticsCards />
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => {
                setActiveTab(newValue);
                setSelectedRoleFilter(''); // Reset role filter when switching tabs
              }}
              variant='scrollable'
              scrollButtons='auto'
              sx={{ mb: 3 }}
            >
              <Tab label='Makina Bazlı' />
              <Tab label='Kalıp Değişim' />
              <Tab label='Departman Bazlı' />
              <Tab label='Rol Bazlı' />
              <Tab label='Tüm Personel' />
            </Tabs>

            {/* Tab Content */}
            {activeTab === 0 && <MachinePersonnelView />}
            {activeTab === 1 && <KalipDegisimView />}
            {activeTab === 2 && <DepartmentPersonnelView />}
            {activeTab === 3 && <RolePersonnelView />}
            {activeTab === 4 && <AllPersonnelView />}

            {/* Değerlendirme Dialog */}
            <EvaluationDialog />

            {/* Kalıp History Dialog */}
            <KalipHistoryDialog />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PersonnelTracking;
