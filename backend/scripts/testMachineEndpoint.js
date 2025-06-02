const http = require('http');

// Test API endpoint
const testEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory/machines-for-tasks',
    method: 'GET',
    headers: {
      Authorization: 'Bearer dummy-token',
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', jsonData);
        if (Array.isArray(jsonData)) {
          console.log(`Found ${jsonData.length} machines`);
          jsonData.forEach((machine, index) => {
            console.log(`  ${index + 1}. ${machine.kod} - ${machine.ad}`);
          });
        }
      } catch (error) {
        console.log('JSON parse error:', error.message);
      }
    });
  });

  req.on('error', error => {
    console.error('Request error:', error);
  });

  req.end();
};

console.log('🧪 Testing /api/inventory/machines-for-tasks endpoint...');
testEndpoint();
