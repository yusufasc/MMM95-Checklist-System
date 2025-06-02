import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    kullaniciAdi: '',
    sifre: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login hatası:', error);
      }
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <Typography component="h1" variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
              Serinova 360
            </Typography>
            <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
              Giriş Yap
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="kullaniciAdi"
              label="Kullanıcı Adı"
              name="kullaniciAdi"
              autoComplete="username"
              autoFocus
              value={formData.kullaniciAdi}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="sifre"
              label="Şifre"
              type="password"
              id="sifre"
              autoComplete="current-password"
              value={formData.sifre}
              onChange={handleChange}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Giriş Yap'}
            </Button>

            {/* Test Kullanıcıları Bilgisi */}
            <Box sx={{ mt: 2, width: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>
                Test Kullanıcıları:
              </Typography>
              <Typography variant="caption" display="block">
                Admin: admin / 123456
              </Typography>
              <Typography variant="caption" display="block">
                Ali Veli: ali.veli / 123456
              </Typography>
              <Typography variant="caption" display="block">
                Ayşe Yılmaz: ayse.yilmaz / 123456
              </Typography>
              <Typography variant="caption" display="block">
                Mehmet Kaya: mehmet.kaya / 123456
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
