const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');
const WorkTask = require('./models/WorkTask');

async function resetScores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm_checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔌 MongoDB bağlantısı kuruldu');
    console.log('🧹 Tüm puanlar sıfırlanıyor...');

    // Task puanlarını sıfırla
    const taskResult = await Task.updateMany(
      {},
      {
        $unset: {
          toplamPuan: '',
          kontrolToplamPuani: '',
          puanlayanKullanici: '',
          maddePuanlari: '',
        },
      },
    );

    // WorkTask puanlarını sıfırla
    const workTaskResult = await WorkTask.updateMany(
      {},
      {
        $unset: {
          toplamPuan: '',
          kontrolToplamPuani: '',
          puanlayanKullanici: '',
          maddePuanlari: '',
        },
      },
    );

    console.log('✅ Task puanları sıfırlandı:', taskResult.modifiedCount, 'kayıt');
    console.log('✅ WorkTask puanları sıfırlandı:', workTaskResult.modifiedCount, 'kayıt');

    // Onay durumlarını da sıfırla (isteğe bağlı)
    const taskStatusResult = await Task.updateMany({ durum: 'onaylandi' }, { durum: 'tamamlandi' });

    const workTaskStatusResult = await WorkTask.updateMany(
      { durum: 'onaylandi' },
      { durum: 'tamamlandi' },
    );

    console.log('✅ Task durumları sıfırlandı:', taskStatusResult.modifiedCount, 'kayıt');
    console.log('✅ WorkTask durumları sıfırlandı:', workTaskStatusResult.modifiedCount, 'kayıt');

    await mongoose.disconnect();
    console.log('\n🎉 Tüm puanlar başarıyla sıfırlandı!');
    console.log('📊 Artık sadece gerçek puanlamalar görünecek.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

resetScores();
