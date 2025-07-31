const fs = require('fs');
const path = require('path');

console.log('🏗️ MMM Projesi Mimari Haritası Oluşturuluyor...');

// Current working directory'yi kontrol et ve path'leri ayarla
function getProjectPaths() {
  const currentDir = process.cwd();
  const isInToolsDir = currentDir.endsWith('tools');
  
  if (isInToolsDir) {
    return {
      backend: '../backend',
      frontend: '../frontend/src',
      backendRoutes: '../backend/routes',
      backendModels: '../backend/models',
      frontendComponents: '../frontend/src/components'
    };
  } else {
    return {
      backend: './backend',
      frontend: './frontend/src',
      backendRoutes: './backend/routes',
      backendModels: './backend/models',
      frontendComponents: './frontend/src/components'
    };
  }
}

const paths = getProjectPaths();

// Dosya yapısını analiz et
function analyzeDirectory(dir, prefix = '') {
  const items = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Dizin bulunamadı: ${dir}`);
    return items;
  }
  
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (file.startsWith('.') || file === 'node_modules') return;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      items.push(`${prefix}📁 ${file}/`);
      items.push(...analyzeDirectory(fullPath, prefix + '  '));
    } else if (file.endsWith('.js')) {
      // Dosya içeriğini analiz et
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      const exports = (content.match(/module\.exports|export/g) || []).length;
      const imports = (content.match(/require\(|import/g) || []).length;

      items.push(`${prefix}📄 ${file} (${lines} satır, ${imports} import, ${exports} export)`);
    }
  });

  return items;
}

// Backend analizi
console.log('\n📊 Backend Yapı Analizi:');
const backendStructure = analyzeDirectory(paths.backend);
backendStructure.forEach(item => console.log(item));

// Frontend analizi
console.log('\n📱 Frontend Yapı Analizi:');
const frontendStructure = analyzeDirectory(paths.frontend);
frontendStructure.forEach(item => console.log(item));

// API Route'larını analiz et
console.log('\n🛣️ API Route Analizi:');
const routesDir = paths.backendRoutes;
if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

  routeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const routes = content.match(/router\.(get|post|put|delete)\(/g) || [];
    const middlewares = content.match(/auth|checkModulePermission/g) || [];

    console.log(`📍 ${file}:`);
    console.log(`   - ${routes.length} endpoint`);
    console.log(`   - ${middlewares.length} middleware kullanımı`);

    // Endpoint'leri listele
    const endpoints = content.match(/router\.(get|post|put|delete)\(['"`]([^'"`]+)/g) || [];
    endpoints.forEach(endpoint => {
      const method = endpoint.match(/\.(get|post|put|delete)/)[1].toUpperCase();
      const pathMatch = endpoint.match(/['"`]([^'"`]+)/);
      if (pathMatch) {
        console.log(`     ${method} ${pathMatch[1]}`);
      }
    });
    console.log('');
  });
}

// Component analizi
console.log('\n🧩 React Component Analizi:');
const componentsDir = paths.frontendComponents;
if (fs.existsSync(componentsDir)) {
  const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));

  componentFiles.forEach(file => {
    const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
    const hooks = content.match(/use[A-Z]\w+/g) || [];
    const imports = content.match(/import.*from/g) || [];
    const muiComponents = content.match(/<[A-Z]\w+/g) || [];

    console.log(`🧩 ${file}:`);
    console.log(`   - ${hooks.length} hook kullanımı`);
    console.log(`   - ${imports.length} import`);
    console.log(`   - ${muiComponents.length} MUI component`);
  });
}

// Database Model analizi
console.log('\n🗄️ Database Model Analizi:');
const modelsDir = paths.backendModels;
if (fs.existsSync(modelsDir)) {
  const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

  modelFiles.forEach(file => {
    const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    const fields = content.match(/^\s*\w+:/gm) || [];
    const refs = content.match(/ref:\s*['"`]\w+/g) || [];

    console.log(`🗄️ ${file}:`);
    console.log(`   - ${fields.length} field`);
    console.log(`   - ${refs.length} referans`);
  });
}

// Kompleksite analizi
console.log('\n🎯 Kod Kompleksite Skoru:');
function calculateComplexity(dir) {
  let totalLines = 0;
  let totalFiles = 0;
  let totalCyclomaticComplexity = 0;

  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Dizin bulunamadı: ${dir}`);
    return {
      totalFiles: 0,
      totalLines: 0,
      avgLinesPerFile: 0,
      totalComplexity: 0,
      avgComplexityPerFile: 0,
    };
  }

  function analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      const complexity = (content.match(/if|for|while|switch|catch|\?\s*:/g) || []).length;

      totalLines += lines;
      totalFiles += 1;
      totalCyclomaticComplexity += complexity;
    } catch (error) {
      console.log(`⚠️ Dosya okunamadı: ${filePath}`);
    }
  }

  function walkDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    files.forEach(file => {
      if (file.startsWith('.') || file === 'node_modules') return;

      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith('.js')) {
        analyzeFile(fullPath);
      }
    });
  }

  walkDir(dir);

  return {
    totalFiles,
    totalLines,
    avgLinesPerFile: totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0,
    totalComplexity: totalCyclomaticComplexity,
    avgComplexityPerFile: totalFiles > 0 ? Math.round(totalCyclomaticComplexity / totalFiles) : 0,
  };
}

const backendComplexity = calculateComplexity(paths.backend);
const frontendComplexity = calculateComplexity(paths.frontend);

console.log('Backend:');
console.log(`  📄 ${backendComplexity.totalFiles} dosya`);
console.log(
  `  📏 ${backendComplexity.totalLines} satır (avg: ${backendComplexity.avgLinesPerFile}/dosya)`
);
console.log(
  `  🔄 ${backendComplexity.totalComplexity} kompleksite (avg: ${backendComplexity.avgComplexityPerFile}/dosya)`
);

console.log('Frontend:');
console.log(`  📄 ${frontendComplexity.totalFiles} dosya`);
console.log(
  `  📏 ${frontendComplexity.totalLines} satır (avg: ${frontendComplexity.avgLinesPerFile}/dosya)`
);
console.log(
  `  🔄 ${frontendComplexity.totalComplexity} kompleksite (avg: ${frontendComplexity.avgComplexityPerFile}/dosya)`
);

// Öneri sistemi
console.log('\n💡 Anti-Spaghetti Önerileri:');

if (backendComplexity.avgLinesPerFile > 200) {
  console.log('⚠️ Backend dosyaları çok büyük. Dosyaları böl!');
}

if (frontendComplexity.avgLinesPerFile > 150) {
  console.log('⚠️ Frontend componentları çok büyük. Küçük componentlara böl!');
}

if (backendComplexity.avgComplexityPerFile > 10) {
  console.log('⚠️ Backend kompleksitesi yüksek. Fonksiyonları basitleştir!');
}

if (frontendComplexity.avgComplexityPerFile > 8) {
  console.log('⚠️ Frontend kompleksitesi yüksek. Componentları basitleştir!');
}

console.log("\n✅ Analiz tamamlandı! Bu bilgileri AI'ya vererek daha iyi kod yazabilirsiniz.");
