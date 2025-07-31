@echo off
echo ================================================================
echo 🎯 MMM Projesi Kod Kalitesi Dashboard
echo ================================================================
echo.

echo 📊 1. Proje Analizi Çalıştırılıyor...
node visualize-architecture.js > quality-report.txt

echo 💬 2. Smart Comments Ekleniyor...
node add-smart-comments.js >> quality-report.txt

echo 🔍 3. ESLint Kontrolü...
echo === BACKEND ESLint === >> quality-report.txt
cd backend
npm run lint >> ../quality-report.txt 2>&1
cd ..

echo === FRONTEND ESLint === >> quality-report.txt
cd frontend
npm run lint >> ../quality-report.txt 2>&1
cd ..

echo 📈 4. Dosya İstatistikleri...
echo === DOSYA İSTATİSTİKLERİ === >> quality-report.txt
echo Backend JS dosyaları: >> quality-report.txt
find backend -name "*.js" | wc -l >> quality-report.txt
echo Frontend JS dosyaları: >> quality-report.txt
find frontend/src -name "*.js" | wc -l >> quality-report.txt

echo 🎨 5. Git Durumu...
echo === GIT DURUMU === >> quality-report.txt
git status --porcelain >> quality-report.txt
echo Son commit: >> quality-report.txt
git log -1 --oneline >> quality-report.txt

echo 📝 6. TODO/FIXME Arama...
echo === TODO/FIXME LİSTESİ === >> quality-report.txt
grep -r "TODO\|FIXME\|XXX\|HACK" backend/ frontend/src/ >> quality-report.txt

echo ✅ Kod Kalitesi Raporu Hazır!
echo 📁 quality-report.txt dosyasını kontrol edin
echo.
echo 🚀 Hızlı Menü:
echo 1. Raporu göster: type quality-report.txt
echo 2. Mimari analizi: node visualize-architecture.js
echo 3. Smart comments: node add-smart-comments.js
echo 4. ESLint fix: fix-all.bat
echo.
pause 