const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/mmm-checklist');

async function createDepartment() {
  try {
    console.log('🏢 Departman oluşturuluyor...\n');

    // Temel departman oluştur
    const existingDept = await Department.findOne({ ad: 'Genel' });
    if (existingDept) {
      console.log('⚠️  Genel departmanı zaten mevcut');
      return;
    }

    const generalDept = new Department({
      ad: 'Genel',
      aciklama: 'Genel departman',
    });

    await generalDept.save();
    console.log('✅ Genel departmanı oluşturuldu');

    // Tüm kullanıcılara bu departmanı ata
    await User.updateMany(
      { departmanlar: { $size: 0 } },
      { $push: { departmanlar: generalDept._id } },
    );

    console.log('✅ Tüm kullanıcılara Genel departmanı atandı');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
}

createDepartment();
