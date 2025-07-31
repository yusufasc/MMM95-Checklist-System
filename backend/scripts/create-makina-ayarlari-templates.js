const mongoose = require('mongoose');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Role = require('../models/Role');
const Department = require('../models/Department');

mongoose.connect('mongodb://localhost:27017/mmm-checklist');

async function createMakinaAyarlariTemplates() {
  console.log('🎯 MAKİNA AYARLARI şablonları oluşturuluyor...');

  try {
    // Roller ve departmanları al
    const roles = await Role.find();
    const departments = await Department.find();

    const adminRole = roles.find(r => r.ad === 'Admin');
    const vardiyaAmiriRole = roles.find(r => r.ad === 'VARDİYA AMİRİ');
    const kaliteKontrolRole = roles.find(r => r.ad === 'Kalite Kontrol');
    const ustaRole = roles.find(r => r.ad === 'Usta');

    const uretimDept =
      departments.find(d => d.ad === 'Üretim') || departments[0];

    if (!adminRole || !uretimDept) {
      console.error('❌ Gerekli roller veya departmanlar bulunamadı');
      return;
    }

    // MAKİNA AYARLARI 1 şablonu
    const template1 = new ChecklistTemplate({
      ad: 'MAKİNA AYARLARI 1',
      tur: 'rutin',
      hedefRol: ustaRole._id,
      hedefDepartman: uretimDept._id,
      periyot: 'olayBazli',
      kategori: 'Checklist',
      degerlendirmeRolleri: [vardiyaAmiriRole._id, adminRole._id],
      maddeler: [
        {
          soru: 'Makina güvenlik sistemleri kontrol edildi',
          puan: 10,
          aciklama: 'Acil stop, güvenlik kapıları, ışık perdeleri',
          fotografGereklimi: true,
          zorunlu: true,
        },
        {
          soru: 'Makina sıcaklık ayarları doğru şekilde yapıldı',
          puan: 15,
          aciklama: 'İşleme uygun sıcaklık değerleri',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Basınç ayarları kontrol edildi ve ayarlandı',
          puan: 15,
          aciklama: 'Optimum basınç değerleri',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Hız ayarları yapıldı',
          puan: 10,
          aciklama: 'Ürün tipine uygun hız değerleri',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Kalibrasyon işlemleri tamamlandı',
          puan: 20,
          aciklama: 'Ölçüm aletlerinin kalibrasyonu',
          fotografGereklimi: true,
          zorunlu: true,
        },
        {
          soru: 'Test üretimi yapıldı ve onaylandı',
          puan: 15,
          aciklama: 'İlk ürün kalite kontrolü',
          fotografGereklimi: true,
          zorunlu: true,
        },
        {
          soru: 'Makina temizliği yapıldı',
          puan: 10,
          aciklama: 'Genel temizlik ve yağlama',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Döküman ve kayıtlar güncellendi',
          puan: 5,
          aciklama: 'Ayar fişleri ve kayıt formları',
          fotografGereklimi: false,
          zorunlu: true,
        },
      ],
      kontrolPuani: 25,
      aktif: true,
    });

    // MAKİNA AYARLARI 2 şablonu
    const template2 = new ChecklistTemplate({
      ad: 'MAKİNA AYARLARI 2',
      tur: 'rutin',
      hedefRol: ustaRole._id,
      hedefDepartman: uretimDept._id,
      periyot: 'olayBazli',
      kategori: 'Checklist',
      degerlendirmeRolleri: [kaliteKontrolRole._id, adminRole._id],
      maddeler: [
        {
          soru: 'Elektriksel kontroller yapıldı',
          puan: 15,
          aciklama: 'Voltaj, amper, topraklama kontrolleri',
          fotografGereklimi: true,
          zorunlu: true,
        },
        {
          soru: 'Mekanik bağlantılar kontrol edildi',
          puan: 15,
          aciklama: 'Civata, somun, kaynak bağlantıları',
          fotografGereklimi: true,
          zorunlu: true,
        },
        {
          soru: 'Yağlama sistemi kontrol edildi',
          puan: 10,
          aciklama: 'Yağ seviyeleri, pompa çalışması',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Sensör ayarları yapıldı',
          puan: 20,
          aciklama: 'Pozisyon, basınç, sıcaklık sensörleri',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'PLC parametreleri güncellendi',
          puan: 20,
          aciklama: 'Program ayarları ve değişkenler',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Alarm sistemi test edildi',
          puan: 10,
          aciklama: 'Uyarı ve alarm fonksiyonları',
          fotografGereklimi: false,
          zorunlu: true,
        },
        {
          soru: 'Operatör eğitimi verildi',
          puan: 10,
          aciklama: 'Yeni ayarlar hakkında bilgilendirme',
          fotografGereklimi: false,
          zorunlu: true,
        },
      ],
      kontrolPuani: 30,
      aktif: true,
    });

    // Mevcut şablonları kontrol et
    const existing1 = await ChecklistTemplate.findOne({
      ad: 'MAKİNA AYARLARI 1',
    });
    const existing2 = await ChecklistTemplate.findOne({
      ad: 'MAKİNA AYARLARI 2',
    });

    if (existing1) {
      console.log('⚠️ MAKİNA AYARLARI 1 şablonu zaten mevcut');
    } else {
      await template1.save();
      console.log('✅ MAKİNA AYARLARI 1 şablonu oluşturuldu');
    }

    if (existing2) {
      console.log('⚠️ MAKİNA AYARLARI 2 şablonu zaten mevcut');
    } else {
      await template2.save();
      console.log('✅ MAKİNA AYARLARI 2 şablonu oluşturuldu');
    }

    console.log('\n🎯 Şablon Özeti:');
    console.log('📋 MAKİNA AYARLARI 1:');
    console.log('  - Hedef: Usta rolü');
    console.log('  - Değerlendiren: VARDİYA AMİRİ, Admin');
    console.log('  - Maddeler: 8 adet (100 puan)');
    console.log('  - Kontrol Puanı: 25 puan');

    console.log('📋 MAKİNA AYARLARI 2:');
    console.log('  - Hedef: Usta rolü');
    console.log('  - Değerlendiren: Kalite Kontrol, Admin');
    console.log('  - Maddeler: 7 adet (100 puan)');
    console.log('  - Kontrol Puanı: 30 puan');

    console.log('\n🎮 Kullanım:');
    console.log(
      '1. http://localhost:3000/checklists sayfasında şablonlar görünecek',
    );
    console.log(
      '2. http://localhost:3000/personnel-tracking → Kalıp Değişim segmentinde değerlendirme butonları aktif olacak',
    );
    console.log('3. Yetkili roller değerlendirme yapabilecek');
    console.log(
      '4. Puanlar MyActivity → Bonus Puanlarım segmentinde görünecek',
    );
  } catch (error) {
    console.error('❌ Şablon oluşturma hatası:', error);
  }

  mongoose.disconnect();
}

createMakinaAyarlariTemplates().catch(console.error);
