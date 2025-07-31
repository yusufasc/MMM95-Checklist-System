# 🎯 AI Kural Koordinasyon Sistemi - Kullanım Kılavuzu

## 🧠 **Akıllı Kural Aktivasyon Sistemi**

Bu sistem AI'nın **hangi durumda hangi cursor rule'ını** kullanacağını otomatik belirler.

## 🔍 **Context Detection (Durum Tespiti)**

### 📁 **Dosya Bazlı Aktivasyon**

```javascript
// Bu dosyayı açtığınızda otomatik aktif olur:
backend/models/User.js          → database-cursor.mdc + backend-cursor.mdc
frontend/src/components/App.jsx → frontend-cursor.mdc + mobile-pwa-cursor.mdc
backend/routes/auth.js          → security-cursor.mdc + backend-cursor.mdc
test/user.test.js              → testing-cursor.mdc + backend-cursor.mdc
package.json                   → deployment-cursor.mdc + eslint-performance-cursor.mdc
```

### 🎯 **Anahtar Kelime Bazlı Aktivasyon**

```javascript
// Kullanıcı şunu yazınca:
"mongoose error"        → database-cursor.mdc + debugging-troubleshooting-cursor.mdc
"react component"       → frontend-cursor.mdc + mobile-pwa-cursor.mdc  
"jwt token auth"        → security-cursor.mdc + backend-cursor.mdc
"eslint hatası"         → eslint-performance-cursor.mdc + debugging-troubleshooting-cursor.mdc
"deployment problemi"   → deployment-cursor.mdc + debugging-troubleshooting-cursor.mdc
```

### 💭 **Niyet Bazlı Aktivasyon**

```javascript
// User Intent Detection:
"Yeni component oluştur"     → development → frontend-cursor.mdc + core-cursor.mdc
"Bu hatayı düzelt"          → debugging → debugging-troubleshooting-cursor.mdc
"Performance iyileştir"      → optimization → eslint-performance-cursor.mdc
"Production'a deploy et"     → deployment → deployment-cursor.mdc
"API dokümantasyonu yaz"     → documentation → api-documentation-cursor.mdc
```

## 🎮 **Manuel Komutlar**

### ⚡ **Hızlı Aktivasyon Komutları**

```bash
@backend        → Backend development rules
@frontend       → Frontend development rules  
@database       → Database operations rules
@security       → Security & auth rules
@debug          → Debugging & troubleshooting rules
@test           → Testing rules
@deploy         → Deployment rules
@docs           → Documentation rules
@performance    → Performance optimization rules
@mobile         → Mobile & PWA rules
@data           → Data management rules
@maintenance    → System maintenance rules
@fullstack      → Full-stack development rules
@all            → All rules active
```

### 📝 **Kullanım Örnekleri**

```javascript
// Örnek 1: Backend API geliştirme
User: "@backend Yeni user authentication API'si oluştur"
Active Rules: backend-cursor.mdc + security-cursor.mdc + core-cursor.mdc

// Örnek 2: Frontend component debug
User: "@frontend React component render sorunu var"  
Active Rules: frontend-cursor.mdc + debugging-troubleshooting-cursor.mdc

// Örnek 3: Database optimization
User: "@database MongoDB query performance iyileştir"
Active Rules: database-cursor.mdc + eslint-performance-cursor.mdc + monitoring-logging-cursor.mdc

// Örnek 4: Full-stack feature
User: "@fullstack Kullanıcı profil sistemi ekle"
Active Rules: backend-cursor.mdc + frontend-cursor.mdc + database-cursor.mdc + security-cursor.mdc
```

## 🔄 **Akıllı Kombinasyonlar**

### 🎯 **Scenario-Based Activation**

#### **Full-Stack Development**

```json
Active Rules: [
  "core-cursor.mdc",           // Temel kurallar
  "backend-cursor.mdc",        // API geliştirme  
  "frontend-cursor.mdc",       // UI geliştirme
  "database-cursor.mdc"        // Data modeling
]
```

#### **API Development**

```json
Active Rules: [
  "backend-cursor.mdc",        // Server logic
  "api-documentation-cursor.mdc", // Documentation
  "security-cursor.mdc",       // Auth & permissions
  "database-cursor.mdc"        // Data layer
]
```

#### **Production Deployment**

```json
Active Rules: [
  "deployment-cursor.mdc",     // Deploy strategies
  "security-cursor.mdc",       // Security hardening
  "monitoring-logging-cursor.mdc", // Monitoring
  "maintenance-cursor.mdc"     // System maintenance
]
```

#### **Quality Assurance**

```json
Active Rules: [
  "testing-cursor.mdc",        // Test writing
  "eslint-performance-cursor.mdc", // Code quality
  "security-cursor.mdc"        // Security testing
]
```

## 🤖 **Automatic Context Detection**

### 📊 **Priority Matrix**

1. **Primary Context** (En yüksek öncelik)
   - Açık dosya türü
   - Dosya yolu
   - Son yapılan işlem

2. **Secondary Context** (Orta öncelik)  
   - Kod içeriği anahtar kelimeleri
   - Kullanıcı intent kelimeleri
   - Hata mesajları

3. **Tertiary Context** (Düşük öncelik)
   - Proje yapısı
   - Package.json dependencies
   - Git branch adı

### 🔧 **Smart Fallback System**

```javascript
// Eğer context belirlenemezse:
Default Fallback → core-cursor.mdc

// Eğer çok fazla rule aktif olursa:
Max Active Rules → 4 rule (en yüksek priority)

// Eğer çelişkili context varsa:
Conflict Resolution → User intent priority
```

## 📱 **Usage Examples**

### 🎯 **Günlük Workflow Örnekleri**

```bash
# 1. Sabah geliştirme başlangıcı
User: "Bugün yeni özellik geliştireceğim"
AI: fullStackDevelopment rules aktif → core + backend + frontend + database

# 2. Bug fix zamanı  
User: "Kullanıcı login sorunu var"
AI: debugging + security rules aktif → debugging-troubleshooting + security + backend

# 3. Performance optimization
User: "Site yavaş, hızlandırmak lazım"  
AI: optimization rules aktif → eslint-performance + monitoring-logging + database

# 4. Deploy günü
User: "Production'a çıkacağız"
AI: deployment rules aktif → deployment + security + monitoring-logging + maintenance
```

### 🔄 **Context Switching Examples**

```javascript
// Dosya değiştirince otomatik switch:
user.test.js açıldı     → testing-cursor.mdc aktif
App.jsx açıldı          → frontend-cursor.mdc aktif  
auth.js açıldı          → security-cursor.mdc aktif
package.json açıldı     → deployment-cursor.mdc aktif

// Task değiştirince otomatik switch:
"component oluştur"     → frontend rules
"API endpoint ekle"     → backend + api-documentation rules
"database optimize et"  → database + performance rules
"hata düzelt"          → debugging rules
```

## 🎛️ **Gelişmiş Kontrol**

### ⚙️ **Configuration Options**

```json
// .cursor/ai-rule-coordinator.json içinde:

"autoActivation": {
  "enabled": true,              // Otomatik aktivasyon açık/kapalı
  "maxActiveRules": 4,          // Max aynı anda aktif rule sayısı  
  "priority": "contextual",     // Priority stratejisi
  "fallback": ["core-cursor.mdc"] // Fallback rule
}
```

### 🎯 **Performance Tuning**

```javascript
// Rule activation frequency:
High Frequency → core, backend, frontend (sürekli kullanılan)
Medium Frequency → security, database, testing (proje tipine göre)  
Low Frequency → deployment, maintenance (nadiren kullanılan)

// Memory optimization:
Active Rules Cache → Last 4 rules cached
Context Cache → Last 10 context cached  
Smart Preloading → Likely next rules preloaded
```

## 🚀 **Best Practices**

### ✅ **Recommended Usage**

1. **Specificity İlkesi**: Mümkün olduğunca spesifik komut kullan

   ```bash
   ❌ Genel: "Kod yaz"
   ✅ Spesifik: "@backend User authentication API'si oluştur"
   ```

2. **Context Switching**: Görev değiştirirken context'i açıkla

   ```bash
   ✅ "Şimdi frontend'e geçiyorum, login component'i yapacağım"
   ```

3. **Rule Combination**: Manuel kombinasyon gerektiğinde belirt

   ```bash
   ✅ "@fullstack @security Güvenli user management sistemi"
   ```

### ⚠️ **Common Mistakes**

```bash
❌ Çok genel komutlar
❌ Context'siz rule değişimi  
❌ Çok fazla rule'ı aynı anda aktif etme
❌ Manuel override'ı unutma
```

## 🎉 **Sonuç**

Bu sistem sayesinde AI **tam otomatik** olarak:

- ✅ Hangi dosyada çalıştığınızı anlar
- ✅ Ne yapmaya çalıştığınızı tespit eder
- ✅ Uygun rule'ları aktif eder  
- ✅ Context değiştikçe rule'ları günceller
- ✅ Maximum verimlilik sağlar

**Artık sadece ne istediğinizi söylemeniz yeterli!** 🚀
 
 
