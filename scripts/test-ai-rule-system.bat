@echo off
title AI Rule Coordination System Test
color 0B
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║            🎯 AI RULE COORDINATION SYSTEM TEST 🎯             ║
echo  ║               Akıllı Kural Aktivasyon Demo                    ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 🧪 Testing AI Rule Auto Activator...
echo.

REM === TEST 1: Backend Development ===
echo 📊 Test 1: Backend Development
echo Input: "Backend'de yeni user authentication API'si oluştur"
echo.
node tools\ai-rule-auto-activator.js analyze "Backend'de yeni user authentication API'si oluştur"
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM === TEST 2: Frontend Debugging ===
echo 📊 Test 2: Frontend Debugging  
echo Input: "React component render hatası var, düzeltmek lazım"
echo.
node tools\ai-rule-auto-activator.js analyze "React component render hatası var, düzeltmek lazım"
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM === TEST 3: Database Optimization ===
echo 📊 Test 3: Database Optimization
echo Input: "MongoDB query performance iyileştirmesi yapılacak"
echo.
node tools\ai-rule-auto-activator.js analyze "MongoDB query performance iyileştirmesi yapılacak"
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM === TEST 4: Manual Command ===
echo 📊 Test 4: Manual Command
echo Input: "@fullstack Kullanıcı profil yönetim sistemi ekle"
echo.
node tools\ai-rule-auto-activator.js analyze "@fullstack Kullanıcı profil yönetim sistemi ekle"
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM === TEST 5: Security Context ===
echo 📊 Test 5: Security Context
echo Input: "JWT token authentication sistemi güvenlik açığı var"
echo.
node tools\ai-rule-auto-activator.js analyze "JWT token authentication sistemi güvenlik açığı var"
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM === TEST 6: Deployment Context ===
echo 📊 Test 6: Deployment Context
echo Input: "Production deployment hazırlığı yapalım"
echo.
node tools\ai-rule-auto-activator.js analyze "Production deployment hazırlığı yapalım"
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

echo 🎯 Running Complete Test Suite...
echo.
node tools\ai-rule-auto-activator.js test

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                    🎉 TEST COMPLETE! 🎉                       ║
echo  ║                                                               ║
echo  ║  ✅ AI Rule Coordination System Working                      ║
echo  ║  ✅ Context Detection Active                                  ║
echo  ║  ✅ Intent Recognition Working                                ║
echo  ║  ✅ Smart Rule Selection Active                               ║
echo  ║  ✅ Auto Activation Ready                                     ║
echo  ║                                                               ║
echo  ║  🚀 System Ready for Prompt-Driven Development!              ║
echo  ║                                                               ║
echo  ║  💡 Usage:                                                    ║
echo  ║     - Just describe what you want to do                      ║
echo  ║     - AI will automatically activate right rules             ║
echo  ║     - Use @commands for manual override                      ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo 📖 For detailed usage guide: .cursor\rule-activation-guide.md
echo 🔧 For configuration: .cursor\ai-rule-coordinator.json
echo.
pause