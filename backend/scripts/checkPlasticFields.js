const mongoose = require('mongoose');
const InventoryFieldTemplate = require('../models/InventoryFieldTemplate');
const InventoryCategory = require('../models/InventoryCategory');
require('dotenv').config();

const checkPlasticFields = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist');

    const category = await InventoryCategory.findOne({ ad: 'Plastik Enjeksiyon Makinası' });
    if (category) {
      const fields = await InventoryFieldTemplate.find({
        kategoriId: category._id,
        aktif: true,
      }).sort({ grup: 1, siraNo: 1 });

      console.log('=== PLASTIK ENJEKSİYON MAKİNASI ALANLARI ===');
      let currentGroup = '';
      fields.forEach((field, index) => {
        if (field.grup !== currentGroup) {
          console.log(`\n🔹 ${field.grup}`);
          currentGroup = field.grup;
        }
        console.log(
          `  ${index + 1}. ${field.alanAdi} (${field.alanTipi})${field.zorunlu ? ' - ZORUNLU' : ''}`,
        );
        if (field.aciklama) {
          console.log(`     📝 ${field.aciklama}`);
        }
      });
      console.log(`\nToplam: ${fields.length} alan`);
    } else {
      console.log('Plastik Enjeksiyon Makinası kategorisi bulunamadı!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Hata:', error);
  }
};

checkPlasticFields();
