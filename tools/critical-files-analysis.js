const fs = require("fs");
const path = require("path");

console.log("🔍 MMM Projesi - Kritik Dosya Analizi");
console.log("=====================================");

// Kritik büyük dosyalar (refactoring-report.json'dan)
const criticalFiles = [
  {
    path: "frontend/src/components/MyActivity/ScoreBreakdown.js",
    lines: 1519,
    category: "Frontend Component",
    priority: "KRITIK",
  },
  {
    path: "backend/services/myActivityHelpers.js",
    lines: 1205,
    category: "Backend Service",
    priority: "KRITIK",
  },
  {
    path: "backend/utils/myActivityFormatters.js",
    lines: 1145,
    category: "Backend Utility",
    priority: "KRITIK",
  },
  {
    path: "backend/routes/hr.js",
    lines: 1046,
    category: "Backend Route",
    priority: "YÜKSEK",
  },
  {
    path: "backend/controllers/myActivityController.js",
    lines: 993,
    category: "Backend Controller",
    priority: "YÜKSEK",
  },
  {
    path: "frontend/src/pages/BonusEvaluation.js",
    lines: 945,
    category: "Frontend Page",
    priority: "YÜKSEK",
  },
  {
    path: "backend/services/myActivityService.js",
    lines: 918,
    category: "Backend Service",
    priority: "YÜKSEK",
  },
  {
    path: "backend/routes/worktasks.js",
    lines: 895,
    category: "Backend Route",
    priority: "YÜKSEK",
  },
  {
    path: "frontend/src/components/Tasks/TaskDialog.js",
    lines: 871,
    category: "Frontend Component",
    priority: "ORTA",
  },
  {
    path: "frontend/src/services/api.js",
    lines: 835,
    category: "Frontend Service",
    priority: "ORTA",
  },
];

// Analiz fonksiyonları
function analyzeFile(filePath) {
  const fullPath = path.join("..", filePath);

  if (!fs.existsSync(fullPath)) {
    return { error: "Dosya bulunamadı" };
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");

  // Temel metrikler
  const analysis = {
    totalLines: lines.length,
    codeLines: lines.filter(
      (line) => line.trim() && !line.trim().startsWith("//")
    ).length,
    commentLines: lines.filter((line) => line.trim().startsWith("//")).length,
    emptyLines: lines.filter((line) => !line.trim()).length,
  };

  // JavaScript/React özel analiz
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) {
    analysis.functions = (
      content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []
    ).length;
    analysis.imports = (content.match(/import\s+/g) || []).length;
    analysis.exports = (content.match(/export\s+/g) || []).length;

    // React özel
    if (content.includes("React") || content.includes("useState")) {
      analysis.reactHooks = (content.match(/use\w+\(/g) || []).length;
      analysis.jsxElements = (content.match(/<\w+/g) || []).length;
      analysis.stateVariables = (content.match(/useState\(/g) || []).length;
      analysis.effects = (content.match(/useEffect\(/g) || []).length;
    }

    // Backend özel
    if (content.includes("require(") || content.includes("router.")) {
      analysis.routes = (
        content.match(/router\.(get|post|put|delete|patch)/g) || []
      ).length;
      analysis.middleware = (content.match(/\.\w+\(/g) || []).length;
      analysis.mongoQueries = (
        content.match(/\.(find|save|update|delete)/g) || []
      ).length;
    }
  }

  return analysis;
}

function generateRefactoringPlan(file, analysis) {
  const suggestions = [];

  // Dosya boyutu önerileri
  if (file.lines > 1500) {
    suggestions.push({
      type: "CRITICAL_SIZE",
      message: "Dosya çok büyük - acil refactoring gerekli",
      action: "Dosyayı 3-4 modüle böl",
    });
  } else if (file.lines > 1000) {
    suggestions.push({
      type: "LARGE_SIZE",
      message: "Dosya büyük - refactoring gerekli",
      action: "Dosyayı 2-3 modüle böl",
    });
  }

  // React component önerileri
  if (analysis.reactHooks && analysis.reactHooks > 10) {
    suggestions.push({
      type: "TOO_MANY_HOOKS",
      message: `${analysis.reactHooks} hook kullanımı çok fazla`,
      action: "Custom hook'lara böl",
    });
  }

  if (analysis.stateVariables && analysis.stateVariables > 8) {
    suggestions.push({
      type: "TOO_MANY_STATES",
      message: `${analysis.stateVariables} state değişkeni çok fazla`,
      action: "useReducer veya context kullan",
    });
  }

  if (analysis.jsxElements && analysis.jsxElements > 100) {
    suggestions.push({
      type: "COMPLEX_JSX",
      message: `${analysis.jsxElements} JSX elementi çok karmaşık`,
      action: "Alt componentlara böl",
    });
  }

  // Backend önerileri
  if (analysis.routes && analysis.routes > 15) {
    suggestions.push({
      type: "TOO_MANY_ROUTES",
      message: `${analysis.routes} route çok fazla`,
      action: "Route dosyalarını kategorilere böl",
    });
  }

  if (analysis.functions && analysis.functions > 20) {
    suggestions.push({
      type: "TOO_MANY_FUNCTIONS",
      message: `${analysis.functions} fonksiyon çok fazla`,
      action: "Utility dosyalarına böl",
    });
  }

  return suggestions;
}

// Analiz yap
console.log("\n🎯 En Kritik 10 Dosya Analizi:");
console.log("================================\n");

const analysisResults = [];

criticalFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.path}`);
  console.log(`   📏 Satır Sayısı: ${file.lines}`);
  console.log(`   🏷️ Kategori: ${file.category}`);
  console.log(`   🚨 Öncelik: ${file.priority}`);

  const analysis = analyzeFile(file.path);

  if (analysis.error) {
    console.log(`   ❌ Hata: ${analysis.error}`);
  } else {
    console.log(`   📊 Kod Satırı: ${analysis.codeLines}`);
    console.log(`   💬 Yorum Satırı: ${analysis.commentLines}`);
    console.log(`   🔧 Fonksiyon Sayısı: ${analysis.functions || 0}`);

    if (analysis.reactHooks) {
      console.log(`   ⚛️ React Hook: ${analysis.reactHooks}`);
      console.log(`   📱 State: ${analysis.stateVariables || 0}`);
      console.log(`   🔄 Effect: ${analysis.effects || 0}`);
    }

    if (analysis.routes) {
      console.log(`   🛣️ Route: ${analysis.routes}`);
      console.log(`   🔧 Middleware: ${analysis.middleware || 0}`);
    }

    const suggestions = generateRefactoringPlan(file, analysis);
    if (suggestions.length > 0) {
      console.log("   🎯 Öneriler:");
      suggestions.forEach((suggestion) => {
        console.log(`      • ${suggestion.message} → ${suggestion.action}`);
      });
    }

    analysisResults.push({
      file,
      analysis,
      suggestions,
    });
  }

  console.log("");
});

// Özet rapor
console.log("\n📋 REFACTORING ÖNCELİK RAPORU");
console.log("===============================");

const kritikDosyalar = analysisResults.filter(
  (r) => r.file.priority === "KRITIK"
);
const yuksekDosyalar = analysisResults.filter(
  (r) => r.file.priority === "YÜKSEK"
);

console.log(`🚨 Kritik (Acil): ${kritikDosyalar.length} dosya`);
console.log(`⚠️ Yüksek: ${yuksekDosyalar.length} dosya`);
console.log(`📊 Toplam analiz edilen: ${analysisResults.length} dosya`);

console.log("\n🎯 EN ACİL REFACTORING GEREKENLERİ:");
kritikDosyalar.forEach((result, index) => {
  console.log(`${index + 1}. ${result.file.path}`);
  console.log(`   💾 ${result.file.lines} satır`);
  console.log(`   🔧 ${result.suggestions.length} öneri`);
  result.suggestions.slice(0, 2).forEach((s) => {
    console.log(`      • ${s.action}`);
  });
  console.log("");
});

console.log("\n🚀 REFACTORING PLANI:");
console.log("======================");
console.log("1. ÖNCE: ScoreBreakdown.js (1519 satır) → 3 modül");
console.log("   - ScoreBreakdownMain.js (ana component)");
console.log("   - ScoreBreakdownCharts.js (grafik componentları)");
console.log("   - ScoreBreakdownHooks.js (custom hooks)");
console.log("");
console.log("2. SONRA: myActivityHelpers.js (1205 satır) → 4 modül");
console.log("   - bonusEvaluationHelpers.js");
console.log("   - kalipDegisimHelpers.js");
console.log("   - hrScoreHelpers.js");
console.log("   - activityFormatters.js");
console.log("");
console.log("3. SON: Diğer büyük dosyalar benzer strateji ile");

console.log("\n✅ Analiz tamamlandı!");
console.log("💡 Bu raporu takip ederek kod kalitesini artırabilirsiniz.");
