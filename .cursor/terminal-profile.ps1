# ===== MMM95 PROJE TERMINAL PROFİLİ =====

# ALIASLAR
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name la -Value Get-ChildItem
Set-Alias -Name grep -Value Select-String

# NODE.JS ALIASLAR
function npm-install { & "C:\Program Files\nodejs\npm.cmd" install $args }
function npm-start { & "C:\Program Files\nodejs\npm.cmd" start $args }
function npm-test { & "C:\Program Files\nodejs\npm.cmd" test $args }
function npm-build { & "C:\Program Files\nodejs\npm.cmd" run build $args }
function node-version { & "C:\Program Files\nodejs\node.exe" --version }
function npm-version { & "C:\Program Files\nodejs\npm.cmd" --version }

Set-Alias -Name ni -Value npm-install
Set-Alias -Name ns -Value npm-start
Set-Alias -Name nt -Value npm-test
Set-Alias -Name nb -Value npm-build
Set-Alias -Name nv -Value node-version
Set-Alias -Name npmv -Value npm-version

# MMM95 PROJE SPESİFİK ALIASLAR
function backend { Set-Location backend }
function frontend { Set-Location frontend }
function root { Set-Location .. }
function scripts { Set-Location backend/scripts }
function docs { Set-Location docs }

function start-backend { 
    Set-Location backend
    & "C:\Program Files\nodejs\node.exe" server.js
}

function start-frontend {
    Set-Location frontend  
    & "C:\Program Files\nodejs\npm.cmd" start
}

function mongo-connect {
    & "C:\Program Files\nodejs\node.exe" -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/mmm-checklist').then(() => { console.log('✅ MongoDB bağlantısı başarılı'); process.exit(0); }).catch(err => { console.error('❌ MongoDB bağlantı hatası:', err.message); process.exit(1); });"
}

function run-script {
    param([string]$ScriptName)
    Set-Location backend
    & "C:\Program Files\nodejs\node.exe" "scripts/$ScriptName"
}

# GELIŞTIRME ALIASLAR
Set-Alias -Name be -Value backend
Set-Alias -Name fe -Value frontend
Set-Alias -Name rt -Value root
Set-Alias -Name sc -Value scripts
Set-Alias -Name sb -Value start-backend
Set-Alias -Name sf -Value start-frontend
Set-Alias -Name mc -Value mongo-connect
Set-Alias -Name rs -Value run-script

# RENK VE GÖRÜNÜM AYARLARI
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$OutputEncoding = [System.Text.Encoding]::UTF8

# PROMPT ÖZELLEŞTIRMESI
function prompt {
    $location = Get-Location
    $projectRoot = "MMM95"
    
    if ($location.Path.Contains($projectRoot)) {
        $relativePath = $location.Path.Substring($location.Path.IndexOf($projectRoot))
        Write-Host "[$relativePath]" -ForegroundColor Green -NoNewline
    } else {
        Write-Host "[$($location.Name)]" -ForegroundColor Blue -NoNewline
    }
    
    return " > "
}

# OTOMATIK TAMAMLAMA
Set-PSReadLineOption -PredictionSource History
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

# BAŞLANGIÇ MESAJI
Write-Host "🚀 MMM95 Checklist Sistemi Terminal Profili Yüklendi!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Kullanılabilir Komutlar:" -ForegroundColor Yellow
Write-Host "  be/backend    - Backend klasörüne git" -ForegroundColor Gray
Write-Host "  fe/frontend   - Frontend klasörüne git" -ForegroundColor Gray  
Write-Host "  sc/scripts    - Scripts klasörüne git" -ForegroundColor Gray
Write-Host "  sb            - Backend'i başlat" -ForegroundColor Gray
Write-Host "  sf            - Frontend'i başlat" -ForegroundColor Gray
Write-Host "  mc            - MongoDB bağlantı testi" -ForegroundColor Gray
Write-Host "  rs <script>   - Script çalıştır" -ForegroundColor Gray
Write-Host "  ni/npm-install- NPM install" -ForegroundColor Gray
Write-Host "  ns/npm-start  - NPM start" -ForegroundColor Gray
Write-Host ""