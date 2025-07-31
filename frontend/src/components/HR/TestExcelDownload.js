import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { hrAPI } from '../../services/api';

const TestExcelDownload = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleTestDownload = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('Excel dosyası indiriliyor...');

      console.log('📥 Excel download test başlatılıyor...');
      console.log('🔍 API Request Details:', {
        url: '/api/hr/excel/download',
        method: 'GET',
        token: localStorage.getItem('token') ? 'Mevcut' : 'YOK',
        timestamp: new Date().toISOString(),
      });

      const result = await hrAPI.downloadExcel();

      console.log('✅ Excel download başarılı:', {
        fileSize: result.data.size || 'Unknown',
        contentType: result.headers['content-type'],
        status: result.status,
        statusText: result.statusText,
      });

      // Blob oluştur ve indir
      const blob = new Blob([result.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test_personel_excel_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(
        `✅ Excel dosyası başarıyla indirildi! (${Math.round(blob.size / 1024)} KB)`,
      );
    } catch (error) {
      console.error('❌ Excel download error:', error);
      console.error('🔍 Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });

      let errorMessage = 'Excel indirme sırasında hata oluştu';

      if (error.response?.status === 404) {
        errorMessage =
          'Excel endpoint bulunamadı (404). Backend route kontrol edilmeli.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Excel indirme yetkiniz yok (403).';
      } else if (error.response?.status === 401) {
        errorMessage =
          'Oturum süreniz dolmuş (401). Lütfen yeniden giriş yapın.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(`Excel indirilemedi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 600 }}>
      <Typography variant='h5' gutterBottom>
        <span role='img' aria-label='grafik tablosu'>
          📊
        </span>{' '}
        Excel Download Test
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Bu test aracı HR modülünün Excel download fonksiyonunu kontrol eder.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Test Button */}
        <Button
          variant='contained'
          onClick={handleTestDownload}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Download />}
          sx={{
            backgroundColor: '#2E7D32',
            '&:hover': { backgroundColor: '#1B5E20' },
          }}
        >
          {loading ? 'Excel İndiriliyor...' : 'Excel Dosyasını İndir'}
        </Button>

        {/* Test Details */}
        <Box
          sx={{
            backgroundColor: '#F5F5F5',
            p: 2,
            borderRadius: 1,
            fontSize: '0.875rem',
          }}
        >
          <Typography variant='subtitle2' gutterBottom>
            <span role='img' aria-label='pano'>
              📋
            </span>{' '}
            Yeni Basit Format - 4 Kolon:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip label='👤 Kullanıcı Adı (doldurulmuş)' size='small' />
            <Chip label='📅 Tarih (Ay/Yıl) - girilecek' size='small' />
            <Chip label='⏰ Devamsızlık Saat - girilecek' size='small' />
            <Chip label='💼 Fazla Mesai Saat - girilecek' size='small' />
          </Box>
        </Box>

        {/* Messages */}
        {message && (
          <Alert severity='success' onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity='error' onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Instructions */}
        <Box
          sx={{
            backgroundColor: '#E3F2FD',
            p: 2,
            borderRadius: 1,
            border: '1px solid #2196F3',
          }}
        >
          <Typography variant='subtitle2' color='primary' gutterBottom>
            <span role='img' aria-label='kitap'>
              📖
            </span>{' '}
            Kullanım Rehberi:
          </Typography>
          <Typography variant='body2' component='div'>
            1. <strong>"Excel Dosyasını İndir"</strong> butonuna tıklayın
            <br />
            2. İndirilen Excel dosyasını açın
            <br />
            3. <strong>Gri alan:</strong> Kullanıcı adları (değiştirmeyin)
            <br />
            4. <strong>Tarih:</strong> "01/2025" veya "Ocak 2025" formatında
            girin
            <br />
            5. <strong>Devamsızlık & Fazla Mesai:</strong> Aylık toplam saatleri
            girin
            <br />
            6. Dosyayı kaydedin ve HR modülünden yükleyin
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default TestExcelDownload;
