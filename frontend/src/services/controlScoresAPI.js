import api from './api';

const controlScoresAPI = {
  // Kontrol puanı oluştur
  createControlScore: async data => {
    const response = await api.post('/control-scores/create', data);
    return response.data;
  },

  // Kullanıcının kontrol puanları listesi
  getMyScores: async (params = {}) => {
    const response = await api.get('/control-scores/my-scores', { params });
    return response.data;
  },

  // Kontrol puanları özeti
  getSummary: async (params = {}) => {
    const response = await api.get('/control-scores/summary', { params });
    return response.data;
  },
};

export default controlScoresAPI;
