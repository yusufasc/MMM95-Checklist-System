const axios = require('axios');

async function testRoleAPI() {
  try {
    console.log('🚀 Roles API test başlatılıyor...');

    // Biraz bekle ki server hazır olsun
    await new Promise(resolve => setTimeout(resolve, 3000));

    // İlk önce admin kullanıcısı ile login yapalım (token almak için)
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        kullaniciAdi: 'admin',
        sifre: '123456', // Güncellenmiş admin şifresi
      });

      const token = loginResponse.data.token;
      console.log('✅ Login başarılı, token alındı');

      // Şimdi roles API'sini test et
      const rolesResponse = await axios.get('http://localhost:5000/api/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📋 Roles API response alındı');

      // Ortacı rolünü bul
      const ortaciRole = rolesResponse.data.find(role => role.ad === 'Ortacı');

      if (ortaciRole) {
        console.log('\n🎯 Ortacı rolü API response:');
        console.log('  ID:', ortaciRole._id);
        console.log('  Ad:', ortaciRole.ad);
        console.log('  checklistYetkileri sayısı:', ortaciRole.checklistYetkileri?.length);

        if (ortaciRole.checklistYetkileri) {
          console.log('\n📊 API checklistYetkileri:');
          ortaciRole.checklistYetkileri.forEach((yetki, index) => {
            console.log(`  ${index}:`);
            console.log(`    hedefRol: ${JSON.stringify(yetki.hedefRol)}`);
            console.log(`    gorebilir: ${yetki.gorebilir} (${typeof yetki.gorebilir})`);
            console.log(
              `    puanlayabilir: ${yetki.puanlayabilir} (${typeof yetki.puanlayabilir})`,
            );
            console.log(
              `    onaylayabilir: ${yetki.onaylayabilir} (${typeof yetki.onaylayabilir})`,
            );
          });

          // Paketlemeci yetkisini ara
          const paketlemeciYetki = ortaciRole.checklistYetkileri.find(
            yetki => yetki.hedefRol?.ad === 'Paketlemeci',
          );

          if (paketlemeciYetki) {
            console.log('\n🎯 API Paketlemeci yetkisi:');
            console.log(`  gorebilir: ${paketlemeciYetki.gorebilir}`);
            console.log(`  puanlayabilir: ${paketlemeciYetki.puanlayabilir}`);
            console.log(`  onaylayabilir: ${paketlemeciYetki.onaylayabilir}`);

            if (paketlemeciYetki.puanlayabilir === true) {
              console.log('✅ API\'de puanlayabilir TRUE!');
            } else {
              console.log('❌ API\'de puanlayabilir FALSE/undefined!');
            }
          } else {
            console.log('❌ API response\'da Paketlemeci yetkisi bulunamadı');
          }
        }
      } else {
        console.log('❌ API response\'da Ortacı rolü bulunamadı');
      }
    } catch (apiError) {
      console.error('❌ API test hatası:', apiError.message);
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      }
    }
  } catch (error) {
    console.error('❌ Script hatası:', error);
  }
}

console.log('🚀 Roles API test scripti başlatılıyor...');
testRoleAPI();
