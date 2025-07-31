@echo off
echo 🔍 MMM95 Development Environment Validation Starting...
echo.

REM === NODE.JS CHECK ===
echo 📦 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not installed!
    echo 💡 Download from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js: 
    node --version
)

REM === NPM CHECK ===
echo 📦 Checking NPM...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NPM not found!
    pause
    exit /b 1
) else (
    echo ✅ NPM: 
    npm --version
)

REM === GIT CHECK ===
echo 📦 Checking Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git not installed!
    echo 💡 Download from: https://git-scm.com/
    pause
    exit /b 1
) else (
    echo ✅ Git: 
    git --version
)

REM === MONGODB CHECK ===
echo 📦 Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MongoDB not found in PATH
    echo 💡 Make sure MongoDB is installed and running
) else (
    echo ✅ MongoDB: 
    mongod --version | findstr "db version"
)

REM === PROJECT DEPENDENCIES ===
echo.
echo 📦 Checking Project Dependencies...

if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies missing
    echo 💡 Run: cd backend && npm install
)

if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies missing
    echo 💡 Run: cd frontend && npm install
)

REM === MCP TOOLS CHECK ===
echo.
echo 🛠️ Checking MCP Tools...
npx --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NPX not available
) else (
    echo ✅ NPX available for MCP tools
)

REM === CURSOR CONFIGURATION ===
echo.
echo ⚙️ Checking Cursor Configuration...
if exist ".cursor\settings.json" (
    echo ✅ Cursor settings configured
) else (
    echo ⚠️ Cursor settings not found
)

if exist "mcp-config.json" (
    echo ✅ MCP configuration found
) else (
    echo ❌ MCP configuration missing
)

REM === WORKSPACE CHECK ===
echo.
echo 🏠 Checking Workspace...
if exist "MMM95.code-workspace" (
    echo ✅ VS Code workspace configured
) else (
    echo ⚠️ VS Code workspace file missing
)

REM === HEALTH CHECK ===
echo.
echo 🏥 Running Health Checks...

REM Check if MongoDB is running
echo | nul | telnet localhost 27017 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running on port 27017
) else (
    echo ⚠️ MongoDB is not running
    echo 💡 Start MongoDB service
)

REM Check backend port
echo | nul | telnet localhost 3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend port 3001 is in use
) else (
    echo ⚠️ Backend not running on port 3001
)

REM Check frontend port
echo | nul | telnet localhost 3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend port 3000 is in use
) else (
    echo ⚠️ Frontend not running on port 3000
)

echo.
echo 🎯 Environment Validation Complete!
echo 💡 For full setup, run: npm run setup:all
echo.
pause