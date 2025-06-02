const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');

const debugOrtaciMachineSelection = async () => {
  try {
    // MongoDB'a bağlan
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mmm-checklist';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // 1. Ortacı rolünü bul
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });
    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }
    console.log(`📋 Ortacı Role ID: ${ortaciRole._id}`);

    // 2. Ortacı kullanıcılarını bul
    const ortaciUsers = await User.find({
      roller: ortaciRole._id,
    }).select('kullaniciAdi ad soyad secilenMakinalar');

    console.log(`\n👥 ${ortaciUsers.length} Ortacı kullanıcı bulundu:`);
    ortaciUsers.forEach(user => {
      console.log(
        `  - ${user.kullaniciAdi} (${user.ad} ${user.soyad}): ${user.secilenMakinalar?.length || 0} makina seçili`,
      );
      if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
        console.log(`    └─ Makina ID'leri: ${user.secilenMakinalar.join(', ')}`);
      }
    });

    // 3. Makina kategorilerini kontrol et
    console.log('\n🔧 Makina kategorileri kontrol ediliyor...');
    const machineCategories = await InventoryCategory.find({
      ad: { $regex: /makina|makine|machine/i },
      aktif: true,
    }).select('_id ad');

    console.log(`📋 Bulunan makina kategorileri (${machineCategories.length}):`);
    machineCategories.forEach(cat => {
      console.log(`  - ${cat.ad} (ID: ${cat._id})`);
    });

    // 4. Erişilebilir makinaları kontrol et
    console.log('\n📦 Erişilebilir makinalar kontrol ediliyor...');
    const machines = await InventoryItem.find({
      $or: [
        { kategoriId: { $in: machineCategories.map(c => c._id) } },
        { envanterKodu: { $regex: /mak|machine/i } },
        { 'dinamikAlanlar.Makine Adı': { $exists: true } },
      ],
      aktif: true,
      durum: { $in: ['aktif', 'bakim'] },
    })
      .select('envanterKodu ad lokasyon kategoriId durum dinamikAlanlar')
      .populate('kategoriId', 'ad')
      .sort({ envanterKodu: 1 });

    console.log(`📦 Toplam erişilebilir makina sayısı: ${machines.length}`);

    if (machines.length > 0) {
      console.log('📋 İlk 5 makina:');
      machines.slice(0, 5).forEach((machine, index) => {
        console.log(
          `  ${index + 1}. ${machine.envanterKodu} - ${machine.ad} (${machine.kategoriId?.ad || 'Kategori yok'})`,
        );
      });
    }

    // 5. Paketlemeci kullanıcılarını karşılaştırma için kontrol et
    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    if (paketlemeciRole) {
      const paketlemeciUsers = await User.find({
        roller: paketlemeciRole._id,
      }).select('kullaniciAdi secilenMakinalar');

      console.log(`\n🔄 Karşılaştırma - ${paketlemeciUsers.length} Paketlemeci kullanıcı:`);
      paketlemeciUsers.forEach(user => {
        console.log(
          `  - ${user.kullaniciAdi}: ${user.secilenMakinalar?.length || 0} makina seçili`,
        );
      });
    }

    // 6. Ortacı kullanıcılarına makina atama önerisi
    if (machines.length > 0 && ortaciUsers.length > 0) {
      console.log('\n💡 Çözüm Önerisi:');
      console.log('Ortacı kullanıcılarına makina atamak için şu komutu çalıştırabilirsiniz:');
      console.log('node scripts/fixOrtaciMachineSelection.js');
    }

    // 7. API endpoint simülasyonu
    console.log('\n🧪 API Endpoint Simülasyonu:');
    console.log('GET /api/inventory/machines-for-tasks response:');
    const formattedMachines = machines.slice(0, 3).map(machine => ({
      _id: machine._id,
      kod: machine.envanterKodu,
      ad: machine.dinamikAlanlar?.get('Makine Adı') || machine.ad,
      lokasyon: machine.lokasyon || '',
      kategori: machine.kategoriId?.ad || '',
      durum: machine.durum,
    }));
    console.log(JSON.stringify(formattedMachines, null, 2));
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

debugOrtaciMachineSelection().catch(console.error);
