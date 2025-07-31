const mongoose = require('mongoose');
const HRScore = require('../models/HRScore');
const User = require('../models/User');
const HRSettings = require('../models/HRSettings');

async function createTestData() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');

    // Test kullanıcılarını bul
    const testUsers = await User.find({
      kullaniciAdi: { $in: ['usta.test', 'ortaci.test', 'paketlemeci.test'] },
    }).limit(3);

    if (testUsers.length === 0) {
      console.log('❌ Test kullanıcıları bulunamadı');
      process.exit(1);
    }

    // HR ayarlarını al
    const settings = await HRSettings.findOne();
    if (!settings) {
      console.log('❌ HR ayarları bulunamadı');
      process.exit(1);
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Her kullanıcı için test verileri oluştur
    for (const user of testUsers) {
      console.log(
        `\n📝 ${user.ad} ${user.soyad} için test verileri oluşturuluyor...`,
      );

      // Mevcut HR score'u bul veya oluştur
      let hrScore = await HRScore.findOne({
        kullanici: user._id,
        'donem.yil': currentYear,
        'donem.ay': currentMonth,
      });

      if (!hrScore) {
        hrScore = new HRScore({
          kullanici: user._id,
          donem: {
            yil: currentYear,
            ay: currentMonth,
          },
        });
      }

      // Fazla mesai kayıtları ekle (son 7 gün)
      for (let i = 0; i < 7; i++) {
        const tarih = new Date();
        tarih.setDate(tarih.getDate() - i);

        const mesaiSaat = Math.floor(Math.random() * 3) + 1; // 1-3 saat arası
        const mesaiPuani = mesaiSaat * settings.mesaiPuanlama.saatBasinaPuan;

        hrScore.mesaiKayitlari.push({
          tarih: tarih,
          saat: mesaiSaat,
          puan: mesaiPuani,
          aciklama: `Test mesai kaydı - ${i + 1}. gün`,
          olusturanKullanici: user._id,
        });
      }

      // Devamsızlık kayıtları ekle (rastgele 2-3 kayıt)
      const devamsizlikSayisi = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < devamsizlikSayisi; i++) {
        const tarih = new Date();
        tarih.setDate(tarih.getDate() - (i * 7 + 3)); // Haftalık aralıklarla

        const isGunluk = Math.random() > 0.5;

        if (isGunluk) {
          const gun = 1;
          const puan = gun * settings.devamsizlikPuanlama.gunBasinaPuan;

          hrScore.devamsizlikKayitlari.push({
            tarih: tarih,
            tur: 'tam_gun',
            miktar: gun,
            puan: puan,
            aciklama: 'Test devamsızlık - tam gün',
            olusturanKullanici: user._id,
          });
        } else {
          const saat = Math.floor(Math.random() * 4) + 1; // 1-4 saat
          const puan = saat * settings.devamsizlikPuanlama.saatBasinaPuan;

          hrScore.devamsizlikKayitlari.push({
            tarih: tarih,
            tur: 'saat',
            miktar: saat,
            puan: puan,
            aciklama: `Test devamsızlık - ${saat} saat`,
            olusturanKullanici: user._id,
          });
        }
      }

      await hrScore.save();

      // Özet bilgi
      const toplamMesaiPuani = hrScore.mesaiKayitlari.reduce(
        (sum, m) => sum + m.puan,
        0,
      );
      const toplamDevamsizlikPuani = hrScore.devamsizlikKayitlari.reduce(
        (sum, d) => sum + d.puan,
        0,
      );

      console.log(`✅ ${user.ad} ${user.soyad} için veriler oluşturuldu:`);
      console.log(
        `   - Mesai kayıtları: ${hrScore.mesaiKayitlari.length} adet (Toplam: +${toplamMesaiPuani} puan)`,
      );
      console.log(
        `   - Devamsızlık kayıtları: ${hrScore.devamsizlikKayitlari.length} adet (Toplam: ${toplamDevamsizlikPuani} puan)`,
      );
      console.log(
        `   - Net puan: ${toplamMesaiPuani + toplamDevamsizlikPuani}`,
      );
    }

    await mongoose.connection.close();
    console.log('\n✅ Test verileri başarıyla oluşturuldu');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

createTestData();
