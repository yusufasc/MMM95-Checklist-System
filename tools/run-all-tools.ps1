# MMM Checklist System - Master Tools Runner
# Tum araclari dogru sirada calistirir

Write-Host "🚀 MMM Checklist System - Master Tools Runner" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Baslangic zamani
$startTime = Get-Date
Write-Host "⏰ Baslangic: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Cyan
Write-Host ""

# Sonuclari takip et
$results = @{
    "health-check" = $false
    "eslint-fix" = $false
    "architecture-analysis" = $false
    "refactor-analysis" = $false
    "dashboard-update" = $false
    "smart-comments" = $false
}

# Hata sayaci
$errorCount = 0

# Yardimci fonksiyon
function Run-Tool {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Description,
        [string]$Type = "powershell"
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Yellow
    Write-Host "   Komut: $Command" -ForegroundColor Gray
    
    try {
        if ($Type -eq "powershell") {
            $output = Invoke-Expression $Command 2>&1
        } else {
            # Node.js komutlari icin
            $output = Invoke-Expression $Command 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $Name basarili" -ForegroundColor Green
            $results[$Name] = $true
            return $true
        } else {
            Write-Host "   ❌ $Name basarisiz (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
            Write-Host "   Output: $($output | Select-Object -Last 3)" -ForegroundColor DarkGray
            $script:errorCount++
            return $false
        }
    } catch {
        Write-Host "   ❌ $Name hata: $($_.Exception.Message)" -ForegroundColor Red
        $script:errorCount++
        return $false
    }
    
    Write-Host ""
}

# 1. Health Check
Write-Host "📊 ADIM 1: Sistem Saglik Kontrolu" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Run-Tool -Name "health-check" -Command "powershell -ExecutionPolicy Bypass -File health-check.ps1" -Description "Sistem durumu kontrolu"

Write-Host ""

# 2. ESLint Fix
Write-Host "🔧 ADIM 2: ESLint Duzeltmeleri" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Run-Tool -Name "eslint-fix" -Command "powershell -ExecutionPolicy Bypass -File fix-eslint.ps1" -Description "ESLint hatalarini duzelt"

Write-Host ""

# 3. Architecture Analysis
Write-Host "🏗️ ADIM 3: Mimari Analiz" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Run-Tool -Name "architecture-analysis" -Command "node visualize-architecture.js" -Description "Proje mimarisi analizi" -Type "node"

Write-Host ""

# 4. Refactoring Analysis
Write-Host "🔍 ADIM 4: Refactoring Analizi" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Run-Tool -Name "refactor-analysis" -Command "node refactor-large-files.js" -Description "Buyuk dosya analizi" -Type "node"

Write-Host ""

# 5. Dashboard Update
Write-Host "📈 ADIM 5: Dashboard Guncelleme" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Run-Tool -Name "dashboard-update" -Command "node refactoring-dashboard.js" -Description "Refactoring dashboard" -Type "node"

Write-Host ""

# 6. Smart Comments (Opsiyonel - sadece aylik)
$currentDate = Get-Date
$dayOfMonth = $currentDate.Day

if ($dayOfMonth -eq 1 -or $env:FORCE_SMART_COMMENTS -eq "true") {
    Write-Host "💬 ADIM 6: Smart Comments (Aylik)" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Run-Tool -Name "smart-comments" -Command "node add-smart-comments.js" -Description "Smart comments guncelleme" -Type "node"
} else {
    Write-Host "💬 ADIM 6: Smart Comments (Atlandi - Aylik)" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host "   ℹ️ Smart comments sadece ayin 1'inde calisir" -ForegroundColor Gray
    Write-Host "   💡 Zorlamak icin: `$env:FORCE_SMART_COMMENTS = 'true'`" -ForegroundColor Gray
    $results["smart-comments"] = "skipped"
}

Write-Host ""

# Sonuclari ozetle
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "📊 OZET RAPOR" -ForegroundColor Green
Write-Host "=============" -ForegroundColor Green
Write-Host "⏰ Baslangic: $($startTime.ToString('HH:mm:ss'))" -ForegroundColor Cyan
Write-Host "⏰ Bitis: $($endTime.ToString('HH:mm:ss'))" -ForegroundColor Cyan
Write-Host "⏱️ Sure: $($duration.TotalMinutes.ToString('F1')) dakika" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Arac Sonuclari:" -ForegroundColor Cyan
foreach ($tool in $results.Keys) {
    $status = $results[$tool]
    $icon = switch ($status) {
        $true { "✅" }
        $false { "❌" }
        "skipped" { "⏭️" }
        default { "❓" }
    }
    $statusText = switch ($status) {
        $true { "Basarili" }
        $false { "Basarisiz" }
        "skipped" { "Atlandi" }
        default { "Bilinmiyor" }
    }
    Write-Host "  $icon $tool : $statusText" -ForegroundColor $(if ($status -eq $true) { "Green" } elseif ($status -eq $false) { "Red" } else { "Yellow" })
}

Write-Host ""

# Basari orani hesapla
$totalTools = $results.Keys.Count
$successfulTools = ($results.Values | Where-Object { $_ -eq $true }).Count
$skippedTools = ($results.Values | Where-Object { $_ -eq "skipped" }).Count
$failedTools = ($results.Values | Where-Object { $_ -eq $false }).Count

$successRate = if ($totalTools -gt 0) { [math]::Round(($successfulTools / ($totalTools - $skippedTools)) * 100, 1) } else { 0 }

Write-Host "📈 Istatistikler:" -ForegroundColor Cyan
Write-Host "  📊 Toplam arac: $totalTools" -ForegroundColor Gray
Write-Host "  ✅ Basarili: $successfulTools" -ForegroundColor Green
Write-Host "  ❌ Basarisiz: $failedTools" -ForegroundColor Red
Write-Host "  ⏭️ Atlanan: $skippedTools" -ForegroundColor Yellow
Write-Host "  🎯 Basari orani: %$successRate" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

Write-Host ""

# Oneriler
if ($errorCount -eq 0) {
    Write-Host "🎉 Mukemmel! Tum araclar basariyla calisti." -ForegroundColor Green
    Write-Host "💡 Sistem saglikli ve kod kalitesi yuksek." -ForegroundColor Green
} elseif ($errorCount -le 2) {
    Write-Host "⚠️ Bazi araclarda sorun var ama genel durum iyi." -ForegroundColor Yellow
    Write-Host "💡 Basarisiz araclari manuel kontrol edin." -ForegroundColor Yellow
} else {
    Write-Host "🚨 Cok sayida arac basarisiz oldu!" -ForegroundColor Red
    Write-Host "💡 Sistem konfigurasyonunu kontrol edin." -ForegroundColor Red
}

Write-Host ""

# Sonraki adimlar
Write-Host "🔄 Sonraki Adimlar:" -ForegroundColor Cyan
Write-Host "  📅 Gunluk: health-check.ps1" -ForegroundColor Gray
Write-Host "  📅 Haftalik: Bu script'i calistir" -ForegroundColor Gray
Write-Host "  📅 Aylik: Smart comments otomatik calisir" -ForegroundColor Gray
Write-Host "  🔧 Ihtiyac halinde: fix-eslint.ps1" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Master Tools Runner tamamlandi!" -ForegroundColor Green

# Exit code
if ($errorCount -eq 0) {
    exit 0
} else {
    exit 1
} 