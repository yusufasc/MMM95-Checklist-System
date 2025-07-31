const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const InventoryItem = require('../models/InventoryItem');

async function activateUsersAndAssignVardiya() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('✅ MongoDB bağlantısı başarılı');

    // 1. Tüm kullanıcıları aktif hale getir
    const updateResult = await User.updateMany(
      { aktif: { $ne: true } },
      { $set: { aktif: true } },
    );

    console.log(
      `✅ ${updateResult.modifiedCount} kullanıcı aktif hale getirildi`,
    );

    // 2. VARDİYA AMİRİ rolünü bul
    const vardiyaRole = await Role.findOne({ ad: 'VARDİYA AMİRİ' });
    const ustaRole = await Role.findOne({ ad: 'Usta' });

    if (!vardiyaRole) {
      console.log('❌ VARDİYA AMİRİ rolü bulunamadı');
      return;
    }

    if (!ustaRole) {
      console.log('❌ Usta rolü bulunamadı');
      return;
    }

    console.log(`🎭 VARDİYA AMİRİ rolü bulundu: ${vardiyaRole._id}`);
    console.log(`🔧 Usta rolü bulundu: ${ustaRole._id}`);

    // 3. mehmet.kaya kullanıcısına VARDİYA AMİRİ rolü ata
    const mehmetUser = await User.findOne({ kullaniciAdi: 'mehmet.kaya' });

    if (mehmetUser) {
      if (!mehmetUser.roller.includes(vardiyaRole._id)) {
        mehmetUser.roller.push(vardiyaRole._id);
        await mehmetUser.save();
        console.log('✅ mehmet.kaya kullanıcısına VARDİYA AMİRİ rolü eklendi');
      } else {
        console.log('✅ mehmet.kaya zaten VARDİYA AMİRİ rolüne sahip');
      }
    } else {
      console.log('❌ mehmet.kaya kullanıcısı bulunamadı');
    }

    // 4. usta.test kullanıcısına Usta rolü ata
    const ustaTestUser = await User.findOne({ kullaniciAdi: 'usta.test' });

    if (ustaTestUser) {
      if (!ustaTestUser.roller.includes(ustaRole._id)) {
        ustaTestUser.roller.push(ustaRole._id);
        await ustaTestUser.save();
        console.log('✅ usta.test kullanıcısına Usta rolü eklendi');
      } else {
        console.log('✅ usta.test zaten Usta rolüne sahip');
      }
    } else {
      console.log('❌ usta.test kullanıcısı bulunamadı');
    }

    // 5. Makinaları bul ve ata
    const machines = await InventoryItem.find({
      kategori: { $regex: /makina/i },
    }).limit(15);

    console.log(`🔧 ${machines.length} makina bulundu`);

    // mehmet.kaya'ya makinaları ata
    if (mehmetUser && machines.length > 0) {
      mehmetUser.secilenMakinalar = machines.map(m => m._id);
      await mehmetUser.save();
      console.log(`✅ mehmet.kaya'ya ${machines.length} makina atandı`);
    }

    // usta.test'e makinaları ata
    if (ustaTestUser && machines.length > 0) {
      ustaTestUser.secilenMakinalar = machines.map(m => m._id);
      await ustaTestUser.save();
      console.log(`✅ usta.test'e ${machines.length} makina atandı`);
    }

    // 6. Kontrol
    const vardiyaUsers = await User.find({
      roller: vardiyaRole._id,
      aktif: true,
    }).populate('roller', 'ad');

    const ustaUsers = await User.find({
      roller: ustaRole._id,
      aktif: true,
    }).populate('roller', 'ad');

    console.log(`\n👥 ${vardiyaUsers.length} VARDİYA AMİRİ kullanıcısı:`);
    vardiyaUsers.forEach(user => {
      console.log(`  - ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
      console.log(
        `    Seçilen Makina: ${user.secilenMakinalar?.length || 0} adet`,
      );
    });

    console.log(`\n🔧 ${ustaUsers.length} Usta kullanıcısı:`);
    ustaUsers.forEach(user => {
      console.log(`  - ${user.kullaniciAdi} (${user.ad} ${user.soyad})`);
      console.log(
        `    Seçilen Makina: ${user.secilenMakinalar?.length || 0} adet`,
      );
    });

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    await mongoose.connection.close();
  }
}

activateUsersAndAssignVardiya();
