# MMM Pre-commit Hook
# Auto-fix code before commit

Write-Host "Pre-commit Auto-Fix starting..." -ForegroundColor Cyan

# Frontend Auto-Fix
Write-Host "Fixing Frontend..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location "frontend"
    Write-Host "  ESLint auto-fix..."
    npm run lint:fix
    Set-Location ".."
}

# Backend Auto-Fix
Write-Host "Fixing Backend..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Set-Location "backend"
    Write-Host "  ESLint auto-fix..."
    npx eslint . --fix
    Set-Location ".."
}

Write-Host "Auto-Fix completed!" -ForegroundColor Green
Write-Host "Changed files will be added with git add..." -ForegroundColor Blue

# Git add changed files
git add . 