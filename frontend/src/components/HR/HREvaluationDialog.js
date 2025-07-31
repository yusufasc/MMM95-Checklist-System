import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  IconButton,
  Slider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { hrAPI } from '../../services/api';

const HREvaluationDialog = ({ open, onClose, template, onSuccess }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [evaluationData, setEvaluationData] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug log
  console.log('🎯 HREvaluationDialog props:', { open, template: template?.ad });

  const loadUsers = useCallback(async () => {
    try {
      // Şablon ID'si ile kullanıcıları filtrele
      const params = template?._id ? { sablonId: template._id } : {};
      console.log('🔍 HREvaluationDialog - Loading users with params:', params);

      const response = await hrAPI.getUsers(params);
      console.log(
        '👥 HREvaluationDialog - Loaded users:',
        response.data.length,
        'users',
      );
      console.log(
        '📋 HREvaluationDialog - Users:',
        response.data.map(
          u => `${u.ad} ${u.soyad} (${u.roller?.map(r => r.ad).join(', ')})`,
        ),
      );

      setUsers(response.data);
    } catch (error) {
      console.error('❌ HREvaluationDialog - Error loading users:', error);
      setError('Kullanıcılar yüklenirken hata oluştu');
    }
  }, [template]);

  const initializeEvaluationData = useCallback(() => {
    if (template?.maddeler) {
      const initialData = {};
      template.maddeler.forEach((madde, index) => {
        initialData[index] = {
          puan: madde.maksimumPuan || 5,
          aciklama: '',
        };
      });
      setEvaluationData(initialData);
    }
  }, [template]);

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
      initializeEvaluationData();
    }
  }, [open, template, initializeEvaluationData, loadUsers]);

  const handleScoreChange = (index, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        puan: value,
      },
    }));
  };

  const handleNoteChange = (index, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        aciklama: value,
      },
    }));
  };

  const calculateTotalScore = () => {
    return Object.values(evaluationData).reduce(
      (total, item) => total + (item.puan || 0),
      0,
    );
  };

  const calculateMaxScore = () => {
    return (
      template?.maddeler?.reduce(
        (total, madde) => total + (madde.maksimumPuan || 5),
        0,
      ) || 0
    );
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Lütfen değerlendirilecek kullanıcıyı seçin');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const evaluationPayload = {
        templateId: template._id,
        userId: selectedUser,
        maddeler: template.maddeler.map((madde, index) => ({
          maddeId: madde._id,
          baslik: madde.baslik,
          puan: evaluationData[index]?.puan || 0,
          maksimumPuan: madde.maksimumPuan || 5,
          aciklama: evaluationData[index]?.aciklama || '',
        })),
        toplamPuan: calculateTotalScore(),
        maksimumPuan: calculateMaxScore(),
        notlar: notes,
        degerlendirmeTarihi: new Date(),
      };

      await hrAPI.createEvaluation(evaluationPayload);
      onSuccess('Değerlendirme başarıyla kaydedildi');
      handleClose();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Değerlendirme kaydedilirken hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser('');
    setEvaluationData({});
    setNotes('');
    setError('');
    onClose();
  };

  if (!template) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          <Box
            component='span'
            sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}
          >
            İK Değerlendirme: {template.ad}
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* User Selection */}
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography
              variant='h6'
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PersonIcon color='primary' />
              Değerlendirilecek Kullanıcı
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Kullanıcı Seçin</InputLabel>
              <Select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                label='Kullanıcı Seçin'
              >
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.ad} {user.soyad} ({user.kullaniciAdi})
                    {user.roller?.map(rol => (
                      <Chip
                        key={rol._id}
                        label={rol.ad}
                        size='small'
                        sx={{ ml: 1 }}
                      />
                    ))}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Evaluation Items */}
        <Typography variant='h6' sx={{ mb: 2 }}>
          Değerlendirme Maddeleri
        </Typography>

        {template.maddeler?.map((madde, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Typography
                variant='subtitle1'
                sx={{ fontWeight: 'bold', mb: 2 }}
              >
                {index + 1}. {madde.baslik}
              </Typography>

              {madde.aciklama && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  {madde.aciklama}
                </Typography>
              )}

              <Grid container spacing={2} alignItems='center'>
                <Grid item xs={12} sm={6}>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    Puan: {evaluationData[index]?.puan || 0} /{' '}
                    {madde.maksimumPuan || 5}
                  </Typography>
                  <Slider
                    value={evaluationData[index]?.puan || 0}
                    onChange={(_, value) => handleScoreChange(index, value)}
                    min={0}
                    max={madde.maksimumPuan || 5}
                    step={1}
                    marks
                    valueLabelDisplay='auto'
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Açıklama'
                    multiline
                    rows={2}
                    value={evaluationData[index]?.aciklama || ''}
                    onChange={e => handleNoteChange(index, e.target.value)}
                    placeholder='Bu madde için açıklama...'
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Summary */}
        <Card sx={{ bgcolor: 'primary.50', mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Değerlendirme Özeti
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant='body1'>
                  <strong>Toplam Puan:</strong> {calculateTotalScore()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body1'>
                  <strong>Maksimum Puan:</strong> {calculateMaxScore()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body1'>
                  <strong>Başarı Oranı:</strong> %
                  {calculateMaxScore() > 0
                    ? Math.round(
                        (calculateTotalScore() / calculateMaxScore()) * 100,
                      )
                    : 0}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* General Notes */}
        <TextField
          fullWidth
          label='Genel Notlar'
          multiline
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder='Değerlendirme hakkında genel notlarınız...'
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          startIcon={<SaveIcon />}
          disabled={loading || !selectedUser}
          sx={{
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          }}
        >
          {loading ? 'Kaydediliyor...' : 'Değerlendirmeyi Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HREvaluationDialog;
