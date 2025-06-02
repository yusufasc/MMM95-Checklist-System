import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Alert,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Autocomplete,
  TextField,
  List,
  Slider,
  CircularProgress,
  Chip,
  Avatar,
  Fab,
  Collapse,
  IconButton,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { qualityControlAPI, inventoryAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const QualityControlEvaluation = () => {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [kalips, setKalips] = useState([]);

  // Form verileri
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedKalip, setSelectedKalip] = useState('');
  const [hammadde, setHammadde] = useState('');
  const [evaluationData, setEvaluationData] = useState({});
  const [notes, setNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    template: true,
    selections: true,
    evaluation: false,
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Refs
  const fileInputRefs = useRef({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, machinesRes, kalipsRes] = await Promise.all([
        qualityControlAPI.getActiveTemplates(),
        inventoryAPI.getMachinesForTasks(),
        inventoryAPI.getKalipsForTasks(),
      ]);
      setTemplates(templatesRes.data);
      setMachines(machinesRes.data);
      setKalips(kalipsRes.data);
      // Workers şablon seçildikten sonra yüklenecek - burada sıfırlama
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ LoadData hatası:', error);
      }
      // showSnackbar dependency'sini kaldırdık, direkt console.error kullanıyoruz
    } finally {
      setLoading(false);
    }
  }, []); // Dependency array'i boş

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Workers state değişikliklerini izle (sadece development'ta)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👥 Workers state değişti:', workers.length, 'kişi');
      if (workers.length > 0) {
        console.log(
          '📝 İlk 3 worker:',
          workers
            .slice(0, 3)
            .map(w => `${w.ad} ${w.soyad} (${w.puanlanabilir ? 'puanlanabilir' : 'puanlanamaz'})`),
        );
      }
    }
  }, [workers]);

  const handleTemplateSelect = async templateId => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Şablon seçildi:', templateId);
    }
    setSelectedTemplate(templateId);
    setEvaluationData({});
    setSelectedWorker(''); // Kullanıcı seçimini sıfırla
    setExpandedSections(prev => ({ ...prev, selections: true, evaluation: true }));

    // Seçilen şablonun rolüne göre kullanıcıları yükle
    try {
      setLoading(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 API çağrısı yapılıyor...');
      }
      const workersRes = await qualityControlAPI.getActiveWorkersByTemplate(templateId);
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 API yanıtı:', workersRes.data);
      }
      setWorkers(workersRes.data);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Workers state güncellendi, toplam:', workersRes.data.length);
      }

      const puanlanabilirSayisi = workersRes.data.filter(w => w.puanlanabilir).length;
      const toplamSayisi = workersRes.data.length;

      if (toplamSayisi === 0) {
        showSnackbar('Bu role ait aktif çalışan bulunamadı', 'warning');
      } else if (puanlanabilirSayisi === 0) {
        showSnackbar(
          `${toplamSayisi} çalışan yüklendi, ancak hepsi son 4 saat içinde puanlanmış`,
          'warning',
        );
      } else {
        showSnackbar(
          `${toplamSayisi} çalışan yüklendi (${puanlanabilirSayisi} puanlanabilir)`,
          'success',
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Workers yükleme hatası:', error);
      }
      showSnackbar(
        `Çalışanlar yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        'error',
      );
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationChange = (maddeIndex, field, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [maddeIndex]: {
        ...prev[maddeIndex],
        [field]: value,
      },
    }));
  };

  const handleImageUpload = async (maddeIndex, event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Dosya validasyonu
    if (!file.type.startsWith('image/')) {
      showSnackbar('Sadece resim dosyaları kabul edilir', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Dosya boyutu çok büyük (Max: 5MB)', 'error');
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      handleEvaluationChange(maddeIndex, 'fotograf', base64);
      showSnackbar('Fotoğraf başarıyla eklendi', 'success');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Fotoğraf yükleme hatası:', error);
      }
      showSnackbar('Fotoğraf yüklenirken hata oluştu', 'error');
    }
  };

  const convertToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleSaveEvaluation = async () => {
    if (!selectedTemplate || !selectedWorker) {
      showSnackbar('Lütfen şablon ve çalışan seçin', 'warning');
      return;
    }

    try {
      setLoading(true);

      const template = templates.find(t => t._id === selectedTemplate);

      // Backend'in beklediği formata uygun payload oluştur
      const evaluationPayload = {
        sablon: selectedTemplate,
        degerlendirilenKullanici: selectedWorker, // Backend'in beklediği field ismi
        makina: selectedMachine || undefined,
        kalip: selectedKalip || undefined,
        hammadde: hammadde || undefined,
        genelYorum: notes || '', // Backend'in beklediği field ismi
        maddeler: template.maddeler.map((madde, index) => ({
          baslik: madde.baslik,
          maksimumPuan: madde.maksimumPuan,
          alinanPuan: evaluationData[index]?.puan || 0,
          yorum: evaluationData[index]?.yorum || '',
          fotografUrl: evaluationData[index]?.fotograf || undefined,
        })),
        toplamPuan: template.maddeler.reduce(
          (sum, madde, index) => sum + (evaluationData[index]?.puan || 0),
          0,
        ),
        maksimumToplamPuan: template.maddeler.reduce((sum, madde) => sum + madde.maksimumPuan, 0),
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Debug - Seçilen değerler:');
        console.log('  - Template:', selectedTemplate);
        console.log('  - Worker:', selectedWorker);
        console.log('  - Machine:', selectedMachine);
        console.log('  - Kalip:', selectedKalip);
        console.log('  - Hammadde:', hammadde);
        console.log('  - Notes:', notes);
        console.log('  - EvaluationData:', evaluationData);
        console.log('📤 Gönderilen payload:', evaluationPayload);
      }

      await qualityControlAPI.createEvaluation(evaluationPayload);

      showSnackbar('Değerlendirme başarıyla kaydedildi', 'success');

      // Formu sıfırla
      setSelectedTemplate('');
      setSelectedWorker('');
      setSelectedMachine('');
      setSelectedKalip('');
      setHammadde('');
      setEvaluationData({});
      setNotes('');
      setWorkers([]); // Workers listesini de sıfırla
      setExpandedSections({ template: true, selections: false, evaluation: false });
    } catch (error) {
      let errorMessage = 'Değerlendirme kaydedilirken hata oluştu';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t._id === selectedTemplate);
  };

  const getSelectedWorker = () => {
    return workers.find(w => w._id === selectedWorker);
  };

  const getTotalScore = () => {
    const template = getSelectedTemplate();
    if (!template) {
      return { current: 0, max: 0 };
    }

    const currentScore = template.maddeler.reduce(
      (sum, madde, index) => sum + (evaluationData[index]?.puan || 0),
      0,
    );
    const maxScore = template.maddeler.reduce((sum, madde) => sum + madde.maksimumPuan, 0);

    return { current: currentScore, max: maxScore };
  };

  const toggleSection = section => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const loadDebugInfo = async () => {
    try {
      await qualityControlAPI.getDebugInfo();
      showSnackbar('Şablon durumunu kontrol etme işlemi başarılı', 'success');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Debug info hatası:', error);
      }
      showSnackbar('Şablon durumunu kontrol etme işlemi sırasında hata oluştu', 'error');
    }
  };

  if (loading && templates.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Şablon Seçimi */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => toggleSection('template')}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            Değerlendirme Şablonu
          </Typography>
          <IconButton>
            {expandedSections.template ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expandedSections.template}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Değerlendirme Şablonu Seçin
                </Typography>
                <IconButton onClick={() => toggleSection('template')}>
                  {expandedSections.template ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {templates.length === 0 ? (
                <Alert severity="warning">
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Henüz aktif değerlendirme şablonu bulunmuyor.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Bu durumun nedenleri:
                  </Typography>
                  <Typography component="ul" variant="body2" sx={{ ml: 2 }}>
                    <li>Hiç şablon oluşturulmamış olabilir</li>
                    <li>Şablonlar "Pasif" durumda olabilir</li>
                    <li>
                      Şablonlarda belirli saatler tanımlanmış ve şu anda değerlendirme saati dışında
                      olabilir
                    </li>
                    <li>Şablonlar başka rollere atanmış olabilir</li>
                  </Typography>
                  <Button variant="outlined" size="small" onClick={loadDebugInfo} sx={{ mt: 2 }}>
                    Şablon Durumunu Kontrol Et
                  </Button>
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {templates.map(template => (
                    <Grid item xs={12} sm={6} key={template._id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedTemplate === template._id ? 2 : 1,
                          borderColor:
                            selectedTemplate === template._id ? 'primary.main' : 'divider',
                          backgroundColor:
                            selectedTemplate === template._id ? 'primary.50' : 'white',
                        }}
                        onClick={() => handleTemplateSelect(template._id)}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {template.ad}
                              </Typography>
                              <Chip label={template.rol.ad} size="small" color="primary" />
                              <Typography variant="caption" display="block" color="text.secondary">
                                {template.maddeler.length} madde -{' '}
                                {template.maddeler.reduce((sum, m) => sum + m.maksimumPuan, 0)} puan
                              </Typography>
                            </Box>
                            {selectedTemplate === template._id && (
                              <CheckCircleIcon color="primary" />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Collapse>
      </Paper>

      {/* Seçimler */}
      {selectedTemplate && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => toggleSection('selections')}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Çalışan ve Makina Seçimi
            </Typography>
            <IconButton>
              {expandedSections.selections ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={expandedSections.selections}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Çalışan Seçimi - Daha Geniş */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Değerlendirilecek Çalışan
                </Typography>

                {/* Puanlanabilir Çalışanlar */}
                <Autocomplete
                  fullWidth
                  options={workers.filter(w => w.puanlanabilir)}
                  getOptionLabel={option => `${option.ad} ${option.soyad}`}
                  value={
                    workers.filter(w => w.puanlanabilir).find(w => w._id === selectedWorker) || null
                  }
                  onChange={(event, newValue) => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('👤 Kullanıcı seçildi:', newValue);
                    }
                    setSelectedWorker(newValue ? newValue._id : '');
                  }}
                  filterOptions={(options, { inputValue }) => {
                    return options.filter(option =>
                      `${option.ad} ${option.soyad}`
                        .toLowerCase()
                        .includes(inputValue.toLowerCase()),
                    );
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder="Çalışan ara (ad, soyad ile)..."
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          minHeight: '56px',
                          fontSize: '1.1rem',
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ p: 2 }}>
                      <Avatar sx={{ mr: 2, width: 40, height: 40, bgcolor: 'primary.main' }}>
                        {option.ad[0]}
                        {option.soyad[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {option.ad} {option.soyad}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  noOptionsText={
                    workers.length === 0
                      ? 'Çalışan listesi yükleniyor...'
                      : workers.filter(w => w.puanlanabilir).length === 0
                        ? 'Tüm çalışanlar son 4 saat içinde puanlanmış'
                        : 'Puanlanabilir çalışan bulunamadı'
                  }
                />

                {/* Puanlanmış Çalışanlar Listesi */}
                {workers.filter(w => !w.puanlanabilir).length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}
                    >
                      Son 4 Saat İçinde Puanlanmış Çalışanlar
                    </Typography>
                    <Grid container spacing={2}>
                      {workers
                        .filter(w => !w.puanlanabilir)
                        .map(worker => (
                          <Grid item xs={12} sm={6} md={4} key={worker._id}>
                            <Card
                              sx={{
                                bgcolor: 'grey.50',
                                border: '1px solid',
                                borderColor: 'grey.300',
                                opacity: 0.8,
                              }}
                            >
                              <CardContent sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Avatar
                                    sx={{ mr: 2, width: 32, height: 32, bgcolor: 'grey.500' }}
                                  >
                                    {worker.ad[0]}
                                    {worker.soyad[0]}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {worker.ad} {worker.soyad}
                                    </Typography>
                                  </Box>
                                </Box>

                                {worker.basariYuzdesi !== null && (
                                  <Box sx={{ mt: 1 }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Typography variant="body2" color="text.secondary">
                                        Son Puan:
                                      </Typography>
                                      <Chip
                                        label={`%${worker.basariYuzdesi}`}
                                        size="small"
                                        color={
                                          worker.basariYuzdesi >= 80
                                            ? 'success'
                                            : worker.basariYuzdesi >= 60
                                              ? 'warning'
                                              : 'error'
                                        }
                                      />
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      {worker.toplamPuan}/{worker.maksimumPuan} puan
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Değerlendirme:{' '}
                                      {new Date(worker.sonDegerlendirme).toLocaleTimeString(
                                        'tr-TR',
                                        {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        },
                                      )}
                                    </Typography>
                                    {worker.degerlendirmeSayisi > 1 && (
                                      <Typography
                                        variant="caption"
                                        color="primary.main"
                                        display="block"
                                      >
                                        Bugün {worker.degerlendirmeSayisi} kez puanlandı
                                      </Typography>
                                    )}
                                  </Box>
                                )}

                                <Typography
                                  variant="caption"
                                  color="error.main"
                                  display="block"
                                  sx={{ mt: 1 }}
                                >
                                  {worker.puanlanamaSebebi || '4 saat sonra tekrar puanlanabilir'}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                )}
              </Grid>

              {/* Makina Seçimi - Daha Geniş */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Makina (İsteğe Bağlı)
                </Typography>
                <Autocomplete
                  options={machines}
                  getOptionLabel={option => `${option.kod} - ${option.ad}`}
                  value={machines.find(m => m._id === selectedMachine) || null}
                  onChange={(event, newValue) => {
                    setSelectedMachine(newValue ? newValue._id : '');
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder="Makina ara ve seç..."
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          minHeight: '56px',
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Kalıp Seçimi - Daha Geniş */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Kalıp (İsteğe Bağlı)
                </Typography>
                <Autocomplete
                  options={kalips}
                  getOptionLabel={option => `${option.kod} - ${option.ad}`}
                  value={kalips.find(k => k._id === selectedKalip) || null}
                  onChange={(event, newValue) => {
                    setSelectedKalip(newValue ? newValue._id : '');
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder="Kalıp ara ve seç..."
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          minHeight: '56px',
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Hammadde - Daha Geniş */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Hammadde (İsteğe Bağlı)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Kullanılan hammadde bilgisini giriniz..."
                  value={hammadde}
                  onChange={e => setHammadde(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: '56px',
                      fontSize: '1.1rem',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>
      )}

      {/* Değerlendirme */}
      {selectedTemplate && selectedWorker && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => toggleSection('evaluation')}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Değerlendirme - {getTotalScore().current}/{getTotalScore().max} Puan
            </Typography>
            <IconButton>
              {expandedSections.evaluation ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={expandedSections.evaluation}>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Değerlendirilen:</strong> {getSelectedWorker()?.ad}{' '}
                {getSelectedWorker()?.soyad}
              </Alert>

              <List sx={{ p: 0 }}>
                {getSelectedTemplate()?.maddeler.map((madde, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {index + 1}. {madde.baslik}
                      </Typography>

                      {madde.aciklama && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {madde.aciklama}
                        </Typography>
                      )}

                      {/* Puan Slider */}
                      <Box sx={{ mb: 2 }}>
                        <Typography gutterBottom>
                          Puan: {evaluationData[index]?.puan || 0} / {madde.maksimumPuan}
                        </Typography>
                        <Slider
                          value={evaluationData[index]?.puan || 0}
                          onChange={(e, value) => handleEvaluationChange(index, 'puan', value)}
                          min={0}
                          max={madde.maksimumPuan}
                          marks
                          step={1}
                          valueLabelDisplay="auto"
                          sx={{
                            '& .MuiSlider-thumb': {
                              height: 24,
                              width: 24,
                            },
                            '& .MuiSlider-track': {
                              height: 8,
                            },
                            '& .MuiSlider-rail': {
                              height: 8,
                            },
                          }}
                        />
                      </Box>

                      {/* Yorum */}
                      <TextField
                        fullWidth
                        label="Yorum"
                        multiline
                        rows={2}
                        value={evaluationData[index]?.yorum || ''}
                        onChange={e => handleEvaluationChange(index, 'yorum', e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      {/* Fotoğraf */}
                      <Box>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          style={{ display: 'none' }}
                          ref={el => (fileInputRefs.current[index] = el)}
                          onChange={e => handleImageUpload(index, e)}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<PhotoCameraIcon />}
                            onClick={() => fileInputRefs.current[index]?.click()}
                            size="small"
                          >
                            {evaluationData[index]?.fotograf
                              ? 'Fotoğrafı Değiştir'
                              : 'Fotoğraf Ekle (İsteğe Bağlı)'}
                          </Button>

                          <Chip label="İsteğe Bağlı" size="small" color="info" />
                        </Box>

                        {evaluationData[index]?.fotograf && (
                          <Box sx={{ mt: 1 }}>
                            <Box
                              component="button"
                              onClick={() => setPreviewImage(evaluationData[index].fotograf)}
                              sx={{
                                border: 'none',
                                background: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                '&:focus': {
                                  outline: '2px solid primary.main',
                                  outlineOffset: 2,
                                },
                              }}
                              aria-label="Fotoğrafı büyüt"
                            >
                              <img
                                src={evaluationData[index].fotograf}
                                alt="Değerlendirme fotoğrafı"
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>

              {/* Genel Yorum */}
              <TextField
                fullWidth
                label="Genel Değerlendirme Notu"
                multiline
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Bu değerlendirme hakkında genel yorumlarınızı yazın..."
                sx={{ mt: 2 }}
              />
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Kaydet Butonu - Floating */}
      {selectedTemplate && selectedWorker && (
        <Fab
          color="primary"
          variant="extended"
          onClick={handleSaveEvaluation}
          disabled={loading}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
            '&:hover': {
              background: 'linear-gradient(45deg, #388e3c, #689f38)',
            },
          }}
        >
          <SaveIcon sx={{ mr: 1 }} />
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Fab>
      )}

      {/* Fotoğraf Önizleme Dialog */}
      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md" fullWidth>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 1 }}>
            {previewImage && (
              <img
                src={previewImage}
                alt="Fotoğraf önizleme"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  );
};

export default QualityControlEvaluation;
