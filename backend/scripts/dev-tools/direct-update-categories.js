const mongoose = require('mongoose');
require('dotenv').config();

async function directUpdateCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');
    console.log('MongoDB bağlantısı başarılı');

    const collection = mongoose.connection.db.collection('checklisttemplates');

    // Önce tüm template'leri Checklist yap
    const result1 = await collection.updateMany({}, { $set: { kategori: 'Checklist' } });
    console.log('Tüm template\'ler Checklist yapıldı:', result1.modifiedCount);

    // Kalıp değişim template'ini Kalite yap
    const result2 = await collection.updateMany(
      { ad: { $regex: /KALIP|DEĞİŞİM/i } },
      { $set: { kategori: 'Kalite' } },
    );
    console.log('Kalite kategorisi güncellendi:', result2.modifiedCount);

    // Kontrol et
    console.log('\n=== GÜNCEL DURUM ===');
    const templates = await collection.find({}).toArray();
    templates.forEach(template => {
      console.log(`📋 "${template.ad}": ${template.kategori}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

directUpdateCategories();
