const axios = require('axios');

async function testAuthMe() {
  try {
    console.log('🔍 /auth/me endpoint test ediliyor...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      kullaniciAdi: 'orta1',
      sifre: '123456',
    });

    const token = loginRes.data.token;
    console.log('✅ Login başarılı, token alındı');

    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('📋 /auth/me response:');
    console.log('Kullanıcı adı:', meRes.data.ad, meRes.data.soyad);
    console.log(
      'Rolleri:',
      meRes.data.roller?.map(r => r.ad),
    );

    const ortaciRole = meRes.data.roller?.find(r => r.ad === 'Ortacı');
    if (ortaciRole?.checklistYetkileri) {
      console.log('📊 Ortacı checklistYetkileri sayısı:', ortaciRole.checklistYetkileri.length);
      ortaciRole.checklistYetkileri.forEach((yetki, i) => {
        console.log(
          `${i + 1}: ${yetki.hedefRol?.ad} - gorebilir=${yetki.gorebilir}, puanlayabilir=${yetki.puanlayabilir}, onaylayabilir=${yetki.onaylayabilir}`,
        );
      });

      const paketlemeciYetki = ortaciRole.checklistYetkileri.find(
        y => y.hedefRol?.ad === 'Paketlemeci',
      );
      if (paketlemeciYetki) {
        console.log(
          `🎯 Paketlemeci yetkisi: gorebilir=${paketlemeciYetki.gorebilir}, puanlayabilir=${paketlemeciYetki.puanlayabilir}`,
        );
        if (paketlemeciYetki.puanlayabilir) {
          console.log('✅ Frontend çalışacak! puanlayabilir=true');
        } else {
          console.log('❌ Frontend çalışmayacak! puanlayabilir=false');
        }
      }
    } else {
      console.log('❌ Ortacı rolü checklistYetkileri bulunamadı');
    }
  } catch (error) {
    console.error('❌ Hata:', error.response?.data || error.message);
  }
}

testAuthMe();
