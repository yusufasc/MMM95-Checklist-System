const mongoose = require('mongoose');
require('dotenv').config();

const getRealMachineIds = async () => {
  try {
    // MongoDB'a bağlan
    const mongoURI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB bağlantısı başarılı: ${mongoURI}`);

    // Inventory collection'ından makina listesini al
    const db = mongoose.connection.db;
    const inventoryCollection = db.collection('inventoryitems');

    // Makina kategorisindeki öğeleri bul
    const machines = await inventoryCollection
      .find({
        kategori: { $regex: /makina/i },
        durum: 'aktif',
      })
      .limit(10)
      .toArray();

    console.log(`📋 Bulunan makina sayısı: ${machines.length}`);

    if (machines.length > 0) {
      console.log('\n🔧 İlk 5 Makina:');
      machines.slice(0, 5).forEach((machine, index) => {
        console.log(`${index + 1}. ID: ${machine._id}`);
        console.log(`   Ad: ${machine.ad}`);
        console.log(`   Kod: ${machine.kod}`);
        console.log(`   Kategori: ${machine.kategori}`);
        console.log('   ---');
      });

      // İlk 3 makina ID'sini al
      const firstThreeMachineIds = machines
        .slice(0, 3)
        .map(m => m._id.toString());
      console.log('\n🎯 İlk 3 Makina ID\'si:');
      firstThreeMachineIds.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
      });

      return firstThreeMachineIds;
    } else {
      console.log('❌ Hiç makina bulunamadı');

      // Tüm inventory öğelerini kontrol et
      const allItems = await inventoryCollection.find({}).limit(5).toArray();
      console.log('\n📦 İlk 5 Inventory Öğesi:');
      allItems.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item._id}`);
        console.log(`   Ad: ${item.ad}`);
        console.log(`   Kategori: ${item.kategori}`);
        console.log('   ---');
      });

      // İlk 3 öğenin ID'sini al
      const firstThreeIds = allItems.slice(0, 3).map(m => m._id.toString());
      return firstThreeIds;
    }
  } catch (error) {
    console.error('❌ Hata:', error.message);
    return [];
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

getRealMachineIds().then(machineIds => {
  if (machineIds.length > 0) {
    console.log('\n✅ Gerçek makina ID\'leri alındı:', machineIds);
  }
  process.exit(0);
});
