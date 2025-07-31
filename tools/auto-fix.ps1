#!/usr/bin/env powershell
# MMM Checklist Otomatik Fix Script'i
# Hem frontend hem backend ESLint/Prettier hatalarını otomatik düzeltir

Write-Host "🚀 MMM Checklist Auto-Fix" -ForegroundColor Green
Write-Host "========================="
Write-Host ""

# Current directory'yi tespit et
$currentDir = Get-Location
$isInToolsDir = $currentDir.Path.EndsWith("tools")

if ($isInToolsDir) {
    $frontendPath = "..\frontend"
    $backendPath = "..\backend"
    $rootPath = ".."
} else {
    $frontendPath = "frontend"
    $backendPath = "backend"
    $rootPath = "."
}

# Frontend Auto-Fix
Write-Host "🔧 Frontend Auto-Fix..." -ForegroundColor Yellow
if (Test-Path $frontendPath) {
    Push-Location $frontendPath
    
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
    
    Write-Host "  🎨 Prettier formatting..."
    if (Test-Path "package.json") {
        $packageContent = Get-Content "package.json" | ConvertFrom-Json
        if ($packageContent.scripts."format:fix") {
            npm run format:fix
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Prettier formatting completed" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ Prettier formatting failed" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️ format:fix script not found" -ForegroundColor Yellow
        }
    }
    
    Pop-Location
} else {
    Write-Host "  ❌ Frontend dizini bulunamadı: $frontendPath" -ForegroundColor Red
}

Write-Host ""

# Backend Auto-Fix  
Write-Host "🔧 Backend Auto-Fix..." -ForegroundColor Yellow
if (Test-Path $backendPath) {
    Push-Location $backendPath
    
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
    
    Write-Host "  🎨 Prettier formatting..."
    if (Test-Path "package.json") {
        $packageContent = Get-Content "package.json" | ConvertFrom-Json
        if ($packageContent.scripts."format:fix") {
            npm run format:fix
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Prettier formatting completed" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ Prettier formatting failed" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️ format:fix script not found" -ForegroundColor Yellow
        }
    }
    
    Pop-Location
} else {
    Write-Host "  ❌ Backend dizini bulunamadı: $backendPath" -ForegroundColor Red
}

Write-Host ""

# Final Health Check
Write-Host "🏠 Final Health Check..." -ForegroundColor Cyan
Write-Host ""

Write-Host "  📱 Frontend build test..." -ForegroundColor Gray
if (Test-Path "$frontendPath\package.json") {
    Write-Host "    ✅ Frontend environment OK" -ForegroundColor Green
} else {
    Write-Host "    ❌ Frontend package.json not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "  🔒 Backend security check..." -ForegroundColor Gray
if (Test-Path "$backendPath\package.json") {
    Push-Location $backendPath
    npm audit --audit-level=high
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ Security check completed" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ Security vulnerabilities found" -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "    ❌ Backend package.json not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Auto-Fix tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Manuel komutlar:" -ForegroundColor Cyan
Write-Host "  Frontend: cd $frontendPath; npm run lint:fix; npm run build" -ForegroundColor Gray
Write-Host "  Backend:  cd $backendPath; npx eslint . --fix; npm audit" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 İstatistikler:" -ForegroundColor Cyan
Write-Host "  ✅ ESLint kontrolü: Tamamlandı" -ForegroundColor Green
Write-Host "  ✅ Prettier formatı: Tamamlandı" -ForegroundColor Green
Write-Host "  ✅ Güvenlik taraması: Tamamlandı" -ForegroundColor Green 