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

    // Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      process.exit(1);
    }

    // Genel departmanını bul
    const genelDepartment = await Department.findOne({ ad: 'Genel' });
    if (!genelDepartment) {
      console.log('❌ Genel departmanı bulunamadı');
      process.exit(1);
    }

    console.log('✅ Rol ve departman bulundu');
    console.log('   Ortacı ID:', ortaciRole._id);
    console.log('   Genel ID:', genelDepartment._id);

    // Mevcut Ortacı checklistlerini temizle
    await ChecklistTemplate.deleteMany({
      hedefRol: ortaciRole._id,
      ad: 'Günlük Ortacı Kontrol',
    });

    // Ortacı için günlük checklist oluştur
    const checklistTemplate = new ChecklistTemplate({
      ad: 'Günlük Ortacı Kontrol',
      tur: 'rutin',
      hedefRol: ortaciRole._id,
      hedefDepartman: genelDepartment._id,
      maddeler: [
        {
          soru: 'Makine temizliği yapıldı mı?',
          puan: 15,
          aciklama: 'Makine ve çevre temizliği kontrol edilmeli',
        },
        {
          soru: 'Malzeme kontrolü yapıldı mı?',
          puan: 20,
          aciklama: 'Gerekli malzemeler hazır ve yeterli olmalı',
        },
        {
          soru: 'Güvenlik kontrolleri yapıldı mı?',
          puan: 25,
          aciklama: 'Güvenlik ekipmanları ve önlemleri kontrol edilmeli',
        },
        {
          soru: 'Kalite kontrol yapıldı mı?',
          puan: 20,
          aciklama: 'Üretilen ürünlerin kalitesi kontrol edilmeli',
        },
        {
          soru: 'Raporlama yapıldı mı?',
          puan: 10,
          aciklama: 'Günlük raporlar ve kayıtlar tutulmalı',
        },
      ],
      periyot: 'gunluk',
      kategori: 'Checklist',
      aktif: true,
    });

    await checklistTemplate.save();
    console.log('✅ Checklist template oluşturuldu:', checklistTemplate.ad);

    // Ortacı kullanıcılarını bul
    const ortaciUsers = await User.find({
      roller: ortaciRole._id,
      departmanlar: genelDepartment._id,
      durum: 'aktif',
    });

    console.log(`👥 ${ortaciUsers.length} ortacı kullanıcısı bulundu`);

    // Her kullanıcı için görev oluştur
    const tasks = [];
    for (const user of ortaciUsers) {
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
        console.log(`⏭️ ${user.kullaniciAdi} için bugün görev zaten mevcut`);
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
        hedefTarih: today,
        otomatikOlusturuldu: true,
      });

      tasks.push(task);
    }

    if (tasks.length > 0) {
      await Task.insertMany(tasks);
      console.log(`🎯 ${tasks.length} görev başarıyla oluşturuldu!`);
    }

    // İstatistikler
    const totalTasks = await Task.countDocuments({
      checklist: checklistTemplate._id,
    });
    console.log(`📊 Bu checklist için toplam ${totalTasks} görev mevcut`);

    console.log('\n✅ İşlem tamamlandı');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
  }
})();
