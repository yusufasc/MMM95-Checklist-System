const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Module = require('../models/Module');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Machine = require('../models/Machine');

const seedData = async () => {
  try {
    // Production ortamında seed data çalışmasını engelle
    // if (process.env.NODE_ENV === 'production') {
    //   console.log('⚠️  Production ortamında seed data çalıştırılmaz!');
    //   return;
    // }

    console.log('Veritabanı kontrol ediliyor...');

    // Önce mevcut verileri kontrol et - eğer veriler varsa seed işlemini atla
    // const existingUsers = await User.countDocuments();
    // const existingRoles = await Role.countDocuments();
    // const existingDepartments = await Department.countDocuments();
    // const existingModules = await Module.countDocuments();

    // if (existingUsers > 0 || existingRoles > 0 || existingDepartments > 0 || existingModules > 0) {
    //   console.log('✅ Veritabanında mevcut veriler bulundu, seed işlemi atlanıyor.');
    //   console.log(`📊 Mevcut veriler: ${existingUsers} kullanıcı, ${existingRoles} rol, ${existingDepartments} departman, ${existingModules} modül`);
    //   return;
    // }

    console.log('📝 Veritabanı boş, test verileri oluşturuluyor...');

    // Modülleri oluştur
    const modules = [
      { ad: 'Dashboard', ikon: 'Dashboard', route: '/', aktif: true },
      {
        ad: 'Kullanıcı Yönetimi',
        ikon: 'People',
        route: '/users',
        aktif: true,
      },
      { ad: 'Rol Yönetimi', ikon: 'Security', route: '/roles', aktif: true },
      {
        ad: 'Departman Yönetimi',
        ikon: 'Business',
        route: '/departments',
        aktif: true,
      },
      {
        ad: 'Checklist Yönetimi',
        ikon: 'PlaylistAddCheck',
        route: '/checklists',
        aktif: true,
      },
      {
        ad: 'Görev Yönetimi',
        ikon: 'Assignment',
        route: '/tasks',
        aktif: true,
      },
      {
        ad: 'Toplantı Yönetimi',
        ikon: 'Groups',
        route: '/meetings',
        aktif: true,
      },
      { ad: 'Yaptım', ikon: 'Build', route: '/worktasks', aktif: true },
      {
        ad: 'Envanter Yönetimi',
        ikon: 'Inventory2',
        route: '/inventory',
        aktif: true,
      },
      {
        ad: 'Kalite Kontrol',
        ikon: 'FactCheck',
        route: '/quality-control',
        aktif: true,
      },
      {
        ad: 'Kalite Kontrol Yönetimi',
        ikon: 'AdminPanelSettings',
        route: '/quality-control-management',
        aktif: true,
      },
      { ad: 'İnsan Kaynakları', ikon: 'People', route: '/hr', aktif: true },
      {
        ad: 'İnsan Kaynakları Yönetimi',
        ikon: 'AdminPanelSettings',
        route: '/hr-management',
        aktif: true,
      },
      {
        ad: 'Kontrol Bekleyenler',
        ikon: 'HourglassEmpty',
        route: '/control-pending',
        aktif: true,
      },
      {
        ad: 'Performans',
        ikon: 'Analytics',
        route: '/performance',
        aktif: true,
      },
      {
        ad: 'Kişisel Aktivite',
        ikon: 'Timeline',
        route: '/my-activity',
        aktif: true,
      },
    ];

    const modulePromises = modules.map(moduleData => {
      return Module.findOneAndUpdate({ ad: moduleData.ad }, moduleData, {
        upsert: true,
        new: true,
      });
    });

    const createdModules = await Promise.all(modulePromises);
    console.log('Modüller oluşturuldu');

    // 2. Departmanları oluştur
    const departments = await Department.insertMany([
      { ad: 'Yönetim' },
      { ad: 'Üretim' },
      { ad: 'Kalite Kontrol' },
      { ad: 'İnsan Kaynakları' },
      { ad: 'Bakım' },
    ]);

    console.log('Departmanlar oluşturuldu:', departments.length);

    // 3. Rolleri oluştur - Modern modulePermissions yapısıyla
    const adminRole = new Role({
      ad: 'Admin',
      modulePermissions: createdModules.map(module => ({
        moduleName: module.ad,
        gorebilir: true,
        duzenleyebilir: true,
      })),
      checklistYetkileri: [],
    });

    const ortaciRole = new Role({
      ad: 'Ortacı',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Görev Yönetimi',
          gorebilir: true,
          duzenleyebilir: false,
        },
        {
          moduleName: 'Toplantı Yönetimi',
          gorebilir: true,
          duzenleyebilir: false,
        },
        { moduleName: 'Yaptım', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Kontrol Bekleyenler',
          gorebilir: true,
          duzenleyebilir: false,
        },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Kişisel Aktivite',
          gorebilir: true,
          duzenleyebilir: false,
        },
      ],
      checklistYetkileri: [],
    });

    const ustaRole = new Role({
      ad: 'Usta',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Görev Yönetimi',
          gorebilir: true,
          duzenleyebilir: false,
        },
        {
          moduleName: 'Toplantı Yönetimi',
          gorebilir: true,
          duzenleyebilir: true,
        },
        { moduleName: 'Yaptım', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Kontrol Bekleyenler',
          gorebilir: true,
          duzenleyebilir: false,
        },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Envanter Yönetimi',
          gorebilir: true,
          duzenleyebilir: false,
        },
        {
          moduleName: 'Kişisel Aktivite',
          gorebilir: true,
          duzenleyebilir: false,
        },
      ],
      checklistYetkileri: [],
    });

    const paketlemeciRole = new Role({
      ad: 'Paketlemeci',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Görev Yönetimi',
          gorebilir: true,
          duzenleyebilir: false,
        },
        {
          moduleName: 'Toplantı Yönetimi',
          gorebilir: true,
          duzenleyebilir: false,
        },
        { moduleName: 'Yaptım', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Kontrol Bekleyenler',
          gorebilir: true,
          duzenleyebilir: false,
        },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Kişisel Aktivite',
          gorebilir: true,
          duzenleyebilir: false,
        },
      ],
      checklistYetkileri: [],
    });

    const kaliteKontrolRole = new Role({
      ad: 'Kalite Kontrol',
      modulePermissions: [
        { moduleName: 'Dashboard', gorebilir: true, duzenleyebilir: false },
        { moduleName: 'Kalite Kontrol', gorebilir: true, duzenleyebilir: true },
        {
          moduleName: 'Kalite Kontrol Yönetimi',
          gorebilir: true,
          duzenleyebilir: true,
        },
        {
          moduleName: 'Toplantı Yönetimi',
          gorebilir: true,
          duzenleyebilir: true,
        },
        {
          moduleName: 'Kontrol Bekleyenler',
          gorebilir: true,
          duzenleyebilir: false,
        },
        { moduleName: 'Performans', gorebilir: true, duzenleyebilir: false },
        {
          moduleName: 'Kişisel Aktivite',
          gorebilir: true,
          duzenleyebilir: false,
        },
      ],
      checklistYetkileri: [],
    });

    const roles = await Role.insertMany([
      adminRole,
      ortaciRole,
      ustaRole,
      paketlemeciRole,
      kaliteKontrolRole,
    ]);

    // Rolleri kaydettikten sonra checklist yetkileri ekle
    // Usta rolü Ortacı ve Paketlemeci rollerini görebilir ve puanlayabilir
    await Role.findByIdAndUpdate(roles.find(r => r.ad === 'Usta')._id, {
      $push: {
        checklistYetkileri: [
          {
            hedefRol: roles.find(r => r.ad === 'Ortacı')._id,
            gorebilir: true,
            onaylayabilir: true,
          },
          {
            hedefRol: roles.find(r => r.ad === 'Paketlemeci')._id,
            gorebilir: true,
            onaylayabilir: true,
          },
        ],
      },
    });

    // Kalite Kontrol rolü tüm rolleri görebilir ve puanlayabilir
    await Role.findByIdAndUpdate(
      roles.find(r => r.ad === 'Kalite Kontrol')._id,
      {
        $push: {
          checklistYetkileri: [
            {
              hedefRol: roles.find(r => r.ad === 'Ortacı')._id,
              gorebilir: true,
              onaylayabilir: true,
            },
            {
              hedefRol: roles.find(r => r.ad === 'Usta')._id,
              gorebilir: true,
              onaylayabilir: true,
            },
            {
              hedefRol: roles.find(r => r.ad === 'Paketlemeci')._id,
              gorebilir: true,
              onaylayabilir: true,
            },
          ],
        },
      },
    );

    console.log('Roller oluşturuldu:', roles.length);

    // 4. Kullanıcıları oluştur
    const salt = await bcrypt.genSalt(10);

    const adminUser = new User({
      ad: 'Admin',
      soyad: 'User',
      kullaniciAdi: 'admin',
      sifreHash: await bcrypt.hash('123456', salt),
      roller: [roles.find(r => r.ad === 'Admin')._id],
      departmanlar: [departments.find(d => d.ad === 'Yönetim')._id],
      durum: 'aktif',
    });

    const aliVeli = new User({
      ad: 'Ali',
      soyad: 'Veli',
      kullaniciAdi: 'ali.veli',
      sifreHash: await bcrypt.hash('123456', salt),
      roller: [roles.find(r => r.ad === 'Ortacı')._id],
      departmanlar: [departments.find(d => d.ad === 'Üretim')._id],
      durum: 'aktif',
    });

    const ayseYilmaz = new User({
      ad: 'Ayşe',
      soyad: 'Yılmaz',
      kullaniciAdi: 'ayse.yilmaz',
      sifreHash: await bcrypt.hash('123456', salt),
      roller: [roles.find(r => r.ad === 'Usta')._id],
      departmanlar: [departments.find(d => d.ad === 'Üretim')._id],
      durum: 'aktif',
    });

    const mehmetKaya = new User({
      ad: 'Mehmet',
      soyad: 'Kaya',
      kullaniciAdi: 'mehmet.kaya',
      sifreHash: await bcrypt.hash('123456', salt),
      roller: [roles.find(r => r.ad === 'Kalite Kontrol')._id],
      departmanlar: [departments.find(d => d.ad === 'Kalite Kontrol')._id],
      durum: 'aktif',
    });

    const fatmaDemir = new User({
      ad: 'Fatma',
      soyad: 'Demir',
      kullaniciAdi: 'fatma.demir',
      sifreHash: await bcrypt.hash('123456', salt),
      roller: [roles.find(r => r.ad === 'Paketlemeci')._id],
      departmanlar: [departments.find(d => d.ad === 'Üretim')._id],
      durum: 'aktif',
    });

    const users = await User.insertMany([
      adminUser,
      aliVeli,
      ayseYilmaz,
      mehmetKaya,
      fatmaDemir,
    ]);

    console.log('Kullanıcılar oluşturuldu:', users.length);

    // 5. Örnek Checklist Şablonları oluştur
    const checklistTemplates = await ChecklistTemplate.insertMany([
      {
        ad: 'Günlük Ortacı Kontrol',
        tur: 'rutin',
        hedefRol: roles.find(r => r.ad === 'Ortacı')._id,
        hedefDepartman: departments.find(d => d.ad === 'Üretim')._id,
        maddeler: [
          { soru: 'Makine temizliği yapıldı mı?', puan: 10 },
          { soru: 'Çevre düzeni kontrol edildi mi?', puan: 5 },
          { soru: 'Hammadde kontrolü yapıldı mı?', puan: 5 },
        ],
        periyot: 'gunluk',
      },
      {
        ad: 'Kalıp Değişim İşlemi',
        tur: 'iseBagli',
        hedefRol: roles.find(r => r.ad === 'Usta')._id,
        hedefDepartman: departments.find(d => d.ad === 'Üretim')._id,
        maddeler: [
          { soru: 'Eski kalıp söküldü mü?', puan: 15 },
          { soru: 'Yeni kalıp yerleştirildi mi?', puan: 15 },
          { soru: 'Bağlantı civataları kontrol edildi mi?', puan: 10 },
          { soru: 'Numune ürün alındı mı?', puan: 10 },
          { soru: 'Kalıp değişim saati kaydedildi mi?', puan: 5 },
          { soru: 'Açıklama ve resim eklendi mi?', puan: 5 },
        ],
        periyot: 'olayBazli',
        isTuru: 'Kalıp Değişim',
      },
      {
        ad: 'Haftalık Genel Temizlik',
        tur: 'rutin',
        hedefRol: roles.find(r => r.ad === 'Ortacı')._id,
        hedefDepartman: departments.find(d => d.ad === 'Üretim')._id,
        maddeler: [
          { soru: 'Makine detaylı temizliği yapıldı mı?', puan: 20 },
          { soru: 'Çalışma alanı organize edildi mi?', puan: 15 },
          { soru: 'Atık malzemeler temizlendi mi?', puan: 10 },
          { soru: 'Güvenlik ekipmanları kontrol edildi mi?', puan: 5 },
        ],
        periyot: 'haftalik',
      },
      {
        ad: 'Paketleme İşlem Kontrol',
        tur: 'iseBagli',
        hedefRol: roles.find(r => r.ad === 'Paketlemeci')._id,
        hedefDepartman: departments.find(d => d.ad === 'Üretim')._id,
        maddeler: [
          { soru: 'Paket boyutları kontrol edildi mi?', puan: 10 },
          { soru: 'Etiket bilgileri doğru mu?', puan: 10 },
          { soru: 'Paket sızdırmazlığı test edildi mi?', puan: 15 },
          { soru: 'Kalite kontrol formu dolduruldu mu?', puan: 10 },
          { soru: 'İş emri tamamlandı mı?', puan: 5 },
        ],
        periyot: 'olayBazli',
        isTuru: 'Paketleme',
      },
    ]);

    console.log('Checklist şablonları oluşturuldu:', checklistTemplates.length);

    // 6. Test Makinalarını oluştur
    const testMachines = await Machine.insertMany([
      {
        ad: 'Paketleme Makinası 1',
        makinaNo: 'PKT-001',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Paketlemeci')._id,
          roles.find(r => r.ad === 'Ortacı')._id,
        ],
        durum: 'aktif',
        aciklama: 'Ana paketleme hattı',
      },
      {
        ad: 'Paketleme Makinası 2',
        makinaNo: 'PKT-002',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Paketlemeci')._id,
          roles.find(r => r.ad === 'Ortacı')._id,
        ],
        durum: 'aktif',
        aciklama: 'Yedek paketleme hattı',
      },
      {
        ad: 'Paketleme Makinası 3',
        makinaNo: 'PKT-003',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Paketlemeci')._id,
          roles.find(r => r.ad === 'Ortacı')._id,
        ],
        durum: 'aktif',
        aciklama: 'Özel ürün paketleme hattı',
      },
      {
        ad: 'Üretim Makinası 1',
        makinaNo: 'URT-001',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'Ana üretim hattı',
      },
      {
        ad: 'Üretim Makinası 2',
        makinaNo: 'URT-002',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'İkinci üretim hattı',
      },
      {
        ad: 'Üretim Makinası 3',
        makinaNo: 'URT-003',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'Üçüncü üretim hattı',
      },
      {
        ad: 'Üretim Makinası 4',
        makinaNo: 'URT-004',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'Dördüncü üretim hattı',
      },
      {
        ad: 'Üretim Makinası 5',
        makinaNo: 'URT-005',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'Beşinci üretim hattı',
      },
      {
        ad: 'Üretim Makinası 6',
        makinaNo: 'URT-006',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'Altıncı üretim hattı',
      },
      {
        ad: 'Üretim Makinası 7',
        makinaNo: 'URT-007',
        departman: departments.find(d => d.ad === 'Üretim')._id,
        sorumluRoller: [
          roles.find(r => r.ad === 'Ortacı')._id,
          roles.find(r => r.ad === 'Usta')._id,
        ],
        durum: 'aktif',
        aciklama: 'Yedinci üretim hattı',
      },
    ]);

    console.log('Test makinaları oluşturuldu:', testMachines.length);

    console.log('✅ Tüm test verileri başarıyla oluşturuldu!');
    console.log('📋 Giriş bilgileri:');
    console.log('Admin: admin / 123456 (Tüm modüllere erişim)');
    console.log('Ali Veli: ali.veli / 123456 (Ortacı - Sınırlı erişim)');
    console.log(
      'Ayşe Yılmaz: ayse.yilmaz / 123456 (Usta - Orta seviye erişim)',
    );
    console.log(
      'Mehmet Kaya: mehmet.kaya / 123456 (Kalite Kontrol - Özel erişim)',
    );
  } catch (error) {
    console.error('Test verileri oluşturulurken hata:', error);
  }
};

module.exports = seedData;
