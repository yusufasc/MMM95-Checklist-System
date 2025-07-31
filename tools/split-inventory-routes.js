#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Inventory.js Refactoring Tool');
console.log('=================================\n');

// Current working directory'yi kontrol et ve path'leri ayarla
function getProjectPaths() {
  const currentDir = process.cwd();
  const isInToolsDir = currentDir.endsWith('tools');
  
  if (isInToolsDir) {
    return {
      inventoryFile: '../backend/routes/inventory.js',
      backendRoutes: '../backend/routes/'
    };
  } else {
    return {
      inventoryFile: 'backend/routes/inventory.js',
      backendRoutes: 'backend/routes/'
    };
  }
}

const paths = getProjectPaths();
const INVENTORY_FILE = paths.inventoryFile;

if (!fs.existsSync(INVENTORY_FILE)) {
  console.log('❌ Inventory.js dosyası bulunamadı!');
  console.log(`   Aranan konum: ${INVENTORY_FILE}`);
  process.exit(1);
}

// Dosyayı oku ve analiz et
const content = fs.readFileSync(INVENTORY_FILE, 'utf8');
const lines = content.split('\n');

console.log(`📊 Mevcut inventory.js: ${lines.length} satır`);

// Route'ları kategorilere ayır
const routeCategories = {
  categories: {
    patterns: ['categories', 'categories/', 'category-templates', 'field-templates'],
    description: 'Kategori ve şablon yönetimi',
  },
  items: {
    patterns: ['items', 'items/', 'search', 'qr-codes', 'barcodes', 'item-details'],
    description: 'Envanter öğe yönetimi',
  },
  export: {
    patterns: ['export', 'excel', 'import', 'bulk', 'batch'],
    description: 'İçe/Dışa aktarma işlemleri',
  },
  machines: {
    patterns: ['machines', 'kalips', 'machine-items', 'kalip-items'],
    description: 'Makina ve kalıp entegrasyonu',
  },
};

// Route'ları analiz et ve kategorize et
function analyzeRoutes() {
  const routes = [];
  const routePattern = /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = routePattern.exec(content)) !== null) {
    const method = match[1];
    const path = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    routes.push({
      method: method.toUpperCase(),
      path,
      lineNumber,
      fullMatch: match[0],
    });
  }

  console.log(`🔍 Bulunan route sayısı: ${routes.length}\n`);

  // Route'ları kategorilere ata
  const categorizedRoutes = {};
  Object.keys(routeCategories).forEach(category => {
    categorizedRoutes[category] = [];
  });
  categorizedRoutes['uncategorized'] = [];

  routes.forEach(route => {
    let assigned = false;

    for (const [category, config] of Object.entries(routeCategories)) {
      if (config.patterns.some(pattern => route.path.includes(pattern))) {
        categorizedRoutes[category].push(route);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      categorizedRoutes['uncategorized'].push(route);
    }
  });

  // Sonuçları göster
  Object.entries(categorizedRoutes).forEach(([category, routes]) => {
    if (routes.length > 0) {
      const config = routeCategories[category] || { description: 'Kategorilendirilemeyen' };
      console.log(`📂 ${category.toUpperCase()} (${routes.length} route)`);
      console.log(`   📝 ${config.description}`);
      routes.forEach(route => {
        console.log(`   • ${route.method} ${route.path} (satır ${route.lineNumber})`);
      });
      console.log('');
    }
  });

  return categorizedRoutes;
}

// Dosyayı bölme işlemi
function splitFile(categorizedRoutes) {
  console.log('🔨 Dosya bölme işlemi başlıyor...\n');

  // Ana common import'ları ve export'ları tespit et
  const imports = [];
  const imports_section = content.match(/^(const|import).*$/gm) || [];
  imports_section.forEach(line => {
    if (line.includes('require') || line.includes('import')) {
      imports.push(line);
    }
  });

  // Router tanımını tespit et
  const routerDeclaration = content.match(/const\s+router\s*=\s*express\.Router\(\)/);

  // Her kategori için dosya oluştur
  Object.entries(categorizedRoutes).forEach(([category, routes]) => {
    if (routes.length === 0 || category === 'uncategorized') return;

    const fileName = path.join(paths.backendRoutes, `inventory-${category}.js`);
    const config = routeCategories[category];

    console.log(`📄 Oluşturuluyor: ${fileName} (${routes.length} route)`);

    // Dosya başlığı
    let fileContent = `// ${config.description}\n`;
    fileContent += `// Otomatik oluşturuldu: ${new Date().toISOString()}\n`;
    fileContent += `// Orijinal: inventory.js\n\n`;

    // Import'ları ekle
    imports.forEach(importLine => {
      fileContent += importLine + '\n';
    });

    fileContent += '\nconst router = express.Router();\n\n';

    // Route'ları ekle (basit versiyon - gerçek implementasyon daha kompleks olacak)
    routes.forEach(route => {
      fileContent += `// ${route.method} ${route.path}\n`;
      fileContent += `// TODO: Implement route from line ${route.lineNumber}\n`;
      fileContent += `router.${route.method.toLowerCase()}('${
        route.path
      }', async (req, res) => {\n`;
      fileContent += `  // Route implementation needed\n`;
      fileContent += `  res.status(501).json({ message: 'Not implemented yet' });\n`;
      fileContent += `});\n\n`;
    });

    fileContent += 'module.exports = router;\n';

    // Dizin oluştur (eğer yoksa)
    const dir = path.dirname(fileName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Dosyayı yaz
    fs.writeFileSync(fileName, fileContent);
    console.log(`   ✅ ${fileName} oluşturuldu`);
  });
}

// Yeni ana inventory.js dosyası oluştur
function createMainInventoryFile(categorizedRoutes) {
  console.log('\n📄 Ana inventory.js dosyası güncelleniyor...');

  let newContent = `// Inventory Management - Ana Router\n`;
  newContent += `// Refactored: ${new Date().toISOString()}\n\n`;

  // Import'lar
  newContent += `const express = require('express');\n`;
  newContent += `const router = express.Router();\n\n`;

  // Alt modülleri import et
  Object.keys(routeCategories).forEach(category => {
    if (categorizedRoutes[category] && categorizedRoutes[category].length > 0) {
      newContent += `const ${category}Routes = require('./inventory-${category}');\n`;
    }
  });

  newContent += "\n// Alt route'lari bagla\n";
  Object.keys(routeCategories).forEach(category => {
    if (categorizedRoutes[category] && categorizedRoutes[category].length > 0) {
      newContent += `router.use('/${category}', ${category}Routes);\n`;
    }
  });

  newContent += '\nmodule.exports = router;\n';

  // Backup oluştur
  const backupFile = INVENTORY_FILE + '.backup';
  fs.copyFileSync(INVENTORY_FILE, backupFile);
  console.log(`📦 Backup oluşturuldu: ${backupFile}`);

  // Yeni dosyayı yaz
  fs.writeFileSync(INVENTORY_FILE, newContent);
  console.log(`✅ Ana inventory.js güncellendi`);
}

// Refactoring planını oluştur
function createRefactoringPlan() {
  const plan = {
    timestamp: new Date().toISOString(),
    originalFile: INVENTORY_FILE,
    originalLines: lines.length,
    status: 'analysis_complete',
    plannedFiles: Object.keys(routeCategories).map(category => ({
      file: path.join(paths.backendRoutes, `inventory-${category}.js`),
      category,
      description: routeCategories[category].description,
    })),
    nextSteps: [
      '1. Route implementasyonlarini manuel olarak tasi',
      '2. Test et ve debug yap',
      "3. Middleware'leri kontrol et",
      "4. Import path'lerini guncelle",
    ],
  };

  fs.writeFileSync('inventory-refactor-plan.json', JSON.stringify(plan, null, 2));
  console.log('\n📋 Refactoring planı kaydedildi: inventory-refactor-plan.json');
}

// Ana işlem
async function main() {
  try {
    const categorizedRoutes = analyzeRoutes();

    console.log('🤔 Ne yapmak istiyorsunuz?');
    console.log('1. Sadece analiz raporu oluştur');
    console.log('2. Dosyaları böl (otomatik)');
    console.log('3. Plan oluştur (manuel implementasyon için)');

    // Bu demo'da plan oluşturalım
    createRefactoringPlan();

    console.log('\n🎯 Refactoring Önerileri:');
    console.log('========================');
    console.log('• inventory.js çok büyük (2166 satır)');
    console.log('• 4 ana kategoriye bölünebilir');
    console.log('• Her kategori kendi dosyasında yönetilebilir');
    console.log('• Maintenance daha kolay olur');
    console.log('• Team collaboration iyileşir');

    console.log('\n✅ Analiz tamamlandı!');
    console.log('📄 Detaylı plan: inventory-refactor-plan.json');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

main();
