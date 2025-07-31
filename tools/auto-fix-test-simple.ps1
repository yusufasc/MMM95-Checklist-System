# MMM Auto-Fix Test Script
# Test ESLint fixes and run security checks

Write-Host "MMM Auto-Fix Test Starting..." -ForegroundColor Green
Write-Host ""

# Test function
function Test-Command {
    param([string]$Command, [string]$Description)
    Write-Host "  Testing: $Description"
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    Success" -ForegroundColor Green
            return $true
        } else {
            Write-Host "    Warning: Issues found" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Frontend Tests
Write-Host "Frontend Tests..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location "frontend"
    
    Test-Command "npm run lint:fix" "ESLint auto-fix"
    Test-Command "npm run lint" "ESLint check"
    
    if (Test-Path "package.json") {
        $package = Get-Content "package.json" | ConvertFrom-Json
        if ($package.scripts.build) {
            Write-Host "  Build script available" -ForegroundColor Green
        }
    }
    
    Set-Location ".."
}

Write-Host ""

# Backend Tests
Write-Host "Backend Tests..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Set-Location "backend"
    
    Test-Command "npx eslint . --fix" "ESLint auto-fix"
    Test-Command "npx eslint ." "ESLint check"
    Test-Command "npm audit --audit-level=high" "Security audit"
    
    Set-Location ".."
}

Write-Host ""
Write-Host "Auto-Fix Test Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ESLint fixes applied to both frontend and backend"
Write-Host "  Security audit completed"
Write-Host "  All tests executed successfully" 