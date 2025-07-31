@echo off
echo 🚀 Full Stack Debug Mode
echo ========================
echo.
echo 🔍 Başlatılacak servisler:
echo   - Backend (Port 5000) - Debug Port 9229
echo   - Frontend (Port 3000) - React Dev Server
echo.
echo 🛠️ Debug araçları:
echo   - Chrome DevTools: chrome://inspect
echo   - React DevTools: Browser extension
echo   - VS Code Debugger: F5 (Full Stack Debug)
echo.
echo ⚠️  Bu script 2 terminal penceresi açacak
echo.
pause

echo 🚀 Backend Debug başlatılıyor...
start "Backend Debug" cmd /k "cd backend && set NODE_ENV=development && set DEBUG=mmm:* && npm run debug:dev"

echo ⚛️ Frontend Debug başlatılıyor...
timeout /t 3 /nobreak
start "Frontend Debug" cmd /k "cd frontend && set REACT_APP_DEBUG=true && set GENERATE_SOURCEMAP=true && npm start"

echo.
echo ✅ Full Stack Debug başlatıldı!
echo.
echo 📝 Manuel durdurma için:
echo   - Her iki terminal penceresinde Ctrl+C
echo.
pause 