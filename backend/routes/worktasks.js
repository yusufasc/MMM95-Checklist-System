const express = require('express');
const router = express.Router();
const WorkTask = require('../models/WorkTask');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const { auth, checkModulePermission } = require('../middleware/auth');

// @route   GET /api/worktasks/checklists
// @desc    İşe bağlı checklistleri getir
// @access  Private
router.get('/checklists', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    const user = req.user;

    // Kullanıcının rolüne göre işe bağlı checklistleri getir
    const userRoleIds = user.roller.map(rol => rol._id);

    const checklists = await ChecklistTemplate.find({
      tur: 'iseBagli',
      hedefRol: { $in: userRoleIds },
    }).populate('hedefDepartman', 'ad');

    res.json(checklists);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/worktasks
// @desc    Yeni iş görevi oluştur
// @access  Private
router.post('/', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    const {
      checklistId,
      makinaId,
      indirilenKalip,
      baglananHamade,
      makinaDurmaSaati,
      yeniKalipAktifSaati,
      bakimaGitsinMi,
      bakimSebebi,
      bakimResimUrl,
    } = req.body;

    // Checklist'i getir
    const checklist = await ChecklistTemplate.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist bulunamadı' });
    }

    // WorkTask oluştur
    const workTask = new WorkTask({
      kullanici: req.user._id,
      checklist: checklistId,
      makina: makinaId,
      indirilenKalip,
      baglananHamade,
      makinaDurmaSaati,
      yeniKalipAktifSaati,
      bakimaGitsinMi,
      bakimSebebi,
      bakimResimUrl,
      maddeler: checklist.maddeler.map(madde => ({
        maddeId: madde._id,
        soru: madde.soru,
        yapildi: false,
        puan: madde.puan,
        maxPuan: madde.puan, // Maksimum puan değeri
      })),
    });

    await workTask.save();

    // Populate edilmiş veriyi döndür
    const populatedTask = await WorkTask.findById(workTask._id)
      .populate('kullanici', 'ad soyad')
      .populate('checklist', 'ad')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar');

    res.json(populatedTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/worktasks/my-tasks
// @desc    Kullanıcının kendi iş görevlerini getir (Dashboard için)
// @access  Private
router.get('/my-tasks', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    console.log(`🔍 /my-tasks çağrıldı - Kullanıcı: ${req.user._id} (${req.user.kullaniciAdi})`);

    // Dashboard için beklemede ve devam ediyor durumları dahil
    const tasks = await WorkTask.find({
      kullanici: req.user._id,
      durum: { $in: ['bekliyor', 'beklemede', 'devamEdiyor'] },
    })
      .populate('checklist', 'ad aciklama')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
      .sort({ olusturmaTarihi: -1 });

    console.log(
      `📋 WorkTasks /my-tasks - Kullanıcı ${req.user._id} için ${tasks.length} görev bulundu`,
    );

    // Her görevi detayıyla logla
    tasks.forEach((task, index) => {
      console.log(
        `   ${index + 1}. ${task._id} - ${task.checklist?.ad || 'Checklist yok'} - Durum: ${task.durum}`,
      );
    });

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/worktasks/my-completed
// @desc    Kullanıcının tamamladığı iş görevlerini getir
// @access  Private
router.get('/my-completed', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    const tasks = await WorkTask.find({
      kullanici: req.user._id,
      durum: { $in: ['tamamlandi', 'onaylandi', 'reddedildi'] },
    })
      .populate('checklist', 'ad')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
      .populate('onaylayanKullanici', 'ad soyad')
      .sort({ tamamlanmaTarihi: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   PUT /api/worktasks/:id/items
// @desc    Checklist maddelerini güncelle
// @access  Private
router.put('/:id/items', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    const { maddeler } = req.body;

    const workTask = await WorkTask.findById(req.params.id);
    if (!workTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Sadece kendi görevini güncelleyebilir
    if (workTask.kullanici.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Maddeleri güncelle
    maddeler.forEach(guncellenenMadde => {
      const maddeIndex = workTask.maddeler.findIndex(
        m => m.maddeId.toString() === guncellenenMadde.maddeId,
      );

      if (maddeIndex !== -1) {
        workTask.maddeler[maddeIndex].yapildi = guncellenenMadde.yapildi;
        if (guncellenenMadde.yapildi) {
          workTask.maddeler[maddeIndex].yapilmaTarihi = new Date();
        }
      }
    });

    await workTask.save();
    res.json(workTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   PUT /api/worktasks/:id/complete
// @desc    Görevi tamamla
// @access  Private
router.put('/:id/complete', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    const workTask = await WorkTask.findById(req.params.id);
    if (!workTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Sadece kendi görevini tamamlayabilir
    if (workTask.kullanici.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Tüm maddelerin yapıldığını kontrol et
    const tamamlanmayanMaddeler = workTask.maddeler.filter(m => !m.yapildi);
    if (tamamlanmayanMaddeler.length > 0) {
      return res.status(400).json({
        message: 'Tüm maddeler tamamlanmadan görev tamamlanamaz',
        eksikMaddeler: tamamlanmayanMaddeler.length,
      });
    }

    // Toplam puanı hesapla
    const toplamPuan = workTask.maddeler.reduce((total, madde) => {
      return total + (madde.yapildi ? madde.puan : 0);
    }, 0);

    workTask.durum = 'tamamlandi';
    workTask.tamamlanmaTarihi = new Date();
    workTask.toplamPuan = toplamPuan;

    await workTask.save();

    res.json({
      message: 'Görev başarıyla tamamlandı',
      toplamPuan,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/worktasks/:id
// @desc    Tek bir work task detayını getir
// @access  Private
router.get('/:id', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    const workTask = await WorkTask.findById(req.params.id)
      .populate('kullanici', 'ad soyad')
      .populate('checklist')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar');

    if (!workTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    res.json(workTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   PUT /api/worktasks/:id/score-items
// @desc    WorkTask madde bazlı puanlama yap
// @access  Private
router.put(
  '/:id/score-items',
  auth,
  checkModulePermission('Kontrol Bekleyenler'),
  async (req, res) => {
    try {
      const { maddeler, kontrolNotu } = req.body;

      const workTask = await WorkTask.findById(req.params.id);
      if (!workTask) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      if (workTask.durum !== 'tamamlandi') {
        return res.status(400).json({ message: 'Sadece tamamlanmış görevler puanlanabilir' });
      }

      // Kontrol puanlarını güncelle
      let kontrolToplamPuani = 0;
      const updatedMaddeler = workTask.maddeler.map((madde, index) => {
        const kontrolMadde = maddeler[index];
        if (kontrolMadde) {
          madde.kontrolPuani = kontrolMadde.kontrolPuani || kontrolMadde.puan;
          madde.kontrolYorumu = kontrolMadde.kontrolYorumu || '';
          madde.kontrolResimUrl = kontrolMadde.kontrolResimUrl || '';
          kontrolToplamPuani += kontrolMadde.kontrolPuani || 0;
        }
        return madde;
      });

      workTask.maddeler = updatedMaddeler;
      workTask.kontrolToplamPuani = kontrolToplamPuani;
      workTask.onayNotu = kontrolNotu || '';
      workTask.onaylayanKullanici = req.user._id;

      await workTask.save();

      // Populate edilmiş veriyi döndür
      const populatedTask = await WorkTask.findById(workTask._id)
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .populate('onaylayanKullanici', 'ad soyad');

      res.json(populatedTask);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /api/worktasks/:id/approve
// @desc    WorkTask'ı onayla
// @access  Private
router.put('/:id/approve', auth, checkModulePermission('Kontrol Bekleyenler'), async (req, res) => {
  try {
    const { onayNotu } = req.body;

    const workTask = await WorkTask.findById(req.params.id);
    if (!workTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (workTask.durum !== 'tamamlandi') {
      return res.status(400).json({ message: 'Sadece tamamlanmış görevler onaylanabilir' });
    }

    workTask.durum = 'onaylandi';
    workTask.onayTarihi = new Date();
    workTask.onayNotu = onayNotu || 'Onaylandı';
    workTask.onaylayanKullanici = req.user._id;

    await workTask.save();

    // Populate edilmiş veriyi döndür
    const populatedTask = await WorkTask.findById(workTask._id)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklist', 'ad')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
      .populate('onaylayanKullanici', 'ad soyad');

    res.json({
      message: 'Görev başarıyla onaylandı',
      task: populatedTask,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   PUT /api/worktasks/:id/reject
// @desc    WorkTask'ı reddet
// @access  Private
router.put('/:id/reject', auth, checkModulePermission('Kontrol Bekleyenler'), async (req, res) => {
  try {
    const { redNotu } = req.body;

    const workTask = await WorkTask.findById(req.params.id);
    if (!workTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (workTask.durum !== 'tamamlandi') {
      return res.status(400).json({ message: 'Sadece tamamlanmış görevler reddedilebilir' });
    }

    workTask.durum = 'reddedildi';
    workTask.onayTarihi = new Date();
    workTask.onayNotu = redNotu || 'Reddedildi';
    workTask.onaylayanKullanici = req.user._id;

    await workTask.save();

    // Populate edilmiş veriyi döndür
    const populatedTask = await WorkTask.findById(workTask._id)
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklist', 'ad')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
      .populate('onaylayanKullanici', 'ad soyad');

    res.json({
      message: 'Görev reddedildi',
      task: populatedTask,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
