const express = require('express');
const router = express.Router();
const WorkTask = require('../models/WorkTask');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const { auth, checkModulePermission } = require('../middleware/auth');
const User = require('../models/User');
const Role = require('../models/Role');
const axios = require('axios');

// @route   GET /api/worktasks/checklists
// @desc    İşe bağlı checklistleri getir
// @access  Private
router.get(
  '/checklists',
  auth,
  checkModulePermission('Yaptım'),
  async (req, res) => {
    try {
      const user = req.user;

      // Kullanıcının rolüne göre işe bağlı checklistleri getir
      const userRoleIds = user.roller.map(rol => rol._id);

      const checklists = await ChecklistTemplate.find({
        tur: 'iseBagli',
        hedefRol: { $in: userRoleIds },
      })
        .populate('hedefDepartman', 'ad')
        .populate('hedefRol', 'ad');

      console.log(
        `📋 Kullanıcı ${user.kullaniciAdi} için ${checklists.length} olay bazlı checklist bulundu`,
      );

      // Debug: Her checklist'in maddelerini logla
      checklists.forEach((checklist, index) => {
        console.log(
          `   ${index + 1}. ${checklist.ad} - ${checklist.maddeler?.length || 0} madde`,
        );
        if (checklist.maddeler && checklist.maddeler.length > 0) {
          checklist.maddeler.forEach((madde, maddeIndex) => {
            console.log(
              `      ${maddeIndex + 1}. ${madde.soru} (${madde.puan} puan)`,
            );
          });
        }
      });

      res.json(checklists);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   POST /api/worktasks
// @desc    Yeni iş görevi oluştur
// @access  Private
router.post('/', auth, checkModulePermission('Yaptım'), async (req, res) => {
  try {
    console.log('🔧 WorkTask oluşturma isteği:', req.body);
    console.log('🔧 WorkTask oluşturan kullanıcı:', {
      id: req.user._id,
      ad: req.user.ad,
      soyad: req.user.soyad,
      roller: req.user.roller,
    });

    const {
      checklistId,
      makinaId,
      indirilenKalip,
      baglananHamade,
      makinaDurmaSaati,
      yeniKalipAktifSaati,
      kalipDegisimBuddy,
      bakimaGitsinMi,
      bakimSebebi,
      bakimResimUrl,
    } = req.body;

    // Validation
    if (!checklistId) {
      return res.status(400).json({
        success: false,
        message: 'Checklist ID gerekli',
        field: 'checklistId',
      });
    }

    if (!makinaId) {
      return res.status(400).json({
        success: false,
        message: 'Makina ID gerekli',
        field: 'makinaId',
      });
    }

    // Checklist'i getir
    const checklist = await ChecklistTemplate.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Checklist bulunamadı',
        checklistId,
      });
    }

    console.log('✅ Checklist bulundu:', {
      id: checklist._id,
      ad: checklist.ad,
      maddelerSayisi: checklist.maddeler?.length || 0,
    });

    // WorkTask oluştur
    const workTaskData = {
      kullanici: req.user._id,
      checklist: checklistId,
      makina: makinaId,
      makinaDurmaSaati: makinaDurmaSaati || new Date(),
      yeniKalipAktifSaati: yeniKalipAktifSaati || new Date(),
      bakimaGitsinMi: bakimaGitsinMi || false,
      bakimSebebi: bakimSebebi || '',
      bakimResimUrl: bakimResimUrl || '',
      maddeler: checklist.maddeler.map(madde => ({
        maddeId: madde._id,
        soru: madde.soru,
        yapildi: false,
        puan: madde.puan,
        maxPuan: madde.puan,
      })),
    };

    // Opsiyonel alanları sadece değer varsa ekle
    if (indirilenKalip) {
      workTaskData.indirilenKalip = indirilenKalip;
    }
    if (baglananHamade) {
      workTaskData.baglananHamade = baglananHamade;
    }
    if (kalipDegisimBuddy) {
      workTaskData.kalipDegisimBuddy = kalipDegisimBuddy;
    }

    console.log('📝 WorkTask oluşturuluyor:', {
      kullanici: workTaskData.kullanici,
      checklist: workTaskData.checklist,
      makina: workTaskData.makina,
      indirilenKalip: workTaskData.indirilenKalip || 'null',
      baglananHamade: workTaskData.baglananHamade || 'null',
      maddelerSayisi: workTaskData.maddeler.length,
    });

    const workTask = new WorkTask(workTaskData);
    await workTask.save();

    console.log('✅ WorkTask başarıyla oluşturuldu:', workTask._id);

    // Populate edilmiş veriyi döndür
    const populatedTask = await WorkTask.findById(workTask._id)
      .populate('kullanici', 'ad soyad')
      .populate('checklist', 'ad')
      .populate('makina', 'envanterKodu ad')
      .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
      .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
      .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi rollers')
      .populate('onaylayanKullanici', 'ad soyad');

    res.status(201).json({
      success: true,
      data: populatedTask,
      message: 'WorkTask başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('❌ WorkTask oluşturma hatası:', error);

    // Validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation hatası',
        errors: validationErrors,
        error: error.message,
      });
    }

    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID formatı',
        field: error.path,
        value: error.value,
        error: error.message,
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// @route   GET /api/worktasks/my-tasks
// @desc    Kullanıcının kendi iş görevlerini getir (Dashboard için)
// @access  Private
router.get(
  '/my-tasks',
  auth,
  checkModulePermission('Yaptım'),
  async (req, res) => {
    try {
      console.log(
        `🔍 /my-tasks çağrıldı - Kullanıcı: ${req.user._id} (${req.user.kullaniciAdi})`,
      );

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
  },
);

// @route   GET /api/worktasks/my-completed
// @desc    Kullanıcının tamamladığı iş görevlerini getir
// @access  Private
router.get(
  '/my-completed',
  auth,
  checkModulePermission('Yaptım'),
  async (req, res) => {
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
  },
);

// @route   PUT /api/worktasks/:id/items
// @desc    Checklist maddelerini güncelle
// @access  Private
router.put(
  '/:id/items',
  auth,
  checkModulePermission('Yaptım'),
  async (req, res) => {
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
  },
);

// @route   PUT /api/worktasks/:id/complete
// @desc    Görevi tamamla
// @access  Private
router.put(
  '/:id/complete',
  auth,
  checkModulePermission('Yaptım'),
  async (req, res) => {
    try {
      const workTask = await WorkTask.findById(req.params.id);
      if (!workTask) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      // Sadece kendi görevini tamamlayabilir
      if (workTask.kullanici.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }

      // Tamamlanan madde sayısını kontrol et (en az 1 madde tamamlanmış olmalı)
      const tamamlananMaddeler = workTask.maddeler.filter(m => m.yapildi);
      if (tamamlananMaddeler.length === 0) {
        return res.status(400).json({
          message: 'En az bir madde tamamlanmadan görev tamamlanamaz',
          tamamlananMaddeler: 0,
          toplamMaddeler: workTask.maddeler.length,
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
  },
);

// @route   GET /api/worktasks/control-pending
// @desc    İşe bağlı görevlerin kontrol listesi (sadece WorkTask'lar)
// @access  Private (Kontrol Bekleyenler modülü erişim yetkisi)
router.get(
  '/control-pending',
  auth,
  checkModulePermission(['Kontrol Bekleyenler', 'Dashboard']),
  async (req, res) => {
    try {
      console.log('🎯 WorkTask Control-Pending isteği başlatıldı');

      // Kullanıcının rollerini al
      const user = await User.findById(req.user._id).populate('roller');

      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      if (!user.roller || user.roller.length === 0) {
        console.log('Kullanıcının rolü yok:', user.kullaniciAdi);
        return res.json({ groupedTasks: {}, needsMachineSelection: false });
      }

      const userRoles = user.roller;
      console.log(
        'Kullanıcı rolleri:',
        userRoles.map(r => r.ad),
      );

      // Kullanıcının kontrol edebileceği rolleri bul
      const controllableRoles = [];

      // Tüm rolleri paralel olarak yükle
      const rolePromises = userRoles.map(role =>
        Role.findById(role._id).populate('checklistYetkileri.hedefRol'),
      );
      const fullRoles = await Promise.all(rolePromises);

      console.log(
        '🔍 Kontrol eden kullanıcının rolleri:',
        userRoles.map(r => r.ad),
      );

      for (const fullRole of fullRoles) {
        if (!fullRole) {
          continue;
        }

        console.log(
          `${fullRole.ad} rolünün checklist yetkileri:`,
          fullRole.checklistYetkileri?.map(y => ({
            hedefRol: y.hedefRol?.ad,
            gorebilir: y.gorebilir,
            puanlayabilir: y.puanlayabilir,
          })),
        );

        if (
          fullRole.checklistYetkileri &&
          fullRole.checklistYetkileri.length > 0
        ) {
          fullRole.checklistYetkileri.forEach(yetki => {
            if (yetki.gorebilir && yetki.hedefRol) {
              console.log(
                `✅ ${fullRole.ad} rolü ${yetki.hedefRol.ad} rolünü görebilir/kontrol edebilir`,
              );
              controllableRoles.push(yetki.hedefRol._id);
            }
          });
        } else {
          console.log(
            `⚠️ ${fullRole.ad} rolünün checklist yetkisi tanımlanmamış!`,
          );
        }
      }

      // Eğer hiç checklist yetkisi tanımlanmamışsa, hiçbir görevi gösterme
      if (controllableRoles.length === 0) {
        console.log(
          '⚠️ Hiç checklist yetkisi bulunamadı! Hiçbir görev gösterilmeyecek.',
        );
        return res.json({ groupedTasks: {}, needsMachineSelection: false });
      }

      console.log('🎯 Kontrol edilebilir roller ID\'leri:', controllableRoles);
      console.log(
        '🎯 Kontrol edilebilir rol sayısı:',
        controllableRoles.length,
      );

      // Seçili makinaları al
      let selectedMachines = [];

      try {
        const selectedMachinesResponse = await axios.get(
          `${process.env.BASE_URL || 'http://localhost:5000'}/api/tasks/my-selected-machines`,
          {
            headers: {
              Authorization: req.headers.authorization,
            },
          },
        );
        const rawResponse = selectedMachinesResponse.data;
        console.log(
          '🔍 WorkTask endpoint - Raw response:',
          typeof rawResponse,
          Array.isArray(rawResponse),
        );

        // Response format kontrolü - object ise machines array'ini al
        if (Array.isArray(rawResponse)) {
          selectedMachines = rawResponse;
        } else if (rawResponse && Array.isArray(rawResponse.machines)) {
          selectedMachines = rawResponse.machines;
          console.log('🔧 WorkTask endpoint - machines array kullanıldı');
        } else {
          console.log(
            '❌ selectedMachines format tanınmıyor, boş array kullanılıyor',
          );
          selectedMachines = [];
        }

        if (selectedMachines.length > 0) {
          console.log(
            '✅ WorkTask endpoint - Seçili makinalar:',
            selectedMachines.map(m => m.makinaNo || m.envanterKodu),
          );
        }
      } catch (error) {
        console.log(
          '❌ WorkTask endpoint - Makina seçimi hatası:',
          error.response?.status,
          error.response?.data?.message || error.message,
        );
        console.log(
          '❌ WorkTask endpoint - Authorization header:',
          req.headers.authorization ? 'Mevcut' : 'Eksik',
        );
        selectedMachines = [];
      }

      // Eğer kullanıcı makina seçmemişse
      if (selectedMachines.length === 0) {
        console.log('Kullanıcı henüz makina seçmemiş');
        return res.json({
          message: 'Lütfen önce çalıştığınız makinaları seçin',
          needsMachineSelection: true,
        });
      }

      // Sadece WorkTask'ları getir
      const workTasks = await WorkTask.find({
        durum: { $in: ['tamamlandi', 'onaylandi', 'reddedildi'] },
      })
        .populate({
          path: 'kullanici',
          select: 'ad soyad kullaniciAdi rollers',
          populate: {
            path: 'roller',
            select: 'ad',
          },
        })
        .populate('checklist', 'ad')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi roller')
        .populate('onaylayanKullanici', 'ad soyad')
        .sort({ tamamlanmaTarihi: -1 });

      console.log(`📋 ${workTasks.length} WorkTask bulundu`);

      // Sadece kontrol edilebilir rollerdeki kullanıcıların görevlerini filtrele
      const filteredWorkTasks = workTasks.filter(task => {
        if (!task.kullanici) {
          console.log('❌ WorkTask\'ta kullanıcı bilgisi eksik:', task._id);
          return false;
        }

        if (!task.kullanici.roller || task.kullanici.roller.length === 0) {
          console.log(
            `❌ Kullanıcı ${task.kullanici.kullaniciAdi || task.kullanici._id} rolü yok`,
          );
          return false;
        }

        // Kullanıcının rollerinden en az biri kontrol edilebilir roller arasında mı?
        const hasPermission = task.kullanici.roller.some(role => {
          const roleId = role._id || role;
          return controllableRoles.some(
            controllableRole =>
              controllableRole.toString() === roleId.toString(),
          );
        });

        if (!hasPermission) {
          console.log(
            `❌ WorkTask ${task._id} filtrelendi - Kullanıcı rolleri:`,
            task.kullanici.roller.map(r => r.ad),
          );
        } else {
          console.log(
            `✅ WorkTask ${task._id} dahil edildi - Kullanıcı rolleri:`,
            task.kullanici.roller.map(r => r.ad),
          );
        }

        return hasPermission;
      });

      console.log(
        `${filteredWorkTasks.length} WorkTask rol filtrelemesinden geçti`,
      );

      // WorkTask'ları formatla
      const formattedWorkTasks = filteredWorkTasks.map(workTask => ({
        _id: workTask._id,
        kullanici: workTask.kullanici,
        checklist: workTask.checklist,
        makina: workTask.makina
          ? {
            _id: workTask.makina._id,
            ad: workTask.makina.ad,
            makinaNo: workTask.makina.envanterKodu,
            envanterKodu: workTask.makina.envanterKodu,
          }
          : null,
        durum: workTask.durum,
        toplamPuan: workTask.toplamPuan,
        kontrolToplamPuani: workTask.kontrolToplamPuani,
        tamamlanmaTarihi: workTask.tamamlanmaTarihi,
        maddeler: workTask.maddeler,
        olusturmaTarihi: workTask.olusturmaTarihi,
        taskType: 'worktask',
        // Kalıp değişim bilgileri
        indirilenKalip: workTask.indirilenKalip,
        baglananHamade: workTask.baglananHamade,
        makinaDurmaSaati: workTask.makinaDurmaSaati,
        yeniKalipAktifSaati: workTask.yeniKalipAktifSaati,
        kalipDegisimBuddy: workTask.kalipDegisimBuddy,
        bakimaGitsinMi: workTask.bakimaGitsinMi,
        bakimSebebi: workTask.bakimSebebi,
        bakimResimUrl: workTask.bakimResimUrl,
        onaylayanKullanici: workTask.onaylayanKullanici,
      }));

      // Makina bazlı gruplama
      const groupedTasks = {};
      const machineFilteredTasks = formattedWorkTasks.filter(task => {
        if (!task.makina) {
          return false;
        }

        const taskMachineId = task.makina._id?.toString();
        return selectedMachines.some(selectedMachine => {
          const selectedMachineId = selectedMachine._id?.toString();
          return taskMachineId === selectedMachineId;
        });
      });

      console.log(
        `🔍 ${machineFilteredTasks.length} WorkTask seçili makinalarla eşleşti`,
      );

      // Makina bazlı gruplama yap
      machineFilteredTasks.forEach(task => {
        let machineKey, machineInfo;

        if (task.makina && task.makina._id) {
          machineKey =
            task.makina.makinaNo || task.makina.envanterKodu || task.makina.ad;
          machineInfo = {
            _id: task.makina._id,
            ad: task.makina.ad,
            makinaNo: task.makina.makinaNo || task.makina.envanterKodu,
            envanterKodu: task.makina.envanterKodu,
          };
        } else {
          machineKey = 'Atanmamış';
          machineInfo = null;
        }

        if (!groupedTasks[machineKey]) {
          groupedTasks[machineKey] = {
            machine: machineInfo,
            tasks: [],
          };
        }
        groupedTasks[machineKey].tasks.push(task);
      });

      console.log(
        '✅ WorkTask kontrol listesi hazırlandı:',
        Object.keys(groupedTasks),
      );

      res.json({
        groupedTasks,
        selectedMachines: selectedMachines,
        needsMachineSelection: false,
      });
    } catch (error) {
      console.error('WorkTask control-pending hatası:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).send('Sunucu hatası');
    }
  },
);

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
      console.log('🎯 WorkTask Score-Items Request:', {
        taskId: req.params.id,
        userId: req.user._id,
        userRole: req.user.roller?.map(r => r.ad || r),
        body: req.body,
      });

      const { maddeler, kontrolNotu } = req.body;

      if (!maddeler || !Array.isArray(maddeler)) {
        console.log('❌ Maddeler array değil:', maddeler);
        return res
          .status(400)
          .json({ message: 'Maddeler array formatında olmalıdır' });
      }

      const workTask = await WorkTask.findById(req.params.id);
      if (!workTask) {
        console.log('❌ WorkTask bulunamadı:', req.params.id);
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      console.log('📋 WorkTask durumu:', workTask.durum);
      if (workTask.durum !== 'tamamlandi') {
        console.log('❌ WorkTask tamamlanmamış:', workTask.durum);
        return res
          .status(400)
          .json({ message: 'Sadece tamamlanmış görevler puanlanabilir' });
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
      workTask.onayTarihi = new Date();
      workTask.puanlayanKullanici = req.user._id;
      workTask.durum = 'onaylandi';
      workTask.toplamPuan = kontrolToplamPuani;

      await workTask.save();

      console.log('✅ WorkTask puanlandı ve onaylandı:', {
        id: workTask._id,
        kontrolToplamPuani,
        durum: workTask.durum,
        puanlayanKullanici: req.user._id,
      });

      // Populate edilmiş veriyi döndür
      const populatedTask = await WorkTask.findById(workTask._id)
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .populate('onaylayanKullanici', 'ad soyad');

      // Cache temizleme - Control-pending verilerini invalidate et
      const cacheService = require('../services/cacheService');
      await cacheService.invalidateTasks();
      console.log('🧹 WorkTask control-pending cache temizlendi');

      // 🎯 Kontrol puanı ver (puanlama sonrası)
      try {
        const axios = require('axios');
        const baseURL = process.env.BASE_URL || 'http://localhost:5000';

        console.log('🎯 WorkTask kontrol puanı API çağrısı başlatılıyor...');

        // ✅ DÜZELTME: İki ayrı puan sistemi
        console.log('🔍 WorkTask puanlama detayları:', {
          workTaskId: workTask._id,
          gorevYapanKisi: workTask.kullanici,
          puanlamaYapanKisi: req.user._id,
          verilenPuan: kontrolToplamPuani,
          checklistAdi: workTask.checklist,
          buddyVar: !!workTask.kalipDegisimBuddy,
        });

        // 1. Puanlama yapan kişiye (VARDİYA AMİRİ) kontrol puanı ver
        const controlScoreResponse = await axios.post(
          `${baseURL}/api/control-scores/create`,
          {
            puanlananTask: workTask._id,
            gorevTipi: 'WorkTask',
            sablon: workTask.checklist,
            sablonTipi: 'ChecklistTemplate',
            puanlananKullanici: req.user._id, // ✅ DÜZELTME: Puanlama yapan kişiye kontrol puanı ver
            verilenPuan: kontrolToplamPuani, // ✅ Kullanıcının verdiği gerçek puan
          },
          {
            headers: {
              Authorization: req.headers.authorization,
              'x-auth-token': req.headers['x-auth-token'],
            },
          },
        );

        console.log(
          '✅ Puanlama yapan kişiye (VARDİYA AMİRİ) kontrol puanı başarıyla verildi:',
          controlScoreResponse.data,
        );

        // 2. ✅ DÜZELTME: Buddy'ye de ana kullanıcı ile aynı puanı ver
        if (workTask.kalipDegisimBuddy) {
          console.log('🎯 Buddy WorkTask puanı veriliyor:', {
            buddyId: workTask.kalipDegisimBuddy,
            workTaskId: workTask._id,
            kontrolToplamPuani: kontrolToplamPuani, // Ana ile aynı puan!
            maddeler: workTask.maddeler.length,
          });

          // Buddy'nin WorkTask'ını daha geniş kriterle bul
          const buddyWorkTask = await WorkTask.findOne({
            kullanici: workTask.kalipDegisimBuddy,
            checklist: workTask.checklist,
            durum: { $in: ['tamamlandi', 'onaylandi'] },
          }).sort({ updatedAt: -1 }); // En son güncellenen

          if (buddyWorkTask) {
            console.log('🔍 Buddy\'nin WorkTask\'ı bulundu:', buddyWorkTask._id);

            // Buddy'nin WorkTask'ına ana kullanıcı ile aynı puanı ver
            // Validation hatalarını önlemek için updateOne kullan
            const buddyUpdateData = {
              kontrolToplamPuani: kontrolToplamPuani,
              onayNotu: `Buddy puanlaması: ${kontrolNotu || 'VARDİYA AMİRİ tarafından puanlandı'}`,
              onaylayanKullanici: req.user._id,
              onayTarihi: new Date(),
              puanlayanKullanici: req.user._id,
              durum: 'onaylandi',
              toplamPuan: kontrolToplamPuani,
              updatedAt: new Date(),
            };

            // Buddy'nin maddelerine de aynı puanları ver
            if (buddyWorkTask.maddeler && workTask.maddeler) {
              // Madde sayısı aynı değilse bile tüm maddeleri güncelle
              for (let i = 0; i < buddyWorkTask.maddeler.length; i++) {
                const anaMadde = workTask.maddeler[i];

                if (anaMadde) {
                  // Ana görevden aynı puanı kopyala
                  buddyUpdateData[`maddeler.${i}.kontrolPuani`] =
                    anaMadde.kontrolPuani;
                  buddyUpdateData[`maddeler.${i}.kontrolYorumu`] =
                    `Buddy puanlaması: ${anaMadde.kontrolYorumu || ''}`;
                  if (anaMadde.kontrolResimUrl) {
                    buddyUpdateData[`maddeler.${i}.kontrolResimUrl`] =
                      anaMadde.kontrolResimUrl;
                  }
                } else {
                  // Ana görevde eksik madde varsa varsayılan puan ver
                  buddyUpdateData[`maddeler.${i}.kontrolPuani`] = Math.floor(
                    kontrolToplamPuani / buddyWorkTask.maddeler.length,
                  );
                  buddyUpdateData[`maddeler.${i}.kontrolYorumu`] =
                    'Buddy puanlaması: Otomatik puan';
                }
              }
            }

            // Validation'ı bypass ederek direkt update yap
            await WorkTask.updateOne(
              { _id: buddyWorkTask._id },
              { $set: buddyUpdateData },
              { runValidators: false }, // Validation'ı bypass et
            );

            // Final kontrolü yap
            const finalBuddyCheck = await WorkTask.findById(buddyWorkTask._id);

            console.log('✅ Buddy WorkTask puanlandı:', {
              buddyTaskId: finalBuddyCheck._id,
              kontrolToplamPuani: finalBuddyCheck.kontrolToplamPuani,
              durum: finalBuddyCheck.durum,
              maddeSayisi: finalBuddyCheck.maddeler?.length || 0,
            });

            // Buddy için de cache temizle
            try {
              const cacheService = req.app.get('cacheService');
              if (cacheService) {
                await cacheService.delPattern(
                  `activity:*${workTask.kalipDegisimBuddy}*`,
                );
                await cacheService.delPattern(
                  `tasks:*${workTask.kalipDegisimBuddy}*`,
                );
                await cacheService.delPattern(
                  `worktask:*${workTask.kalipDegisimBuddy}*`,
                );
                console.log('✅ Buddy cache temizlendi');
              }
            } catch (cacheError) {
              console.log(
                '⚠️ Buddy cache temizleme hatası:',
                cacheError.message,
              );
            }
          } else {
            console.log(
              '⚠️ Buddy\'nin WorkTask\'ı bulunamadı! Buddy sistemi çalışmayacak.',
            );
            console.log('🔍 Buddy arama kriterleri:', {
              kullanici: workTask.kalipDegisimBuddy,
              checklist: workTask.checklist,
              durum: 'tamamlandi veya onaylandi',
            });
          }
        } else {
          console.log('ℹ️ Bu WorkTask\'ta buddy yok, buddy puanı verilmedi');
        }
      } catch (controlError) {
        console.error(
          '⚠️ WorkTask kontrol puanı verilemedi:',
          controlError.response?.data || controlError.message,
        );
        // Hata olsa bile ana işlem devam etsin
      }

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
router.put(
  '/:id/approve',
  auth,
  checkModulePermission('Kontrol Bekleyenler'),
  async (req, res) => {
    try {
      const { onayNotu } = req.body;

      const workTask = await WorkTask.findById(req.params.id);
      if (!workTask) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      if (workTask.durum !== 'tamamlandi') {
        return res
          .status(400)
          .json({ message: 'Sadece tamamlanmış görevler onaylanabilir' });
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
  },
);

// @route   PUT /api/worktasks/:id/reject
// @desc    WorkTask'ı reddet
// @access  Private
router.put(
  '/:id/reject',
  auth,
  checkModulePermission('Kontrol Bekleyenler'),
  async (req, res) => {
    try {
      const { redNotu } = req.body;

      const workTask = await WorkTask.findById(req.params.id);
      if (!workTask) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      if (workTask.durum !== 'tamamlandi') {
        return res
          .status(400)
          .json({ message: 'Sadece tamamlanmış görevler reddedilebilir' });
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
  },
);

module.exports = router;
