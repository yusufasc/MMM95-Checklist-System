const express = require('express');
const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');
const User = require('../models/User');
const Role = require('../models/Role');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Machine = require('../models/Machine');
const { auth, checkModulePermission, checkChecklistPermission } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/tasks
// @desc    Görevleri listele
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get('/', auth, checkModulePermission('Görev Yönetimi'), async (req, res) => {
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
});

// @route   GET /api/tasks/control-pending
// @desc    Kontrol bekleyen görevleri hiyerarşik olarak listele
// @access  Private (Kontrol Bekleyenler modülü erişim yetkisi)
router.get(
  '/control-pending',
  auth,
  checkModulePermission('Kontrol Bekleyenler'),
  async (req, res) => {
    try {
      // Kullanıcının rollerini al
      const user = await User.findById(req.user._id).populate('roller');

      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      if (!user.roller || user.roller.length === 0) {
        console.log('Kullanıcının rolü yok:', user.kullaniciAdi);
        return res.json({});
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

      for (const fullRole of fullRoles) {
        if (!fullRole) {
          continue;
        }

        console.log(`${fullRole.ad} rolünün checklist yetkileri:`, fullRole.checklistYetkileri);

        if (fullRole.checklistYetkileri && fullRole.checklistYetkileri.length > 0) {
          fullRole.checklistYetkileri.forEach(yetki => {
            if (yetki.gorebilir && yetki.hedefRol) {
              console.log(`${fullRole.ad} rolü ${yetki.hedefRol.ad} rolünü görebilir`);
              controllableRoles.push(yetki.hedefRol._id);
            }
          });
        }
      }

      console.log('Kontrol edilebilir roller:', controllableRoles);

      // Kullanıcının seçtiği makinaları al
      let selectedMachines = [];

      if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
        // Önce inventory'den makina bilgilerini almaya çalış
        try {
          const axios = require('axios');
          const baseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';

          const inventoryResponse = await axios.get(`${baseURL}/inventory/machines-for-tasks`, {
            headers: {
              Authorization: req.headers.authorization,
            },
          });

          // Seçilen makina ID'lerini inventory verisiyle eşleştir
          selectedMachines = user.secilenMakinalar
            .map(selectedId => {
              return inventoryResponse.data.find(
                machine => machine._id.toString() === selectedId.toString(),
              );
            })
            .filter(Boolean); // null/undefined değerleri çıkar

          console.log(
            'Inventory\'den yüklenen seçili makinalar:',
            selectedMachines.map(m => m.kod || m.makinaNo),
          );
        } catch (inventoryError) {
          console.error('Inventory API hatası, fallback kullanılıyor:', inventoryError.message);

          // Fallback: Eski Machine model'ini dene
          try {
            const userWithMachines = await User.findById(req.user._id).populate(
              'secilenMakinalar',
              'ad makinaNo',
            );

            selectedMachines = userWithMachines.secilenMakinalar || [];
            console.log(
              'Fallback\'den yüklenen seçili makinalar:',
              selectedMachines.map(m => m.makinaNo),
            );
          } catch (fallbackError) {
            console.error('Fallback de başarısız:', fallbackError.message);
            selectedMachines = [];
          }
        }
      }

      // Eğer kullanıcı makina seçmemişse, boş sonuç döndür
      if (selectedMachines.length === 0) {
        console.log('Kullanıcı henüz makina seçmemiş');
        return res.json({
          message: 'Lütfen önce çalıştığınız makinaları seçin',
          needsMachineSelection: true,
        });
      }

      // Kontrol edilebilir rollerdeki kullanıcıların tamamlanmış görevlerini getir
      // Sadece seçilen makinaların görevleri

      // Rutin görevler (Task modeli)
      const tasks = await Task.find({
        durum: { $in: ['tamamlandi', 'onaylandi', 'iadeEdildi'] },
        makina: { $in: selectedMachines.map(m => m._id) },
      })
        .populate({
          path: 'kullanici',
          select: 'ad soyad kullaniciAdi roller',
          populate: {
            path: 'roller',
            select: 'ad',
          },
        })
        .populate('checklist', 'ad')
        .populate('makina', 'ad makinaNo')
        .sort({ tamamlanmaTarihi: -1 });

      // İşe bağlı görevler (WorkTask modeli)
      const workTasks = await WorkTask.find({
        durum: { $in: ['tamamlandi', 'onaylandi', 'reddedildi'] },
        makina: { $in: selectedMachines.map(m => m._id) },
      })
        .populate({
          path: 'kullanici',
          select: 'ad soyad kullaniciAdi roller',
          populate: {
            path: 'roller',
            select: 'ad',
          },
        })
        .populate('checklist', 'ad')
        .populate('makina', 'envanterKodu ad')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .sort({ tamamlanmaTarihi: -1 });

      console.log(`WorkTask sorgusu tamamlandı. ${workTasks.length} WorkTask bulundu.`);

      // WorkTask'lardaki kullanıcı rollerini kontrol et
      workTasks.forEach(wt => {
        if (wt.kullanici && wt.kullanici.roller) {
          console.log(
            `WorkTask ${wt._id} - Kullanıcı: ${wt.kullanici.ad} ${wt.kullanici.soyad}, Roller: ${wt.kullanici.roller.map(r => r.ad).join(', ')}`,
          );
        } else {
          console.log(`WorkTask ${wt._id} - Kullanıcı veya rol bilgisi eksik!`);
        }
      });

      // WorkTask'ları Task formatına dönüştür (uyumluluk için)
      const formattedWorkTasks = workTasks.map(workTask => ({
        _id: workTask._id,
        kullanici: workTask.kullanici,
        checklist: workTask.checklist,
        makina: {
          _id: workTask.makina._id,
          ad: workTask.makina.ad,
          makinaNo: workTask.makina.envanterKodu, // envanterKodu'nu makinaNo olarak kullan
          envanterKodu: workTask.makina.envanterKodu,
        },
        durum: workTask.durum,
        toplamPuan: workTask.toplamPuan,
        tamamlanmaTarihi: workTask.tamamlanmaTarihi,
        maddeler: workTask.maddeler,
        olusturmaTarihi: workTask.olusturmaTarihi,
        taskType: 'worktask', // Ayırt etmek için
        // Kalıp değişim bilgileri
        indirilenKalip: workTask.indirilenKalip,
        baglananHamade: workTask.baglananHamade,
        makinaDurmaSaati: workTask.makinaDurmaSaati,
        yeniKalipAktifSaati: workTask.yeniKalipAktifSaati,
        bakimaGitsinMi: workTask.bakimaGitsinMi,
        bakimSebebi: workTask.bakimSebebi,
        bakimResimUrl: workTask.bakimResimUrl,
      }));

      // Tüm görevleri birleştir
      const allTasks = [...tasks, ...formattedWorkTasks];

      console.log(
        `Toplam ${allTasks.length} tamamlanmış görev bulundu (${tasks.length} rutin + ${workTasks.length} işe bağlı)`,
      );

      // WorkTask'ları detaylı logla
      if (workTasks.length > 0) {
        console.log('WorkTask detayları:');
        workTasks.forEach(wt => {
          console.log(
            `- ${wt._id}: ${wt.checklist?.ad} (${wt.kullanici?.ad} ${wt.kullanici?.soyad}) - Durum: ${wt.durum}`,
          );
        });
      }

      // Sadece kontrol edilebilir rollerdeki görevleri filtrele
      const filteredTasks = allTasks.filter(task => {
        if (!task.kullanici || !task.kullanici.roller) {
          console.log('Görevde kullanıcı veya rol bilgisi eksik:', task._id);
          return false;
        }

        const hasPermission = task.kullanici.roller.some(role =>
          controllableRoles.some(
            controllableRole => controllableRole.toString() === role._id.toString(),
          ),
        );

        // Detaylı log - özellikle WorkTask'lar için
        if (task.taskType === 'worktask') {
          console.log(`🔧 WorkTask ${task._id} kontrol:`, {
            kullanici: `${task.kullanici.ad} ${task.kullanici.soyad}`,
            kullaniciRolleri: task.kullanici.roller.map(r => r.ad),
            kontrolEdilebilirRoller: controllableRoles,
            hasPermission: hasPermission,
            checklist: task.checklist?.ad,
          });
        }

        if (!hasPermission) {
          console.log(
            `❌ Görev ${task._id} filtrelendi - Kullanıcı rolleri:`,
            task.kullanici.roller.map(r => r.ad),
            'Kontrol edilebilir roller:',
            controllableRoles,
          );
        } else {
          console.log(
            `✅ Görev ${task._id} dahil edildi - Kullanıcı rolleri:`,
            task.kullanici.roller.map(r => r.ad),
          );
        }

        return hasPermission;
      });

      console.log(`${filteredTasks.length} görev filtrelendi`);

      // Makinaya göre grupla
      const groupedTasks = {};
      filteredTasks.forEach(task => {
        const machineKey = task.makina ? task.makina.makinaNo || task.makina.kod : 'Atanmamış';
        if (!groupedTasks[machineKey]) {
          groupedTasks[machineKey] = {
            machine: task.makina,
            tasks: [],
          };
        }
        groupedTasks[machineKey].tasks.push(task);
      });

      console.log('Makina bazlı gruplandırılmış görevler:', Object.keys(groupedTasks));
      res.json({
        groupedTasks,
        selectedMachines: selectedMachines,
        needsMachineSelection: false,
      });
    } catch (error) {
      console.error('Control-pending hatası:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   GET /api/tasks/my
// @desc    Kullanıcının kendi görevlerini listele (sadece rutin checklistler)
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get('/my', auth, checkModulePermission('Görev Yönetimi'), async (req, res) => {
  try {
    // SADECE rutin görevleri getir (Görevlerim sayfası için)
    const tasks = await Task.find({ kullanici: req.user._id })
      .populate({
        path: 'checklist',
        select: 'ad tur periyot',
        match: { tur: 'rutin' }, // SADECE rutin checklistler
      })
      .populate('makina', 'ad makinaNo')
      .sort({ hedefTarih: 1, olusturmaTarihi: -1 });

    // Checklist'i null olan görevleri filtrele (işe bağlı olanlar)
    const filteredTasks = tasks.filter(task => task.checklist !== null);

    console.log(
      `📋 Kullanıcı ${req.user._id} için ${filteredTasks.length} rutin görev bulundu (toplam: ${tasks.length})`,
    );
    console.log(`📋 Durum dağılımı: ${filteredTasks.map(t => t.durum).join(', ')}`);
    console.log(`📋 Checklist türleri: ${filteredTasks.map(t => t.checklist?.tur).join(', ')}`);

    res.json(filteredTasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/tasks/my-by-machine
// @desc    Kullanıcının görevlerini makina bazlı grupla (sadece rutin checklistler)
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get('/my-by-machine', auth, checkModulePermission('Görev Yönetimi'), async (req, res) => {
  try {
    // Kullanıcının erişebileceği makinaları al
    const user = await User.findById(req.user._id).populate('roller');
    const userRoleIds = user.roller.map(role => role._id);

    const accessibleMachines = await Machine.find({
      sorumluRoller: { $in: userRoleIds },
      durum: 'aktif',
    }).sort({ makinaNo: 1 });

    // Her makina için görevleri al (sadece rutin checklistler)
    const machineTasksMap = {};

    // Tüm makina görevlerini paralel olarak al
    const machineTaskPromises = accessibleMachines.map(async machine => {
      const tasks = await Task.find({
        kullanici: req.user._id,
        makina: machine._id,
      })
        .populate({
          path: 'checklist',
          select: 'ad tur periyot',
          match: { tur: 'rutin' }, // Sadece rutin checklistler
        })
        .populate('makina', 'ad makinaNo')
        .sort({ hedefTarih: 1, olusturmaTarihi: -1 });

      // Checklist'i null olan görevleri filtrele (işe bağlı olanlar)
      const filteredTasks = tasks.filter(task => task.checklist !== null);

      return {
        machineId: machine._id,
        machine: machine,
        tasks: filteredTasks,
      };
    });

    const machineTaskResults = await Promise.all(machineTaskPromises);

    // Sonuçları map'e dönüştür
    machineTaskResults.forEach(result => {
      machineTasksMap[result.machineId] = {
        machine: result.machine,
        tasks: result.tasks,
      };
    });

    // Makina atanmamış görevler (sadece rutin checklistler)
    const unassignedTasks = await Task.find({
      kullanici: req.user._id,
      makina: { $exists: false },
    })
      .populate({
        path: 'checklist',
        select: 'ad tur periyot',
        match: { tur: 'rutin' }, // Sadece rutin checklistler
      })
      .sort({ hedefTarih: 1, olusturmaTarihi: -1 });

    // Checklist'i null olan görevleri filtrele (işe bağlı olanlar)
    const filteredUnassignedTasks = unassignedTasks.filter(task => task.checklist !== null);

    res.json({
      machineTasksMap,
      unassignedTasks: filteredUnassignedTasks,
      accessibleMachines,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/tasks
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
        return res.status(404).json({ message: 'Checklist şablonu bulunamadı' });
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
            hedefTarih: hedefTarih || new Date(Date.now() + 24 * 60 * 60 * 1000),
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

// @route   PUT /api/tasks/:id/complete
// @desc    Görevi tamamla
// @access  Private (Görev Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id/complete',
  auth,
  checkModulePermission('Görev Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { maddeler, makina } = req.body;

      console.log('🎯 Görev tamamlama isteği:', {
        taskId: req.params.id,
        maddelerCount: maddeler?.length,
        makina,
        userId: req.user._id,
      });

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      // Sadece görevin sahibi tamamlayabilir
      if (task.kullanici.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Bu görevi tamamlama yetkiniz yok' });
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

      const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('makina', 'ad makinaNo');

      console.log('✅ Görev tamamlandı:', {
        taskId: updatedTask._id,
        toplamPuan: updatedTask.toplamPuan,
        durum: updatedTask.durum,
      });

      res.json(updatedTask);
    } catch (error) {
      console.error('❌ Görev tamamlama hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  },
);

// @route   PUT /api/tasks/:id/score-items
// @desc    Madde bazlı puanlama yap
// @access  Private (Rol bazlı checklist puanlama yetkisi)
router.put(
  '/:id/score-items',
  auth,
  checkChecklistPermission('puanlayabilir'),
  async (req, res) => {
    try {
      const { maddeler, kontrolNotu } = req.body;

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      if (task.durum !== 'tamamlandi') {
        return res.status(400).json({ message: 'Sadece tamamlanmış görevler puanlanabilir' });
      }

      // Kontrol puanlarını güncelle
      let kontrolToplamPuani = 0;
      const updatedMaddeler = task.maddeler.map((madde, index) => {
        const kontrolMadde = maddeler[index];
        if (kontrolMadde) {
          madde.kontrolPuani = kontrolMadde.kontrolPuani;
          madde.kontrolYorumu = kontrolMadde.kontrolYorumu || '';
          madde.kontrolResimUrl = kontrolMadde.kontrolResimUrl || '';
          kontrolToplamPuani += kontrolMadde.kontrolPuani || 0;
        }
        return madde;
      });

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        {
          maddeler: updatedMaddeler,
          kontrolToplamPuani,
          onayNotu: kontrolNotu || '',
          onaylayan: req.user._id,
        },
        { new: true },
      )
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad')
        .populate('onaylayan', 'ad soyad');

      res.json(updatedTask);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /api/tasks/:id/approve
// @desc    Görevi onayla
// @access  Private (Rol bazlı checklist onaylama yetkisi)
router.put('/:id/approve', auth, checkChecklistPermission('puanlayabilir'), async (req, res) => {
  try {
    const { onayNotu } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (task.durum !== 'tamamlandi') {
      return res.status(400).json({ message: 'Sadece tamamlanmış görevler onaylanabilir' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        durum: 'onaylandi',
        onayTarihi: new Date(),
        onayNotu: onayNotu || '',
        onaylayan: req.user._id,
      },
      { new: true },
    )
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklist', 'ad')
      .populate('onaylayan', 'ad soyad');

    res.json(updatedTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   PUT /api/tasks/:id/reject
// @desc    Görevi reddet
// @access  Private (Rol bazlı checklist reddetme yetkisi)
router.put('/:id/reject', auth, checkChecklistPermission('puanlayabilir'), async (req, res) => {
  try {
    const { redNotu } = req.body;

    if (!redNotu || !redNotu.trim()) {
      return res.status(400).json({ message: 'Red nedeni gereklidir' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (task.durum !== 'tamamlandi') {
      return res.status(400).json({ message: 'Sadece tamamlanmış görevler reddedilebilir' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        durum: 'iadeEdildi',
        redTarihi: new Date(),
        redNotu: redNotu.trim(),
        reddeden: req.user._id,
      },
      { new: true },
    )
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklist', 'ad')
      .populate('reddeden', 'ad soyad');

    res.json(updatedTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   GET /api/tasks/inventory-machines
// @desc    Envanter kayıtlarından makina listesi getir
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get(
  '/inventory-machines',
  auth,
  checkModulePermission('Görev Yönetimi'),
  async (req, res) => {
    try {
      // Inventory API'sinden makina listesini çek
      const axios = require('axios');
      const baseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';

      try {
        const response = await axios.get(`${baseURL}/inventory/machines-for-tasks`, {
          headers: {
            Authorization: req.headers.authorization,
          },
        });

        // Response'u tasks modülü için uygun formata dönüştür
        const machines = response.data.map(machine => ({
          _id: machine._id,
          ad: machine.ad,
          makinaNo: machine.kod,
          envanterKodu: machine.kod,
          lokasyon: machine.lokasyon,
          kategori: machine.kategori,
          durum: machine.durum,
          // Eski Machine model'i ile uyumluluk için
          name: machine.name,
          machineCode: machine.machineCode,
        }));

        res.json(machines);
      } catch (inventoryError) {
        console.error('Envanter API hatası:', inventoryError.message);

        // Fallback: Eski Machine model'ini kullan
        const fallbackMachines = await Machine.find({ durum: 'aktif' })
          .select('ad makinaNo lokasyon')
          .sort({ makinaNo: 1 });

        res.json(fallbackMachines);
      }
    } catch (error) {
      console.error('Makina listesi getirme hatası:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

// @route   POST /api/tasks/select-machines
// @desc    Kullanıcının çalıştığı makinaları seç
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.post('/select-machines', auth, checkModulePermission('Görev Yönetimi'), async (req, res) => {
  try {
    const { selectedMachines } = req.body;

    // Seçilen makinaları string ID olarak sakla (inventory ObjectId'leri)
    // Eski Machine referansları yerine direkt ID'leri kullanacağız
    const machineIds = Array.isArray(selectedMachines) ? selectedMachines : [];

    await User.findByIdAndUpdate(req.user._id, {
      secilenMakinalar: machineIds,
    });

    console.log('✅ Makina seçimi güncellendi:', machineIds.length, 'makina');

    res.json({ message: 'Makina seçimi başarıyla güncellendi', selectedMachines: machineIds });
  } catch (error) {
    console.error('❌ Makina seçimi hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// @route   GET /api/tasks/my-selected-machines
// @desc    Kullanıcının seçtiği makinaları getir
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get(
  '/my-selected-machines',
  auth,
  checkModulePermission('Görev Yönetimi'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user || !user.secilenMakinalar || user.secilenMakinalar.length === 0) {
        return res.json([]);
      }

      // Önce inventory'den makina bilgilerini almaya çalış
      try {
        const axios = require('axios');
        const baseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';

        const inventoryResponse = await axios.get(`${baseURL}/inventory/machines-for-tasks`, {
          headers: {
            Authorization: req.headers.authorization,
          },
        });

        // Seçilen makina ID'lerini inventory verisiyle eşleştir
        const selectedMachineData = user.secilenMakinalar
          .map(selectedId => {
            return inventoryResponse.data.find(
              machine => machine._id.toString() === selectedId.toString(),
            );
          })
          .filter(Boolean); // null/undefined değerleri çıkar

        res.json(selectedMachineData);
      } catch (inventoryError) {
        console.error('Inventory API hatası, fallback kullanılıyor:', inventoryError.message);

        // Fallback: Eski Machine model'ini dene
        try {
          const userWithMachines = await User.findById(req.user._id).populate(
            'secilenMakinalar',
            'ad makinaNo',
          );

          res.json(userWithMachines.secilenMakinalar || []);
        } catch (fallbackError) {
          console.error('Fallback de başarısız:', fallbackError.message);
          res.json([]);
        }
      }
    } catch (error) {
      console.error('Seçilen makinalar getirilirken hata:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  },
);

module.exports = router;
