# 🏭 MMM95 - Modern Manufacturing Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.x-blue.svg)](https://mui.com/)

## 📋 Proje Hakkında

MMM95, modern üretim tesisleri için geliştirilmiş kapsamlı bir **Checklist & Task Management** sistemidir. İmalat süreçlerini dijitalleştirerek verimliliği artırır ve kalite kontrol süreçlerini optimize eder.

### 🎯 Temel Özellikler

- **📊 Envanter Yönetimi** - Excel import/export ile makina ve malzeme takibi
- **✅ Task Management** - İş atama, onay süreçleri ve progress tracking  
- **🔍 Kalite Kontrol** - Systematic quality evaluation ve reporting
- **👥 İnsan Kaynakları** - Performance scoring ve değerlendirme sistemi
- **📱 Mobile-First** - Responsive design ile mobil uyumlu arayüz
- **🔐 Rol Bazlı Erişim** - Güvenli yetkilendirme sistemi
- **📈 Real-time Dashboard** - Anlık performans takibi ve analytics

## 🚀 Hızlı Başlangıç

### ⚡ Gereksinimler

- **Node.js** 18.x veya üzeri
- **MongoDB** 6.x veya üzeri  
- **npm** veya **yarn**

### 🔧 Kurulum

```bash
# Repository'yi klonlayın
git clone https://github.com/yusufasc/MMM95-Checklist-System.git
cd MMM95-Checklist-System

# Backend bağımlılıklarını yükleyin
cd backend
npm install

# Frontend bağımlılıklarını yükleyin  
cd ../frontend
npm install
```

### 🏃‍♂️ Çalıştırma

```bash
# MongoDB'yi başlatın
mongod

# Backend'i başlatın (Terminal 1)
cd backend
npm start
# ✅ Backend: http://localhost:3001

# Frontend'i başlatın (Terminal 2)  
cd frontend
npm start
# ✅ Frontend: http://localhost:3000
```

## 📁 Proje Yapısı

```
MMM95/
├── 🚀 backend/              # Node.js/Express API
│   ├── config/              # Database configuration
│   ├── controllers/         # Business logic
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Authentication & authorization
│   └── services/            # Business services
├── 🎮 frontend/             # React.js aplikasyonu
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API integration
│   │   └── utils/           # Helper functions
├── 📚 docs/                 # Documentation
├── 📊 scripts/              # Database & maintenance scripts
└── 🔧 tools/                # Development tools
```

## 🔑 Ana Modüller

### 📦 Envanter Yönetimi
- Makina ve malzeme kataloğu
- Excel ile toplu veri import/export
- Kategorize edilmiş envanter sistemi
- Real-time stok takibi

### ✅ Task & Checklist Sistemi  
- İş atama ve progress tracking
- Approval workflow'ları
- Template-based checklist'ler
- Deadline ve reminder sistemi

### 🔍 Kalite Kontrol
- Systematic evaluation forms
- Quality scoring algorithms  
- Performance analytics
- Trend analysis ve reporting

### 👥 İK Yönetimi
- Personel performance değerlendirmesi
- Bonus calculation sistemi
- Training tracking
- Department-based analytics

## 🛡️ Güvenlik

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Granular permission sistem
- **Input Validation** - Comprehensive data validation
- **Security Headers** - CORS, CSRF protection
- **Rate Limiting** - API abuse protection

## 📊 Performans

- **Bundle Size**: <600KB (gzipped)
- **Load Time**: <200ms (avg response time)
- **Mobile Performance**: 95+ Lighthouse score
- **Code Splitting**: React.lazy() implementation
- **Caching**: 3-tier caching strategy

## 🌍 Dil Desteği

- **🇹🇷 Türkçe** (Primary)
- **🇺🇸 English** (Secondary)

## 📈 Teknoloji Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database & ODM
- **JWT** - Authentication
- **Winston** - Logging
- **Jest** - Testing

### Frontend  
- **React.js** - UI library
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Hook Form** - Form management

### DevOps & Tools
- **ESLint** + **Prettier** - Code quality
- **Nodemon** - Development server
- **Concurrently** - Multi-process management
- **Git** - Version control

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Yusuf ASC**
- GitHub: [@yusufasc](https://github.com/yusufasc)
- Email: yusufasci376@gmail.com

## 🙏 Teşekkürler

Bu projeyi mümkün kılan tüm açık kaynak kütüphanelere ve topluluğa teşekkürler.

---

⭐ **Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!** ⭐