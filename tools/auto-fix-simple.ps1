# MMM Checklist Simple Auto-Fix Script
# Hem frontend hem backend ESLint hatalarını otomatik düzeltir

Write-Host "🚀 MMM Checklist Simple Auto-Fix" -ForegroundColor Green
Write-Host "================================"
Write-Host ""

# Frontend Auto-Fix
Write-Host "🔧 Frontend Auto-Fix..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location "frontend"
    
    Write-Host "  🔧 ESLint fixing..."
    npm run lint:fix
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ ESLint fix completed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ ESLint fix failed" -ForegroundColor Yellow
    }
    
    Write-Host "  ✅ ESLint check..."
    npm run lint
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ ESLint check passed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ ESLint check found issues" -ForegroundColor Yellow
    }
    
    Set-Location ".."
} else {
    Write-Host "  ❌ Frontend directory not found" -ForegroundColor Red
}

Write-Host ""

# Backend Auto-Fix
Write-Host "🔧 Backend Auto-Fix..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Set-Location "backend"
    
    Write-Host "  🔧 ESLint fixing..."
    npx eslint . --fix
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ ESLint fix completed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ ESLint fix failed" -ForegroundColor Yellow
    }
    
    Write-Host "  ✅ ESLint check..."
    npx eslint .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ ESLint check passed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ ESLint check found issues" -ForegroundColor Yellow
    }
    
    Set-Location ".."
} else {
    Write-Host "  ❌ Backend directory not found" -ForegroundColor Red
}

Write-Host ""

# Security Check
Write-Host "🔒 Backend Security Check..." -ForegroundColor Cyan
if (Test-Path "backend") {
    Set-Location "backend"
    npm audit --audit-level=high
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Security check completed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Security vulnerabilities found" -ForegroundColor Yellow
    }
    Set-Location ".."
}

Write-Host ""
Write-Host "✅ Simple Auto-Fix completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Cyan
Write-Host "  ✅ ESLint check: Completed" -ForegroundColor Green
Write-Host "  ✅ Security scan: Completed" -ForegroundColor Green 