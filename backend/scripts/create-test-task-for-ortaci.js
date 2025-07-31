const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const InventoryItem = require('../models/InventoryItem');
const Machine = require('../models/Machine');
const Department = require('../models/Department');

async function createTestTaskForOrtaci() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Ortacı kullanıcısını bul
    const ortaciUser = await User.findOne({
      kullaniciAdi: 'ortaci.test',
    }).populate('roller');
    if (!ortaciUser) {
      console.log('❌ ortaci.test kullanıcısı bulunamadı!');
      return;
    }

    console.log(
      `👤 Kullanıcı: ${ortaciUser.ad} ${ortaciUser.soyad} (${ortaciUser.kullaniciAdi})`,
    );
    console.log(`   Roller: ${ortaciUser.roller.map(r => r.ad).join(', ')}\n`);

    // İlk makinayı bul (zf101)
    let machine = await Machine.findOne({
      $or: [{ makinaNo: '01' }, { ad: 'zf101' }],
    });

    // Machine'de bulunamazsa InventoryItem'da ara
    if (!machine) {
      machine = await InventoryItem.findOne({
        $or: [{ kod: '01' }, { envanterKodu: '01' }, { ad: 'zf101' }],
      });
    }

    if (!machine) {
      console.log('❌ Makina bulunamadı!');
      console.log('   Machine ve InventoryItem modellerinde arama yapıldı.');
      return;
    }

    console.log(
      `🔧 Makina: ${machine.kod || machine.envanterKodu} - ${machine.ad}\n`,
    );

    // Ortacı için uygun bir checklist template bul
    const template = await ChecklistTemplate.findOne({
      aktif: true,
      hedefRoller: { $in: ortaciUser.roller.map(r => r._id) },
      tur: 'rutin',
    });

    if (!template) {
      console.log('❌ Ortacı için uygun checklist template bulunamadı!');

      // Departman bul
      const department = await Department.findOne({ ad: 'Üretim' });

      // Yeni bir template oluştur
      console.log('📝 Yeni checklist template oluşturuluyor...');

      const newTemplate = new ChecklistTemplate({
        ad: 'Ortacı Test Checklist',
        aciklama: 'Ortacı test görevi için checklist',
        tur: 'rutin',
        periyot: 'gunluk',
        hedefRol: ortaciUser.roller[0]._id, // İlk rolü al
        hedefDepartman: department ? department._id : null,
        hedefRoller: ortaciUser.roller.map(r => r._id),
        hedefDepartmanlar: [],
        maddeler: [
          {
            soru: 'Makina kontrolü yap',
            baslik: 'Makina kontrolü yap',
            puan: 10,
          },
          { soru: 'Temizlik yap', baslik: 'Temizlik yap', puan: 10 },
          { soru: 'Yağlama yap', baslik: 'Yağlama yap', puan: 10 },
        ],
        aktif: true,
      });

      await newTemplate.save();
      console.log('✅ Yeni template oluşturuldu\n');
    }

    const checklistTemplate =
      template ||
      (await ChecklistTemplate.findOne({ ad: 'Ortacı Test Checklist' }));

    // Yeni görev oluştur
    console.log('📋 Yeni görev oluşturuluyor...');

    const newTask = new Task({
      kullanici: ortaciUser._id,
      checklist: checklistTemplate._id,
      makina: machine._id,
      durum: 'bekliyor',
      hedefTarih: new Date(),
      periyot: checklistTemplate.periyot,
      maddeler: checklistTemplate.maddeler.map(madde => ({
        maddeId: madde._id,
        soru: madde.soru,
        baslik: madde.baslik,
        puan: madde.puan,
        yapildi: false,
      })),
    });

    await newTask.save();
    console.log('✅ Görev oluşturuldu\n');

    // Görevi tamamla
    console.log('✔️  Görev tamamlanıyor...');

    // Tüm maddeleri tamamla
    newTask.maddeler.forEach(madde => {
      madde.yapildi = true;
      madde.yapilmaTarihi = new Date();
      madde.yorum = 'Test için tamamlandı';
    });

    // Toplam puanı hesapla
    const toplamPuan = newTask.maddeler.reduce((total, madde) => {
      return total + (madde.yapildi ? madde.puan : 0);
    }, 0);

    newTask.durum = 'tamamlandi';
    newTask.tamamlanmaTarihi = new Date();
    newTask.toplamPuan = toplamPuan;

    await newTask.save();

    console.log('✅ Görev başarıyla tamamlandı!');
    console.log(`   ID: ${newTask._id}`);
    console.log(`   Checklist: ${checklistTemplate.ad}`);
    console.log(`   Makina: ${machine.ad}`);
    console.log(`   Toplam Puan: ${toplamPuan}`);
    console.log(`   Durum: ${newTask.durum}`);
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

createTestTaskForOrtaci();
