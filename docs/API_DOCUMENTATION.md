# 📚 MMM Checklist Sistemi - API Dokümantasyonu

## 🚀 **API Genel Bilgileri**

**Base URL**: `http://localhost:5000/api`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`

---

## 🔐 **Authentication Endpoints**

### **POST /api/auth/login**
Kullanıcı girişi

**Request Body:**
```json
{
  "kullaniciAdi": "admin",
  "sifre": "admin321"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "kullaniciAdi": "admin",
    "ad": "Admin",
    "soyad": "User",
    "roller": [...],
    "departmanlar": [...]
  }
}
```

### **GET /api/auth/me**
Mevcut kullanıcı bilgisi

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "kullaniciAdi": "admin",
    "ad": "Admin",
    "soyad": "User",
    "roller": [...],
    "departmanlar": [...]
  }
}
```

---

## 👥 **User Management Endpoints**

### **GET /api/users**
Tüm kullanıcıları listele

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "kullaniciAdi": "admin",
    "ad": "Admin",
    "soyad": "User",
    "roller": [...],
    "departmanlar": [...],
    "durum": "aktif"
  }
]
```

### **POST /api/users**
Yeni kullanıcı oluştur

**Request Body:**
```json
{
  "kullaniciAdi": "yeni_kullanici",
  "sifre": "güvenli_şifre",
  "ad": "Ad",
  "soyad": "Soyad",
  "roller": ["507f1f77bcf86cd799439012"],
  "departmanlar": ["507f1f77bcf86cd799439013"]
}
```

### **PUT /api/users/:id**
Kullanıcı güncelle

### **DELETE /api/users/:id**
Kullanıcı sil

---

## 🎭 **Role Management Endpoints**

### **GET /api/roles**
Tüm rolleri listele

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "ad": "Admin",
    "moduller": [
      {
        "modul": {
          "_id": "507f1f77bcf86cd799439014",
          "ad": "Kullanıcı Yönetimi"
        },
        "erisebilir": true,
        "duzenleyebilir": true,
        "puanlayabilir": false,
        "onaylayabilir": false
      }
    ]
  }
]
```

### **POST /api/roles**
Yeni rol oluştur

**Request Body:**
```json
{
  "ad": "Yeni Rol",
  "moduller": [
    {
      "modul": "507f1f77bcf86cd799439014",
      "erisebilir": true,
      "duzenleyebilir": true,
      "puanlayabilir": false,
      "onaylayabilir": false
    }
  ]
}
```

---

## 🏢 **Department Management Endpoints**

### **GET /api/departments**
Tüm departmanları listele

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "ad": "Üretim",
    "aciklama": "Üretim departmanı",
    "digerDepartmanYetkileri": [...]
  }
]
```

### **POST /api/departments**
Yeni departman oluştur

---

## 📋 **Task Management Endpoints**

### **GET /api/tasks**
Tüm görevleri listele

**Query Parameters:**
- `durum`: `aktif` | `pasif`
- `kullanici`: Kullanıcı ID'si
- `makina`: Makina adı

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "baslik": "Günlük Kontrol",
    "aciklama": "Makina günlük kontrolü",
    "checklistTemplate": {...},
    "atananRoller": [...],
    "makina": "Makina-001",
    "durum": "aktif"
  }
]
```

### **GET /api/tasks/my**
Kullanıcının görevleri

### **POST /api/tasks**
Yeni görev oluştur

**Request Body:**
```json
{
  "baslik": "Yeni Görev",
  "aciklama": "Görev açıklaması",
  "checklistTemplate": "507f1f77bcf86cd799439016",
  "atananRoller": ["507f1f77bcf86cd799439012"],
  "makina": "Makina-001"
}
```

### **PUT /api/tasks/:id/complete**
Görevi tamamla

**Request Body:**
```json
{
  "fotograflar": {
    "beforePhoto": "data:image/jpeg;base64,...",
    "afterPhoto": "data:image/jpeg;base64,..."
  },
  "puanlar": [
    {
      "maddeId": "507f1f77bcf86cd799439017",
      "puan": 5
    }
  ]
}
```

### **GET /api/tasks/control-pending**
Kontrol bekleyen görevler

### **PUT /api/tasks/:id/approve**
Görevi onayla

### **PUT /api/tasks/:id/reject**
Görevi reddet

---

## 🏭 **Inventory Management Endpoints**

### **GET /api/inventory/categories**
Envanter kategorileri

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439018",
    "ad": "Plastik Enjeksiyon Makinaları",
    "aciklama": "Enjeksiyon makinaları kategorisi",
    "alanSablolari": [...]
  }
]
```

### **GET /api/inventory/items**
Envanter öğeleri

**Query Parameters:**
- `kategori`: Kategori ID'si
- `durum`: `aktif` | `pasif`
- `arama`: Arama terimi

### **POST /api/inventory/items**
Yeni envanter öğesi oluştur

### **PUT /api/inventory/items/:id**
Envanter öğesi güncelle

### **DELETE /api/inventory/items/:id**
Envanter öğesi sil

---

## 📊 **Performance Endpoints**

### **GET /api/performance/users**
Kullanıcı performansları

**Query Parameters:**
- `tarihBaslangic`: Başlangıç tarihi
- `tarihBitis`: Bitiş tarihi
- `kullanici`: Kullanıcı ID'si

**Response:**
```json
[
  {
    "kullanici": {
      "_id": "507f1f77bcf86cd799439011",
      "ad": "Admin",
      "soyad": "User"
    },
    "toplamGorev": 25,
    "tamamlananGorev": 23,
    "ortalamaPuan": 4.2,
    "toplamPuan": 96
  }
]
```

### **GET /api/performance/departments**
Departman performansları

---

## 🔧 **Machine Management Endpoints**

### **GET /api/machines**
Tüm makinaları listele

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439019",
    "makinaNo": "Makina-001",
    "ad": "Enjeksiyon Makinası 1",
    "departman": {...},
    "sorumluRoller": [...],
    "durum": "aktif"
  }
]
```

### **GET /api/machines/my-accessible**
Kullanıcının erişebileceği makinalar

---

## 📈 **HR Management Endpoints**

### **GET /api/hr/scores**
HR puanları

**Query Parameters:**
- `yil`: Yıl
- `ay`: Ay
- `kullanici`: Kullanıcı ID'si

### **POST /api/hr/scores**
HR puanı ekle

### **GET /api/hr/templates**
HR şablonları

### **POST /api/hr/templates**
HR şablonu oluştur

---

## 🎯 **Quality Control Endpoints**

### **GET /api/quality-control/evaluations**
Kalite kontrol değerlendirmeleri

### **POST /api/quality-control/evaluations**
Kalite kontrol değerlendirmesi oluştur

### **GET /api/quality-control/templates**
Kalite kontrol şablonları

---

## 📊 **Analytics Endpoints**

### **GET /api/analytics/dashboard**
Dashboard istatistikleri

**Response:**
```json
{
  "kullaniciSayisi": 150,
  "aktifGorevSayisi": 45,
  "tamamlananGorevSayisi": 1200,
  "ortalamaPuan": 4.3,
  "envanterOgesiSayisi": 500,
  "makinaSayisi": 25
}
```

### **GET /api/analytics/performance-trends**
Performans trendleri

### **GET /api/analytics/user-activity**
Kullanıcı aktivite analizi

---

## 🔔 **Notification Endpoints**

### **GET /api/notifications**
Bildirimler

**Query Parameters:**
- `okunmamis`: `true` | `false`
- `tip`: `gorev` | `sistem` | `kalite`

### **PUT /api/notifications/:id/read**
Bildirimi okundu olarak işaretle

---

## 📁 **File Upload Endpoints**

### **POST /api/upload/photo**
Fotoğraf yükle

**Content-Type**: `multipart/form-data`

**Form Data:**
- `photo`: Fotoğraf dosyası
- `tip`: `before` | `after`

**Response:**
```json
{
  "url": "data:image/jpeg;base64,...",
  "boyut": 1572864,
  "tip": "image/jpeg"
}
```

---

## 🚨 **Error Responses**

### **400 Bad Request**
```json
{
  "message": "Geçersiz veri formatı",
  "errors": [
    {
      "field": "kullaniciAdi",
      "message": "Kullanıcı adı gerekli"
    }
  ]
}
```

### **401 Unauthorized**
```json
{
  "message": "Geçersiz token"
}
```

### **403 Forbidden**
```json
{
  "message": "Bu işlem için yetkiniz yok"
}
```

### **404 Not Found**
```json
{
  "message": "Kayıt bulunamadı"
}
```

### **500 Internal Server Error**
```json
{
  "message": "Sunucu hatası"
}
```

---

## 🔧 **Rate Limiting**

- **Default**: 100 requests per minute
- **Auth endpoints**: 10 requests per minute
- **File upload**: 20 requests per minute

---

## 📝 **Pagination**

Liste endpoint'leri pagination destekler:

**Query Parameters:**
- `sayfa`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20)

**Response:**
```json
{
  "veriler": [...],
  "pagination": {
    "sayfa": 1,
    "limit": 20,
    "toplamKayit": 150,
    "toplamSayfa": 8
  }
}
```

---

## 🔍 **Search & Filtering**

Çoğu endpoint arama ve filtreleme destekler:

**Query Parameters:**
- `arama`: Genel arama terimi
- `siralama`: `asc` | `desc`
- `siralamaAlani`: Sıralama alanı

---

## 📊 **Response Headers**

```
Content-Type: application/json
X-Total-Count: 150
X-Page-Count: 8
X-Current-Page: 1
Cache-Control: no-cache
```

---

## 🚀 **WebSocket Events**

### **Real-time Updates**

```javascript
// Bağlantı
const socket = io('http://localhost:5000');

// Görev güncellemeleri
socket.on('task-updated', (data) => {
  console.log('Görev güncellendi:', data);
});

// Bildirimler
socket.on('notification', (data) => {
  console.log('Yeni bildirim:', data);
});

// Performans güncellemeleri
socket.on('performance-updated', (data) => {
  console.log('Performans güncellendi:', data);
});
```

---

## 📚 **SDK & Libraries**

### **JavaScript/Node.js**
```javascript
import { MMMClient } from '@mmm/client';

const client = new MMMClient({
  baseURL: 'http://localhost:5000/api',
  token: 'your-jwt-token'
});

// Kullanıcıları listele
const users = await client.users.getAll();

// Görev oluştur
const task = await client.tasks.create({
  baslik: 'Yeni Görev',
  aciklama: 'Görev açıklaması'
});
```

### **Python**
```python
from mmm_client import MMMClient

client = MMMClient(
    base_url='http://localhost:5000/api',
    token='your-jwt-token'
)

# Kullanıcıları listele
users = client.users.get_all()

# Görev oluştur
task = client.tasks.create({
    'baslik': 'Yeni Görev',
    'aciklama': 'Görev açıklaması'
})
```

---

## 🔧 **Development Tools**

### **Postman Collection**
[MMM API Collection](https://www.postman.com/collections/mmm-api)

### **Swagger Documentation**
[API Documentation](http://localhost:5000/api-docs)

### **GraphQL Playground**
[GraphQL Playground](http://localhost:5000/graphql)

---

## 📞 **Support**

- **API Documentation**: [docs/api.md](docs/api.md)
- **GitHub Issues**: [github.com/mmm/issues](https://github.com/mmm/issues)
- **Email Support**: api@mmm.com
- **Slack Channel**: #api-support

---

**🎯 Son Güncelleme**: 6 Şubat 2025  
**📊 API Version**: v1.0.0  
**🔒 Security**: OWASP Top 10 Compliant 