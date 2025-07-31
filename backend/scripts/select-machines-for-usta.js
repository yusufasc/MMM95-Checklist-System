const axios = require('axios');

async function selectMachinesForUsta() {
  try {
    console.log('🔧 Usta kullanıcısı için makina seçimi yapılıyor...\n');

    // Login yap
    const loginResponse = await axios.post(
      'http://localhost:5000/api/auth/login',
      {
        kullaniciAdi: 'usta.test',
        sifre: 'usta123',
      },
    );

    const token = loginResponse.data.token;
    console.log('✅ Login başarılı\n');

    // Mevcut makinaları getir
    const machinesResponse = await axios.get(
      'http://localhost:5000/api/inventory/machines?source=all',
      {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const machines = machinesResponse.data;
    console.log(`📋 Toplam ${machines.length} makina bulundu\n`);

    if (machines.length === 0) {
      console.log('❌ Hiç makina bulunamadı!');
      return;
    }

    // İlk 3 makinayı seç
    const selectedMachines = machines.slice(0, 3);
    const selectedMachineIds = selectedMachines.map(m => m._id);

    console.log('🎯 Seçilen makinalar:');
    selectedMachines.forEach(m => {
      console.log(`   - ${m.kod || m.makinaNo} - ${m.ad}`);
    });

    // Makina seçimini kaydet
    try {
      await axios.post(
        'http://localhost:5000/api/tasks/select-machines',
        { selectedMachines: selectedMachineIds },
        {
          headers: {
            'x-auth-token': token,
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('\n✅ Makina seçimi başarıyla kaydedildi!');

      // Seçimi doğrula
      const verifyResponse = await axios.get(
        'http://localhost:5000/api/tasks/my-selected-machines',
        {
          headers: {
            'x-auth-token': token,
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(
        `\n📍 Doğrulama: ${verifyResponse.data.length} makina seçili`,
      );
    } catch (error) {
      console.error(
        '❌ Makina seçimi kaydedilemedi:',
        error.response?.data || error.message,
      );
    }
  } catch (error) {
    console.error('❌ Hata:', error.response?.data || error.message);
  }
}

selectMachinesForUsta();
