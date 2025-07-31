// Görev CRUD işlemleri
// Otomatik oluşturuldu: 2025-02-05T23:15:00.000Z
// Orijinal: tasks.js

const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');

// Models
const Task = require('../models/Task');
const User = require('../models/User');
const ChecklistTemplate = require('../models/ChecklistTemplate');

// @route   GET /
// @desc    Görevleri listele
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get(
  '/',
  auth,
  checkModulePermission('Görev Yönetimi'),
  async (req, res) => {
    try {
      const tasks = await Task.find()
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('ustRol', 'ad')
        .populate('ustDepartman', 'ad')
        .sort({ olusturmaTarihi: -1 });

      res.json(tasks);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   POST /
// @desc    Yeni görev oluştur (tek kullanıcı veya tüm rol kullanıcıları)
// @access  Private (Görev Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Görev Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const {
        kullanici,
        checklist,
        maddeler,
        ustRol,
        ustDepartman,
        periyot,
        hedefTarih,
        tumKullanicilar,
      } = req.body;

      // Checklist bilgilerini al
      const checklistTemplate = await ChecklistTemplate.findById(checklist)
        .populate('hedefRol')
        .populate('hedefDepartman');

      if (!checklistTemplate) {
        return res
          .status(404)
          .json({ message: 'Checklist şablonu bulunamadı' });
      }

      console.log('✅ Checklist template bulundu ve populate edildi');

      if (tumKullanicilar || !kullanici) {
        // Tüm rol kullanıcılarına görev oluştur
        console.log(
          `📋 ${checklistTemplate.ad} için tüm ${checklistTemplate.hedefRol.ad} kullanıcılarına görev oluşturuluyor...`,
        );

        const users = await User.find({
          roller: checklistTemplate.hedefRol._id,
          departmanlar: checklistTemplate.hedefDepartman._id,
          durum: 'aktif',
        });

        console.log(`👥 ${users.length} kullanıcı bulundu`);

        // Tüm kullanıcılar için görevleri paralel olarak oluştur
        const taskPromises = users.map(async user => {
          const task = new Task({
            kullanici: user._id,
            checklist: checklist,
            maddeler:
              maddeler ||
              checklistTemplate.maddeler.map(madde => ({
                soru: madde.soru,
                cevap: false,
                puan: 0,
                maxPuan: madde.puan,
                yorum: '',
                resimUrl: '',
              })),
            ustRol,
            ustDepartman,
            periyot: periyot || checklistTemplate.periyot || 'olayBazli',
            hedefTarih:
              hedefTarih || new Date(Date.now() + 24 * 60 * 60 * 1000),
            otomatikOlusturuldu: false,
          });

          await task.save();

          const populatedTask = await Task.findById(task._id)
            .populate('kullanici', 'ad soyad kullaniciAdi')
            .populate('checklist', 'ad')
            .populate('ustRol', 'ad')
            .populate('ustDepartman', 'ad');

          console.log(`✅ ${user.kullaniciAdi} için görev oluşturuldu`);
          return populatedTask;
        });

        const createdTasks = await Promise.all(taskPromises);

        res.status(201).json({
          message: `${createdTasks.length} kullanıcıya görev başarıyla oluşturuldu`,
          tasks: createdTasks,
          count: createdTasks.length,
        });
      } else {
        // Tek kullanıcıya görev oluştur (eski davranış)
        const task = new Task({
          kullanici,
          checklist,
          maddeler:
            maddeler ||
            checklistTemplate.maddeler.map(madde => ({
              soru: madde.soru,
              cevap: false,
              puan: 0,
              maxPuan: madde.puan,
              yorum: '',
              resimUrl: '',
            })),
          ustRol,
          ustDepartman,
          periyot: periyot || 'olayBazli',
          hedefTarih: hedefTarih || new Date(Date.now() + 24 * 60 * 60 * 1000),
          otomatikOlusturuldu: false,
        });

        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('kullanici', 'ad soyad kullaniciAdi')
          .populate('checklist', 'ad')
          .populate('ustRol', 'ad')
          .populate('ustDepartman', 'ad');

        res.status(201).json(populatedTask);
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /:id/complete
// @desc    Görevi tamamla
// @access  Private (Görev Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id/complete',
  auth,
  checkModulePermission('Görev Yönetimi', 'duzenleyebilir'),
  require('../middleware/cache').invalidateCache([
    'tasks:*',
    'control:*',
    'activity:*',
    'dashboard:*',
  ]),
  async (req, res) => {
    try {
      const { maddeler, makina } = req.body;

      console.log('🎯 Görev tamamlama isteği:', {
        taskId: req.params.id,
        maddelerCount: maddeler?.length,
        makina,
        userId: req.user._id,
      });

      // Makina kontrolü - ZORUNLU
      if (!makina) {
        return res.status(400).json({
          message: 'Makina seçimi zorunludur! Lütfen bir makina seçin.',
          error: 'MAKINA_SECIMI_ZORUNLU',
        });
      }

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      // Görevin durumunu kontrol et - sadece "bekliyor" ve "baslatildi" durumundaki görevler tamamlanabilir
      if (!['bekliyor', 'baslatildi'].includes(task.durum)) {
        return res.status(400).json({
          message:
            'Bu görev zaten tamamlanmış veya işlem görmüş. Tekrar tamamlananamaz.',
          currentStatus: task.durum,
        });
      }

      // Sadece görevin sahibi tamamlayabilir
      if (task.kullanici.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: 'Bu görevi tamamlama yetkiniz yok' });
      }

      // Toplam puanı hesapla - maxPuan kullan, puan değil
      let toplamPuan = 0;
      const updatedMaddeler = maddeler.map(madde => {
        const puan = madde.cevap ? madde.maxPuan || 0 : 0;
        toplamPuan += puan;
        return {
          ...madde,
          puan: puan,
        };
      });

      console.log('📊 Puan hesaplama:', {
        toplamPuan,
        maddelerCount: updatedMaddeler.length,
        tamamlananMaddeler: updatedMaddeler.filter(m => m.cevap).length,
      });

      const updateData = {
        maddeler: updatedMaddeler,
        toplamPuan,
        durum: 'tamamlandi',
        tamamlanmaTarihi: new Date(),
      };

      // Makina bilgisi varsa ekle
      if (makina) {
        updateData.makina = makina;
        console.log('🔧 Makina eklendi:', makina);
      }

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true },
      )
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('makina', 'ad makinaNo');

      console.log('✅ Görev tamamlandı:', {
        taskId: updatedTask._id,
        toplamPuan: updatedTask.toplamPuan,
        durum: updatedTask.durum,
        makina: updatedTask.makina?.makinaNo || 'Makina yok',
        checklist: updatedTask.checklist?.ad || 'N/A',
        kullanici: updatedTask.kullanici?.kullaniciAdi || 'N/A',
      });

      res.json(updatedTask);
    } catch (error) {
      console.error('❌ Görev tamamlama hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  },
);

// @route   PUT /:id/start
// @desc    Görevi başlat ve makina ata
// @access  Private (Görev Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id/start',
  auth,
  checkModulePermission('Görev Yönetimi', 'duzenleyebilir'),
  require('../middleware/cache').invalidateCache(['tasks:*']),
  async (req, res) => {
    try {
      const { makina } = req.body;

      console.log('🚀 Göreve başlama isteği:', {
        taskId: req.params.id,
        makina,
        userId: req.user._id,
      });

      // Makina kontrolü - ZORUNLU
      if (!makina) {
        return res.status(400).json({
          message: 'Makina seçimi zorunludur! Lütfen bir makina seçin.',
          error: 'MAKINA_SECIMI_ZORUNLU',
        });
      }

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      // Görevin durumunu kontrol et - sadece "bekliyor" durumundaki görevler başlatılabilir
      if (task.durum !== 'bekliyor') {
        return res.status(400).json({
          message: 'Bu görev zaten başlatılmış veya tamamlanmış.',
          currentStatus: task.durum,
        });
      }

      // Sadece görevin sahibi başlatabilir
      if (task.kullanici.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: 'Bu görevi başlatma yetkiniz yok' });
      }

      // Kullanıcının seçili makina ile uyumlu olup olmadığını kontrol et
      const user = await User.findById(req.user._id);
      if (!user.secilenMakinalar?.includes(makina)) {
        return res.status(400).json({
          message:
            'Seçili makinanız ile görev makinası uyuşmuyor. Lütfen makina seçiminizi güncelleyin.',
          error: 'MAKINA_UYUMSUZLUGU',
        });
      }

      const updateData = {
        makina: makina,
        durum: 'baslatildi',
        baslamaTarihi: new Date(),
      };

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true },
      )
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('makina', 'ad makinaNo');

      console.log('🚀 Görev başlatıldı:', {
        taskId: updatedTask._id,
        durum: updatedTask.durum,
        makina: updatedTask.makina?.makinaNo || 'Makina yok',
        checklist: updatedTask.checklist?.ad || 'N/A',
        kullanici: updatedTask.kullanici?.kullaniciAdi || 'N/A',
      });

      res.json({
        message: 'Görev başarıyla başlatıldı',
        task: updatedTask,
        makina: updatedTask.makina,
      });
    } catch (error) {
      console.error('❌ Görev başlatma hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  },
);

module.exports = router;
