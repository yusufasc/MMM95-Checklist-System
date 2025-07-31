const User = require('./models/User');
const mongoose = require('mongoose');

async function checkAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');
    
    const admin = await User.findOne({kullaniciAdi: 'admin'});
    
    if (admin) {
      console.log('Admin kullanıcısı bulundu:');
      console.log('- Kullanıcı Adı:', admin.kullaniciAdi);
      console.log('- Ad:', admin.ad);
      console.log('- Soyad:', admin.soyad);
      console.log('- Şifre (hash):', admin.sifreHash);
      console.log('- Roller:', admin.roller);
      console.log('- Departmanlar:', admin.departmanlar);
    } else {
      console.log('Admin kullanıcısı bulunamadı!');
      
      // Admin kullanıcısı yoksa oluştur
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = new User({
        kullaniciAdi: 'admin',
        sifre: hashedPassword,
        displayName: 'Admin User',
        role: 'Admin',
        departman: 'Genel'
      });
      
      await newAdmin.save();
      console.log('✅ Admin kullanıcısı oluşturuldu: admin/admin123');
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    process.exit();
  }
}

checkAdminUser();