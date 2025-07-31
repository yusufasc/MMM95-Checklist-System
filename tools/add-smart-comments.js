const fs = require('fs');
const path = require('path');

console.log('💬 MMM Projesi Smart Comments Sistemi');

// Current working directory'yi kontrol et ve path'leri ayarla
function getProjectPaths() {
  const currentDir = process.cwd();
  const isInToolsDir = currentDir.endsWith('tools');
  
  if (isInToolsDir) {
    return {
      backendRoutes: '../backend/routes',
      backendModels: '../backend/models',
      frontendComponents: '../frontend/src/components'
    };
  } else {
    return {
      backendRoutes: './backend/routes',
      backendModels: './backend/models',
      frontendComponents: './frontend/src/components'
    };
  }
}

const paths = getProjectPaths();

// Smart comment template'leri
const commentTemplates = {
  route: {
    get: '// 📖 API Endpoint: {method} {path}\n// 🎯 Amaç: {purpose}\n// 🔐 Yetki: {auth}\n// 📊 Response: {response}',
    post: '// ✏️ API Endpoint: {method} {path}\n// 🎯 Amaç: {purpose}\n// 🔐 Yetki: {auth}\n// 📝 Body: {body}\n// 📊 Response: {response}',
    put: '// 🔄 API Endpoint: {method} {path}\n// 🎯 Amaç: {purpose}\n// 🔐 Yetki: {auth}\n// 📝 Body: {body}\n// 📊 Response: {response}',
    delete:
      '// 🗑️ API Endpoint: {method} {path}\n// 🎯 Amaç: {purpose}\n// 🔐 Yetki: {auth}\n// ⚠️ Dikkat: {warning}',
  },
  component:
    '// 🧩 React Component: {name}\n// 🎯 Amaç: {purpose}\n// 📝 Props: {props}\n// 🔗 Hooks: {hooks}',
  model:
    '// 🗄️ MongoDB Model: {name}\n// 🎯 Amaç: {purpose}\n// 🔗 İlişkiler: {relations}\n// 📋 Ana Alanlar: {fields}',
  function:
    '// ⚙️ Fonksiyon: {name}\n// 🎯 Amaç: {purpose}\n// 📥 Parametreler: {params}\n// 📤 Return: {return}',
};

// Dosya analiz fonksiyonları
function analyzeRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let updatedContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Route tanımı tespit et
    const routeMatch = line.match(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/);
    if (routeMatch && !lines[i - 1]?.includes('//')) {
      const method = routeMatch[1];
      const endpoint = routeMatch[2];

      // Smart comment ekle
      const comment = generateRouteComment(method, endpoint, line);
      updatedContent += comment + '\n';
    }

    updatedContent += line + '\n';
  }

  return updatedContent;
}

function generateRouteComment(method, endpoint, codeLine) {
  const purpose = inferPurposeFromEndpoint(endpoint, method);
  const auth = codeLine.includes('auth') ? 'Gerekli' : 'Gerekli değil';
  const response = inferResponseType(endpoint, method);

  let template = commentTemplates.route[method.toLowerCase()] || commentTemplates.route.get;

  return template
    .replace('{method}', method.toUpperCase())
    .replace('{path}', endpoint)
    .replace('{purpose}', purpose)
    .replace('{auth}', auth)
    .replace('{response}', response)
    .replace('{body}', inferBodyType(endpoint, method))
    .replace('{warning}', method === 'DELETE' ? 'Kalıcı silme işlemi!' : '');
}

function inferPurposeFromEndpoint(endpoint, method) {
  const purposes = {
    '/login': 'Kullanıcı girişi',
    '/logout': 'Kullanıcı çıkışı',
    '/tasks': method === 'GET' ? 'Görevleri listele' : 'Yeni görev oluştur',
    '/tasks/:id':
      method === 'GET' ? 'Görev detayı' : method === 'PUT' ? 'Görev güncelle' : 'Görev sil',
    '/users': method === 'GET' ? 'Kullanıcıları listele' : 'Yeni kullanıcı oluştur',
    '/inventory': method === 'GET' ? 'Envanter listele' : 'Envanter öğesi ekle',
    '/performance': 'Performans verilerini işle',
    '/control-pending': 'Kontrol bekleyen görevleri listele',
  };

  // Exact match kontrolü
  if (purposes[endpoint]) return purposes[endpoint];

  // Pattern match kontrolü
  if (endpoint.includes('/tasks')) return 'Görev yönetimi';
  if (endpoint.includes('/users')) return 'Kullanıcı yönetimi';
  if (endpoint.includes('/inventory')) return 'Envanter yönetimi';
  if (endpoint.includes('/performance')) return 'Performans takibi';
  if (endpoint.includes('/quality')) return 'Kalite kontrol';

  return 'API işlemi';
}

function inferResponseType(endpoint, method) {
  if (method === 'GET') {
    if (endpoint.includes('/:id')) return 'Tek kayıt objesi';
    return 'Kayıt listesi array';
  }
  if (method === 'POST') return 'Oluşturulan kayıt';
  if (method === 'PUT') return 'Güncellenen kayıt';
  if (method === 'DELETE') return 'Silme konfirmasyonu';
  return 'API response';
}

function inferBodyType(endpoint, method) {
  if (method === 'GET' || method === 'DELETE') return '-';

  if (endpoint.includes('/tasks')) return '{ baslik, aciklama, makina, atananKullanici }';
  if (endpoint.includes('/users')) return '{ kullaniciAdi, email, roller, makinalar }';
  if (endpoint.includes('/inventory')) return '{ ad, kategori, miktar, konum }';

  return 'Request body object';
}

// Component analizi
function analyzeComponentFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.js');

  // Component adını tespit et
  const componentMatch = content.match(/(?:function|const)\s+(\w+)|export default (\w+)/);
  const componentName = componentMatch ? componentMatch[1] || componentMatch[2] : fileName;

  // Props analizi
  const propsMatch = content.match(/\{\s*([^}]+)\s*\}/);
  const props = propsMatch
    ? propsMatch[1]
        .split(',')
        .map(p => p.trim())
        .join(', ')
    : 'Yok';

  // Hooks analizi
  const hooks = (content.match(/use[A-Z]\w+/g) || []).join(', ') || 'Yok';

  // Amaç çıkarımı
  const purpose = inferComponentPurpose(componentName, content);

  const comment = commentTemplates.component
    .replace('{name}', componentName)
    .replace('{purpose}', purpose)
    .replace('{props}', props)
    .replace('{hooks}', hooks);

  // Comment'i dosyanın başına ekle
  if (!content.startsWith('//')) {
    return comment + '\n\n' + content;
  }

  return content;
}

function inferComponentPurpose(name, content) {
  const purposes = {
    Login: 'Kullanıcı giriş formu',
    Dashboard: 'Ana kontrol paneli',
    Tasks: 'Görev listesi ve yönetimi',
    Users: 'Kullanıcı listesi ve yönetimi',
    Inventory: 'Envanter yönetimi',
    Performance: 'Performans göstergeleri',
    Layout: 'Sayfa layout wrapper',
    ProtectedRoute: 'Yetki korumalı route',
  };

  if (purposes[name]) return purposes[name];

  if (name.includes('Dialog')) return 'Modal dialog component';
  if (name.includes('Card')) return 'Kart görünümü component';
  if (name.includes('List')) return 'Liste component';
  if (name.includes('Form')) return 'Form component';

  return 'React UI component';
}

// Model analizi
function analyzeModelFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.js');

  // Model adını tespit et
  const modelMatch = content.match(/mongoose\.model\(['"`](\w+)/);
  const modelName = modelMatch ? modelMatch[1] : fileName;

  // İlişkileri tespit et
  const relations =
    (content.match(/ref:\s*['"`](\w+)/g) || []).map(r => r.match(/['"`](\w+)/)[1]).join(', ') ||
    'Yok';

  // Ana alanları tespit et
  const fields = (content.match(/^\s*(\w+):/gm) || [])
    .map(f => f.trim().replace(':', ''))
    .slice(0, 5) // İlk 5 alan
    .join(', ');

  const purpose = inferModelPurpose(modelName);

  const comment = commentTemplates.model
    .replace('{name}', modelName)
    .replace('{purpose}', purpose)
    .replace('{relations}', relations)
    .replace('{fields}', fields);

  if (!content.startsWith('//')) {
    return comment + '\n\n' + content;
  }

  return content;
}

function inferModelPurpose(name) {
  const purposes = {
    User: 'Kullanıcı bilgileri ve yetkileri',
    Task: 'Görev tanımları ve durumları',
    WorkTask: 'Çalışma görevleri ve tamamlanma bilgileri',
    Role: 'Kullanıcı rolleri ve yetkileri',
    Machine: 'Makina bilgileri ve durumu',
    Inventory: 'Envanter öğeleri',
    Performance: 'Performans metrikleri',
    ChecklistTemplate: 'Checklist şablonları',
    QualityControl: 'Kalite kontrol verileri',
  };

  return purposes[name] || 'Database model';
}

// Ana işleme fonksiyonu
function processFiles() {
  console.log('🔍 Dosyalar analiz ediliyor...');

  // Backend routes
  const routesDir = paths.backendRoutes;
  if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

    routeFiles.forEach(file => {
      const filePath = path.join(routesDir, file);
      console.log(`📍 İşleniyor: ${file}`);

      try {
        const updatedContent = analyzeRouteFile(filePath);
        fs.writeFileSync(filePath + '.commented', updatedContent);
        console.log(`✅ Comment'ler eklendi: ${file}`);
      } catch (error) {
        console.log(`❌ Hata: ${file} - ${error.message}`);
      }
    });
  }

  // Frontend components  
  const componentsDir = paths.frontendComponents;
  if (fs.existsSync(componentsDir)) {
    // Sadece ana seviyedeki component'leri işle (alt klasörler çok fazla)
    const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));

    componentFiles.forEach(file => {
      const filePath = path.join(componentsDir, file);
      console.log(`🧩 İşleniyor: ${file}`);

      try {
        const updatedContent = analyzeComponentFile(filePath);
        fs.writeFileSync(filePath + '.commented', updatedContent);
        console.log(`✅ Comment'ler eklendi: ${file}`);
      } catch (error) {
        console.log(`❌ Hata: ${file} - ${error.message}`);
      }
    });
  }

  // Backend models
  const modelsDir = paths.backendModels;
  if (fs.existsSync(modelsDir)) {
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

    modelFiles.forEach(file => {
      const filePath = path.join(modelsDir, file);
      console.log(`🗄️ İşleniyor: ${file}`);

      try {
        const updatedContent = analyzeModelFile(filePath);
        fs.writeFileSync(filePath + '.commented', updatedContent);
        console.log(`✅ Comment'ler eklendi: ${file}`);
      } catch (error) {
        console.log(`❌ Hata: ${file} - ${error.message}`);
      }
    });
  }
}

// İstatistik raporu
function generateReport() {
  console.log('\n📊 Smart Comments Raporu:');

  const stats = {
    routes: 0,
    components: 0,
    models: 0,
    totalComments: 0,
  };

  // .commented dosyalarını say
  function countComments(dir, type) {
    if (!fs.existsSync(dir)) return 0;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js.commented'));
    files.forEach(file => {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const commentCount = (content.match(/^\/\/ [📖✏️🔄🗑️🧩🗄️⚙️]/gm) || []).length;
      stats.totalComments += commentCount;
    });

    stats[type] = files.length;
    return files.length;
  }

  countComments(paths.backendRoutes, 'routes');
  countComments(paths.frontendComponents, 'components');
  countComments(paths.backendModels, 'models');

  console.log(`📍 Route dosyaları: ${stats.routes}`);
  console.log(`🧩 Component dosyaları: ${stats.components}`);
  console.log(`🗄️ Model dosyaları: ${stats.models}`);
  console.log(`💬 Toplam smart comment: ${stats.totalComments}`);

  console.log("\n💡 Bu comment'li dosyaları AI'ya verdiğinizde daha iyi anlayacak!");
  console.log('📝 .commented dosyalarını review edip orijinal dosyalara uygulayabilirsiniz.');
}

// Ana çalıştırma
if (require.main === module) {
  processFiles();
  generateReport();
}
