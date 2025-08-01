#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏗️ MMM Refactoring Dashboard');
console.log('============================\n');

// Refactoring raporu oku
let refactoringReport = {};
let inventoryPlan = {};
let worktasksPlan = {};

try {
  if (fs.existsSync('refactoring-report.json')) {
    refactoringReport = JSON.parse(fs.readFileSync('refactoring-report.json', 'utf8'));
  }
  if (fs.existsSync('inventory-refactor-plan.json')) {
    inventoryPlan = JSON.parse(fs.readFileSync('inventory-refactor-plan.json', 'utf8'));
  }
  if (fs.existsSync('worktasks-refactor-plan.json')) {
    worktasksPlan = JSON.parse(fs.readFileSync('worktasks-refactor-plan.json', 'utf8'));
  }
} catch (error) {
  console.log('⚠️ Rapor dosyaları okunamadı, varsayılan analiz yapılacak');
}

// Büyük dosyaları yeniden tara
function getCurrentLargeFiles() {
  const largeFiles = [];
  const THRESHOLD = 500;

  function scanDirectory(dir, extensions = ['.js', '.jsx']) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        scanDirectory(fullPath, extensions);
      } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lineCount = content.split('\n').length;

          if (lineCount > THRESHOLD) {
            largeFiles.push({
              path: fullPath.replace(process.cwd(), '.'),
              lines: lineCount,
              size: fs.statSync(fullPath).size,
            });
          }
        } catch (error) {
          // Dosya okunamadı, atla
        }
      }
    }
  }

  scanDirectory('backend');
  scanDirectory('frontend/src');

  return largeFiles.sort((a, b) => b.lines - a.lines);
}

// Refactoring durumunu kontrol et
function checkRefactoringStatus() {
  const status = {
    inventoryRoutes: {
      original: 'backend/routes/inventory.js',
      completed: false,
      newFiles: [
        'backend/routes/inventory-categories.js',
        'backend/routes/inventory-items.js',
        'backend/routes/inventory-export.js',
        'backend/routes/inventory-machines.js',
      ],
    },
    workTasksComponents: {
      original: 'frontend/src/pages/WorkTasks.js',
      completed: false,
      newFiles: [
        'frontend/src/components/WorkTask/WorkTaskList.js',
        'frontend/src/components/WorkTask/WorkTaskForm.js',
        'frontend/src/components/WorkTask/WorkTaskFilters.js',
        'frontend/src/components/WorkTask/useWorkTaskUI.js',
        'frontend/src/components/WorkTask/useWorkTaskData.js',
      ],
    },
  };

  // Durum kontrolü
  status.inventoryRoutes.completed = status.inventoryRoutes.newFiles.some(file =>
    fs.existsSync(file)
  );

  status.workTasksComponents.completed = status.workTasksComponents.newFiles.every(file =>
    fs.existsSync(file)
  );

  return status;
}

// Refactoring önceliklerini hesapla
function calculatePriorities(largeFiles) {
  return largeFiles.map(file => {
    let priority = 'low';
    let reasons = [];

    // Dosya boyutuna göre öncelik
    if (file.lines > 2000) {
      priority = 'critical';
      reasons.push(`${file.lines} satır - kritik seviye`);
    } else if (file.lines > 1500) {
      priority = 'high';
      reasons.push(`${file.lines} satır - yüksek öncelik`);
    } else if (file.lines > 1000) {
      priority = 'medium';
      reasons.push(`${file.lines} satır - orta öncelik`);
    }

    // Dosya türüne göre öncelik
    if (file.path.includes('/routes/')) {
      reasons.push('Backend route - bakım zorluğu');
    } else if (file.path.includes('/pages/')) {
      reasons.push('Ana sayfa component - test zorluğu');
    } else if (file.path.includes('/components/')) {
      reasons.push('UI component - yeniden kullanım zorluğu');
    }

    return {
      ...file,
      priority,
      reasons,
    };
  });
}

// Ana dashboard görüntüsü
function displayDashboard() {
  const largeFiles = getCurrentLargeFiles();
  const refactoringStatus = checkRefactoringStatus();
  const prioritizedFiles = calculatePriorities(largeFiles);

  console.log('📊 MEVCUT DURUM');
  console.log('==============');
  console.log(`📁 Toplam büyük dosya: ${largeFiles.length}`);
  console.log(`📏 En büyük dosya: ${largeFiles[0]?.path} (${largeFiles[0]?.lines} satır)`);
  console.log(
    `💾 Toplam büyük dosya boyutu: ${Math.round(
      largeFiles.reduce((sum, f) => sum + f.size, 0) / 1024
    )} KB`
  );

  console.log('\n🎯 ÖNCELİK SIRALAMASI');
  console.log('===================');

  prioritizedFiles.slice(0, 10).forEach((file, index) => {
    const priorityIcon = {
      critical: '🚨',
      high: '⚠️',
      medium: '📋',
      low: 'ℹ️',
    }[file.priority];

    console.log(`${index + 1}. ${priorityIcon} ${file.path}`);
    console.log(`   📏 ${file.lines} satır | 💾 ${Math.round(file.size / 1024)} KB`);
    file.reasons.forEach(reason => {
      console.log(`   • ${reason}`);
    });
    console.log('');
  });

  console.log("\n✅ TAMAMLANAN REFACTORING'LER");
  console.log('=============================');

  if (refactoringStatus.workTasksComponents.completed) {
    console.log("✅ WorkTasks.js → Modüler component'lar");
    console.log('   📁 5 yeni dosya oluşturuldu');
    console.log('   🎣 2 custom hook hazır');
  } else {
    console.log('⏳ WorkTasks.js → İlerleme: %50 (template dosyalar hazır)');
  }

  if (refactoringStatus.inventoryRoutes.completed) {
    console.log("✅ inventory.js → Modüler route'lar");
    console.log('   📁 4 yeni route dosyası');
  } else {
    console.log('📋 inventory.js → Plan hazır (manuel implement gerekli)');
  }

  console.log('\n🚀 ÖNERİLEN AKSİYONLAR');
  console.log('=====================');

  const criticalFiles = prioritizedFiles.filter(f => f.priority === 'critical');
  const highFiles = prioritizedFiles.filter(f => f.priority === 'high');

  if (criticalFiles.length > 0) {
    console.log('🚨 KRİTİK ÖNCELIK:');
    criticalFiles.forEach(file => {
      console.log(`   • ${path.basename(file.path)} - Acil refactoring gerekli`);
    });
  }

  if (highFiles.length > 0) {
    console.log('\n⚠️ YÜKSEK ÖNCELIK:');
    highFiles.forEach(file => {
      console.log(`   • ${path.basename(file.path)} - Refactoring planla`);
    });
  }

  console.log('\n📋 MEVCUT ARAÇLAR:');
  console.log('=================');
  console.log('• node refactor-large-files.js     → Genel analiz');
  console.log('• node split-inventory-routes.js   → inventory.js böl');
  console.log('• node split-worktasks-component.js → WorkTasks.js böl');
  console.log('• node refactoring-dashboard.js     → Bu dashboard');

  return {
    largeFiles: largeFiles.length,
    criticalFiles: criticalFiles.length,
    highPriorityFiles: highFiles.length,
    completedRefactorings: Object.values(refactoringStatus).filter(s => s.completed).length,
  };
}

// Haftalık refactoring planı oluştur
function generateWeeklyPlan(prioritizedFiles) {
  const plan = {
    week1: {
      title: 'Kritik Dosyalar',
      files: prioritizedFiles.filter(f => f.priority === 'critical').slice(0, 2),
      estimatedHours: 12,
    },
    week2: {
      title: 'Yüksek Öncelik',
      files: prioritizedFiles.filter(f => f.priority === 'high').slice(0, 3),
      estimatedHours: 10,
    },
    week3: {
      title: 'Orta Öncelik',
      files: prioritizedFiles.filter(f => f.priority === 'medium').slice(0, 4),
      estimatedHours: 8,
    },
    week4: {
      title: 'Test ve Optimizasyon',
      files: [],
      estimatedHours: 6,
      tasks: [
        'Refactor edilen dosyaları test et',
        'ESLint kurallarını kontrol et',
        'Performance ölçümü',
      ],
    },
  };

  console.log('\n📅 4 HAFTALIK REFACTORING PLANI');
  console.log('==============================');

  Object.entries(plan).forEach(([week, data]) => {
    console.log(`\n📅 ${week.toUpperCase()}: ${data.title}`);
    console.log(`⏱️ Tahmini süre: ${data.estimatedHours} saat`);

    if (data.files.length > 0) {
      data.files.forEach(file => {
        console.log(`   📄 ${path.basename(file.path)} (${file.lines} satır)`);
      });
    }

    if (data.tasks) {
      data.tasks.forEach(task => {
        console.log(`   ✅ ${task}`);
      });
    }
  });

  fs.writeFileSync('weekly-refactoring-plan.json', JSON.stringify(plan, null, 2));
  console.log('\n📄 Haftalık plan kaydedildi: weekly-refactoring-plan.json');
}

// Ana işlem
function main() {
  try {
    const summary = displayDashboard();

    if (summary.largeFiles > 0) {
      const largeFiles = getCurrentLargeFiles();
      const prioritizedFiles = calculatePriorities(largeFiles);
      generateWeeklyPlan(prioritizedFiles);
    }

    console.log('\n📈 ÖZET');
    console.log('=======');
    console.log(`📁 Büyük dosya sayısı: ${summary.largeFiles}`);
    console.log(`🚨 Kritik dosya sayısı: ${summary.criticalFiles}`);
    console.log(`⚠️ Yüksek öncelik dosya sayısı: ${summary.highPriorityFiles}`);
    console.log(`✅ Tamamlanan refactoring: ${summary.completedRefactorings}`);

    const progressPercent =
      summary.largeFiles > 0
        ? Math.round((summary.completedRefactorings / summary.largeFiles) * 100)
        : 100;
    console.log(`📊 Genel ilerleme: %${progressPercent}`);

    console.log('\n🎯 Sonraki adım:');
    if (summary.criticalFiles > 0) {
      console.log('🚨 Kritik dosyaları acil olarak refactor et!');
    } else if (summary.highPriorityFiles > 0) {
      console.log('⚠️ Yüksek öncelikli dosyaları planla');
    } else {
      console.log('✅ Harika! Büyük dosya sorunu yok');
    }
  } catch (error) {
    console.error('❌ Dashboard hatası:', error.message);
  }
}

main();
