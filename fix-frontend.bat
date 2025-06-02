@echo off
echo 🚀 Frontend Auto-Fix
echo ==================
cd frontend
echo.
echo 🔍 ESLint fixing...
npm run lint:fix
echo.
echo 🎨 Prettier formatting... 
npm run format
echo.
echo ✅ Frontend Auto-Fix completed!
echo.
echo Final check:
npm run lint
cd .. 