import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI } from '../services/api';

const MachineSelectionTest = () => {
  const { selectedMachines, accessibleMachines, loadMachineData, updateSelectedMachines } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [error, setError] = useState('');

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message: `[${timestamp}] ${message}`, type }]);
  };

  const testMachineSelection = async () => {
    setLoading(true);
    setError('');
    setTestResults([]);

    try {
      addTestResult('🔄 Makina seçimi testi başlatılıyor...', 'info');

      // 1. Mevcut durumu kontrol et
      addTestResult(`📋 Mevcut seçili makina sayısı: ${selectedMachines.length}`, 'info');
      addTestResult(`📦 Erişilebilir makina sayısı: ${accessibleMachines.length}`, 'info');

      // 2. Makina verilerini yeniden yükle
      addTestResult('🔄 Makina verileri yeniden yükleniyor...', 'info');
      await loadMachineData();

      // 3. API'den seçili makinaları kontrol et
      addTestResult('📡 API den seçili makinalar kontrol ediliyor...', 'info');
      const selectedResponse = await tasksAPI.getMySelectedMachines();
      addTestResult(
        `✅ API den gelen seçili makina sayısı: ${selectedResponse.data?.length || 0}`,
        'success',
      );

      if (selectedResponse.data && selectedResponse.data.length > 0) {
        selectedResponse.data.forEach((machine, index) => {
          addTestResult(
            `  ${index + 1}. ${machine.kod || machine.makinaNo} - ${machine.ad}`,
            'info',
          );
        });
      }

      // 4. Erişilebilir makinaları kontrol et
      addTestResult('📦 Erişilebilir makinalar kontrol ediliyor...', 'info');
      const accessibleResponse = await tasksAPI.getInventoryMachines();
      addTestResult(
        `✅ API den gelen erişilebilir makina sayısı: ${accessibleResponse.data?.length || 0}`,
        'success',
      );

      // 5. Test makina seçimi yap (ilk 2 makina)
      if (accessibleResponse.data && accessibleResponse.data.length >= 2) {
        addTestResult('🔧 Test makina seçimi yapılıyor...', 'info');
        const testMachines = accessibleResponse.data.slice(0, 2);

        const updateResult = await updateSelectedMachines(testMachines);
        if (updateResult.success) {
          addTestResult(
            `✅ Test makina seçimi başarılı: ${testMachines.length} makina seçildi`,
            'success',
          );
          testMachines.forEach((machine, index) => {
            addTestResult(
              `  ${index + 1}. ${machine.kod || machine.makinaNo} - ${machine.ad}`,
              'info',
            );
          });
        } else {
          addTestResult(`❌ Test makina seçimi başarısız: ${updateResult.error}`, 'error');
        }
      }

      addTestResult('🎉 Makina seçimi testi tamamlandı!', 'success');
    } catch (error) {
      addTestResult(`❌ Test hatası: ${error.message}`, 'error');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setError('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Makina Seçimi Test Sayfası
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bu sayfa makina seçimi sisteminin çalışıp çalışmadığını test eder.
      </Typography>

      {/* Mevcut Durum */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Mevcut Durum
          </Typography>
          <Typography variant="body2">
            Seçili Makinalar: <strong>{selectedMachines.length}</strong>
          </Typography>
          <Typography variant="body2">
            Erişilebilir Makinalar: <strong>{accessibleMachines.length}</strong>
          </Typography>

          {selectedMachines.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Seçili Makinalar:
              </Typography>
              <List dense>
                {selectedMachines.map(machine => (
                  <ListItem key={machine._id} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${machine.kod || machine.makinaNo} - ${machine.ad}`}
                      secondary={`ID: ${machine._id}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Test Butonları */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={testMachineSelection}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Test Çalışıyor...' : 'Makina Seçimi Testini Başlat'}
        </Button>

        <Button variant="outlined" onClick={clearResults} disabled={loading}>
          Sonuçları Temizle
        </Button>

        <Button variant="outlined" onClick={loadMachineData} disabled={loading}>
          Makina Verilerini Yenile
        </Button>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Test Sonuçları */}
      {testResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Test Sonuçları
            </Typography>
            <List>
              {testResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={result.message}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                          color:
                            result.type === 'error'
                              ? 'error.main'
                              : result.type === 'success'
                                ? 'success.main'
                                : 'text.primary',
                        },
                      }}
                    />
                  </ListItem>
                  {index < testResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MachineSelectionTest;
