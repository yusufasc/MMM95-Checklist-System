const mongoose = require('mongoose');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Task = require('../models/Task');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');

    console.log('🔗 MongoDB\'ye bağlandı');

    // Paketlemeci rolünü bul
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    if (!paketlemeciRole) {
      console.log('❌ Paketlemeci rolü bulunamadı');
      process.exit(1);
    }

    // Genel departmanını bul
    const genelDepartment = await Department.findOne({ ad: 'Genel' });
    if (!genelDepartment) {
      console.log('❌ Genel departmanı bulunamadı');
      process.exit(1);
    }

    console.log('✅ Rol ve departman bulundu');
    console.log('   Paketlemeci ID:', paketlemeciRole._id);
    console.log('   Genel ID:', genelDepartment._id);

    // Mevcut Paketlemeci checklistlerini temizle
    await ChecklistTemplate.deleteMany({
      hedefRol: paketlemeciRole._id,
      ad: 'Günlük Paketleme Kontrol',
    });

    // Paketlemeci için günlük checklist oluştur
    const checklistTemplate = new ChecklistTemplate({
      ad: 'Günlük Paketleme Kontrol',
      tur: 'rutin',
      hedefRol: paketlemeciRole._id,
      hedefDepartman: genelDepartment._id,
      maddeler: [
        {
          soru: 'Paketleme malzemeleri hazır mı?',
          puan: 10,
          aciklama: 'Karton kutu, bantlar, etiketler kontrol edilmeli',
        },
        {
          soru: 'Etiketleme doğru yapıldı mı?',
          puan: 15,
          aciklama: 'Ürün etiketi, barkod, tarih bilgileri doğru olmalı',
        },
        {
          soru: 'Kalite kontrol yapıldı mı?',
          puan: 20,
          aciklama: 'Paketlenen ürünlerin kalitesi kontrol edilmeli',
        },
        {
          soru: 'Paketleme alanı temiz mi?',
          puan: 10,
          aciklama: 'Çalışma alanının düzen ve temizliği kontrol edilmeli',
        },
      ],
      periyot: 'gunluk',
      kategori: 'Checklist',
      aktif: true,
    });

    await checklistTemplate.save();
    console.log('✅ Checklist template oluşturuldu:', checklistTemplate.ad);

    // Paketlemeci kullanıcılarını bul
    const paketlemeciUsers = await User.find({
      roller: paketlemeciRole._id,
      departmanlar: genelDepartment._id,
      durum: 'aktif',
    });

    console.log(
      `👥 ${paketlemeciUsers.length} paketlemeci kullanıcısı bulundu`,
    );

    // Her kullanıcı için görev oluştur
    const tasks = [];
    for (const user of paketlemeciUsers) {
      // Bu kullanıcı için bu checklist'ten bugün için görev var mı kontrol et
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingTask = await Task.findOne({
        kullanici: user._id,
        checklist: checklistTemplate._id,
        hedefTarih: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      if (existingTask) {
        console.log(`⚠️  ${user.kullaniciAdi} için bugün zaten görev mevcut`);
        continue;
      }

      // Yeni görev oluştur
      const task = new Task({
        kullanici: user._id,
        checklist: checklistTemplate._id,
        maddeler: checklistTemplate.maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        durum: 'bekliyor',
        periyot: 'gunluk',
        hedefTarih: tomorrow,
        otomatikOlusturuldu: true,
      });

      tasks.push(task);
      console.log(`✅ ${user.kullaniciAdi} için görev hazırlandı`);
    }

    // Görevleri kaydet
    if (tasks.length > 0) {
      await Task.insertMany(tasks);
      console.log(`🎯 ${tasks.length} görev başarıyla oluşturuldu!`);
    } else {
      console.log('ℹ️  Yeni görev oluşturulmadı (zaten mevcut)');
    }

    // Sonuçları kontrol et
    const totalTasks = await Task.countDocuments({
      checklist: checklistTemplate._id,
    });
    console.log(`📊 Bu checklist için toplam ${totalTasks} görev mevcut`);

    await mongoose.disconnect();
    console.log('\n✅ İşlem tamamlandı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
})();
