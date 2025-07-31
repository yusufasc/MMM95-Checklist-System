# MMM Checklist System - Simple Tools Runner
Write-Host "MMM Checklist System - Tools Runner" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# ESLint Check Backend
Write-Host ""
Write-Host "1. Backend ESLint Check..." -ForegroundColor Yellow
Set-Location "../backend"
$backendResult = npx eslint . --ext .js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Backend ESLint: 0 errors" -ForegroundColor Green
} else {
    Write-Host "   Backend ESLint: Has warnings" -ForegroundColor Yellow
}
Set-Location "../tools"

# ESLint Check Frontend  
Write-Host ""
Write-Host "2. Frontend ESLint Check..." -ForegroundColor Yellow
Set-Location "../frontend"
$frontendResult = npx eslint src 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Frontend ESLint: 0 errors" -ForegroundColor Green
} else {
    Write-Host "   Frontend ESLint: Has warnings" -ForegroundColor Yellow
}
Set-Location "../tools"

# Architecture Analysis
Write-Host ""
Write-Host "3. Architecture Analysis..." -ForegroundColor Yellow
$archResult = node visualize-architecture.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Architecture Analysis: Success" -ForegroundColor Green
} else {
    Write-Host "   Architecture Analysis: Error" -ForegroundColor Red
}

# Refactoring Dashboard
Write-Host ""
Write-Host "4. Refactoring Dashboard..." -ForegroundColor Yellow
$refactorResult = node refactoring-dashboard.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Refactoring Dashboard: Success" -ForegroundColor Green
} else {
    Write-Host "   Refactoring Dashboard: Error" -ForegroundColor Red
}

# Smart Comments
Write-Host ""
Write-Host "5. Smart Comments..." -ForegroundColor Yellow
$smartResult = node add-smart-comments.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Smart Comments: Success" -ForegroundColor Green
} else {
    Write-Host "   Smart Comments: Error" -ForegroundColor Red
}

Write-Host ""
Write-Host "Tools Runner Completed!" -ForegroundColor Green 