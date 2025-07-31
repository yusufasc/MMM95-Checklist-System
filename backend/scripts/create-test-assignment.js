const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Equipment = require('../models/Equipment');

async function createTestAssignment() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Creating test assignment for admin user...');

    // Admin kullanıcısını bul
    const adminUser = await User.findOne({ kullaniciAdi: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('👤 Admin user found:', adminUser.kullaniciAdi, adminUser._id);

    // Mevcut equipment'ları listele
    const equipments = await Equipment.find({ isActive: true }).limit(5);
    console.log('📦 Available equipment:');
    equipments.forEach(eq => {
      console.log(`  - ${eq.name} (${eq._id})`);
    });

    if (equipments.length === 0) {
      console.log('❌ No equipment found');
      process.exit(1);
    }

    // İlk equipment'ı admin'e ata
    const equipment = equipments[0];

    // Mevcut assignment'ı kontrol et
    const existingAssignment = await Assignment.findOne({
      userId: adminUser._id,
      equipmentId: equipment._id,
      status: 'active',
    });

    if (existingAssignment) {
      console.log('⚠️ Assignment already exists');
      console.log('Existing assignment:', existingAssignment._id);
    } else {
      // Yeni assignment oluştur
      const assignment = new Assignment({
        equipmentId: equipment._id,
        userId: adminUser._id,
        assignedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
        assignedBy: adminUser._id,
        status: 'active',
        condition: 'perfect',
        notes: 'Test assignment for profile page',
      });

      await assignment.save();
      console.log('✅ Assignment created:', assignment._id);
    }

    // Admin'in assignment'larını kontrol et
    const adminAssignments = await Assignment.find({ userId: adminUser._id })
      .populate('equipmentId', 'name category')
      .populate('assignedBy', 'ad soyad');

    console.log('\n📋 Admin assignments:');
    adminAssignments.forEach(assignment => {
      console.log(`  - ${assignment.equipmentId?.name} (${assignment.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAssignment();
