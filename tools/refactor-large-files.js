#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 MMM Proje Refactoring Aracı');
console.log('================================\n');

// Büyük dosyaları tespit et
const LARGE_FILE_THRESHOLD = 500; // 500 satırdan fazla
const largeFiles = [];

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    return {
      path: filePath,
      lines: lines.length,
      content: content,
      size: fs.statSync(filePath).size,
    };
  } catch (error) {
    return null;
  }
}

function findLargeFiles(dir, extensions = ['.js', '.jsx']) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      findLargeFiles(fullPath, extensions);
    } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
      const analysis = analyzeFile(fullPath);
      if (analysis && analysis.lines > LARGE_FILE_THRESHOLD) {
        largeFiles.push(analysis);
      }
    }
  }
}

// Backend ve Frontend dosyalarını analiz et
console.log('📊 Büyük dosyalar taranıyor...\n');

if (fs.existsSync('backend')) {
  findLargeFiles('backend');
}
if (fs.existsSync('frontend/src')) {
  findLargeFiles('frontend/src');
}

// Büyük dosyaları listele
largeFiles.sort((a, b) => b.lines - a.lines);

console.log(`🚨 ${LARGE_FILE_THRESHOLD}+ satır dosyalar:\n`);
largeFiles.forEach((file, index) => {
  const relativePath = file.path.replace(process.cwd(), '.');
  const sizeKB = (file.size / 1024).toFixed(1);
  console.log(`${index + 1}. ${relativePath}`);
  console.log(`   📏 ${file.lines} satır | 💾 ${sizeKB} KB`);
  console.log('');
});

// Refactoring önerileri
function generateRefactoringPlan(filePath, content) {
  const suggestions = [];
  const lines = content.split('\n');

  // Route dosyası analizi
  if (filePath.includes('/routes/')) {
    const routeMatches = content.match(/router\.(get|post|put|delete|patch)/g) || [];
    if (routeMatches.length > 10) {
      suggestions.push({
        type: 'split-routes',
        description: `${routeMatches.length} endpoint var. Modüllere böl`,
        priority: 'high',
        plan: 'Her endpoint kategorisi için ayrı dosya oluştur',
      });
    }
  }

  // React component analizi
  if (filePath.includes('/pages/') || filePath.includes('/components/')) {
    const functionMatches = content.match(/const \w+ = \(/g) || [];
    const useStateMatches = content.match(/useState\(/g) || [];

    if (useStateMatches.length > 10) {
      suggestions.push({
        type: 'split-state',
        description: `${useStateMatches.length} state var. Custom hook'lara böl`,
        priority: 'medium',
        plan: "İlgili state'leri custom hook'larda grupla",
      });
    }

    if (lines.length > 1000) {
      suggestions.push({
        type: 'split-component',
        description: "Component çok büyük. Alt component'lara böl",
        priority: 'high',
        plan: "Dialog'lar, formlar ve listeler için ayrı component'lar oluştur",
      });
    }
  }

  // Utility functions analizi
  const functionCount =
    (content.match(/function \w+/g) || []).length + (content.match(/const \w+ = \(/g) || []).length;

  if (functionCount > 15) {
    suggestions.push({
      type: 'split-utilities',
      description: `${functionCount} fonksiyon var. Utility dosyalarına böl`,
      priority: 'medium',
      plan: 'İlgili fonksiyonları utility modüllerinde grupla',
    });
  }

  return suggestions;
}

// Her büyük dosya için refactoring planı oluştur
console.log('🎯 Refactoring Önerileri:\n');
console.log('='.repeat(50));

largeFiles.slice(0, 10).forEach((file, index) => {
  const relativePath = file.path.replace(process.cwd(), '.');
  console.log(`\n${index + 1}. ${relativePath} (${file.lines} satır)`);
  console.log('-'.repeat(40));

  const suggestions = generateRefactoringPlan(file.path, file.content);

  if (suggestions.length === 0) {
    console.log('   ✅ Bu dosya için özel öneri yok');
  } else {
    suggestions.forEach((suggestion, i) => {
      const priority =
        suggestion.priority === 'high' ? '🚨' : suggestion.priority === 'medium' ? '⚠️' : 'ℹ️';
      console.log(`   ${priority} ${suggestion.description}`);
      console.log(`      💡 Plan: ${suggestion.plan}`);
    });
  }
});

// Automatic refactoring önerileri
console.log('\n\n🤖 Otomatik Refactoring Seçenekleri:');
console.log('='.repeat(50));

console.log(`
1. 📂 Route Splitting:
   - inventory.js → inventory-items.js, inventory-categories.js, inventory-export.js
   - tasks.js → tasks-crud.js, tasks-assignment.js, tasks-control.js
   
2. 🔧 Component Splitting:
   - WorkTasks.js → WorkTaskList.js, WorkTaskForm.js, WorkTaskDialog.js
   - HR.js → HRScoring.js, HRTemplates.js, HRStatistics.js
   
3. 🎣 Custom Hooks:
   - useInventoryManagement.js
   - useTaskManagement.js
   - useQualityControl.js
   
4. 🛠️ Utility Modules:
   - taskHelpers.js
   - inventoryHelpers.js
   - validationHelpers.js
`);

// Refactoring script'leri oluştur
function createRefactoringScripts() {
  const scripts = [
    {
      name: 'split-inventory-routes.js',
      description: 'inventory.js dosyasını modüllere böl',
      priority: 'high',
    },
    {
      name: 'split-worktasks-component.js',
      description: "WorkTasks.js component'ini böl",
      priority: 'high',
    },
    {
      name: 'extract-custom-hooks.js',
      description: "State yönetimi için custom hook'lar oluştur",
      priority: 'medium',
    },
  ];

  console.log("\n🚀 Kullanılabilir Refactoring Script'leri:");
  console.log('='.repeat(50));

  scripts.forEach((script, index) => {
    const priority = script.priority === 'high' ? '🚨' : '⚠️';
    console.log(`${index + 1}. ${priority} ${script.name}`);
    console.log(`   📝 ${script.description}`);
  });
}

createRefactoringScripts();

console.log(`\n✅ Analiz tamamlandı!`);
console.log(`📊 Toplam ${largeFiles.length} büyük dosya bulundu`);
console.log(
  `🎯 En kritik: ${largeFiles
    .slice(0, 3)
    .map(f => path.basename(f.path))
    .join(', ')}`
);

// Sonuçları dosyaya yaz
const report = {
  timestamp: new Date().toISOString(),
  threshold: LARGE_FILE_THRESHOLD,
  totalLargeFiles: largeFiles.length,
  files: largeFiles.map(f => ({
    path: f.path.replace(process.cwd(), '.'),
    lines: f.lines,
    sizeKB: Math.round(f.size / 1024),
  })),
};

fs.writeFileSync('refactoring-report.json', JSON.stringify(report, null, 2));
console.log(`\n📄 Detaylı rapor: refactoring-report.json`);
