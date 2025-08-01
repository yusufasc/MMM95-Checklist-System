# 🏗️ MMM95 Sistem Mimarisi - Yeni Modül Planlama Rehberi

## 🎯 **SİSTEM GENEL BAKIŞ**

### **Teknoloji Stack**
- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Frontend**: React 18 + Material-UI v5 + React Router v6
- **Authentication**: JWT + bcrypt + role-based permissions  
- **File Processing**: multer + ExcelJS (Excel import/export)
- **Performance**: <600KB bundle, <200ms API response

### **Proje Yapısı**
```
MMM95/
├── backend/           # Node.js Express API
├── frontend/          # React SPA
├── .cursor/rules/     # 14 modüler code quality rules
└── monitoring/        # Sistem monitoring
```

---

## 🗄️ **VERİTABANI YAPISI (25 Model)**

### **Core Models**
- **User.js** - Kullanıcılar (57 lines)
- **Role.js** - Roller ve yetkiler (74 lines)  
- **Department.js** - Departmanlar (42 lines)
- **Module.js** - Sistem modülleri (36 lines)

### **İş Süreçleri Models**
- **Task.js** - Görevler (165 lines)
- **WorkTask.js** - İş görevleri (144 lines)
- **Assignment.js** - Atamalar (105 lines)
- **ChecklistTemplate.js** - Checklist şablonları (135 lines)

### **Envanter & Ekipman Models**
- **InventoryItem.js** - Envanter öğeleri (278 lines)
- **InventoryCategory.js** - Envanter kategorileri (52 lines) 
- **InventoryFieldTemplate.js** - Dinamik alanlar (97 lines)
- **Machine.js** - Makinalar (52 lines)
- **Equipment.js** - Ekipmanlar (62 lines)
- **EquipmentRequest.js** - Ekipman talepleri (127 lines)

### **Değerlendirme & Kalite Models**
- **BonusEvaluation.js** - Performans değerlendirme (145 lines)
- **QualityControlEvaluation.js** - Kalite kontrol (132 lines)
- **KalipDegisimEvaluation.js** - Kalıp değişim (115 lines)
- **HRScore.js** - İK skorları (192 lines)
- **ControlScore.js** - Kontrol skorları (96 lines)

### **Diğer Models**
- **BonusEvaluationTemplate.js** - Bonus değerlendirme şablonları (114 lines)
- **QualityControlTemplate.js** - Kalite kontrol şablonları (118 lines)
- **HRTemplate.js** - İK şablonları (80 lines)
- **HRSettings.js** - İK ayarları (126 lines)
- **UserShiftMachine.js** - Kullanıcı vardiya makina (119 lines)
- **Notification.js** - Bildirimler (24 lines)

---

## 🔐 **YETKİ SİSTEMİ YAPISI**

### **Role Schema Pattern**
```javascript
{
  ad: String,
  moduller: [{ 
    modul: ObjectId,
    erisebilir: Boolean,
    duzenleyebilir: Boolean 
  }],
  checklistYetkileri: [{ 
    hedefRol: ObjectId,
    gorebilir: Boolean,
    puanlayabilir: Boolean,
    onaylayabilir: Boolean 
  }],
  modulePermissions: [{ 
    moduleName: String,
    gorebilir: Boolean,
    duzenleyebilir: Boolean 
  }]
}
```

### **Permission Middleware Kullanımı**
```javascript
// Backend route protection
router.get('/', 
  auth, 
  checkModulePermission('Yeni Modül', 'erisebilir'),
  async (req, res) => { ... }
);

// Frontend permission check  
hasModulePermission('Yeni Modül', 'duzenleyebilir')
```

### **Permission Types**
- **erisebilir** - Modülü görme yetkisi
- **duzenleyebilir** - Modülde değişiklik yapma yetkisi
- **gorebilir** - Checklist/evaluation görme yetkisi
- **puanlayabilir** - Puanlama yapma yetkisi
- **onaylayabilir** - Onaylama yetkisi

---

## 📋 **MEVCUT MODÜLLER (15 Aktif) ✅**

### **Temel Modüller**
1. **Dashboard** - Ana sayfa, genel bakış (`/`)
2. **Kullanıcı Yönetimi** - User CRUD operations (`/users`)
3. **Rol Yönetimi** - Permission management (`/roles`)
4. **Departman Yönetimi** - Department structure (`/departments`)

### **İş Süreçleri Modülleri**  
5. **Checklist Yönetimi** - Template ve görev yönetimi (`/checklists`)
6. **Görev Yönetimi** - Task assignment ve tracking (`/tasks`)
7. **Yaptım** - WorkTasks execution (`/worktasks`)
8. **Kontrol Bekleyenler** - Pending approvals (`/control-pending`)

### **Envanter & Kalite Modülleri**
9. **Envanter Yönetimi** - Inventory management + Excel I/O (`/inventory`)
10. **Kalite Kontrol** - Quality evaluations (`/quality-control`)
11. **Kalite Kontrol Yönetimi** - QC admin panel (`/quality-control-management`)

### **İK & Performans Modülleri**
12. **İnsan Kaynakları** - HR evaluations + scoring (`/hr`)
13. **İnsan Kaynakları Yönetimi** - HR admin functions (`/hr-management`)
14. **Performans** - Performance analytics (`/performance`)
15. **Kişisel Aktivite** - User activity tracking (`/my-activity`)

### **🎯 YENİ MODÜL ENTEGRASYON HAZIRLIĞI**
16. **Toplantı Yönetimi** - Meeting management & live collaboration (PLANLANIYOR)

---

## 🛠️ **API ENDPOINT PATTERNLERİ**

### **Standard CRUD Pattern**
```javascript
// Backend Routes Structure
router.get('/',           auth, checkModulePermission(...), getAll);
router.get('/:id',        auth, checkModulePermission(...), getById);  
router.post('/',          auth, checkModulePermission(...), create);
router.put('/:id',        auth, checkModulePermission(...), update);
router.delete('/:id',     auth, checkModulePermission(...), delete);

// Excel Operations
router.post('/excel-import', auth, upload.single('file'), importExcel);
router.get('/excel-export',  auth, exportExcel);
```

### **API Base URLs**
```javascript
const API_BASE_URL = 'http://localhost:3001';

// API Endpoints Structure
{
  auth: `${API_BASE_URL}/api/auth`,
  dashboard: `${API_BASE_URL}/api/dashboard`,
  users: `${API_BASE_URL}/api/users`,
  roles: `${API_BASE_URL}/api/roles`,
  departments: `${API_BASE_URL}/api/departments`,
  machines: `${API_BASE_URL}/api/machines`,
  checklists: `${API_BASE_URL}/api/checklists`,
  inventory: `${API_BASE_URL}/api/inventory`,
  tasks: `${API_BASE_URL}/api/tasks`,
  hr: `${API_BASE_URL}/api/hr`,
  quality: `${API_BASE_URL}/api/quality-control`
}
```

### **Frontend API Service Pattern**
```javascript
// services/api.js structure
export const newModuleAPI = {
  getAll: (params) => api.get('/api/new-module', { params }),
  getById: (id) => api.get(`/api/new-module/${id}`),
  create: (data) => api.post('/api/new-module', data),
  update: (id, data) => api.put(`/api/new-module/${id}`, data),
  delete: (id) => api.delete(`/api/new-module/${id}`)
};
```

---

## ⚛️ **FRONTEND COMPONENT YAPISI**

### **Component Hierarchy**
```
src/
├── components/
│   ├── NewModule/           # Modül-specific components
│   │   ├── NewModuleTable.js
│   │   ├── NewModuleDialog.js
│   │   ├── NewModuleFilters.js
│   │   └── NewModuleCard.js
│   ├── common/              # Reusable components
│   │   ├── DataTable.js
│   │   ├── FormDialog.js
│   │   ├── ConfirmDialog.js
│   │   └── LoadingSpinner.js
│   └── Layout/              # App layout
│       ├── Layout.js
│       ├── Sidebar.js
│       └── Header.js
├── pages/
│   └── NewModule.js         # Main page component
├── hooks/
│   ├── useNewModuleData.js  # Data management hook
│   ├── useNewModuleForm.js  # Form handling hook
│   └── useNewModuleDialog.js # Dialog state hook
├── contexts/
│   ├── AuthContext.js       # Authentication context
│   └── ThemeContext.js      # Theme management
├── services/
│   ├── api.js              # API service layer
│   └── apiConfig.js        # API configuration
└── utils/
    ├── constants.js        # Application constants
    ├── helpers.js          # Utility functions
    └── newModuleHelpers.js # Module-specific utilities
```

### **Material-UI Component Patterns**
- **DataGrid/Table** - Listeleme için (pagination, sorting, filtering)
- **Dialog/Modal** - Form operations (create, edit, delete confirmation)
- **Card/Paper** - Content containers  
- **Snackbar** - Success/error messages
- **Chip/Badge** - Status indicators
- **Autocomplete** - Dropdown selections
- **DatePicker** - Date inputs

### **Common Hooks Pattern**
```javascript
// useModuleData.js example
const useModuleData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({});

  const fetchData = useCallback(async () => {
    // Implementation
  }, [filters, pagination]);

  return { data, loading, error, fetchData, filters, setFilters };
};
```

---

## 📊 **EXCEL IMPORT/EXPORT SİSTEMİ**

### **Backend Excel Service**
```javascript
// services/excelService.js
class ExcelService {
  static async generateCategoryTemplate(category, templates) {
    // Template generation logic
  }
  
  static async readExcel(buffer, templates = []) {
    // Excel file reading logic
  }
  
  static async validateExcelData(data, category, fieldTemplates) {
    // Data validation logic
  }
  
  static async exportToExcel(data, columns) {
    // Excel export logic
  }
}
```

### **Frontend Upload Pattern**
```javascript
// File upload with validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Single file only
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});
```

### **Excel Upload Dialog Pattern**
```javascript
// components/ExcelUploadDialog.js
const ExcelUploadDialog = ({ open, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step process
  
  const handleUpload = async () => {
    // Upload implementation
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      {/* Upload UI */}
    </Dialog>
  );
};
```

---

## 🎨 **NAMING CONVENTIONS**

### **Database Field Naming (Turkish)**
```javascript
// Model field examples
{
  ad: String,                    // Name
  soyad: String,                 // Surname  
  kullaniciAdi: String,          // Username
  olusturmaTarihi: Date,         // Creation date
  guncellemeTarihi: Date,        // Update date
  durum: String,                 // Status
  kategoriId: ObjectId,          // Category ID
  dinamikAlanlar: Map            // Dynamic fields
}
```

### **File Naming Conventions**
- **Components**: PascalCase (`NewModuleDialog.js`)
- **Pages**: PascalCase (`NewModule.js`)
- **Hooks**: camelCase with `use` prefix (`useNewModuleData.js`)
- **Services**: camelCase (`newModuleService.js`)
- **API Routes**: kebab-case (`/new-module-management`)
- **Utils**: camelCase (`newModuleHelpers.js`)

### **Permission Naming**
- **Module Names**: Turkish (`"Yeni Modül Adı"`)
- **Permission Types**: `'erisebilir', 'duzenleyebilir', 'gorebilir', 'puanlayabilir', 'onaylayabilir'`
- **Route Protection**: `checkModulePermission(moduleName, permission)`

---

## 🔧 **DYNAMIC FIELDS SİSTEMİ**

### **InventoryFieldTemplate Pattern**
```javascript
// Dynamic field template structure
{
  kategoriId: ObjectId,         // Parent category
  ad: String,                   // Field name (primary)
  alanAdi: String,             // Alternative field name
  tip: String,                 // Field type (metin, sayi, tarih, boolean, liste)
  gerekli: Boolean,            // Required validation (primary)
  zorunlu: Boolean,            // Alternative required field
  varsayilanDeger: Mixed,      // Default value
  siraNo: Number,              // Display order
  secenekler: [String],        // Options for dropdown/radio
  aciklama: String,            // Field description
  aktif: Boolean               // Active status
}
```

### **Form Generation Pattern**
```javascript
// Auto-generate forms from templates
const generateFormFields = (templates) => {
  return templates.map(template => {
    const fieldName = template.ad || template.alanAdi;
    const isRequired = template.gerekli !== undefined ? template.gerekli : template.zorunlu;
    
    return {
      name: fieldName,
      type: template.tip,
      required: isRequired,
      defaultValue: template.varsayilanDeger,
      options: template.secenekler,
      order: template.siraNo
    };
  }).sort((a, b) => a.order - b.order);
};
```

### **Dynamic Field Types**
- **metin** - Text input
- **sayi** - Number input
- **tarih** - Date picker
- **boolean** - Checkbox/Switch
- **liste** - Select/Dropdown
- **cokluSecim** - Multi-select
- **dosya** - File upload

---

## 📈 **PERFORMANCE & QUALITY STANDARDS**

### **Bundle Optimization**
- **Current Size**: ~600KB (gzipped) - HEDEFİN ALTINDA ✅
- **En Büyük Chunk**: 314.35 KB (optimized)
- **Code Splitting**: React.lazy() active for route-based splitting
- **Caching**: 3-tier system (browser, service worker, API)
- **API Response**: <200ms target response time
- **Database**: Optimized queries with indexing

### **Code Quality Rules (14 Modules)**
- **ESLint**: 0 errors, 0 warnings ✅
- **Security**: OWASP compliant ✅  
- **Mobile**: Touch-friendly responsive design ✅
- **PWA Score**: 95+ Lighthouse score
- **Bundle Analysis**: webpack-bundle-analyzer integration

### **Enterprise Standards**
```javascript
// Quality enforcement in package.json scripts
{
  "quality:check": "npm run lint:check && npm run format:check",
  "quality:fix": "npm run lint:fix && npm run format:fix", 
  "health:check": "npm run quality:check && npm run test --passWithNoTests",
  "precommit": "npm run quality:fix"
}
```

---

## 🚀 **YENİ MODÜL EKLEMESİ CHECKLISTY**

### **1. Backend Setup**
```bash
# Required Files
✅ backend/models/NewModuleModel.js
✅ backend/routes/newModule.js 
✅ backend/services/newModuleService.js (optional)
✅ backend/middleware/newModuleAuth.js (if custom auth needed)

# Database Updates
✅ Add to backend/utils/seedData.js modules array
✅ Update Role permissions in seedData
✅ Add to MongoDB collections
```

### **2. Frontend Setup**
```bash
# Component Structure
✅ frontend/src/pages/NewModule.js
✅ frontend/src/components/NewModule/NewModuleTable.js
✅ frontend/src/components/NewModule/NewModuleDialog.js
✅ frontend/src/components/NewModule/NewModuleFilters.js
✅ frontend/src/hooks/useNewModuleData.js
✅ frontend/src/hooks/useNewModuleForm.js

# Service Layer
✅ Add newModuleAPI to services/api.js
✅ Add endpoints to config/apiConfig.js
```

### **3. Permission Integration**
```javascript
// Add to backend/utils/seedData.js modules array
{
  ad: 'Yeni Modül Adı',
  ikon: 'IconName',      // Material-UI icon name
  route: '/new-module',
  aktif: true
}

// Update Role definitions
// Add to Role.modulePermissions array
// Update checkModulePermission middleware usage
```

### **4. Navigation & Routes**
```javascript
// Add to frontend/src/components/Layout.js menu items
// Add to frontend/src/App.js routing
// Update ProtectedRoute permissions
// Add to constants.js MODULES object
```

### **5. API Documentation**
```javascript
// Add Swagger/OpenAPI documentation
// Update API endpoint documentation
// Add to API testing suite
```

---

## 💡 **DEVELOPMENT ÖNERİLERİ**

### **1. Convention Compliance**
- Mevcut Turkish naming conventions'ı takip et
- Material-UI theming system kullan
- Consistent error handling patterns uygula
- MongoDB indexing strategy optimization

### **2. Security Best Practices**
- Her endpoint için `auth` middleware ekle
- `checkModulePermission` her route'da implement et
- Input validation (backend + frontend)
- JWT token expiry management

### **3. Performance Optimization**
- API response caching implement et
- Database query optimization (populate, select)
- Frontend lazy loading (React.lazy, code splitting)
- Image optimization ve CDN usage

### **4. Excel Integration**
- ExcelService'i extend et yeni modül için
- Template generation automatic olsun
- Bulk operations için batch processing
- Error handling ve validation robust olsun

### **5. Mobile & PWA**
- Responsive design Material-UI breakpoints ile
- Touch-friendly interface (minimum 44px touch targets)
- Offline capability consider et
- Service worker integration

### **6. Testing Strategy**
```javascript
// Test file structure
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── utils/
└── setupTests.js
```

---

## 🔍 **DEBUGGING & TROUBLESHOOTING**

### **Common Patterns**
- Console.log strategically (production'da kaldır)
- Network tab analysis için API calls
- React DevTools component inspection
- MongoDB Compass query analysis

### **Error Handling Pattern**
```javascript
// Backend error handling
try {
  // Operation
} catch (error) {
  console.error('Module operation error:', error);
  res.status(500).json({ 
    message: 'Operation failed',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
}

// Frontend error handling
const [error, setError] = useState('');

try {
  // API call
} catch (error) {
  setError(error.response?.data?.message || 'İşlem sırasında hata oluştu');
}
```

---

## 📚 **DEPENDENCIES**

### **Backend Dependencies**
```json
{
  "express": "Express.js framework",
  "mongoose": "MongoDB object modeling",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT authentication", 
  "multer": "File upload handling",
  "exceljs": "Excel file processing",
  "cors": "Cross-origin requests",
  "dotenv": "Environment variables"
}
```

### **Frontend Dependencies**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0", 
  "react-router-dom": "^6.30.1",
  "@mui/material": "^5.15.20",
  "@mui/icons-material": "^5.15.20",
  "@mui/x-date-pickers": "^6.19.9",
  "axios": "^1.9.0",
  "date-fns": "^2.30.0",
  "framer-motion": "^12.16.0",
  "recharts": "^2.15.3"
}
```

---

## 🎯 **DEPLOYMENT CONSIDERATIONS**

### **Environment Configuration**
```bash
# Backend .env variables
NODE_ENV=production
JWT_SECRET=your_jwt_secret
DB_CONNECTION_STRING=mongodb://localhost:27017/mmm-checklist
PORT=3001

# Frontend environment
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=production
```

### **Production Optimizations**
- Bundle size optimization (<600KB target)
- Database connection pooling
- API response compression
- Error logging ve monitoring
- Security headers implementation

---

Bu rehber ile yeni modülünüzü **MMM95 enterprise standards**'ına uygun şekilde geliştirebilirsiniz! 

## 📞 **DESTEK**

Yeni modül geliştirme sürecinde herhangi bir sorunla karşılaştığınızda:
1. Bu dokümantasyonu referans alın
2. Mevcut modüllerin code patterns'ini inceleyin  
3. Console logs ve error messages'ları analiz edin
4. Database schema consistency'sini kontrol edin

**Başarılar! 🚀**