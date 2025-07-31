import api from './api';

const kalipDegisimEvaluationAPI = {
  // Değerlendirme şablonlarını getir
  getEvaluationTemplates: () => {
    return api.get('/kalip-degisim-evaluation/evaluation-templates');
  },

  // WorkTask değerlendirme durumunu kontrol et
  getWorkTaskStatus: workTaskId => {
    return api.get(`/kalip-degisim-evaluation/worktask-status/${workTaskId}`);
  },

  // Yeni değerlendirme yap
  createEvaluation: data => {
    return api.post('/kalip-degisim-evaluation/evaluate', data);
  },

  // Kullanıcının yaptığı değerlendirmeler
  getMyEvaluations: (params = {}) => {
    return api.get('/kalip-degisim-evaluation/my-evaluations', { params });
  },
};

export default kalipDegisimEvaluationAPI;
