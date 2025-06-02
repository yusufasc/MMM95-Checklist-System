const mongoose = require('mongoose');
const Task = require('../../models/Task');
const WorkTask = require('../../models/WorkTask');
const User = require('../../models/User');
const ChecklistTemplate = require('../../models/ChecklistTemplate');

async function createTestCompletedTasks() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm');
    console.log('MongoDB bağlandı');

    // Paketlemeci kullanıcısını bul
    const paketlemeciUser = await User.findOne({ kullaniciAdi: 'fatma.demir' });

    if (!paketlemeciUser) {
      console.log('❌ Paketlemeci kullanıcısı bulunamadı!');
      return;
    }

    console.log('👤 Paketlemeci bulundu:', paketlemeciUser.ad, paketlemeciUser.soyad);

    // Checklist template bul
    const checklistTemplate = await ChecklistTemplate.findOne({});

    if (!checklistTemplate) {
      console.log('❌ Checklist template bulunamadı!');
      return;
    }

    console.log('📋 Checklist template bulundu:', checklistTemplate.ad);

    // Test görevi oluştur - TAMAMLANMIŞ ama PUANLANMAMIŞ
    const testTask = new Task({
      kullanici: paketlemeciUser._id,
      checklist: checklistTemplate._id,
      durum: 'tamamlandi', // Tamamlanmış
      tamamlanmaTarihi: new Date(),
      hedefTarih: new Date(), // Required field
      periyot: 'olayBazli', // Required field
      maddeler: [
        {
          soru: 'Test sorusu 1',
          cevap: true,
          puan: 10,
          maxPuan: 10,
          yorum: 'Test yorumu',
        },
        {
          soru: 'Test sorusu 2',
          cevap: true,
          puan: 15,
          maxPuan: 15,
          yorum: 'Test yorumu 2',
        },
      ],
      // toplamPuan YOKSA puanlanmamış sayılır
      // toplamPuan: null (varsayılan)
    });

    await testTask.save();
    console.log('✅ Test Task oluşturuldu:', testTask._id);

    // Test WorkTask oluştur
    const testWorkTask = new WorkTask({
      kullanici: paketlemeciUser._id,
      checklist: checklistTemplate._id,
      durum: 'tamamlandi',
      tamamlanmaTarihi: new Date(),
      maddeler: [
        {
          soru: 'WorkTask test sorusu',
          cevap: true,
          puan: 20,
          maxPuan: 20,
          yorum: 'WorkTask test yorumu',
        },
      ],
      // toplamPuan yok = puanlanmamış
    });

    await testWorkTask.save();
    console.log('✅ Test WorkTask oluşturuldu:', testWorkTask._id);

    // Kontrol et
    const puanlanmamislar = await Task.find({
      durum: 'tamamlandi',
      $or: [{ toplamPuan: { $exists: false } }, { toplamPuan: null }, { toplamPuan: 0 }],
    });

    console.log(`📊 Puanlanmamış tamamlanmış görevler: ${puanlanmamislar.length}`);

    await mongoose.disconnect();
    console.log('İşlem tamamlandı');
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

createTestCompletedTasks();
