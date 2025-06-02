const mongoose = require('mongoose');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Task = require('../models/Task');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
require('dotenv').config();

// Yardımcı fonksiyon: Checklist için tüm kullanıcılara görev oluştur
const createTasksForAllUsers = async checklist => {
  try {
    console.log(`📋 ${checklist.ad} için tüm kullanıcılara görev oluşturuluyor...`);

    // Hedef role ve departmana sahip tüm aktif kullanıcıları bul
    const users = await User.find({
      roller: checklist.hedefRol,
      departmanlar: checklist.hedefDepartman,
      durum: 'aktif',
    });

    console.log(`👥 ${users.length} kullanıcı bulundu`);

    const tasks = [];
    for (const user of users) {
      // Hedef tarihi hesapla
      let hedefTarih;
      const now = new Date();

      switch (checklist.periyot) {
      case 'gunluk':
        hedefTarih = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün sonra
        break;
      case 'haftalik':
        hedefTarih = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 hafta sonra
        break;
      case 'aylik':
        hedefTarih = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 ay sonra
        break;
      case 'olayBazli':
      default:
        hedefTarih = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün sonra
        break;
      }

      // Yeni görev oluştur
      const task = new Task({
        kullanici: user._id,
        checklist: checklist._id,
        maddeler: checklist.maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        durum: 'bekliyor',
        periyot: checklist.periyot,
        hedefTarih: hedefTarih,
        otomatikOlusturuldu: true,
      });

      tasks.push(task);
      console.log(`✅ ${user.kullaniciAdi} için görev hazırlandı`);
    }

    // Tüm görevleri toplu olarak kaydet
    if (tasks.length > 0) {
      await Task.insertMany(tasks);
      console.log(`🎯 ${tasks.length} görev başarıyla oluşturuldu!`);
    }

    return tasks.length;
  } catch (error) {
    console.error('Görevler oluşturulurken hata:', error);
    throw error;
  }
};

const testChecklistCreation = async () => {
  try {
    console.log('🧪 Checklist oluşturma testi başlatılıyor...');

    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB bağlantısı başarılı!');

    // Mevcut verileri kontrol et
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    const uretimDept = await Department.findOne({ ad: 'Üretim' });

    if (!paketlemeciRole || !uretimDept) {
      console.log('❌ Gerekli rol veya departman bulunamadı!');
      return;
    }

    console.log('📋 Paketlemeci rolü için yeni checklist oluşturuluyor...');

    // Test checklist'i oluştur
    const testChecklist = new ChecklistTemplate({
      ad: 'Test Paketlemeci Checklist 2',
      tur: 'rutin',
      hedefRol: paketlemeciRole._id,
      hedefDepartman: uretimDept._id,
      maddeler: [
        { soru: 'Paket etiketleri doğru mu?', puan: 10 },
        { soru: 'Ambalaj malzemeleri yeterli mi?', puan: 5 },
        { soru: 'Sevkiyat adresi kontrol edildi mi?', puan: 5 },
      ],
      periyot: 'gunluk',
    });

    await testChecklist.save();
    console.log('✅ Test checklist oluşturuldu:', testChecklist.ad);

    // Populate edilmiş hali ile al
    const populatedChecklist = await ChecklistTemplate.findById(testChecklist._id)
      .populate('hedefRol', 'ad')
      .populate('hedefDepartman', 'ad');

    // Manuel olarak görev oluşturma fonksiyonunu test et
    console.log('🔧 Manuel görev oluşturma testi...');
    await createTasksForAllUsers(populatedChecklist);

    // Paketlemeci rolündeki kullanıcıları kontrol et
    const paketlemeciUsers = await User.find({
      roller: paketlemeciRole._id,
      departmanlar: uretimDept._id,
      durum: 'aktif',
    });

    console.log(`✅ ${paketlemeciUsers.length} Paketlemeci kullanıcı için görev oluşturuldu:`);
    paketlemeciUsers.forEach(user => {
      console.log(`  - ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
    });

    // Oluşturulan görevleri kontrol et
    const createdTasks = await Task.find({
      checklist: testChecklist._id,
    }).populate('kullanici', 'kullaniciAdi ad soyad');

    console.log(`📋 Oluşturulan görev sayısı: ${createdTasks.length}`);
    createdTasks.forEach(task => {
      console.log(`  - ${task.kullanici.kullaniciAdi} için görev oluşturuldu`);
    });

    if (createdTasks.length === paketlemeciUsers.length) {
      console.log('🎉 TEST BAŞARILI: Tüm kullanıcılara görev oluşturuldu!');
    } else {
      console.log('❌ TEST BAŞARISIZ: Görev sayısı kullanıcı sayısıyla eşleşmiyor!');
      console.log(`Beklenen: ${paketlemeciUsers.length}, Gerçek: ${createdTasks.length}`);
    }
  } catch (error) {
    console.error('❌ Test sırasında hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

testChecklistCreation();
