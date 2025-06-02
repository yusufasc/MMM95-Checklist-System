const axios = require('axios');

const testMachineAPIs = async () => {
  console.log('🧪 Makina API endpointleri test ediliyor...\n');

  const baseURL = 'http://localhost:5000/api';

  // Test 1: Inventory machines-for-tasks endpoint
  try {
    console.log('1️⃣ Testing /api/inventory/machines-for-tasks...');
    const response = await axios.get(`${baseURL}/inventory/machines-for-tasks`, {
      headers: {
        Authorization: 'Bearer dummy-token',
      },
    });
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Makina sayısı: ${response.data.length}`);
    if (response.data.length > 0) {
      console.log(
        `📋 İlk makina: ${response.data[0].kod || response.data[0].envanterKodu} - ${response.data[0].ad}`,
      );
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('ℹ️  401 Auth hatası (beklenen)');
    } else {
      console.log(`❌ Hata: ${error.message}`);
    }
  }

  console.log('\n');

  // Test 2: Tasks inventory-machines endpoint
  try {
    console.log('2️⃣ Testing /api/tasks/inventory-machines...');
    const response = await axios.get(`${baseURL}/tasks/inventory-machines`, {
      headers: {
        Authorization: 'Bearer dummy-token',
      },
    });
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Makina sayısı: ${response.data.length}`);
    if (response.data.length > 0) {
      console.log(
        `📋 İlk makina: ${response.data[0].kod || response.data[0].makinaNo} - ${response.data[0].ad}`,
      );
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('ℹ️  401 Auth hatası (beklenen)');
    } else {
      console.log(`❌ Hata: ${error.message}`);
    }
  }

  console.log('\n');

  // Test 3: Server health check
  try {
    console.log('3️⃣ Testing server health...');
    const response = await axios.get(`${baseURL.replace('/api', '')}/health`);
    console.log(`✅ Server çalışıyor: ${response.status}`);
  } catch (error) {
    console.log(`❌ Server hatası: ${error.message}`);
  }
};

testMachineAPIs().catch(console.error);
