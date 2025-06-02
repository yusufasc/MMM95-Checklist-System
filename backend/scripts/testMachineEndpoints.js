const axios = require('axios');

async function testEndpoints() {
  try {
    console.log('🧪 API endpointleri test ediliyor...\n');

    // Test 1: Inventory machines-for-tasks endpoint
    try {
      await axios.get('http://localhost:5000/api/inventory/machines-for-tasks', {
        headers: {
          Authorization: 'Bearer dummy-token', // Bu test için geçersiz token kullanıyoruz
        },
      });
      console.log('✅ /api/inventory/machines-for-tasks çalışıyor');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(
          'ℹ️  /api/inventory/machines-for-tasks endpointi mevcut (401 auth hatası beklenen)',
        );
      } else {
        console.log(`❌ /api/inventory/machines-for-tasks hatası: ${error.message}`);
      }
    }

    // Test 2: Tasks inventory-machines endpoint
    try {
      await axios.get('http://localhost:5000/api/tasks/inventory-machines', {
        headers: {
          Authorization: 'Bearer dummy-token',
        },
      });
      console.log('✅ /api/tasks/inventory-machines çalışıyor');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(
          'ℹ️  /api/tasks/inventory-machines endpointi mevcut (401 auth hatası beklenen)',
        );
      } else {
        console.log(`❌ /api/tasks/inventory-machines hatası: ${error.message}`);
      }
    }

    // Test 3: Server response
    try {
      await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server çalışıyor');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server çalışmıyor (ECONNREFUSED)');
      } else {
        console.log('ℹ️  Server çalışıyor ama health endpoint yok');
      }
    }

    console.log('\n🎉 Test tamamlandı!');
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testEndpoints();
