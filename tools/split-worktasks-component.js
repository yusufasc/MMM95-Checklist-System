#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 WorkTasks.js Component Refactoring Tool');
console.log('==========================================\n');

// Current working directory'yi kontrol et ve path'leri ayarla
function getProjectPaths() {
  const currentDir = process.cwd();
  const isInToolsDir = currentDir.endsWith('tools');
  
  if (isInToolsDir) {
    return {
      workTasksFile: '../frontend/src/pages/WorkTasks.js',
      componentOutputDir: '../frontend/src/components/WorkTask'
    };
  } else {
    return {
      workTasksFile: 'frontend/src/pages/WorkTasks.js',
      componentOutputDir: 'frontend/src/components/WorkTask'
    };
  }
}

const paths = getProjectPaths();
const WORKTASKS_FILE = paths.workTasksFile;

if (!fs.existsSync(WORKTASKS_FILE)) {
  console.log('❌ WorkTasks.js dosyası bulunamadı!');
  process.exit(1);
}

// Dosyayı oku ve analiz et
const content = fs.readFileSync(WORKTASKS_FILE, 'utf8');
const lines = content.split('\n');

console.log(`📊 Mevcut WorkTasks.js: ${lines.length} satır`);

// Component'i bölme kategorileri
const componentCategories = {
  WorkTaskList: {
    patterns: ['TaskCard', 'Card', 'Grid', 'Typography', 'map(', 'filter('],
    description: 'Görev listesi ve kartları',
    startPattern: 'return (',
    endPattern: '</Grid>',
  },
  WorkTaskForm: {
    patterns: ['Dialog', 'TextField', 'Select', 'Button', 'onSubmit', 'handleSave'],
    description: 'Görev ekleme/düzenleme formu',
    startPattern: '<Dialog',
    endPattern: '</Dialog>',
  },
  WorkTaskFilters: {
    patterns: ['Autocomplete', 'DatePicker', 'FormControl', 'InputLabel', 'handleFilter'],
    description: 'Filtreleme ve arama bileşenleri',
    startPattern: '<Box sx={{',
    endPattern: '</Box>',
  },
  WorkTaskHooks: {
    patterns: ['useState', 'useEffect', 'useCallback', 'useMemo'],
    description: 'State yönetimi ve hooks',
    isHook: true,
  },
};

// State'leri analiz et
function analyzeStates() {
  const states = [];
  const statePattern = /const \[(\w+), set\w+\] = useState\(([^)]*)\);/g;
  let match;

  while ((match = statePattern.exec(content)) !== null) {
    const stateName = match[1];
    const initialValue = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    states.push({
      name: stateName,
      initialValue: initialValue,
      lineNumber: lineNumber,
      fullMatch: match[0],
    });
  }

  console.log(`🔍 Bulunan state sayısı: ${states.length}\n`);

  // State'leri kategorize et
  const categorizedStates = {
    ui: [],
    data: [],
    form: [],
    filter: [],
  };

  states.forEach(state => {
    if (
      state.name.includes('open') ||
      state.name.includes('show') ||
      state.name.includes('loading')
    ) {
      categorizedStates.ui.push(state);
    } else if (
      state.name.includes('filter') ||
      state.name.includes('search') ||
      state.name.includes('selected')
    ) {
      categorizedStates.filter.push(state);
    } else if (
      state.name.includes('form') ||
      state.name.includes('edit') ||
      state.name.includes('new')
    ) {
      categorizedStates.form.push(state);
    } else {
      categorizedStates.data.push(state);
    }
  });

  // Sonuçları göster
  Object.entries(categorizedStates).forEach(([category, states]) => {
    if (states.length > 0) {
      console.log(`📊 ${category.toUpperCase()} States (${states.length} adet):`);
      states.forEach(state => {
        console.log(`   • ${state.name} (satır ${state.lineNumber})`);
      });
      console.log('');
    }
  });

  return categorizedStates;
}

// Fonksiyonları analiz et
function analyzeFunctions() {
  const functions = [];
  const functionPattern = /const (\w+) = (?:async )?\([^)]*\) => \{/g;
  let match;

  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    functions.push({
      name: functionName,
      lineNumber: lineNumber,
      fullMatch: match[0],
    });
  }

  console.log(`🔧 Bulunan fonksiyon sayısı: ${functions.length}\n`);

  // Fonksiyonları kategorize et
  const categorizedFunctions = {
    api: [],
    ui: [],
    validation: [],
    util: [],
  };

  functions.forEach(func => {
    if (
      func.name.includes('load') ||
      func.name.includes('fetch') ||
      func.name.includes('save') ||
      func.name.includes('delete')
    ) {
      categorizedFunctions.api.push(func);
    } else if (
      func.name.includes('handle') ||
      func.name.includes('open') ||
      func.name.includes('close')
    ) {
      categorizedFunctions.ui.push(func);
    } else if (func.name.includes('validate') || func.name.includes('check')) {
      categorizedFunctions.validation.push(func);
    } else {
      categorizedFunctions.util.push(func);
    }
  });

  // Sonuçları göster
  Object.entries(categorizedFunctions).forEach(([category, functions]) => {
    if (functions.length > 0) {
      console.log(`⚙️ ${category.toUpperCase()} Functions (${functions.length} adet):`);
      functions.forEach(func => {
        console.log(`   • ${func.name} (satır ${func.lineNumber})`);
      });
      console.log('');
    }
  });

  return categorizedFunctions;
}

// Custom hook önerileri oluştur
function generateCustomHooks(categorizedStates, categorizedFunctions) {
  const hooks = [];

  // UI state'leri için hook
  if (categorizedStates.ui.length > 3) {
    hooks.push({
      name: 'useWorkTaskUI',
      description: 'Dialog ve UI state yönetimi',
      states: categorizedStates.ui,
      functions: categorizedFunctions.ui.filter(
        f => f.name.includes('open') || f.name.includes('close') || f.name.includes('toggle')
      ),
      priority: 'medium',
    });
  }

  // Data management için hook
  if (categorizedStates.data.length > 2) {
    hooks.push({
      name: 'useWorkTaskData',
      description: 'Veri yükleme ve yönetimi',
      states: categorizedStates.data,
      functions: categorizedFunctions.api,
      priority: 'high',
    });
  }

  // Filter için hook
  if (categorizedStates.filter.length > 2) {
    hooks.push({
      name: 'useWorkTaskFilters',
      description: 'Filtreleme ve arama',
      states: categorizedStates.filter,
      functions: categorizedFunctions.util.filter(
        f => f.name.includes('filter') || f.name.includes('search')
      ),
      priority: 'medium',
    });
  }

  return hooks;
}

// Component dosyaları oluştur
function createComponentFiles(hooks) {
  const outputDir = paths.componentOutputDir;

  // Dizin oluştur
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Dizin oluşturuldu: ${outputDir}`);
  }

  // Hook dosyaları oluştur
  hooks.forEach(hook => {
    const fileName = path.join(outputDir, `${hook.name}.js`);

    let fileContent = `// ${hook.description}\n`;
    fileContent += `// Otomatik oluşturuldu: ${new Date().toISOString()}\n`;
    fileContent += `// Orijinal: WorkTasks.js\n\n`;

    fileContent += `import { useState, useEffect, useCallback } from 'react';\n`;
    fileContent += `import { apiService } from '../../services/api';\n\n`;

    fileContent += `export const ${hook.name} = () => {\n`;

    // State'leri ekle
    hook.states.forEach(state => {
      fileContent += `  const [${state.name}, set${
        state.name.charAt(0).toUpperCase() + state.name.slice(1)
      }] = useState(${state.initialValue});\n`;
    });

    fileContent += '\n';

    // Fonksiyonları ekle (placeholder)
    hook.functions.forEach(func => {
      fileContent += `  const ${func.name} = useCallback(() => {\n`;
      fileContent += `    // TODO: Implement ${func.name}\n`;
      fileContent += `    console.log('${func.name} called');\n`;
      fileContent += `  }, []);\n\n`;
    });

    // Return statement
    fileContent += `  return {\n`;
    hook.states.forEach(state => {
      fileContent += `    ${state.name},\n`;
      fileContent += `    set${state.name.charAt(0).toUpperCase() + state.name.slice(1)},\n`;
    });
    hook.functions.forEach(func => {
      fileContent += `    ${func.name},\n`;
    });
    fileContent += `  };\n`;
    fileContent += `};\n`;

    fs.writeFileSync(fileName, fileContent);
    console.log(`📄 Hook oluşturuldu: ${fileName}`);
  });

  // Component dosyaları oluştur
  const components = [
    {
      name: 'WorkTaskList',
      description: 'Görev listesi ve kartları',
    },
    {
      name: 'WorkTaskForm',
      description: 'Görev ekleme/düzenleme formu',
    },
    {
      name: 'WorkTaskFilters',
      description: 'Filtreleme ve arama bileşenleri',
    },
  ];

  components.forEach(comp => {
    const fileName = path.join(outputDir, `${comp.name}.js`);

    let fileContent = `// ${comp.description}\n`;
    fileContent += `// Otomatik oluşturuldu: ${new Date().toISOString()}\n`;
    fileContent += `// Orijinal: WorkTasks.js\n\n`;

    fileContent += `import React from 'react';\n`;
    fileContent += `import {\n`;
    fileContent += `  Box,\n`;
    fileContent += `  Card,\n`;
    fileContent += `  CardContent,\n`;
    fileContent += `  Typography,\n`;
    fileContent += `  Button\n`;
    fileContent += `} from '@mui/material';\n\n`;

    fileContent += `const ${comp.name} = ({ ...props }) => {\n`;
    fileContent += `  return (\n`;
    fileContent += `    <Box>\n`;
    fileContent += `      <Typography variant="h6">${comp.description}</Typography>\n`;
    fileContent += `      <Typography variant="body2" color="text.secondary">\n`;
    fileContent += `        TODO: ${comp.name} component'ini WorkTasks.js'den taşı\n`;
    fileContent += `      </Typography>\n`;
    fileContent += `    </Box>\n`;
    fileContent += `  );\n`;
    fileContent += `};\n\n`;

    fileContent += `export default ${comp.name};\n`;

    fs.writeFileSync(fileName, fileContent);
    console.log(`📄 Component oluşturuldu: ${fileName}`);
  });
}

// Refactoring planını oluştur
function createRefactoringPlan(hooks) {
  const plan = {
    timestamp: new Date().toISOString(),
    originalFile: WORKTASKS_FILE,
    originalLines: lines.length,
    status: 'analysis_complete',
    customHooks: hooks.map(hook => ({
      name: hook.name,
      description: hook.description,
      priority: hook.priority,
      stateCount: hook.states.length,
      functionCount: hook.functions.length,
    })),
    plannedComponents: ['WorkTaskList.js', 'WorkTaskForm.js', 'WorkTaskFilters.js'],
    nextSteps: [
      "1. Custom hook'lari WorkTasks.js'e import et",
      "2. Component'lari WorkTasks.js'den ayir",
      "3. State'leri custom hook'lara tasi",
      "4. Fonksiyonlari ilgili hook'lara tasi",
      '5. Test et ve debug yap',
    ],
  };

  fs.writeFileSync('worktasks-refactor-plan.json', JSON.stringify(plan, null, 2));
  console.log('\n📋 Refactoring planı kaydedildi: worktasks-refactor-plan.json');

  return plan;
}

// Ana işlem
async function main() {
  try {
    console.log('🔍 WorkTasks.js analiz ediliyor...\n');

    const categorizedStates = analyzeStates();
    const categorizedFunctions = analyzeFunctions();
    const hooks = generateCustomHooks(categorizedStates, categorizedFunctions);

    console.log('🎣 Önerilen Custom Hooks:');
    console.log('========================');
    hooks.forEach((hook, index) => {
      const priority = hook.priority === 'high' ? '🚨' : '⚠️';
      console.log(`${index + 1}. ${priority} ${hook.name}`);
      console.log(`   📝 ${hook.description}`);
      console.log(`   📊 ${hook.states.length} state, ${hook.functions.length} fonksiyon`);
      console.log('');
    });

    // Dosyaları oluştur
    console.log('📁 Component dosyaları oluşturuluyor...\n');
    createComponentFiles(hooks);

    const plan = createRefactoringPlan(hooks);

    console.log('\n🎯 Refactoring Önerileri:');
    console.log('========================');
    console.log('• WorkTasks.js çok büyük (1770 satır)');
    console.log(`• ${hooks.length} custom hook oluşturulabilir`);
    console.log("• 3 ana component'e bölünebilir");
    console.log('• State yönetimi daha modüler olur');
    console.log('• Kodun test edilebilirliği artar');

    console.log('\n✅ Analiz tamamlandı!');
    console.log('📄 Detaylı plan: worktasks-refactor-plan.json');
    console.log('📁 Component dosyaları: frontend/src/components/WorkTask/');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

main();
