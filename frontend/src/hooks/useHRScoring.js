import { useState, useCallback } from 'react';
import { hrAPI } from '../services/api';

export const useHRScoring = ({ showSnackbar, onDataChange }) => {
  // Scoring Dialog States
  const [scoreDialog, setScoreDialog] = useState({ open: false });
  const [scoreForm, setScoreForm] = useState({
    kullaniciId: '',
    templateId: '',
    yil: new Date().getFullYear(),
    ay: new Date().getMonth() + 1,
    maddeler: [],
    genelNot: '',
    kaliteSkoru: 0,
  });

  // Evaluation Dialog States
  const [evaluationDialog, setEvaluationDialog] = useState({
    open: false,
    user: null,
    template: null,
  });

  const [evaluationForm, setEvaluationForm] = useState({
    maddeler: [],
    genelNot: '',
    kaliteSkoru: 0,
    puanlayanId: '',
    puanlamaTarihi: new Date(),
  });

  const [selectedUserScores, setSelectedUserScores] = useState(null);
  const [evaluatedUsers, setEvaluatedUsers] = useState([]);

  const openScoreDialog = useCallback(() => {
    setScoreDialog({ open: true });
    setScoreForm({
      kullaniciId: '',
      templateId: '',
      yil: new Date().getFullYear(),
      ay: new Date().getMonth() + 1,
      maddeler: [],
      genelNot: '',
      kaliteSkoru: 0,
    });
  }, []);

  const closeScoreDialog = useCallback(() => {
    setScoreDialog({ open: false });
    setScoreForm({
      kullaniciId: '',
      templateId: '',
      yil: new Date().getFullYear(),
      ay: new Date().getMonth() + 1,
      maddeler: [],
      genelNot: '',
      kaliteSkoru: 0,
    });
  }, []);

  const openEvaluationDialog = useCallback((user, template) => {
    // Template maddelerini evaluation form'a kopyala
    const templateMaddeler = template.maddeler.map(madde => ({
      ...madde,
      puan: 0,
      aciklama: '',
      fotograflar: [],
    }));

    setEvaluationForm({
      maddeler: templateMaddeler,
      genelNot: '',
      kaliteSkoru: 0,
      puanlayanId: '', // Bu backend'den gelecek
      puanlamaTarihi: new Date(),
    });

    setEvaluationDialog({
      open: true,
      user,
      template,
    });
  }, []);

  const closeEvaluationDialog = useCallback(() => {
    setEvaluationDialog({
      open: false,
      user: null,
      template: null,
    });
    setEvaluationForm({
      maddeler: [],
      genelNot: '',
      kaliteSkoru: 0,
      puanlayanId: '',
      puanlamaTarihi: new Date(),
    });
  }, []);

  const handleScoreSubmit = useCallback(async () => {
    try {
      await hrAPI.createScore(scoreForm);
      showSnackbar('Puanlama başarıyla kaydedildi', 'success');
      closeScoreDialog();
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      showSnackbar('Puanlama kaydedilirken hata oluştu', 'error');
    }
  }, [scoreForm, showSnackbar, onDataChange, closeScoreDialog]);

  const handleEvaluationSubmit = useCallback(async () => {
    try {
      const evaluationData = {
        kullaniciId: evaluationDialog.user._id,
        templateId: evaluationDialog.template._id,
        ...evaluationForm,
      };

      await hrAPI.saveEvaluation(evaluationData);
      showSnackbar('Değerlendirme başarıyla kaydedildi', 'success');
      closeEvaluationDialog();
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      showSnackbar('Değerlendirme kaydedilirken hata oluştu', 'error');
    }
  }, [
    evaluationDialog,
    evaluationForm,
    showSnackbar,
    onDataChange,
    closeEvaluationDialog,
  ]);

  const updateEvaluationMadde = useCallback((maddeIndex, field, value) => {
    setEvaluationForm(prev => {
      const newMaddeler = [...prev.maddeler];
      newMaddeler[maddeIndex] = {
        ...newMaddeler[maddeIndex],
        [field]: value,
      };

      // Otomatik kalite skoru hesaplama
      const totalPuan = newMaddeler.reduce(
        (sum, madde) => sum + (madde.puan || 0),
        0,
      );
      const maxPuan = newMaddeler.length * 100; // Her madde max 100 puan
      const kaliteSkoru =
        maxPuan > 0 ? Math.round((totalPuan / maxPuan) * 100) : 0;

      return {
        ...prev,
        maddeler: newMaddeler,
        kaliteSkoru,
      };
    });
  }, []);

  const addEvaluationPhoto = useCallback((maddeIndex, photoBase64) => {
    setEvaluationForm(prev => {
      const newMaddeler = [...prev.maddeler];
      newMaddeler[maddeIndex] = {
        ...newMaddeler[maddeIndex],
        fotograflar: [
          ...(newMaddeler[maddeIndex].fotograflar || []),
          photoBase64,
        ],
      };

      return {
        ...prev,
        maddeler: newMaddeler,
      };
    });
  }, []);

  const removeEvaluationPhoto = useCallback((maddeIndex, photoIndex) => {
    setEvaluationForm(prev => {
      const newMaddeler = [...prev.maddeler];
      const newFotograflar = [...(newMaddeler[maddeIndex].fotograflar || [])];
      newFotograflar.splice(photoIndex, 1);

      newMaddeler[maddeIndex] = {
        ...newMaddeler[maddeIndex],
        fotograflar: newFotograflar,
      };

      return {
        ...prev,
        maddeler: newMaddeler,
      };
    });
  }, []);

  const loadUserScores = useCallback(
    async (userId, year, month) => {
      try {
        const response = await hrAPI.getUserScores(userId, year, month);
        setSelectedUserScores(response.data);
      } catch (error) {
        console.error('Kullanıcı puanları yüklenirken hata:', error);
        showSnackbar('Kullanıcı puanları yüklenirken hata oluştu', 'error');
      }
    },
    [showSnackbar],
  );

  const loadEvaluatedUsers = useCallback(async (year, month) => {
    try {
      const response = await hrAPI.getEvaluatedUsers(year, month);
      setEvaluatedUsers(response.data);
    } catch (error) {
      console.error('Puanlanan kullanıcılar yüklenirken hata:', error);
    }
  }, []);

  return {
    // Score Dialog
    scoreDialog,
    scoreForm,
    setScoreForm,
    openScoreDialog,
    closeScoreDialog,
    handleScoreSubmit,

    // Evaluation Dialog
    evaluationDialog,
    evaluationForm,
    setEvaluationForm,
    openEvaluationDialog,
    closeEvaluationDialog,
    handleEvaluationSubmit,
    updateEvaluationMadde,
    addEvaluationPhoto,
    removeEvaluationPhoto,

    // User Scores
    selectedUserScores,
    setSelectedUserScores,
    loadUserScores,

    // Evaluated Users
    evaluatedUsers,
    setEvaluatedUsers,
    loadEvaluatedUsers,
  };
};
