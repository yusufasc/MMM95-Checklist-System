const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const InventoryItem = require('../models/InventoryItem');

async function fixMachineSelection() {
  try {
    // Doğru veritabanına bağlan
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('📱 MongoDB bağlantısı başarılı: mmm-checklist');

    // Rolleri kontrol et
    const Role = require('../models/Role');
    const allRoles = await Role.find({}).select('ad _id');

    console.log('📋 Sistemdeki tüm roller:');
    allRoles.forEach(role => {
      console.log(`  - ${role.ad} (ID: ${role._id})`);
    });

    const paketlemeciRole = await Role.findOne({ ad: 'Paketlemeci' });
    const ortaciRole = await Role.findOne({ ad: 'Ortacı' });

    if (!paketlemeciRole) {
      console.log('❌ Paketlemeci rolü bulunamadı');
      return;
    }

    if (!ortaciRole) {
      console.log('❌ Ortacı rolü bulunamadı');
      return;
    }

    console.log(`📋 Paketlemeci Role ID: ${paketlemeciRole._id}`);
    console.log(`📋 Ortacı Role ID: ${ortaciRole._id}`);

    // Paketlemeci kullanıcılarını bul
    const paketlemeciUsers = await User.find({
      roller: paketlemeciRole._id,
    }).select('kullaniciAdi secilenMakinalar');

    console.log(`👥 ${paketlemeciUsers.length} Paketlemeci kullanıcı bulundu:`);
    paketlemeciUsers.forEach(user => {
      console.log(`  - ${user.kullaniciAdi}: ${user.secilenMakinalar?.length || 0} makina seçili`);
      if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
        console.log(`    └─ Makina ID'leri: ${user.secilenMakinalar.join(', ')}`);
      }
    });

    // Paketlemeci'lerin görevlerinden makinaları bul - populate olmadan
    const paketlemeciTasks = await Task.find({
      kullanici: { $in: paketlemeciUsers.map(u => u._id) },
      makina: { $exists: true, $ne: null },
    });

    console.log(`📋 Paketlemeci görevlerinde ${paketlemeciTasks.length} makinalı görev bulundu:`);

    const usedMachineIds = [];
    paketlemeciTasks.forEach(task => {
      if (task.makina) {
        console.log(`  - Görev ${task._id}: makina ${task.makina}`);
        if (!usedMachineIds.includes(task.makina.toString())) {
          usedMachineIds.push(task.makina.toString());
        }
      }
    });

    console.log(`🔧 Kullanılan benzersiz makina ID'leri: ${usedMachineIds.length}`);

    // Eğer görevlerde makina yoksa, kullanıcının secilenMakinalar'ından al
    if (usedMachineIds.length === 0) {
      console.log('📋 Görevlerde makina bulunamadı, kullanıcı seçimlerinden kontrol ediliyor...');

      paketlemeciUsers.forEach(user => {
        if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
          user.secilenMakinalar.forEach(machineId => {
            if (!usedMachineIds.includes(machineId.toString())) {
              usedMachineIds.push(machineId.toString());
            }
          });
        }
      });

      console.log(`🔧 Kullanıcı seçimlerinden ${usedMachineIds.length} makina bulundu`);
    }

    // Inventory'den bu makinaları kontrol et
    if (usedMachineIds.length > 0) {
      console.log('📦 Inventory\'de makina aranıyor...');
      try {
        const inventoryMachines = await InventoryItem.find({
          _id: { $in: usedMachineIds },
        }).select('_id ad envanterKodu');

        console.log(`📦 Inventory'de bulunan makinalar (${inventoryMachines.length}):`);
        inventoryMachines.forEach(machine => {
          console.log(`  - ${machine._id}: ${machine.envanterKodu} (${machine.ad})`);
        });
      } catch (inventoryError) {
        console.log('❌ Inventory arama hatası:', inventoryError.message);
        console.log('Makina ID\'leri direkt olarak kullanılacak');
      }

      // Ortacı kullanıcılarını bul
      const ortaciUsers = await User.find({
        roller: ortaciRole._id,
      }).select('kullaniciAdi secilenMakinalar');

      console.log(`👥 ${ortaciUsers.length} Ortacı kullanıcı bulundu:`);
      ortaciUsers.forEach(user => {
        console.log(
          `  - ${user.kullaniciAdi}: ${user.secilenMakinalar?.length || 0} makina seçili`,
        );
      });

      // Her ortacı kullanıcıya bu makinaları ata
      for (const ortaciUser of ortaciUsers) {
        console.log(`🔄 ${ortaciUser.kullaniciAdi} için makina seçimi güncelleniyor...`);
        console.log(`   Mevcut seçim: ${ortaciUser.secilenMakinalar?.length || 0} makina`);

        await User.findByIdAndUpdate(ortaciUser._id, {
          secilenMakinalar: usedMachineIds,
        });

        console.log(`✅ ${ortaciUser.kullaniciAdi}: ${usedMachineIds.length} makina atandı`);
      }

      console.log('🎉 Tüm Ortacı kullanıcılarına makinalar başarıyla atandı!');
      console.log('🔧 Atanan makina ID\'leri:', usedMachineIds);
    } else {
      console.log('❌ Hiçbir makina bulunamadı');
    }
  } catch (error) {
    console.error('❌ Script hatası:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📱 MongoDB bağlantısı kapatıldı');
    }
  }
}

// Script başlat
console.log('🚀 Makina seçimi düzeltme scripti başlatılıyor...');
fixMachineSelection();
