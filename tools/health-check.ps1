# MMM Health Check Script
# Quick system and project health check

Write-Host "MMM Health Check" -ForegroundColor Green
Write-Host "================"
Write-Host ""

# System Check
Write-Host "System Environment:" -ForegroundColor Cyan
Write-Host "  Node.js: $(node --version)" -ForegroundColor Green
Write-Host "  NPM: $(npm --version)" -ForegroundColor Green

Write-Host ""

# Project Structure Check
Write-Host "Project Structure:" -ForegroundColor Cyan
if (Test-Path "frontend") { Write-Host "  Frontend: OK" -ForegroundColor Green } else { Write-Host "  Frontend: Missing" -ForegroundColor Red }
if (Test-Path "backend") { Write-Host "  Backend: OK" -ForegroundColor Green } else { Write-Host "  Backend: Missing" -ForegroundColor Red }
if (Test-Path "tools") { Write-Host "  Tools: OK" -ForegroundColor Green } else { Write-Host "  Tools: Missing" -ForegroundColor Red }
if (Test-Path "scripts") { Write-Host "  Scripts: OK" -ForegroundColor Green } else { Write-Host "  Scripts: Missing" -ForegroundColor Red }

Write-Host ""

# PowerShell Tools Check
Write-Host "PowerShell Tools Status:" -ForegroundColor Cyan
$tools = @(
    "fix-eslint.ps1",
    "auto-fix-test-simple.ps1", 
    "pre-commit-hook-simple.ps1",
    "health-check.ps1"
)

foreach ($tool in $tools) {
    if (Test-Path "tools/$tool") {
        Write-Host "  $tool : Available" -ForegroundColor Green
    } else {
        Write-Host "  $tool : Missing" -ForegroundColor Yellow
    }
}

Write-Host ""

# JavaScript Tools Check
Write-Host "JavaScript Tools Status:" -ForegroundColor Cyan
$jsTools = @(
    "visualize-architecture.js",
    "split-worktasks-component.js",
    "add-smart-comments.js",
    "refactor-large-files.js"
)

foreach ($tool in $jsTools) {
    if (Test-Path "tools/$tool") {
        Write-Host "  $tool : Available" -ForegroundColor Green
    } else {
        Write-Host "  $tool : Missing" -ForegroundColor Yellow
    }
}

Write-Host ""

# ESLint Status Check
Write-Host "ESLint Status:" -ForegroundColor Cyan

# Frontend ESLint
if (Test-Path "frontend") {
    Set-Location "frontend"
    $frontendResult = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Frontend ESLint: All Clean" -ForegroundColor Green
    } else {
        $errorCount = ($frontendResult | Select-String "error").Count
        $warningCount = ($frontendResult | Select-String "warning").Count
        Write-Host "  Frontend ESLint: $errorCount errors, $warningCount warnings" -ForegroundColor Yellow
    }
    Set-Location ".."
}

# Backend ESLint
if (Test-Path "backend") {
    Set-Location "backend"
    $backendResult = npx eslint . 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Backend ESLint: All Clean" -ForegroundColor Green
    } else {
        $errorCount = ($backendResult | Select-String "error").Count
        $warningCount = ($backendResult | Select-String "warning").Count
        Write-Host "  Backend ESLint: $errorCount errors, $warningCount warnings" -ForegroundColor Yellow
    }
    Set-Location ".."
}

Write-Host ""
Write-Host "Health Check Completed!" -ForegroundColor Green 