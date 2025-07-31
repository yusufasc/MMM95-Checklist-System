# MMM ESLint Auto-Fix Script
# Fix ESLint issues in frontend and backend

Write-Host "ESLint Auto-Fix Starting..." -ForegroundColor Green
Write-Host ""

# Frontend ESLint Fix
Write-Host "Frontend ESLint Fix..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location "frontend"
    Write-Host "  Running ESLint fix..."
    npm run lint:fix
    Write-Host "  Running ESLint check..."
    npm run lint
    Set-Location ".."
    Write-Host "  Frontend completed" -ForegroundColor Green
}

Write-Host ""

# Backend ESLint Fix
Write-Host "Backend ESLint Fix..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Set-Location "backend"
    Write-Host "  Running ESLint fix..."
    npx eslint . --fix
    Write-Host "  Running ESLint check..."
    npx eslint .
    Set-Location ".."
    Write-Host "  Backend completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "ESLint Auto-Fix Completed!" -ForegroundColor Green 