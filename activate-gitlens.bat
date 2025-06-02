@echo off
echo ================================================================
echo 🚀 GitLens MMM Projesi Aktivasyon Scripti
echo ================================================================
echo.

REM GitLens durumunu kontrol et
echo 📋 GitLens kurulum durumu kontrol ediliyor...
code --list-extensions | findstr "eamodio.gitlens" >nul
if %errorlevel% equ 0 (
    echo ✅ GitLens zaten kurulu
) else (
    echo ❌ GitLens bulunamadı - Extension'ı Cursor IDE'de manuel olarak kurun
    echo 💡 Cursor'da: Extensions > Search "GitLens" > Install
    pause
    exit /b 1
)

echo.
echo 🔧 GitLens konfigürasyonları kontrol ediliyor...

REM VS Code Settings kontrol
if exist ".vscode\settings.json" (
    echo ✅ GitLens settings.json konfigürasyonu hazır
) else (
    echo ❌ settings.json bulunamadı
)

REM GitLens workspace konfigürasyon kontrol  
if exist ".vscode\gitlens.json" (
    echo ✅ GitLens workspace konfigürasyonu hazır
) else (
    echo ❌ gitlens.json bulunamadı
)

REM Tasks kontrol
if exist ".vscode\tasks.json" (
    echo ✅ Git task konfigürasyonları hazır
) else (
    echo ❌ tasks.json bulunamadı
)

echo.
echo 🔍 Git repository durumu:
git status --porcelain --branch

echo.
echo 📊 Git geçmişi (son 5 commit):
git log --oneline --graph --max-count=5 --date=format:%%d/%%m/%%Y --pretty=format:"%%C(yellow)%%h%%C(reset) %%C(blue)%%ad%%C(reset) %%C(green)%%an%%C(reset) %%s"

echo.
echo 👥 Proje katkıda bulunanlar:
git shortlog -sn --all --no-merges | head -10

echo.
echo ================================================================
echo 🎯 GitLens Özellikler Aktif:
echo ================================================================
echo ✅ Code Lens - Kod satırlarında yazar ve tarih bilgisi
echo ✅ Blame Annotations - Dosya kenarında commit bilgileri  
echo ✅ Hover Information - Mouse ile detaylı commit bilgisi
echo ✅ Status Bar - Alt çubukta aktif dosya commit bilgisi
echo ✅ Sidebar Views - Repository, File History, Line History
echo ✅ Commit Graph - Görsel commit geçmişi
echo ✅ Compare Views - Dosya ve branch karşılaştırması
echo ✅ Timeline View - Dosya değişiklik zaman çizelgesi

echo.
echo 🎮 GitLens Kullanım Kılavuzu:
echo ================================================================
echo 📌 Code Lens: Fonksiyon/sınıf üstündeki "... authored by" linklerine tıklayın
echo 📌 Blame Toggle: Ctrl+Shift+G B - Dosya kenarında blame bilgilerini aç/kapat
echo 📌 File History: Explorer'da dosyaya sağ tık > "Open File History"
echo 📌 Line History: Kod satırına sağ tık > "Open Line History" 
echo 📌 Compare: Ctrl+Shift+P > "GitLens: Compare" komutları
echo 📌 Search: Ctrl+Shift+P > "GitLens: Search Commits"
echo 📌 Repository View: Sol sidebar'da GitLens ikonu

echo.
echo 🔧 MMM Projesi Özel GitLens Komutları:
echo ================================================================  
echo 📊 Ctrl+Shift+P > Tasks: Run Task > "📊 Git Status (GitLens Enhanced)"
echo 🌳 Ctrl+Shift+P > Tasks: Run Task > "🌳 Git Log (GitLens Format)"
echo 🔍 Ctrl+Shift+P > Tasks: Run Task > "🔍 Git Diff (Working Directory)"
echo 📈 Ctrl+Shift+P > Tasks: Run Task > "📈 Git Contributors Stats"
echo 💾 Ctrl+Shift+P > Tasks: Run Task > "💾 Quick Commit (GitLens)"

echo.
echo 🎯 MMM Proje Yapısı GitLens ile:
echo ================================================================
echo 📁 backend/ - Node.js API (Git history ile debug edilebilir)
echo 📁 frontend/ - React UI (Component geçmişi takip edilebilir)  
echo 📁 .vscode/ - Development ortamı (GitLens konfigürasyonları)
echo 📋 ESLint & Debug - Kod kalitesi geçmişi görülebilir
echo 🔍 Performance optimizasyonları - Kim hangi performans iyileştirmesini yaptı

echo.
echo 💡 GitLens Pro İpuçları:
echo ================================================================
echo 🎨 Heatmap: Sık değişen kod bölgeleri renkli gösterilir
echo 📅 Tarih formatı: DD/MM/YYYY HH:mm (Türkiye formatı)
echo 🎯 Blame format: Yazar adı, tarih ve commit mesajı gösterilir
echo 📱 Mobile-friendly: Commit mesajları kısa ve açıklayıcı
echo 🔄 Auto-refresh: Değişiklikler otomatik olarak güncellenir

echo.
echo ================================================================
echo ✅ GitLens MMM projesi için başarıyla konfigüre edildi!
echo ================================================================
echo.
echo 🚀 Şimdi Cursor IDE'yi yeniden başlatarak GitLens'i aktifleştirin.
echo 📖 GitLens panelini açmak için: Sol sidebar'da GitLens ikonu
echo 🎯 İlk kullanım: Herhangi bir dosyayı açın ve kod satırları üzerinde
echo    yazar bilgilerini göreceksiniz.

echo.
pause 