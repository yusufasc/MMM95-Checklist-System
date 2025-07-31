@echo off
echo 🚀 MMM Checklist - Full Auto-Fix
echo ================================
echo.

echo 📦 Frontend Auto-Fix...
cd frontend
npm run lint:fix
npm run format
echo ✅ Frontend completed!
echo.

echo 📦 Backend Auto-Fix...  
cd ../backend
npm run lint:fix
npm run format
echo ✅ Backend completed!
echo.

echo 🔍 Final Lint Check...
echo   Frontend:
cd ../frontend
npm run lint
echo   Backend:
cd ../backend
npm run lint
cd ..

echo.
echo ✅ ALL AUTO-FIX COMPLETED!
echo 🚀 Ready for commit!
pause 