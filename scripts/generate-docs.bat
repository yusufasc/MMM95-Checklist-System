@echo off
echo ================================================================
echo 📚 MMM Projesi Otomatik Dokümantasyon Oluşturucu
echo ================================================================
echo.

echo 🔍 Backend API Dokümantasyonu oluşturuluyor...
cd backend
npx @apidevtools/swagger-jsdoc -d swaggerDef.js routes/*.js > ../docs/api-documentation.json

echo 📱 Frontend Component Dokümantasyonu oluşturuluyor...
cd ../frontend
npx @storybook/cli extract src/components > ../docs/components-map.json

echo 📊 Proje Yapısı Analizi...
cd ..
echo "# MMM Projesi Yapı Analizi" > docs/project-structure.md
echo "## Backend Routes" >> docs/project-structure.md
find backend/routes -name "*.js" -exec echo "- {}" \; >> docs/project-structure.md
echo "" >> docs/project-structure.md
echo "## Frontend Components" >> docs/project-structure.md
find frontend/src/components -name "*.js" -exec echo "- {}" \; >> docs/project-structure.md
echo "" >> docs/project-structure.md
echo "## Database Models" >> docs/project-structure.md
find backend/models -name "*.js" -exec echo "- {}" \; >> docs/project-structure.md

echo 🎯 Dosya Bağımlılık Haritası...
npx madge --image docs/dependency-graph.png --exclude node_modules backend/

echo ✅ Dokümantasyon tamamlandı!
echo 📁 docs/ klasörünü kontrol edin
pause 