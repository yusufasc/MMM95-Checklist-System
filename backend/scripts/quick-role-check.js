const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  ad: String,
  checklistYetkileri: [
    {
      hedefRol: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
      gorebilir: Boolean,
      puanlayabilir: Boolean,
      onaylayabilir: Boolean,
    },
  ],
});

const Role = mongoose.model('Role', RoleSchema);

mongoose
  .connect('mongodb://localhost:27017/mmm-checklist')
  .then(async () => {
    console.log('✅ MongoDB bağlandı');

    const ustaRole = await Role.findOne({ ad: 'Usta' }).populate(
      'checklistYetkileri.hedefRol',
    );
    console.log('Usta rolü:', ustaRole ? 'BULUNDU' : 'YOK');

    if (ustaRole) {
      console.log('Usta ID:', ustaRole._id);
      console.log(
        'Checklist yetkileri sayısı:',
        ustaRole.checklistYetkileri?.length || 0,
      );

      if (ustaRole.checklistYetkileri?.length > 0) {
        console.log('Yetkileri:');
        ustaRole.checklistYetkileri.forEach((yetki, i) => {
          console.log(
            `  ${i + 1}. Hedef Rol: ${yetki.hedefRol?.ad || 'UNDEFINED'} - Görebilir: ${yetki.gorebilir}`,
          );
        });
      } else {
        console.log('❌ Hiç checklist yetkisi yok!');
      }
    }

    // Tüm rolleri de listele
    const allRoles = await Role.find({}, 'ad');
    console.log('\nTüm roller:', allRoles.map(r => r.ad).join(', '));

    await mongoose.disconnect();
  })
  .catch(err => console.error('Hata:', err.message));
