@echo off
echo 🚀 Backend Auto-Fix
echo =================
cd backend
echo.
echo 🔍 ESLint fixing...
npm run lint:fix
echo.
echo 🎨 Prettier formatting...
npm run format
echo.
echo ✅ Backend Auto-Fix completed!
echo.
echo Final check:
npm run lint
cd .. 