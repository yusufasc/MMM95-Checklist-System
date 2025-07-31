// Kontrol ve onay işlemleri
// Otomatik oluşturuldu: 2025-02-05T23:15:00.000Z
// Orijinal: tasks.js

const express = require('express');
const router = express.Router();
const {
  auth,
  checkModulePermission,
  checkChecklistPermission,
} = require('../middleware/auth');
const { controlPendingCache } = require('../middleware/cache');

// Models
const Task = require('../models/Task');
const User = require('../models/User');
const Role = require('../models/Role');

// @route   GET /control-pending
// @desc    Kontrol bekleyen görevleri hiyerarşik olarak listele
// @access  Private (Kontrol Bekleyenler veya Dashboard modülü erişim yetkisi)
router.get(
  '/control-pending',
  auth,
  checkModulePermission(['Kontrol Bekleyenler', 'Dashboard']),
  controlPendingCache(), // 🚀 CACHE: 3 dakika
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
      }

      console.log('🎯 Kontrol edilebilir roller ID\'leri:', controllableRoles);
      console.log(
        '🎯 Kontrol edilebilir rol sayısı:',
        controllableRoles.length,
      );

      // Frontend'den gelen makina seçimi parametresini kontrol et
      const frontendMachines = req.query.machines;
      console.log(
        '🔍 Frontend\'den gelen machines parametresi:',
        frontendMachines,
      );
      console.log('🔍 Request query tamamı:', req.query);
      console.log('🔍 Request URL:', req.originalUrl);

      // Kullanıcının seçtiği makinaları al
      let selectedMachines = [];

      if (user.secilenMakinalar && user.secilenMakinalar.length > 0) {
        // Önce inventory'den makina bilgilerini almaya çalış
        try {
          const axios = require('axios');
          const baseURL =
            process.env.API_BASE_URL || 'http://localhost:5000/api';

          const selectedMachinesResponse = await axios.get(
            `${baseURL}/tasks/my-selected-machines`,
            {
              headers: {
                Authorization: req.headers.authorization,
              },
            },
          );

          // Direkt seçilen makinaları al
          selectedMachines = selectedMachinesResponse.data;

          console.log(
            'Tasks endpoint den yüklenen seçili makinalar:',
            selectedMachines.map(m => m.makinaNo || m.envanterKodu),
          );
        } catch (inventoryError) {
          console.error(
            'Inventory API hatası, fallback kullanılıyor:',
            inventoryError.message,
          );

          // Fallback: Eski Machine model'ini dene
          try {
            const userWithMachines = await User.findById(req.user._id).populate(
              'secilenMakinalar',
              'ad makinaNo',
            );

            selectedMachines = userWithMachines.secilenMakinalar || [];
            console.log(
              'Fallback dan yüklenen seçili makinalar:',
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
      // TÜM görevleri çek, makina filtresi sonra yapılacak

      console.log(
        '🔍 Seçili makina detayları:',
        selectedMachines.map(m => ({
          _id: m._id,
          kod: m.kod || m.makinaNo,
          ad: m.ad,
          kategori: m.kategori,
        })),
      );

      // Rutin görevler (Task modeli) - TÜM tamamlanmış görevleri çek
      console.log('📋 Tamamlanmış görevler aranıyor...');
      const tasks = await Task.find({
        durum: { $in: ['tamamlandi', 'onaylandi', 'iadeEdildi'] },
      })
        .populate({
          path: 'kullanici',
          select: 'ad soyad kullaniciAdi roller',
          populate: {
            path: 'roller',
            select: 'ad _id',
          },
        })
        .populate('checklist', 'ad maddeler')
        .populate('makina', 'ad envanterKodu')
        .sort({ tamamlanmaTarihi: -1 });

      console.log(`📋 ${tasks.length} rutin görev bulundu`);

      // Debug: Tüm görevlerin durumunu kontrol et
      if (tasks.length > 0) {
        console.log('🔍 TÜM GÖREVLERİN DURUMU:');
        const durumSayilari = {};
        tasks.forEach(task => {
          durumSayilari[task.durum] = (durumSayilari[task.durum] || 0) + 1;
          console.log(
            `  - ${task._id}: ${task.durum} (${task.checklist?.ad || 'N/A'}) - Kullanıcı: ${task.kullanici?.kullaniciAdi || 'N/A'}`,
          );
        });
        console.log('📊 DURUM İSTATİSTİKLERİ:', durumSayilari);
      }

      // NOT: İşe bağlı görevler (WorkTask) artık ayrı endpoint'te (/api/worktasks/control-pending)
      // Bu endpoint'te sadece rutin görevler (Task) gösterilecek
      console.log(
        'ℹ️ Control-pending endpoint\'i sadece rutin görevleri (Task) gösteriyor. İşe bağlı görevler için /api/worktasks/control-pending kullanın.',
      );

      // Task'ları tutarlı formata dönüştür
      const formattedTasks = tasks.map(task => ({
        _id: task._id,
        kullanici: task.kullanici,
        checklist: task.checklist,
        makina: task.makina
          ? {
            _id: task.makina._id,
            ad: task.makina.ad,
            makinaNo: task.makina.envanterKodu, // envanterKodu'nu makinaNo olarak kullan
            envanterKodu: task.makina.envanterKodu,
          }
          : null,
        durum: task.durum,
        toplamPuan: task.toplamPuan,
        tamamlanmaTarihi: task.tamamlanmaTarihi,
        maddeler: task.maddeler,
        olusturmaTarihi: task.olusturmaTarihi,
        taskType: 'task', // Normal task olduğunu belirt
      }));

      console.log(`Toplam ${formattedTasks.length} rutin görev bulundu`);

      // Sadece kontrol edilebilir rollerdeki görevleri filtrele
      console.log(
        `🔍 ${formattedTasks.length} görev rol filtrelemesi için kontrol ediliyor...`,
      );
      console.log(
        '🎯 Kontrol edilebilir roller:',
        controllableRoles.map(r => r.toString()),
      );

      const filteredTasks = formattedTasks.filter(task => {
        if (!task.kullanici) {
          console.log('❌ Görevde kullanıcı bilgisi eksik:', task._id);
          return false;
        }

        if (!task.kullanici.roller || task.kullanici.roller.length === 0) {
          console.log(
            `❌ Kullanıcı ${task.kullanici.kullaniciAdi || task.kullanici._id} rolü yok`,
          );
          return false;
        }

        // Artık sadece Task'lar var, WorkTask'lar ayrı endpoint'te
        // Normal Task'lar için rol kontrolü yap
        const hasPermission = task.kullanici.roller.some(role => {
          // role bir object mi yoksa sadece ID mi kontrol et
          const roleId = role._id || role;
          return controllableRoles.some(
            controllableRole =>
              controllableRole.toString() === roleId.toString(),
          );
        });

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

      console.log(`${filteredTasks.length} görev rol filtrelemesinden geçti`);

      // TÜMU görevleri göster - makina filtresi yapmayacağız
      // Kullanıcı sadece kendi seçtiği makinaları görmek istediği için
      // makina filtrelemesini kaldırıyoruz

      console.log(
        '🔍 Seçili makina detayları:',
        selectedMachines.map(m => ({
          id: m._id,
          ad: m.ad,
          makinaNo: m.makinaNo || m.envanterKodu,
          kod: m.kod,
        })),
      );

      // Debug: İlk birkaç görevin makina bilgilerini kontrol et
      const sampleTasks = filteredTasks.slice(0, 5);
      console.log('🔧 Örnek görev makina bilgileri:');
      sampleTasks.forEach(task => {
        if (task.makina) {
          console.log(
            `  Görev ${task._id}: Makina ID ${task.makina._id} - ${task.makina.ad || task.makina.makinaNo}`,
          );
        } else {
          console.log(`  Görev ${task._id}: Makina bilgisi yok`);
        }
      });

      // Sadece seçilen makinadaki görevleri filtrele
      const selectedMachineIds = selectedMachines.map(m => m._id.toString());

      const machineFilteredTasks = filteredTasks.filter(task => {
        // Makina bilgisi yoksa "Atanmamış" olarak kabul et - DAHIL ET
        if (!task.makina || !task.makina._id) {
          console.log(
            `🔍 Görev ${task._id} makina kontrolü: ATANMAMIŞ -> DAHIL EDİLDİ`,
          );
          return true; // Atanmamış görevleri de göster
        }

        // Görevin makinası seçili makinalar arasında mı kontrol et
        const taskMachineId = task.makina._id.toString();
        const isSelected = selectedMachineIds.includes(taskMachineId);

        console.log(
          `🔍 Görev ${task._id} makina kontrolü: ${task.makina.ad} (${taskMachineId}) -> ${isSelected ? 'DAHIL' : 'FILTRELENDI'}`,
        );

        return isSelected;
      });

      console.log(
        `${machineFilteredTasks.length}/${filteredTasks.length} görev makina filtrelemesinden geçti`,
      );
      console.log('🎯 Seçili makina IDleri:', selectedMachineIds);

      // Makinaya göre grupla - daha detaylı bilgilerle
      const groupedTasks = {};
      machineFilteredTasks.forEach(task => {
        let machineKey, machineInfo;

        if (task.makina && task.makina._id) {
          // Makina bilgisi varsa makina adını kullan
          machineKey =
            task.makina.makinaNo || task.makina.envanterKodu || task.makina.ad;
          machineInfo = {
            _id: task.makina._id,
            ad: task.makina.ad,
            makinaNo: task.makina.makinaNo || task.makina.envanterKodu,
            envanterKodu: task.makina.envanterKodu,
          };
        } else {
          // Makina bilgisi yoksa "Atanmamış" kategorisine koy
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

        // Debug log
        console.log(
          `📝 Görev ${task._id} -> Makina: ${machineKey} (ID: ${task.makina?._id || 'yok'})`,
        );
      });

      console.log(
        'Makina bazlı gruplandırılmış görevler:',
        Object.keys(groupedTasks),
      );
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

// @route   PUT /:id/score-items
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
        return res
          .status(400)
          .json({ message: 'Sadece tamamlanmış görevler puanlanabilir' });
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
          kontrolNotu: kontrolNotu || '',
          kontrolTarihi: new Date(),
          kontroleden: req.user._id,
          puanlayanKullanici: req.user._id,
          durum: 'onaylandi',
          onayTarihi: new Date(),
          onaylayan: req.user._id,
          toplamPuan: kontrolToplamPuani,
        },
        { new: true },
      )
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad maddeler')
        .populate('kontroleden', 'ad soyad')
        .populate('puanlayanKullanici', 'ad soyad')
        .populate('onaylayan', 'ad');

      // Cache temizleme - Control-pending verilerini invalidate et
      const cacheService = require('../services/cacheService');
      await cacheService.invalidateTasks();
      console.log('🧹 Control-pending cache temizlendi');

      // 🎯 Kontrol puanı ver (puanlama sonrası)
      try {
        const axios = require('axios');
        const baseURL = process.env.BASE_URL || 'http://localhost:5000';

        console.log('🎯 Kontrol puanı API çağrısı başlatılıyor...');
        console.log('🔍 Puanlama detayları:', {
          taskId: task._id,
          gorevYapanKisi: task.kullanici,
          puanlamaYapanKisi: req.user._id,
          verilenPuan: kontrolToplamPuani,
          checklistAdi: task.checklist,
        });

        // ✅ DÜZELTME: Doğru puanlama sistemi
        // Sadece görevi yapan kişiye checklist puanı verilmeli
        // Puanlama yapan kişi ayrı bir sistemden kontrol puanı almalı

        // 1. Görevi yapan kişiye (usta13) checklist şablonları puanı ver
        console.log('📝 Görevi yapan kişiye checklist puanı veriliyor...');
        const taskScoreResponse = await axios.post(
          `${baseURL}/api/control-scores/create`,
          {
            puanlananTask: task._id,
            gorevTipi: 'Task-Checklist',
            sablon: task.checklist,
            sablonTipi: 'ChecklistTemplate',
            puanlananKullanici: task.kullanici, // ✅ Görevi yapan kişiye checklist puanı
            verilenPuan: kontrolToplamPuani,
          },
          {
            headers: {
              Authorization: req.headers.authorization,
              'x-auth-token': req.headers['x-auth-token'],
            },
          },
        );

        console.log(
          '✅ Checklist puanı başarıyla verildi (görevi yapan kişiye):',
          taskScoreResponse.data,
        );

        // 2. Puanlama yapan kişiye (VARDİYA AMİRİ) kontrol puanı ver
        // Kontrol puanı = Verilen puanın %50'si (örnek: 22 puan verdi → 11 kontrol puanı)
        const kontrolPuani = Math.round(kontrolToplamPuani * 0.5);
        console.log(
          `🎯 Puanlama yapan kişiye kontrol puanı veriliyor: ${kontrolPuani} puan (${kontrolToplamPuani} puanın %50'si)`,
        );

        const controlScoreResponse = await axios.post(
          `${baseURL}/api/control-scores/create`,
          {
            puanlananTask: task._id,
            gorevTipi: 'Task-Control',
            sablon: task.checklist,
            sablonTipi: 'ChecklistTemplate',
            puanlayanKullanici: req.user._id, // ✅ Puanlama yapan kişi
            puanlananKullanici: req.user._id, // ✅ Puanlama yapan kişiye kontrol puanı
            verilenPuan: kontrolPuani, // ✅ Verilen puanın %50'si
          },
          {
            headers: {
              Authorization: req.headers.authorization,
              'x-auth-token': req.headers['x-auth-token'],
            },
          },
        );

        console.log(
          '✅ Kontrol puanı başarıyla verildi (puanlama yapan kişiye):',
          controlScoreResponse.data,
        );
      } catch (controlError) {
        console.error(
          '⚠️ Kontrol puanı verilemedi:',
          controlError.response?.data || controlError.message,
        );
        // Hata olsa bile ana işlem devam etsin
      }

      res.json(updatedTask);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /:id/approve
// @desc    Görevi onayla
// @access  Private (Rol bazlı checklist onaylama yetkisi)
router.put(
  '/:id/approve',
  auth,
  checkChecklistPermission('onaylayabilir'),
  async (req, res) => {
    try {
      const { onayNotu } = req.body;

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      if (task.durum !== 'tamamlandi') {
        return res
          .status(400)
          .json({ message: 'Sadece tamamlanmış görevler onaylanabilir' });
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
        .populate('checklist', 'ad maddeler')
        .populate('onaylayan', 'ad soyad');

      res.json(updatedTask);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /:id/reject
// @desc    Görevi reddet
// @access  Private (Rol bazlı checklist reddetme yetkisi)
router.put(
  '/:id/reject',
  auth,
  checkChecklistPermission('puanlayabilir'),
  async (req, res) => {
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
        return res
          .status(400)
          .json({ message: 'Sadece tamamlanmış görevler reddedilebilir' });
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
        .populate('checklist', 'ad maddeler')
        .populate('reddeden', 'ad soyad');

      res.json(updatedTask);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

module.exports = router;
