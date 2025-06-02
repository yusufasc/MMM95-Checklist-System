# MMM Checklist Sistemi - Frontend

Bu proje **MMM Checklist Sistemi**'nin React tabanlı frontend uygulamasıdır. Fabrika çalışanları için performans yönetimi ve görev takip sistemi sağlar.

## 🎯 Proje Özellikleri

### ✅ Temel Özellikler
- **Rol Tabanlı Dashboard'lar**: Admin, Ortacı, Usta, Paketlemeci için özel arayüzler
- **Görev Yönetimi**: Checklist'ler, WorkTask'lar ve kontrol bekleyenler
- **Performans Takibi**: Real-time performans skorları ve sıralama
- **Envanter Yönetimi**: Kapsamlı envanter sistemi ve Excel entegrasyonu
- **Makina Seçimi**: Gelişmiş makina seçim sistemi
- **Fotoğraf Yükleme**: Base64 formatında güvenli fotoğraf sistemi

### 🎨 Modern UI/UX
- **Material-UI v5**: Modern ve responsive tasarım
- **Card-based Layout**: Temiz ve organize görünüm
- **Mobile-First Design**: Touch-friendly arayüz
- **Dark/Light Theme**: Kullanıcı tercihi destekli
- **Gradient Backgrounds**: Rol bazlı renk temaları
- **Smooth Animations**: Fade, Zoom, Slide efektleri

### 🔐 Güvenlik ve Yetkilendirme
- **JWT Authentication**: Güvenli giriş sistemi
- **Modül Bazlı Yetkilendirme**: Granular erişim kontrolü
- **Protected Routes**: Sayfa seviyesinde koruma
- **Input Validation**: Comprehensive form validation
- **XSS Protection**: Güvenli veri işleme

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+ 
- npm 8+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Kurulum Adımları

```bash
# Repository'yi klonlayın
git clone <repository-url>
cd MMM/frontend

# Bağımlılıkları yükleyin
npm install

# Development server'ı başlatın
npm start

# Production build alın
npm run build
```

### Environment Variables
`.env` dosyası oluşturun:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

## 📁 Proje Yapısı

```
frontend/src/
├── components/          # Yeniden kullanılabilir componentler
│   ├── Layout.js       # Ana layout component
│   ├── ProtectedRoute.js # Route koruma
│   ├── MachineSelector.js # Makina seçim dialog'u
│   └── ImageUpload.js  # Fotoğraf yükleme component
├── contexts/           # React Context'ler
│   └── AuthContext.js  # Authentication ve yetkilendirme
├── pages/              # Sayfa componentleri
│   ├── Dashboard.js    # Ana dashboard
│   ├── Users.js        # Kullanıcı yönetimi
│   ├── Tasks.js        # Görev listesi
│   ├── WorkTasks.js    # İş görevleri
│   ├── Performance.js  # Performans sayfası
│   ├── Inventory.js    # Envanter yönetimi
│   └── ...
├── services/           # API servisleri
│   └── api.js          # Tüm API çağrıları
├── utils/              # Yardımcı fonksiyonlar
│   ├── constants.js    # Sabitler
│   └── helpers.js      # Yardımcı fonksiyonlar
└── App.js              # Ana uygulama component
```

## 🛠️ Available Scripts

### Development
```bash
# Development server başlat
npm start

# ESLint kontrolü
npm run lint

# ESLint otomatik düzeltme
npm run lint:fix

# Test'leri çalıştır
npm test
```

### Production
```bash
# Production build (ESLint ile)
npm run build

# Production build (ESLint bypass)
npm run build:no-lint

# Build'i serve et
npm run serve
```

### Analysis
```bash
# Bundle analizi
npm run analyze

# Bundle size kontrolü
npm run bundle-size

# Performance testi
npm run test:performance
```

## 🎨 UI Component'leri

### Dashboard Component'leri
```javascript
// Rol bazlı dashboard'lar
const AdminDashboard = () => {
  // Admin özel widget'ları
  // Sistem yönetimi araçları
  // Analytics ve raporlar
};

const OrtaciDashboard = () => {
  // Pink-red gradient tema
  // Görev yönetimi widget'ları
  // Performance tracking
};
```

### Form Component'leri
```javascript
// Modern form tasarımı
const ModernForm = () => (
  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
    <CardContent>
      <TextField
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
        // Touch-friendly design
      />
    </CardContent>
  </Card>
);
```

### Dialog Component'leri
```javascript
// Gelişmiş silme dialog'u
const DeleteDialog = ({ open, item, onConfirm, onCancel, error }) => (
  <Dialog open={open} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <DeleteIcon />
        <Typography variant="h6">Silme Onayı</Typography>
      </Box>
    </DialogTitle>
    {/* Modern dialog content */}
  </Dialog>
);
```

## 📱 Responsive Design

### Breakpoint'ler
```javascript
const theme = {
  breakpoints: {
    xs: 0,      // Mobile
    sm: 600,    // Tablet
    md: 900,    // Desktop
    lg: 1200,   // Large Desktop
    xl: 1536,   // Extra Large
  }
};
```

### Mobile-First Approach
```javascript
const useStyles = {
  container: {
    padding: { xs: 1, sm: 2, md: 3 },
    margin: { xs: 0.5, sm: 1, md: 2 }
  },
  button: {
    minHeight: 44, // Touch-friendly
    fontSize: { xs: '0.875rem', sm: '1rem' }
  }
};
```

## 🔧 API Entegrasyonu

### API Service Yapısı
```javascript
// services/api.js
const api = {
  // Authentication
  auth: {
    login: (credentials) => post('/auth/login', credentials),
    logout: () => post('/auth/logout'),
    checkToken: () => get('/auth/check'),
  },
  
  // Users
  users: {
    getAll: () => get('/users'),
    create: (userData) => post('/users', userData),
    update: (id, userData) => put(`/users/${id}`, userData),
    delete: (id) => del(`/users/${id}`),
  },
  
  // Tasks
  tasks: {
    getMyTasks: () => get('/tasks/my'),
    complete: (id, data) => post(`/tasks/${id}/complete`, data),
    getControlPending: () => get('/tasks/control-pending'),
  },
  
  // Inventory (Yeni)
  inventory: {
    getCategories: () => get('/inventory/categories'),
    getItems: (categoryId) => get(`/inventory/items/${categoryId}`),
    importExcel: (categoryId, file) => postFile(`/inventory/import/${categoryId}`, file),
    getKalipsForTasks: () => get('/inventory/kalips-for-tasks'),
  }
};
```

### Error Handling
```javascript
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Token expired, redirect to login
    logout();
  } else if (error.response?.status === 403) {
    // Permission denied
    showError('Bu işlem için yetkiniz bulunmamaktadır');
  } else {
    // Generic error
    showError('Bir hata oluştu. Lütfen tekrar deneyin.');
  }
};
```

## 🎯 Performance Optimizasyonu

### React Optimizasyonları
```javascript
// useCallback kullanımı
const handleSubmit = useCallback(async (data) => {
  try {
    setLoading(true);
    await api.users.create(data);
    showSuccess('Kullanıcı başarıyla eklendi');
    loadData();
  } catch (error) {
    handleApiError(error);
  } finally {
    setLoading(false);
  }
}, [loadData]);

// useMemo kullanımı
const filteredData = useMemo(() => {
  return data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [data, searchTerm]);
```

### Bundle Optimization
```javascript
// Lazy loading
const LazyInventory = React.lazy(() => import('./pages/Inventory'));
const LazyPerformance = React.lazy(() => import('./pages/Performance'));

// Code splitting
const App = () => (
  <Suspense fallback={<CircularProgress />}>
    <Routes>
      <Route path="/inventory" element={<LazyInventory />} />
      <Route path="/performance" element={<LazyPerformance />} />
    </Routes>
  </Suspense>
);
```

## 🧪 Testing

### Unit Tests
```bash
# Test'leri çalıştır
npm test

# Coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch
```

### Component Testing
```javascript
// Component test örneği
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';

test('dashboard renders correctly for admin user', () => {
  render(
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
  
  expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
});
```

## 🔒 Güvenlik Best Practices

### Input Sanitization
```javascript
import DOMPurify from 'dompurify';

const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input);
};
```

### File Upload Security
```javascript
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Geçersiz dosya tipi');
  }
  
  if (file.size > maxSize) {
    throw new Error('Dosya boyutu çok büyük');
  }
  
  return true;
};
```

## 📊 Build Analizi

### Bundle Size
- **Main Bundle**: ~360KB (gzipped)
- **Vendor Bundle**: ~120KB (gzipped)
- **CSS**: ~263B (gzipped)
- **Total**: ~480KB (gzipped)

### Performance Metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3.0s
- **Cumulative Layout Shift**: <0.1

## 🚀 Deployment

### Production Build
```bash
# Production build oluştur
npm run build

# Build'i test et
npm run serve

# Build analizi
npm run analyze
```

### Environment Configuration
```javascript
// Production environment
const config = {
  API_URL: process.env.REACT_APP_API_URL,
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
  VERSION: process.env.REACT_APP_VERSION,
};
```

## 📝 Changelog

### v1.0.0 (02.06.2025)
- ✅ Performance.js optimizasyonu tamamlandı
- ✅ Sidebar menü temizliği (numara badge'leri kaldırıldı)
- ✅ Gelişmiş silme sistemi eklendi
- ✅ Ortacı makina seçimi sorunu çözüldü
- ✅ ESLint compliance sağlandı
- ✅ Modern UI/UX iyileştirmeleri
- ✅ Dashboard widget API parse optimizasyonu

### v0.9.0
- ✅ Envanter yönetimi sistemi eklendi
- ✅ Excel import/export functionality
- ✅ Kalıp seçimi sistemi
- ✅ Fotoğraf yükleme sistemi

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Support

Herhangi bir sorun veya öneriniz için:
- Issue açın: [GitHub Issues](link)
- Email: support@mmm-checklist.com
- Dokümantasyon: [Wiki](link)

---

**Son Güncelleme**: 02.06.2025  
**Version**: 1.0.0  
**Build Status**: ✅ Production Ready
