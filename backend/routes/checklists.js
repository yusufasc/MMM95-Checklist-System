const express = require('express');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, checkModulePermission } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/checklists
// @desc    Tüm checklist şablonlarını listele
// @access  Private (Checklist Yönetimi modülü erişim yetkisi)
router.get(
  '/',
  auth,
  checkModulePermission('Checklist Yönetimi'),
  async (req, res) => {
    try {
      const checklists = await ChecklistTemplate.find()
        .populate('hedefRol', 'ad')
        .populate('hedefDepartman', 'ad');

      res.json(checklists);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   GET /api/checklists/:id
// @desc    Belirli bir checklist şablonu getir
// @access  Private (Checklist Yönetimi modülü erişim yetkisi)
router.get(
  '/:id',
  auth,
  checkModulePermission('Checklist Yönetimi'),
  async (req, res) => {
    try {
      const checklist = await ChecklistTemplate.findById(req.params.id)
        .populate('hedefRol', 'ad')
        .populate('hedefDepartman', 'ad');

      if (!checklist) {
        return res
          .status(404)
          .json({ message: 'Checklist şablonu bulunamadı' });
      }

      res.json(checklist);
    } catch (error) {
      console.error('Checklist getirme hatası:', error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz checklist ID' });
      }
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   POST /api/checklists
// @desc    Yeni checklist şablonu ekle
// @access  Private (Checklist Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Checklist Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        tur,
        hedefRol,
        hedefDepartman,
        maddeler,
        periyot,
        isTuru,
        kontrolPuani,
        degerlendirmeSaatleri,
        degerlendirmePeriyodu,
        degerlendirmeGunleri,
        degerlendirmeSikligi,
        aktif,
        degerlendirmeRolleri,
      } = req.body;

      console.log('📋 Yeni checklist oluşturuluyor:', {
        ad,
        tur,
        hedefRol,
        hedefDepartman,
        periyot,
        kontrolPuani,
        degerlendirmeRolleri,
      });

      const checklist = new ChecklistTemplate({
        ad,
        tur,
        hedefRol,
        hedefDepartman,
        maddeler,
        periyot,
        isTuru,
        kontrolPuani,
        degerlendirmeSaatleri,
        degerlendirmePeriyodu,
        degerlendirmeGunleri,
        degerlendirmeSikligi,
        aktif,
        degerlendirmeRolleri,
      });

      await checklist.save();
      console.log('✅ Checklist kaydedildi:', checklist._id);

      // Populate edilmiş hali ile döndür
      const populatedChecklist = await ChecklistTemplate.findById(checklist._id)
        .populate('hedefRol', 'ad')
        .populate('hedefDepartman', 'ad');

      console.log('📋 Populate edilmiş checklist:', {
        id: populatedChecklist._id,
        ad: populatedChecklist.ad,
        hedefRol: populatedChecklist.hedefRol?.ad,
        hedefDepartman: populatedChecklist.hedefDepartman?.ad,
      });

      // Yeni checklist oluşturulduğunda sadece rutin checklistler için tüm kullanıcılara görev oluştur
      // İşe bağlı checklistler WorkTasks sayfasından manuel olarak oluşturulacak
      if (populatedChecklist.tur === 'rutin') {
        try {
          console.log(
            '🔧 Rutin checklist için otomatik görev oluşturma başlatılıyor...',
          );
          const taskCount = await createTasksForAllUsers(populatedChecklist);
          console.log(
            `✅ Rutin checklist oluşturuldu ve ${taskCount} görev atandı`,
          );
        } catch (taskError) {
          console.error(
            'Görevler oluşturulurken hata (checklist yine de kaydedildi):',
            taskError,
          );
          // Checklist oluşturuldu ama görevler oluşturulamadı, yine de başarılı response döndür
        }
      } else {
        console.log(
          '📋 Olay bazlı (işe bağlı) checklist oluşturuldu - WorkTasks sayfasından manuel başlatılacak',
        );
      }

      res.status(201).json(populatedChecklist);
    } catch (error) {
      console.error('Checklist oluşturma hatası:', error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /api/checklists/:id
// @desc    Checklist şablonu güncelle
// @access  Private (Checklist Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id',
  auth,
  checkModulePermission('Checklist Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        ad,
        tur,
        hedefRol,
        hedefDepartman,
        maddeler,
        periyot,
        isTuru,
        kontrolPuani,
        degerlendirmeSaatleri,
        degerlendirmePeriyodu,
        degerlendirmeGunleri,
        degerlendirmeSikligi,
        aktif,
        degerlendirmeRolleri,
      } = req.body;

      const checklist = await ChecklistTemplate.findByIdAndUpdate(
        req.params.id,
        {
          ad,
          tur,
          hedefRol,
          hedefDepartman,
          maddeler,
          periyot,
          isTuru,
          kontrolPuani,
          degerlendirmeSaatleri,
          degerlendirmePeriyodu,
          degerlendirmeGunleri,
          degerlendirmeSikligi,
          aktif,
          degerlendirmeRolleri,
          guncellemeTarihi: Date.now(),
        },
        { new: true },
      )
        .populate('hedefRol', 'ad')
        .populate('hedefDepartman', 'ad');

      if (!checklist) {
        return res
          .status(404)
          .json({ message: 'Checklist şablonu bulunamadı' });
      }

      res.json(checklist);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz checklist ID' });
      }
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   DELETE /api/checklists/:id
// @desc    Checklist şablonu sil
// @access  Private (Checklist Yönetimi modülü düzenleme yetkisi)
router.delete(
  '/:id',
  auth,
  checkModulePermission('Checklist Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const checklistId = req.params.id;

      // Önce checklist'in var olup olmadığını kontrol et
      const checklist = await ChecklistTemplate.findById(checklistId);
      if (!checklist) {
        return res
          .status(404)
          .json({ message: 'Checklist şablonu bulunamadı' });
      }

      console.log(
        `🗑️ Checklist siliniyor: ${checklist.ad} (ID: ${checklistId})`,
      );

      // Bu checklist'e bağlı aktif görevleri kontrol et
      const activeTasks = await Task.find({
        checklist: checklistId,
        durum: { $in: ['bekliyor', 'devamEdiyor'] },
      });

      if (activeTasks.length > 0) {
        console.log(`⚠️ ${activeTasks.length} aktif görev bulundu`);
        return res.status(400).json({
          message: `Bu checklist şablonuna bağlı ${activeTasks.length} aktif görev bulunmaktadır. Önce bu görevlerin tamamlanmasını bekleyin veya iptal edin.`,
          activeTasksCount: activeTasks.length,
          canForceDelete: true,
        });
      }

      // Tamamlanmış görevleri kontrol et (opsiyonel uyarı)
      const completedTasks = await Task.countDocuments({
        checklist: checklistId,
        durum: { $in: ['tamamlandi', 'onaylandi', 'iadeEdildi'] },
      });

      if (completedTasks > 0) {
        console.log(
          `📊 ${completedTasks} tamamlanmış görev bulundu - bunlar korunacak`,
        );
      }

      // Checklist'i sil
      await ChecklistTemplate.findByIdAndDelete(checklistId);

      console.log(`✅ Checklist başarıyla silindi: ${checklist.ad}`);

      res.json({
        message: 'Checklist şablonu başarıyla silindi',
        deletedChecklist: {
          id: checklistId,
          ad: checklist.ad,
        },
        completedTasksCount: completedTasks,
      });
    } catch (error) {
      console.error('Checklist silme hatası:', error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz checklist ID' });
      }
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// @route   DELETE /api/checklists/:id/force
// @desc    Checklist şablonu ve aktif görevlerini zorla sil
// @access  Private (Checklist Yönetimi modülü düzenleme yetkisi)
router.delete(
  '/:id/force',
  auth,
  checkModulePermission('Checklist Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const checklistId = req.params.id;

      // Önce checklist'in var olup olmadığını kontrol et
      const checklist = await ChecklistTemplate.findById(checklistId);
      if (!checklist) {
        return res
          .status(404)
          .json({ message: 'Checklist şablonu bulunamadı' });
      }

      console.log(
        `🗑️ Checklist zorla siliniyor: ${checklist.ad} (ID: ${checklistId})`,
      );

      // Bu checklist'e bağlı tüm görevleri bul (aktif ve tamamlanmış)
      const allTasks = await Task.find({ checklist: checklistId });
      const activeTasks = allTasks.filter(task =>
        ['bekliyor', 'devamEdiyor'].includes(task.durum),
      );
      const completedTasks = allTasks.filter(task =>
        ['tamamlandi', 'onaylandi', 'iadeEdildi'].includes(task.durum),
      );

      console.log(`📊 Toplam ${allTasks.length} görev bulundu:`);
      console.log(`   - ${activeTasks.length} aktif görev`);
      console.log(`   - ${completedTasks.length} tamamlanmış görev`);

      // Aktif görevleri iptal et
      if (activeTasks.length > 0) {
        await Task.updateMany(
          {
            checklist: checklistId,
            durum: { $in: ['bekliyor', 'devamEdiyor'] },
          },
          {
            durum: 'iptal',
            iptalTarihi: new Date(),
            iptalNedeni: `Checklist şablonu "${checklist.ad}" silindiği için otomatik iptal edildi`,
          },
        );
        console.log(`✅ ${activeTasks.length} aktif görev iptal edildi`);
      }

      // Checklist'i sil
      await ChecklistTemplate.findByIdAndDelete(checklistId);

      console.log(`✅ Checklist başarıyla silindi: ${checklist.ad}`);

      res.json({
        message: 'Checklist şablonu ve bağlı görevler başarıyla silindi',
        deletedChecklist: {
          id: checklistId,
          ad: checklist.ad,
        },
        cancelledTasksCount: activeTasks.length,
        completedTasksCount: completedTasks.length,
        totalTasksCount: allTasks.length,
      });
    } catch (error) {
      console.error('Checklist zorla silme hatası:', error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz checklist ID' });
      }
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// Yardımcı fonksiyon: Checklist için tüm kullanıcılara görev oluştur
const createTasksForAllUsers = async checklist => {
  try {
    console.log(
      `📋 ${checklist.ad} için tüm kullanıcılara görev oluşturuluyor...`,
    );

    // Hedef role ve departmana sahip tüm aktif kullanıcıları bul
    const users = await User.find({
      roller: checklist.hedefRol,
      departmanlar: checklist.hedefDepartman,
      durum: 'aktif',
    });

    console.log(`👥 ${users.length} kullanıcı bulundu`);

    const tasks = [];
    for (const user of users) {
      // Hedef tarihi hesapla
      let hedefTarih;
      const now = new Date();

      switch (checklist.periyot) {
      case 'gunluk':
        hedefTarih = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün sonra
        break;
      case 'haftalik':
        hedefTarih = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 hafta sonra
        break;
      case 'aylik':
        hedefTarih = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 ay sonra
        break;
      case 'olayBazli':
      default:
        hedefTarih = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün sonra
        break;
      }

      // Yeni görev oluştur
      const task = new Task({
        kullanici: user._id,
        checklist: checklist._id,
        maddeler: checklist.maddeler.map(madde => ({
          soru: madde.soru,
          cevap: false,
          puan: 0,
          maxPuan: madde.puan,
          yorum: '',
          resimUrl: '',
        })),
        durum: 'bekliyor',
        periyot: checklist.periyot,
        hedefTarih: hedefTarih,
        otomatikOlusturuldu: true,
      });

      tasks.push(task);
      console.log(`✅ ${user.kullaniciAdi} için görev hazırlandı`);
    }

    // Tüm görevleri toplu olarak kaydet
    if (tasks.length > 0) {
      await Task.insertMany(tasks);
      console.log(`🎯 ${tasks.length} görev başarıyla oluşturuldu!`);
    }

    return tasks.length;
  } catch (error) {
    console.error('Görevler oluşturulurken hata:', error);
    throw error;
  }
};

module.exports = router;
