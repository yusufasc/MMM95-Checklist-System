import { useState, useEffect, useRef, useCallback } from 'react';
import { qualityControlAPI, inventoryAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

export const useQualityEvaluation = () => {
  const { showSnackbar } = useSnackbar();

  // Loading states
  const [loading, setLoading] = useState(false);

  // Data states
  const [templates, setTemplates] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [kalips, setKalips] = useState([]);

  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedKalip, setSelectedKalip] = useState('');
  const [hammadde, setHammadde] = useState('');
  const [evaluationData, setEvaluationData] = useState({});
  const [notes, setNotes] = useState('');

  // UI states
  const [expandedSections, setExpandedSections] = useState({
    template: true,
    selections: true,
    evaluation: false,
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Refs
  const fileInputRefs = useRef({});

  // Initial data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, machinesRes, kalipsRes] = await Promise.all([
        qualityControlAPI.getActiveTemplates(),
        inventoryAPI.getMachines('all'),
        inventoryAPI.getKalips(),
      ]);
      setTemplates(templatesRes.data);
      setMachines(machinesRes.data);
      setKalips(kalipsRes.data || []);
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('❌ LoadData hatası:', error);
      }
      // Kalıp yükleme hatası durumunda boş array set et
      setKalips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Workers state izleme (development)
  useEffect(() => {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.log('👥 Workers state değişti:', workers.length, 'kişi');
      if (workers.length > 0) {
        console.log(
          '📝 İlk 3 worker:',
          workers
            .slice(0, 3)
            .map(
              w =>
                `${w.ad} ${w.soyad} (${w.puanlanabilir ? 'puanlanabilir' : 'puanlanamaz'})`,
            ),
        );
      }
    }
  }, [workers]);

  // Template selection handler
  const handleTemplateSelect = async templateId => {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.log('🎯 Şablon seçildi:', templateId);
    }

    setSelectedTemplate(templateId);
    setEvaluationData({});
    setSelectedWorker('');
    setExpandedSections(prev => ({
      ...prev,
      selections: true,
      evaluation: true,
    }));

    // Workers yükleme
    try {
      setLoading(true);
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.log('📡 API çağrısı yapılıyor...');
      }

      const workersRes =
        await qualityControlAPI.getActiveWorkersByTemplate(templateId);

      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.log('📋 API yanıtı:', workersRes.data);
      }

      setWorkers(workersRes.data);

      const puanlanabilirSayisi = workersRes.data.filter(
        w => w.puanlanabilir,
      ).length;
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
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
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

  // Worker selection handler
  const handleWorkerSelect = workerId => {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.log('👤 Kullanıcı seçildi:', workerId);
    }
    setSelectedWorker(workerId);
  };

  // Other form handlers
  const handleMachineSelect = machineId => {
    setSelectedMachine(machineId);
  };

  const handleKalipSelect = kalipId => {
    setSelectedKalip(kalipId);
  };

  const handleHammaddeChange = value => {
    setHammadde(value);
  };

  const handleNotesChange = value => {
    setNotes(value);
  };

  // Evaluation data handler
  const handleEvaluationChange = (maddeIndex, field, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [maddeIndex]: {
        ...prev[maddeIndex],
        [field]: value,
      },
    }));
  };

  // Image upload handler
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
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Fotoğraf yükleme hatası:', error);
      }
      showSnackbar('Fotoğraf yüklenirken hata oluştu', 'error');
    }
  };

  // Image utilities
  const convertToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handlePreviewImage = imageData => {
    setPreviewImage(imageData);
  };

  const closePreviewImage = () => {
    setPreviewImage(null);
  };

  // Save evaluation handler
  const handleSaveEvaluation = async () => {
    if (!selectedTemplate || !selectedWorker) {
      showSnackbar('Lütfen şablon ve çalışan seçin', 'warning');
      return;
    }

    try {
      setLoading(true);

      const template = templates.find(t => t._id === selectedTemplate);

      const evaluationPayload = {
        sablon: selectedTemplate,
        degerlendirilenKullanici: selectedWorker,
        makina: selectedMachine || undefined,
        kalip: selectedKalip || undefined,
        hammadde: hammadde || undefined,
        genelYorum: notes || '',
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
        maksimumToplamPuan: template.maddeler.reduce(
          (sum, madde) => sum + madde.maksimumPuan,
          0,
        ),
      };

      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.log('📤 Gönderilen payload:', evaluationPayload);
      }

      await qualityControlAPI.createEvaluation(evaluationPayload);
      showSnackbar('Değerlendirme başarıyla kaydedildi', 'success');

      // Form reset
      resetForm();
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

  // Form reset
  const resetForm = () => {
    setSelectedTemplate('');
    setSelectedWorker('');
    setSelectedMachine('');
    setSelectedKalip('');
    setHammadde('');
    setEvaluationData({});
    setNotes('');
    setWorkers([]);
    setExpandedSections({
      template: true,
      selections: false,
      evaluation: false,
    });
  };

  // Section toggle handler
  const toggleSection = section => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Debug helper
  const loadDebugInfo = async () => {
    try {
      await qualityControlAPI.getDebugInfo();
      showSnackbar('Şablon durumunu kontrol etme işlemi başarılı', 'success');
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Debug info hatası:', error);
      }
      showSnackbar(
        'Şablon durumunu kontrol etme işlemi sırasında hata oluştu',
        'error',
      );
    }
  };

  // Computed values
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
    const maxScore = template.maddeler.reduce(
      (sum, madde) => sum + madde.maksimumPuan,
      0,
    );

    return { current: currentScore, max: maxScore };
  };

  // Filtered workers
  const availableWorkers = workers.filter(w => w.puanlanabilir);
  const unavailableWorkers = workers.filter(w => !w.puanlanabilir);

  return {
    // Loading state
    loading,

    // Data states
    templates,
    workers,
    machines,
    kalips,
    availableWorkers,
    unavailableWorkers,

    // Form states
    selectedTemplate,
    selectedWorker,
    selectedMachine,
    selectedKalip,
    hammadde,
    evaluationData,
    notes,

    // UI states
    expandedSections,
    previewImage,
    fileInputRefs,

    // Computed values
    selectedTemplateData: getSelectedTemplate(),
    selectedWorkerData: getSelectedWorker(),
    totalScore: getTotalScore(),

    // Handlers
    handleTemplateSelect,
    handleWorkerSelect,
    handleMachineSelect,
    handleKalipSelect,
    handleHammaddeChange,
    handleNotesChange,
    handleEvaluationChange,
    handleImageUpload,
    handlePreviewImage,
    closePreviewImage,
    handleSaveEvaluation,
    toggleSection,
    loadDebugInfo,
    resetForm,
  };
};
