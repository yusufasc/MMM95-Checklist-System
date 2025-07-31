const mongoose = require('mongoose');
require('dotenv').config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const Module = require('../models/Module');
    const Role = require('../models/Role');

    // Kalite Kontrol modülünü ekle
    const module = await Module.findOneAndUpdate(
      { ad: 'Kalite Kontrol' },
      {
        ad: 'Kalite Kontrol',
        ikon: 'FactCheck',
        route: '/quality-control',
        aktif: true,
      },
      { upsert: true, new: true },
    );

    console.log('Kalite Kontrol modülü oluşturuldu:', module.ad);

    // Tüm rolleri güncelle
    const roles = await Role.find();

    for (const role of roles) {
      // Modül zaten ekli mi kontrol et
      const hasModule = role.moduller.some(
        m => m.modul.toString() === module._id.toString(),
      );

      if (!hasModule) {
        // Admin ve Kalite Kontrol rollerine tam yetki ver
        if (role.ad === 'Admin' || role.ad === 'Kalite Kontrol') {
          role.moduller.push({
            modul: module._id,
            erisebilir: true,
            duzenleyebilir: true,
          });
        } else {
          // Diğer rollere sadece görüntüleme yetkisi
          role.moduller.push({
            modul: module._id,
            erisebilir: false,
            duzenleyebilir: false,
          });
        }

        await role.save();
        console.log(`${role.ad} rolü güncellendi`);
      }
    }

    console.log('Tüm roller güncellendi');
    process.exit(0);
  })
  .catch(err => {
    console.error('Hata:', err);
    process.exit(1);
  });
