// Kullanıcının kendi görevleri
// Otomatik oluşturuldu: 2025-02-05T23:15:00.000Z
// Orijinal: tasks.js

const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const { userTasksCache } = require('../middleware/cache');

// Models
const Task = require('../models/Task');
const User = require('../models/User');
const Machine = require('../models/Machine');

// @route   GET /my
// @desc    Kullanıcının kendi görevlerini listele (sadece rutin checklistler)
// @access  Private (Görev Yönetimi veya Dashboard modülü erişim yetkisi)
router.get(
  '/my',
  auth,
  checkModulePermission(['Görev Yönetimi', 'Dashboard']),
  userTasksCache(), // 🚀 CACHE: 5 dakika
  async (req, res) => {
    try {
      // SADECE rutin görevleri getir (Görevlerim sayfası için)
      const tasks = await Task.find({
        kullanici: req.user._id,
        // durum filtresi kaldırıldı - tüm görevler gelecek
      })
        .populate({
          path: 'checklist',
          select: 'ad tur periyot',
          match: { tur: 'rutin' }, // SADECE rutin checklistler
        })
        .populate('makina', 'ad makinaNo')
        .sort({
          tamamlanmaTarihi: -1, // Tamamlananlar için: en yeni önce
          hedefTarih: 1, // Bekleyenler için: hedef tarihe yakın önce
          olusturmaTarihi: -1, // Son olarak: yeni oluşturulan önce
        });

      // Checklist'i null olan görevleri filtrele (işe bağlı olanlar)
      const filteredTasks = tasks.filter(task => task.checklist !== null);

      console.log(
        `📋 Kullanıcı ${req.user._id} için ${filteredTasks.length} rutin görev bulundu (toplam: ${tasks.length})`,
      );
      console.log(
        `📋 Durum dağılımı: ${filteredTasks.map(t => t.durum).join(', ')}`,
      );
      console.log(
        `📋 Checklist türleri: ${filteredTasks.map(t => t.checklist?.tur).join(', ')}`,
      );

      res.json(filteredTasks);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   GET /my-by-machine
// @desc    Kullanıcının görevlerini makina bazlı grupla (sadece rutin checklistler)
// @access  Private (Görev Yönetimi modülü erişim yetkisi)
router.get(
  '/my-by-machine',
  auth,
  checkModulePermission('Görev Yönetimi'),
  async (req, res) => {
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
          // durum filtresi kaldırıldı
        })
          .populate({
            path: 'checklist',
            select: 'ad tur periyot',
            match: { tur: 'rutin' }, // Sadece rutin checklistler
          })
          .populate('makina', 'ad makinaNo')
          .sort({
            tamamlanmaTarihi: -1, // Tamamlananlar için: en yeni önce
            hedefTarih: 1, // Bekleyenler için: hedef tarihe yakın önce
            olusturmaTarihi: -1, // Son olarak: yeni oluşturulan önce
          });

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
        // durum filtresi kaldırıldı
      })
        .populate({
          path: 'checklist',
          select: 'ad tur periyot',
          match: { tur: 'rutin' }, // Sadece rutin checklistler
        })
        .sort({
          tamamlanmaTarihi: -1, // Tamamlananlar için: en yeni önce
          hedefTarih: 1, // Bekleyenler için: hedef tarihe yakın önce
          olusturmaTarihi: -1, // Son olarak: yeni oluşturulan önce
        });

      // Checklist'i null olan görevleri filtrele (işe bağlı olanlar)
      const filteredUnassignedTasks = unassignedTasks.filter(
        task => task.checklist !== null,
      );

      res.json({
        machineTasksMap,
        unassignedTasks: filteredUnassignedTasks,
        accessibleMachines,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

module.exports = router;
