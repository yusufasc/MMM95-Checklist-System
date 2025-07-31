@echo off
echo 🐛 Backend Debug Mode
echo ===================
echo.
echo 🔍 Debug bilgileri:
echo   - Port: 5000 (HTTP) 
echo   - Debug Port: 9229 (Chrome DevTools)
echo   - Environment: development
echo   - Debug namespaces: mmm:*
echo.
echo 🌐 Chrome DevTools açmak için:
echo   chrome://inspect adresine gidin
echo.
echo 🚀 Backend Debug başlatılıyor...
echo.

cd backend
set NODE_ENV=development
set DEBUG=mmm:*
npm run debug:dev

pause 