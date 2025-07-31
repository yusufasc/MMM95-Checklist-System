@echo off
echo ⚛️ Frontend Debug Mode  
echo ====================
echo.
echo 🔍 Debug bilgileri:
echo   - Port: 3000 (React Dev Server)
echo   - Environment: development
echo   - Source Maps: Enabled
echo   - React DevTools: Auto-detect
echo.
echo 🛠️ Debug araçları:
echo   - F12 veya Ctrl+Shift+I (Chrome DevTools)
echo   - React DevTools Extension (Tarayıcı)
echo   - VS Code Debugger
echo.
echo 🚀 Frontend Debug başlatılıyor...
echo.

cd frontend
set REACT_APP_DEBUG=true
set GENERATE_SOURCEMAP=true
npm start

pause 