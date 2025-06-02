#!/usr/bin/env powershell
# MMM Checklist - Auto-Fix Script
# Kullanım: .\auto-fix.ps1

Write-Host "🚀 MMM Checklist Auto-Fix" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor White

# Frontend Auto-Fix
Write-Host ""
Write-Host "📦 Frontend Auto-Fix..." -ForegroundColor Yellow
Set-Location "frontend"

Write-Host "  🔍 ESLint fixing..." -ForegroundColor Gray
npm run lint:fix

Write-Host "  🎨 Prettier formatting..." -ForegroundColor Gray
npm run format

# Backend Auto-Fix  
Write-Host ""
Write-Host "📦 Backend Auto-Fix..." -ForegroundColor Yellow
Set-Location "../backend"

Write-Host "  🔍 ESLint fixing..." -ForegroundColor Gray
npm run lint:fix

Write-Host "  🎨 Prettier formatting..." -ForegroundColor Gray
npm run format

# Ana dizine dön
Set-Location ".."

# Final check
Write-Host ""
Write-Host "🔍 Final Lint Check..." -ForegroundColor Cyan

Write-Host "  Frontend..." -ForegroundColor Gray
Set-Location "frontend"
npm run lint

Write-Host "  Backend..." -ForegroundColor Gray
Set-Location "../backend"
npm run lint

Set-Location ".."

Write-Host ""
Write-Host "✅ Auto-Fix tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Manuel komutlar:" -ForegroundColor Blue
Write-Host "  Frontend: cd frontend && npm run lint:fix && npm run format" -ForegroundColor White
Write-Host "  Backend:  cd backend && npm run lint:fix && npm run format" -ForegroundColor White 