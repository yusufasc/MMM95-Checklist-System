@echo off
echo ================================================================
echo 🧪 MMM Projesi Araçları Test Scripti
echo ================================================================
echo.

echo 📋 1. Sistem Gereksinimleri Kontrol...
echo Node.js:
node --version
echo NPM:
npm --version
echo Git:
git --version
echo.

echo 🔧 2. Temel Araçlar Test Ediliyor...

echo ├─ Mimari Analiz:
node visualize-architecture.js > test-output.txt
if %errorlevel% equ 0 (
    echo ✅ visualize-architecture.js - ÇALIŞIYOR
) else (
    echo ❌ visualize-architecture.js - HATA
)

echo ├─ Smart Comments:
node add-smart-comments.js > test-output2.txt
if %errorlevel% equ 0 (
    echo ✅ add-smart-comments.js - ÇALIŞIYOR
) else (
    echo ❌ add-smart-comments.js - HATA
)

echo ├─ ESLint Backend:
cd backend
npm run lint > ../test-eslint-backend.txt 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend ESLint - ÇALIŞIYOR
) else (
    echo ⚠️ Backend ESLint - UYARILAR VAR
)
cd ..

echo ├─ ESLint Frontend:
cd frontend
npm run lint > ../test-eslint-frontend.txt 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend ESLint - ÇALIŞIYOR
) else (
    echo ⚠️ Frontend ESLint - UYARILAR VAR
)
cd ..

echo.
echo 📊 3. Test Sonuçları:
echo ├─ Mimari analiz çıktısı: test-output.txt
echo ├─ Smart comments çıktısı: test-output2.txt
echo ├─ Backend ESLint: test-eslint-backend.txt
echo ├─ Frontend ESLint: test-eslint-frontend.txt
echo.

echo 🎯 4. Dosya Sayıları (Windows):
echo Backend JS dosyaları:
dir backend\*.js /s /b | find /c /v ""
echo Frontend JS dosyaları:
dir frontend\src\*.js /s /b | find /c /v ""
echo.

echo 📂 5. AI Kılavuz Dosyaları:
if exist "ai-prompt-templates.md" (
    echo ✅ ai-prompt-templates.md - HAZIR
) else (
    echo ❌ ai-prompt-templates.md - EKSİK
)

if exist "AI-ASSISTANT-GUIDE.md" (
    echo ✅ AI-ASSISTANT-GUIDE.md - HAZIR
) else (
    echo ❌ AI-ASSISTANT-GUIDE.md - EKSİK
)

if exist "quality-report.txt" (
    echo ✅ quality-report.txt - HAZIR
) else (
    echo ❌ quality-report.txt - EKSİK
)

echo.
echo 🚀 6. Hızlı Başlatma Menüsü:
echo.
echo A) Proje analizi: node visualize-architecture.js
echo B) Smart comments: node add-smart-comments.js
echo C) ESLint fix: fix-all.bat
echo D) AI template'leri: notepad ai-prompt-templates.md
echo E) AI kılavuzu: notepad AI-ASSISTANT-GUIDE.md
echo.

echo ✅ Test tamamlandı!
echo 📁 Test çıktıları için yukarıdaki dosyaları kontrol edin.
echo.
pause 