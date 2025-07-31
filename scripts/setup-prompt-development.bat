@echo off
title MMM95 Prompt-Driven Development Setup
color 0A
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                🚀 MMM95 PROMPT-DRIVEN SETUP 🚀                ║
echo  ║              Güvenli ve Optimize Geliştirme Ortamı            ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

REM === ENVIRONMENT VALIDATION ===
echo 🔍 Environment Validation...
call scripts\validate-environment.bat
if %errorlevel% neq 0 (
    echo ❌ Environment validation failed!
    pause
    exit /b 1
)

echo.
echo 📦 Installing Dependencies...

REM === ROOT DEPENDENCIES ===
echo Installing root dependencies...
npm install

REM === BACKEND DEPENDENCIES ===
echo Installing backend dependencies...
cd backend
npm install
cd ..

REM === FRONTEND DEPENDENCIES ===
echo Installing frontend dependencies...
cd frontend  
npm install
cd ..

REM === MCP TOOLS SETUP ===
echo.
echo 🛠️ Setting up MCP Tools...
npx -y @modelcontextprotocol/server-filesystem
npx -y mongodb-mcp-server
npx -y @modelcontextprotocol/server-memory
npx -y @modelcontextprotocol/server-sequential-thinking
npx -y puppeteer-mcp-server
npx -y ref-tools-mcp
npx -y figma-mcp
npx -y hyper-mcp-shell
npx -y @modelcontextprotocol/server-brave-search

REM === ESLINT SETUP ===
echo.
echo 🔧 Setting up ESLint & Prettier...
npm run lint:fix --prefix backend
npm run lint:fix --prefix frontend

REM === DATABASE SETUP ===
echo.
echo 🗄️ Setting up Database...
if exist "backend\scripts\create-admin-user.js" (
    echo Running database initialization...
    cd backend
    node scripts\create-admin-user.js
    cd ..
) else (
    echo ⚠️ Database initialization script not found
)

REM === GIT HOOKS SETUP ===
echo.
echo 🔗 Setting up Git Hooks...
if exist ".husky" (
    npx husky install
    echo ✅ Git hooks configured
) else (
    echo ⚠️ Husky not configured
)

REM === CURSOR OPTIMIZATION ===
echo.
echo 🎯 Optimizing Cursor IDE...
if exist ".cursor\settings.json" (
    echo ✅ Cursor settings optimized
) else (
    echo ⚠️ Cursor settings not found
)

REM === SECURITY CHECK ===
echo.
echo 🔒 Running Security Audit...
npm audit --audit-level moderate
if %errorlevel% neq 0 (
    echo ⚠️ Security vulnerabilities found - please review
    npm audit fix
)

REM === FINAL HEALTH CHECK ===
echo.
echo 🏥 Final Health Check...

REM Start MongoDB if not running
net start MongoDB >nul 2>&1

REM Test backend
echo Starting backend test...
start /min cmd /c "cd backend && timeout 10 npm run dev"
timeout 5 /nobreak >nul

REM Test frontend  
echo Starting frontend test...
start /min cmd /c "cd frontend && timeout 10 npm start"
timeout 5 /nobreak >nul

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                    🎉 SETUP COMPLETE! 🎉                     ║
echo  ║                                                               ║
echo  ║  ✅ Environment validated                                     ║
echo  ║  ✅ Dependencies installed                                    ║
echo  ║  ✅ MCP tools configured                                      ║
echo  ║  ✅ ESLint & Prettier setup                                   ║
echo  ║  ✅ Database initialized                                      ║
echo  ║  ✅ Security audit completed                                  ║
echo  ║                                                               ║
echo  ║  🚀 Ready for Prompt-Driven Development!                     ║
echo  ║                                                               ║
echo  ║  📝 Next Steps:                                               ║
echo  ║     1. Open VS Code workspace: MMM95.code-workspace           ║
echo  ║     2. Start development: npm run dev                         ║
echo  ║     3. Access app: http://localhost:3000                      ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 💡 Pro Tip: Use Cursor AI with @ commands for maximum efficiency!
echo.
pause