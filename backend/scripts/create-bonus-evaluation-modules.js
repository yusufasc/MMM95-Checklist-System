const mongoose = require('mongoose');
require('dotenv').config();
const Module = require('../models/Module');
const Role = require('../models/Role');

const DB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/mmm-checklist';

console.log('MongoDB URI:', DB_URI);

mongoose
  .connect(DB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createBonusEvaluationModules() {
  try {
    console.log('🎯 Bonus Değerlendirme modülleri oluşturuluyor...');

    // 1. Bonus Değerlendirme Yönetimi modülü (Admin)
    const managementModule = await Module.findOneAndUpdate(
      { ad: 'Bonus Değerlendirme Yönetimi' },
      {
        ad: 'Bonus Değerlendirme Yönetimi',
        aciklama:
          'Bonus değerlendirme şablonları yönetimi, personel bonus ölçütlerini tanımlama (/bonus-evaluation-management)',
        aktif: true,
        route: '/bonus-evaluation-management',
      },
      { upsert: true, new: true },
    );

    // 2. Bonus Değerlendirme modülü (Vardiya amiri/yöneticiler)
    const evaluationModule = await Module.findOneAndUpdate(
      { ad: 'Bonus Değerlendirme' },
      {
        ad: 'Bonus Değerlendirme',
        aciklama:
          'Personel bonus değerlendirmesi yapma, performans puanlama (/bonus-evaluation)',
        aktif: true,
        route: '/bonus-evaluation',
      },
      { upsert: true, new: true },
    );

    console.log('✅ Modüller oluşturuldu:');
    console.log('- Bonus Değerlendirme Yönetimi:', managementModule._id);
    console.log('- Bonus Değerlendirme:', evaluationModule._id);

    // 3. Rol bazlı yetkileri güncelle
    console.log('\n🔐 Rol bazlı yetkileri güncelleniyor...');

    // Admin'e tam yetki
    await Role.updateMany(
      { ad: 'Admin' },
      {
        $addToSet: {
          moduller: {
            $each: [
              {
                modul: managementModule._id,
                erisebilir: true,
                duzenleyebilir: true,
              },
              {
                modul: evaluationModule._id,
                erisebilir: true,
                duzenleyebilir: true,
              },
            ],
          },
        },
      },
    );

    // VARDİYA AMİRİ'ne Bonus Değerlendirme yetkisi
    await Role.updateMany(
      { ad: 'VARDİYA AMİRİ' },
      {
        $addToSet: {
          moduller: {
            modul: evaluationModule._id,
            erisebilir: true,
            duzenleyebilir: true,
          },
        },
      },
    );

    // Usta'ya sadece görüntüleme yetkisi
    await Role.updateMany(
      { ad: 'Usta' },
      {
        $addToSet: {
          moduller: {
            modul: evaluationModule._id,
            erisebilir: true,
            duzenleyebilir: false,
          },
        },
      },
    );

    console.log('✅ Rol yetkileri güncellendi:');
    console.log('- Admin: Tam yetki (management + evaluation)');
    console.log('- VARDİYA AMİRİ: Bonus değerlendirme yapabilir');
    console.log('- Usta: Sadece görüntüleme');

    // 4. Mevcut rolleri listele
    const roles = await Role.find().select('ad moduller');
    console.log('\n📋 Mevcut roller ve yetki sayıları:');
    roles.forEach(role => {
      console.log(`- ${role.ad}: ${role.moduller.length} modül yetkisi`);
    });

    console.log('\n🎉 Bonus Değerlendirme sistemi başarıyla kuruldu!');
    console.log('\n📄 Kullanım:');
    console.log('- Admin: /bonus-evaluation-management → Şablon yönetimi');
    console.log('- VARDİYA AMİRİ: /bonus-evaluation → Personel değerlendirme');
    console.log('- Usta: /bonus-evaluation → Sadece görüntüleme');
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Script'i çalıştır
createBonusEvaluationModules();
