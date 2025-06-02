const axios = require('axios');

async function testUpdatedEndpoint() {
  try {
    console.log('🧪 Güncellenmiş /api/inventory/machines-for-tasks endpoint test ediliyor...');

    // Test için geçici token (gerçek test için auth gerekli)
    const testHeaders = {
      Authorization: 'Bearer test-token',
    };

    const response = await axios.get('http://localhost:5000/api/inventory/machines-for-tasks', {
      headers: testHeaders,
      timeout: 5000,
    });

    console.log('✅ Endpoint çalışıyor');
    console.log(`📊 ${response.data.length} makina bulundu:`);

    response.data.forEach((machine, index) => {
      console.log(`  ${index + 1}. ${machine.kod} - ${machine.ad} (${machine.kategori})`);
    });
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('ℹ️  Endpoint mevcut (401 auth hatası beklenen)');
      console.log('   Bu normal - giriş yapmış kullanıcı gerekli');
    } else {
      console.log(`❌ Endpoint hatası: ${error.message}`);
      if (error.response?.data) {
        console.log('   Hata detayı:', error.response.data);
      }
    }
  }
}

testUpdatedEndpoint();
