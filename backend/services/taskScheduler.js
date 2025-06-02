const cron = require('node-cron');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Task = require('../models/Task');
const User = require('../models/User');

class TaskScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Periyodik görev oluşturma servisini başlat
  start() {
    if (this.isRunning) {
      console.log('Task Scheduler zaten çalışıyor');
      return;
    }

    console.log('🕐 Task Scheduler başlatılıyor...');

    // Her gün saat 00:01'de çalış
    cron.schedule('1 0 * * *', async () => {
      console.log('📋 Günlük görevler oluşturuluyor...');
      await this.createDailyTasks();
    });

    // Her pazartesi saat 00:01'de çalış
    cron.schedule('1 0 * * 1', async () => {
      console.log('📋 Haftalık görevler oluşturuluyor...');
      await this.createWeeklyTasks();
    });

    // Her ayın 1'i saat 00:01'de çalış
    cron.schedule('1 0 1 * *', async () => {
      console.log('📋 Aylık görevler oluşturuluyor...');
      await this.createMonthlyTasks();
    });

    // Test için: Her 5 dakikada bir çalış (geliştirme aşamasında)
    cron.schedule('*/5 * * * *', async () => {
      console.log('🔄 Test: Periyodik görevler kontrol ediliyor...');
      await this.createTestTasks();
    });

    this.isRunning = true;
    console.log('✅ Task Scheduler başarıyla başlatıldı');
  }

  // Günlük görevleri oluştur
  async createDailyTasks() {
    try {
      const dailyChecklists = await ChecklistTemplate.find({ periyot: 'gunluk' })
        .populate('hedefRol')
        .populate('hedefDepartman');

      await Promise.all(
        dailyChecklists.map(checklist => this.createTasksForChecklist(checklist, 'gunluk')),
      );
    } catch (error) {
      console.error('Günlük görevler oluşturulurken hata:', error);
    }
  }

  // Haftalık görevleri oluştur
  async createWeeklyTasks() {
    try {
      const weeklyChecklists = await ChecklistTemplate.find({ periyot: 'haftalik' })
        .populate('hedefRol')
        .populate('hedefDepartman');

      await Promise.all(
        weeklyChecklists.map(checklist => this.createTasksForChecklist(checklist, 'haftalik')),
      );
    } catch (error) {
      console.error('Haftalık görevler oluşturulurken hata:', error);
    }
  }

  // Aylık görevleri oluştur
  async createMonthlyTasks() {
    try {
      const monthlyChecklists = await ChecklistTemplate.find({ periyot: 'aylik' })
        .populate('hedefRol')
        .populate('hedefDepartman');

      await Promise.all(
        monthlyChecklists.map(checklist => this.createTasksForChecklist(checklist, 'aylik')),
      );
    } catch (error) {
      console.error('Aylık görevler oluşturulurken hata:', error);
    }
  }

  // Test görevleri oluştur (geliştirme için)
  async createTestTasks() {
    try {
      const testChecklists = await ChecklistTemplate.find({ periyot: 'gunluk' })
        .populate('hedefRol')
        .populate('hedefDepartman');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checklistPromises = testChecklists.map(async checklist => {
        const existingTask = await Task.findOne({
          checklist: checklist._id,
          hedefTarih: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        });

        if (!existingTask) {
          console.log(`📝 Test görevi oluşturuluyor: ${checklist.ad}`);
          return this.createTasksForChecklist(checklist, 'gunluk');
        }
      });

      await Promise.all(checklistPromises);
    } catch (error) {
      console.error('Test görevleri oluşturulurken hata:', error);
    }
  }

  // Belirli bir checklist için görevleri oluştur
  async createTasksForChecklist(checklist, periyot) {
    try {
      // Hedef role sahip kullanıcıları bul
      const users = await User.find({
        roller: checklist.hedefRol._id,
        departmanlar: checklist.hedefDepartman._id,
        durum: 'aktif',
      });

      console.log(`👥 ${checklist.ad} için ${users.length} kullanıcı bulundu`);

      const hedefTarih = this.calculateTargetDate(periyot);

      const userPromises = users.map(async user => {
        // Bu kullanıcı için bu tarihte zaten görev var mı kontrol et
        const existingTask = await Task.findOne({
          kullanici: user._id,
          checklist: checklist._id,
          hedefTarih: {
            $gte: new Date(hedefTarih.getTime() - 12 * 60 * 60 * 1000), // 12 saat öncesi
            $lte: new Date(hedefTarih.getTime() + 12 * 60 * 60 * 1000), // 12 saat sonrası
          },
        });

        if (existingTask) {
          console.log(`⚠️  ${user.kullaniciAdi} için ${checklist.ad} görevi zaten mevcut`);
          return;
        }

        // Yeni görev oluştur
        const task = new Task({
          kullanici: user._id,
          checklist: checklist._id,
          maddeler: checklist.maddeler.map(madde => ({
            soru: madde.soru,
            cevap: false,
            puan: madde.puan,
            maxPuan: madde.puan,
            yorum: '',
            resimUrl: '',
          })),
          periyot: periyot,
          hedefTarih: hedefTarih,
          otomatikOlusturuldu: true,
          durum: 'bekliyor',
        });

        await task.save();
        console.log(`✅ ${user.kullaniciAdi} için ${checklist.ad} görevi oluşturuldu`);
      });

      await Promise.all(userPromises);
    } catch (error) {
      console.error(`${checklist.ad} için görevler oluşturulurken hata:`, error);
    }
  }

  // Hedef tarihi hesapla
  calculateTargetDate(periyot) {
    const now = new Date();

    switch (periyot) {
    case 'gunluk': {
      // Bugün için
      const today = new Date(now);
      today.setHours(23, 59, 59, 999); // Günün sonuna kadar
      return today;
    }

    case 'haftalik': {
      // Bu haftanın sonuna kadar
      const endOfWeek = new Date(now);
      const daysUntilSunday = 7 - now.getDay();
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);
      return endOfWeek;
    }

    case 'aylik': {
      // Bu ayın sonuna kadar
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return endOfMonth;
    }

    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün sonra
    }
  }

  // Servisi durdur
  stop() {
    this.isRunning = false;
    console.log('🛑 Task Scheduler durduruldu');
  }
}

module.exports = new TaskScheduler();
