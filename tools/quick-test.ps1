#!/usr/bin/env powershell
# MMM Checklist Araclari Test Scripti

Write-Host "🚀 MMM Checklist Tools Test" -ForegroundColor Green
Write-Host "============================"
Write-Host ""

# Node.js kontrolu
Write-Host "📋 Node.js versiyon:" -ForegroundColor Yellow
node --version

Write-Host ""
Write-Host "📋 NPM versiyon:" -ForegroundColor Yellow
npm --version

Write-Host ""
Write-Host "🔧 JavaScript araclari test ediliyor..." -ForegroundColor Yellow

# Visualize architecture test
Write-Host "  • visualize-architecture.js..." -ForegroundColor Gray
try {
    node visualize-architecture.js > test-output-1.txt 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Başarılı" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Hata" -ForegroundColor Red
    }
} catch {
    Write-Host "    ❌ Çalıştırılamadı" -ForegroundColor Red
}

# Refactor large files test
Write-Host "  • refactor-large-files.js..." -ForegroundColor Gray
try {
    node refactor-large-files.js > test-output-2.txt 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Başarılı" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Hata" -ForegroundColor Red
    }
} catch {
    Write-Host "    ❌ Çalıştırılamadı" -ForegroundColor Red
}

# Add smart comments test
Write-Host "  • add-smart-comments.js..." -ForegroundColor Gray
try {
    node add-smart-comments.js > test-output-3.txt 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Başarılı" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Hata" -ForegroundColor Red
    }
} catch {
    Write-Host "    ❌ Çalıştırılamadı" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Dosya durumu kontrolu..." -ForegroundColor Yellow

# Oluşturulan dosyaları kontrol et
$files = @("refactoring-report.json", "weekly-refactoring-plan.json", "inventory-refactor-plan.json")

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file mevcut" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file eksik" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Test tamamlandı!" -ForegroundColor Green
Write-Host "📄 Test çıktıları: test-output-*.txt dosyaları" -ForegroundColor Cyan 