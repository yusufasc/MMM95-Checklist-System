#!/usr/bin/env powershell
# MMM Checklist - Pre-commit Auto-Fix Script
# Bu script her commit öncesi otomatik olarak ESLint ve Prettier fix'lerini çalıştırır

Write-Host "🔧 Auto-Fix başlatılıyor..." -ForegroundColor Cyan

# Frontend Auto-Fix
Write-Host "📦 Frontend düzeltiliyor..." -ForegroundColor Yellow
Set-Location "frontend"

# ESLint auto-fix
Write-Host "  🔍 ESLint auto-fix..." -ForegroundColor Gray
npm run lint:fix

# Prettier format
Write-Host "  🎨 Prettier format..." -ForegroundColor Gray  
npm run format

# Backend Auto-Fix
Write-Host "📦 Backend düzeltiliyor..." -ForegroundColor Yellow
Set-Location "../backend"

# ESLint auto-fix
Write-Host "  🔍 ESLint auto-fix..." -ForegroundColor Gray
npm run lint:fix

# Prettier format
Write-Host "  🎨 Prettier format..." -ForegroundColor Gray
npm run format

# Ana dizine dön
Set-Location ".."

# Son durum kontrolü
Write-Host "✅ Auto-Fix tamamlandı!" -ForegroundColor Green
Write-Host "💡 Değişen dosyalar git add ile eklenecek..." -ForegroundColor Blue

# Git add changed files
git add . 