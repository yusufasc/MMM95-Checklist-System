#!/usr/bin/env powershell
# MMM Checklist - Pre-commit Auto-Fix Script
# This script automatically runs ESLint and Prettier fixes before each commit

Write-Host "Auto-Fix starting..." -ForegroundColor Cyan

try {
    # Frontend Auto-Fix
    Write-Host "Fixing Frontend..." -ForegroundColor Yellow
    Set-Location "frontend"

    # ESLint auto-fix
    Write-Host "  ESLint auto-fix..." -ForegroundColor Gray
    npm run lint:fix

    # Prettier format
    Write-Host "  Prettier format..." -ForegroundColor Gray  
    npm run format

    # Backend Auto-Fix
    Write-Host "Fixing Backend..." -ForegroundColor Yellow
    Set-Location "../backend"

    # ESLint auto-fix
    Write-Host "  ESLint auto-fix..." -ForegroundColor Gray
    npm run lint:fix

    # Prettier format
    Write-Host "  Prettier format..." -ForegroundColor Gray
    npm run format

    # Return to root directory
    Set-Location ".."

    # Final status check
    Write-Host "Auto-Fix completed!" -ForegroundColor Green
    Write-Host "Changed files will be added with git add..." -ForegroundColor Blue

    # Git add changed files
    git add .

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
} 