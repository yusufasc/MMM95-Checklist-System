import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Container,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(_error) {
    // Error durumunu güncelleyen state
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Error logging
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Memory usage kontrolü
    if (performance.memory) {
      const memory = performance.memory;
      console.error('💾 Memory at error time:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }

    // Development mode'da detaylı log
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.error('🔍 Component Stack:', errorInfo.componentStack);
      console.error('🔍 Error Stack:', error.stack);
    }
  }

  handleRetry() {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment =
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development';

      return (
        <Container maxWidth='md'>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
              py: 4,
            }}
          >
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                maxWidth: 600,
                width: '100%',
                border: '2px solid',
                borderColor: 'error.main',
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />

              <Typography
                variant='h4'
                gutterBottom
                color='error.main'
                fontWeight='bold'
              >
                Oops! Bir şeyler ters gitti
              </Typography>

              <Typography
                variant='body1'
                sx={{ mb: 3, color: 'text.secondary' }}
              >
                Sayfa çalışırken beklenmeyen bir hata oluştu. Bu genellikle
                geçici bir sorundur.
              </Typography>

              <Alert severity='warning' sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant='body2'>
                  <strong>Yaygın çözümler:</strong>
                  <br />• Sayfayı yenileyin (F5)
                  <br />• Tarayıcı önbelleğini temizleyin
                  <br />• Farklı bir tarayıcı deneyin
                  <br />• İnternet bağlantınızı kontrol edin
                </Typography>
              </Alert>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant='contained'
                  onClick={this.handleRetry}
                  startIcon={<RefreshIcon />}
                  size='large'
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2, #0288D1)',
                    },
                  }}
                >
                  Tekrar Dene
                </Button>

                <Button
                  variant='outlined'
                  onClick={this.handleReload}
                  size='large'
                  color='primary'
                >
                  Sayfayı Yenile
                </Button>
              </Box>

              {this.state.retryCount > 2 && (
                <Alert severity='error' sx={{ mt: 3 }}>
                  <Typography variant='body2'>
                    Tekrar tekrar hata alıyorsanız, lütfen sistem yöneticisi ile
                    iletişime geçin.
                  </Typography>
                </Alert>
              )}

              {/* Development mode detayları */}
              {isDevelopment && this.state.error && (
                <Paper
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant='h6' gutterBottom color='error'>
                    <span role='img' aria-label='bug'>
                      🐛
                    </span>{' '}
                    Developer Info:
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{ fontFamily: 'monospace', mb: 1 }}
                  >
                    <strong>Error:</strong> {this.state.error.message}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                  >
                    <strong>Stack:</strong>
                    <br />
                    {this.state.error.stack}
                  </Typography>
                </Paper>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
