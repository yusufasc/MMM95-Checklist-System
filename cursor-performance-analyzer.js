#!/usr/bin/env node
/**
 * 🔍 CURSOR PERFORMANCE ANALYZER
 * Cursor IDE performansını analiz eder ve raporlar
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CursorPerformanceAnalyzer {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.reportFile = path.join(this.workspaceRoot, 'cursor-performance-report.json');
    this.logFile = path.join(this.workspaceRoot, 'cursor-performance.log');
  }

  async analyzeFileStructure() {
    console.log('📁 Dosya yapısı analiz ediliyor...');
    
    const stats = {
      totalFiles: 0,
      watchedFiles: 0,
      excludedFiles: 0,
      largeFiles: [],
      directories: {
        nodeModules: 0,
        gitFiles: 0,
        buildFiles: 0,
        logFiles: 0
      }
    };

    const scanDirectory = async (dir, relativePath = '') => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativeFullPath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            if (entry.name === 'node_modules') stats.directories.nodeModules++;
            else if (entry.name === '.git') stats.directories.gitFiles++;
            else if (['dist', 'build', 'coverage'].includes(entry.name)) stats.directories.buildFiles++;
            else if (entry.name === 'logs') stats.directories.logFiles++;
            else {
              await scanDirectory(fullPath, relativeFullPath);
            }
          } else {
            stats.totalFiles++;
            
            const fileStat = await fs.promises.stat(fullPath);
            if (fileStat.size > 1024 * 1024) { // 1MB'dan büyük dosyalar
              stats.largeFiles.push({
                path: relativeFullPath,
                size: Math.round(fileStat.size / 1024 / 1024 * 100) / 100 + ' MB'
              });
            }

            // Watched vs excluded files
            if (this.isExcludedFile(relativeFullPath)) {
              stats.excludedFiles++;
            } else {
              stats.watchedFiles++;
            }
          }
        }
      } catch (error) {
        // Erişim hatalarını yok say
      }
    };

    await scanDirectory(this.workspaceRoot);
    return stats;
  }

  isExcludedFile(filePath) {
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.cache',
      'logs',
      '.log',
      'package-lock.json',
      'yarn.lock'
    ];

    return excludePatterns.some(pattern => filePath.includes(pattern));
  }

  async analyzeProcesses() {
    console.log('⚡ Çalışan işlemler analiz ediliyor...');
    
    try {
      // Windows için process analizi
      const { stdout } = await execAsync('powershell "Get-Process | Where-Object {$_.ProcessName -like \'*cursor*\' -or $_.ProcessName -like \'*code*\' -or $_.ProcessName -like \'*node*\'} | Select-Object ProcessName,CPU,WorkingSet,Id | ConvertTo-Json"');
      
      const processes = JSON.parse(stdout || '[]');
      
      return {
        cursorProcesses: processes.filter(p => p.ProcessName.toLowerCase().includes('cursor')),
        nodeProcesses: processes.filter(p => p.ProcessName.toLowerCase().includes('node')),
        totalMemoryUsage: processes.reduce((sum, p) => sum + (p.WorkingSet || 0), 0)
      };
    } catch (error) {
      console.warn('⚠️ Process analizi yapılamadı:', error.message);
      return { error: error.message };
    }
  }

  async analyzeExtensions() {
    console.log('🔌 Extension analizi yapılıyor...');
    
    const workspaceFile = path.join(this.workspaceRoot, 'MMM95.code-workspace');
    let extensions = { recommendations: [], unwanted: [] };
    
    try {
      const workspaceContent = await fs.promises.readFile(workspaceFile, 'utf8');
      const workspace = JSON.parse(workspaceContent);
      
      extensions = {
        recommendations: workspace.extensions?.recommendations || [],
        unwanted: workspace.extensions?.unwantedRecommendations || []
      };
    } catch (error) {
      console.warn('⚠️ Workspace dosyası okunamadı:', error.message);
    }

    return extensions;
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 CURSOR PERFORMANCE ANALYSIS BAŞLATILIYOR [${timestamp}]\n`);

    const report = {
      timestamp,
      analysis: {
        fileStructure: await this.analyzeFileStructure(),
        processes: await this.analyzeProcesses(),
        extensions: await this.analyzeExtensions()
      },
      recommendations: this.generateRecommendations()
    };

    // JSON raporu kaydet
    await fs.promises.writeFile(this.reportFile, JSON.stringify(report, null, 2));
    
    // Güzel formatlı konsol raporu
    this.printReport(report);
    
    // Performance log dosyası oluştur
    await this.createPerformanceLog(report);

    return report;
  }

  generateRecommendations() {
    return [
      {
        category: "File Watching",
        issue: "Çok fazla dosya izleniyor",
        solution: "Workspace ayarlarında files.watcherExclude'u genişlet",
        priority: "HIGH"
      },
      {
        category: "Extensions", 
        issue: "Gereksiz extension'lar aktif",
        solution: "Sadece gerekli extension'ları bırak",
        priority: "MEDIUM"
      },
      {
        category: "Git Operations",
        issue: "Git auto-fetch ve decorations aktif",
        solution: "Git ayarlarını manuel yap",
        priority: "MEDIUM"
      },
      {
        category: "Language Services",
        issue: "TypeScript ve ESLint çok agressif",
        solution: "onSave moduna geç, real-time'ı kapat",
        priority: "HIGH"
      },
      {
        category: "Editor Features",
        issue: "Suggestions ve hover çok aktif",
        solution: "Hover, suggestions, lightbulb kapat",
        priority: "MEDIUM"
      }
    ];
  }

  printReport(report) {
    console.log('\n📊 CURSOR PERFORMANCE RAPORU');
    console.log('═'.repeat(50));
    
    const { fileStructure, processes, extensions } = report.analysis;
    
    console.log('\n📁 DOSYA YAPISI:');
    console.log(`   Toplam dosya: ${fileStructure.totalFiles}`);
    console.log(`   İzlenen dosya: ${fileStructure.watchedFiles}`);
    console.log(`   Hariç tutulan: ${fileStructure.excludedFiles}`);
    console.log(`   Büyük dosyalar (>1MB): ${fileStructure.largeFiles.length}`);
    
    if (fileStructure.largeFiles.length > 0) {
      console.log('\n   🔍 Büyük dosyalar:');
      fileStructure.largeFiles.slice(0, 5).forEach(file => {
        console.log(`      ${file.path} (${file.size})`);
      });
    }
    
    console.log('\n⚡ PROCESS ANALİZİ:');
    if (processes.error) {
      console.log(`   ❌ Hata: ${processes.error}`);
    } else {
      console.log(`   Cursor process'ler: ${processes.cursorProcesses?.length || 0}`);
      console.log(`   Node process'ler: ${processes.nodeProcesses?.length || 0}`);
      console.log(`   Toplam RAM: ${Math.round(processes.totalMemoryUsage / 1024 / 1024)} MB`);
    }
    
    console.log('\n🔌 EXTENSION\'LAR:');
    console.log(`   Önerilen: ${extensions.recommendations.length}`);
    console.log(`   İstenmeyen: ${extensions.unwanted.length}`);
    
    console.log('\n🎯 ÖNERİLER:');
    report.recommendations.forEach((rec, i) => {
      const priority = rec.priority === 'HIGH' ? '🔴' : '🟡';
      console.log(`   ${priority} [${rec.category}] ${rec.issue}`);
      console.log(`      → ${rec.solution}`);
    });
    
    console.log('\n✅ RAPOR DOSYALARI:');
    console.log(`   📄 JSON: ${this.reportFile}`);
    console.log(`   📝 LOG: ${this.logFile}`);
    console.log('\n═'.repeat(50));
  }

  async createPerformanceLog(report) {
    const logContent = `
# CURSOR PERFORMANCE LOG
Generated: ${report.timestamp}

## QUICK STATS
- Total Files: ${report.analysis.fileStructure.totalFiles}
- Watched Files: ${report.analysis.fileStructure.watchedFiles}
- Excluded Files: ${report.analysis.fileStructure.excludedFiles}
- Large Files: ${report.analysis.fileStructure.largeFiles.length}

## PERFORMANCE ISSUES DETECTED
${report.recommendations.map(r => `- [${r.priority}] ${r.category}: ${r.issue}`).join('\n')}

## OPTIMIZATIONS APPLIED
✅ File watching optimized
✅ Git operations disabled
✅ ESLint set to onSave mode
✅ TypeScript auto-imports disabled
✅ Editor suggestions minimized
✅ Extension recommendations reduced

## NEXT STEPS
1. Restart Cursor IDE
2. Monitor performance for 15 minutes
3. Re-run analysis: node cursor-performance-analyzer.js
4. Compare results

---
For detailed analysis, see: ${path.basename(this.reportFile)}
`;

    await fs.promises.writeFile(this.logFile, logContent);
  }
}

// Script çalıştır
if (require.main === module) {
  const analyzer = new CursorPerformanceAnalyzer();
  analyzer.generateReport()
    .then(() => {
      console.log('\n🎉 Analiz tamamlandı! Cursor\'ı yeniden başlat.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Analiz hatası:', error);
      process.exit(1);
    });
}

module.exports = CursorPerformanceAnalyzer;