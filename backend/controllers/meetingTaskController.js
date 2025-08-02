const MeetingTask = require('../models/MeetingTask');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

/**
 * @desc    Kullanıcının tüm meeting görevlerini getir
 * @route   GET /api/meeting-tasks/my-tasks
 * @access  Private
 */
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { durum, page = 1, limit = 10, meetingId } = req.query;

    const options = {};
    if (durum) options.durum = durum;
    if (meetingId) options.meetingId = meetingId;

    const tasks = await MeetingTask.getUserTasks(userId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MeetingTask.countDocuments({
      sorumlu: userId,
      silindiMi: false,
      ...(durum && { durum }),
      ...(meetingId && { meeting: meetingId })
    });

    // Durum istatistikleri
    const stats = await MeetingTask.aggregate([
      { $match: { sorumlu: userId, silindiMi: false } },
      { $group: { _id: '$durum', count: { $sum: 1 } } }
    ]);

    const statistics = {
      toplam: total,
      atandi: 0,
      devamEdiyor: 0,
      kismenTamamlandi: 0,
      tamamlandi: 0,
    };

    stats.forEach(stat => {
      switch (stat._id) {
        case 'atandi':
          statistics.atandi = stat.count;
          break;
        case 'devam-ediyor':
          statistics.devamEdiyor = stat.count;
          break;
        case 'kismen-tamamlandi':
          statistics.kismenTamamlandi = stat.count;
          break;
        case 'tamamlandi':
          statistics.tamamlandi = stat.count;
          break;
      }
    });

    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      statistics
    });

  } catch (error) {
    console.error('My tasks error:', error);
    res.status(500).json({ message: 'Görevler getirilirken hata oluştu' });
  }
};

/**
 * @desc    Meeting'in tüm görevlerini getir
 * @route   GET /api/meeting-tasks/meeting/:meetingId
 * @access  Private
 */
exports.getMeetingTasks = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    // Meeting'e erişim kontrolü
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Kullanıcının meeting'e katılımcı olup olmadığını kontrol et
    const isParticipant = meeting.katilimcilar.some(k => 
      k.kullanici.toString() === userId
    );
    const isOrganizer = meeting.organizator.toString() === userId;

    if (!isParticipant && !isOrganizer) {
      return res.status(403).json({ message: 'Bu toplantının görevlerini görme yetkiniz yok' });
    }

    const tasks = await MeetingTask.getMeetingTasks(meetingId);

    // Görevleri sorumlu kişilere göre grupla
    const tasksByUser = {};
    tasks.forEach(task => {
      const sorumluId = task.sorumlu._id.toString();
      if (!tasksByUser[sorumluId]) {
        tasksByUser[sorumluId] = {
          kullanici: task.sorumlu,
          gorevler: []
        };
      }
      tasksByUser[sorumluId].gorevler.push(task);
    });

    res.json({
      meeting: {
        _id: meeting._id,
        baslik: meeting.baslik,
        tarih: meeting.tarih,
        durum: meeting.durum
      },
      tasksByUser: Object.values(tasksByUser),
      allTasks: tasks
    });

  } catch (error) {
    console.error('Meeting tasks error:', error);
    res.status(500).json({ message: 'Meeting görevleri getirilirken hata oluştu' });
  }
};

/**
 * @desc    Görev detayını getir
 * @route   GET /api/meeting-tasks/:taskId
 * @access  Private
 */
exports.getTaskDetail = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await MeetingTask.findById(taskId)
      .populate('meeting', 'baslik tarih katilimcilar organizator')
      .populate('sorumlu', 'ad soyad email rol')
      .populate('yorumlar.yazan', 'ad soyad')
      .populate('ekler.yukleyenKisi', 'ad soyad');

    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Erişim kontrolü
    const meeting = task.meeting;
    const isParticipant = meeting.katilimcilar.some(k => 
      k.kullanici.toString() === userId
    );
    const isOrganizer = meeting.organizator.toString() === userId;
    const isResponsible = task.sorumlu._id.toString() === userId;

    if (!isParticipant && !isOrganizer && !isResponsible) {
      return res.status(403).json({ message: 'Bu görevi görme yetkiniz yok' });
    }

    res.json(task);

  } catch (error) {
    console.error('Task detail error:', error);
    res.status(500).json({ message: 'Görev detayı getirilirken hata oluştu' });
  }
};

/**
 * @desc    Görev progress'ini güncelle
 * @route   PUT /api/meeting-tasks/:taskId/progress
 * @access  Private
 */
exports.updateTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tamamlanmaYuzdesi, not } = req.body;
    const userId = req.user.id;

    const task = await MeetingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Sadece sorumlu kişi progress güncelleyebilir
    if (task.sorumlu.toString() !== userId) {
      return res.status(403).json({ message: 'Bu görevi güncelleme yetkiniz yok' });
    }

    await task.updateProgress(tamamlanmaYuzdesi, not);

    // Güncellenmiş görevi populate ederek geri döndür
    const updatedTask = await MeetingTask.findById(taskId)
      .populate('sorumlu', 'ad soyad')
      .populate('meeting', 'baslik tarih');

    res.json({
      message: 'Görev progress başarıyla güncellendi',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Progress güncellenirken hata oluştu' });
  }
};

/**
 * @desc    Göreve yorum ekle
 * @route   POST /api/meeting-tasks/:taskId/comments
 * @access  Private
 */
exports.addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { yorum, tip = 'yorum' } = req.body;
    const userId = req.user.id;

    const task = await MeetingTask.findById(taskId)
      .populate('meeting', 'katilimcilar organizator');

    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Yorum yapma yetki kontrolü (katılımcı, organizatör veya sorumlu olmalı)
    const meeting = task.meeting;
    const isParticipant = meeting.katilimcilar.some(k => 
      k.kullanici.toString() === userId
    );
    const isOrganizer = meeting.organizator.toString() === userId;
    const isResponsible = task.sorumlu.toString() === userId;

    if (!isParticipant && !isOrganizer && !isResponsible) {
      return res.status(403).json({ message: 'Bu göreve yorum yapma yetkiniz yok' });
    }

    await task.addComment(userId, yorum, tip);

    // Güncellenmiş görevi döndür
    const updatedTask = await MeetingTask.findById(taskId)
      .populate('yorumlar.yazan', 'ad soyad');

    res.json({
      message: 'Yorum başarıyla eklendi',
      yorumlar: updatedTask.yorumlar
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Yorum eklenirken hata oluştu' });
  }
};

/**
 * @desc    Görev durumunu güncelle
 * @route   PUT /api/meeting-tasks/:taskId/status
 * @access  Private
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { durum, not } = req.body;
    const userId = req.user.id;

    const task = await MeetingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Sadece sorumlu kişi durum güncelleyebilir
    if (task.sorumlu.toString() !== userId) {
      return res.status(403).json({ message: 'Bu görevin durumunu güncelleme yetkiniz yok' });
    }

    task.durum = durum;
    
    if (not) {
      task.calismaNotalari.push({
        icerik: not,
        durum: durum === 'tamamlandi' ? 'completed' : 'progress'
      });
    }

    await task.save();

    res.json({
      message: 'Görev durumu başarıyla güncellendi',
      task
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Durum güncellenirken hata oluştu' });
  }
};

/**
 * @desc    Meeting bittiğinde gündem maddelerinden görev oluştur
 * @route   POST /api/meeting-tasks/create-from-meeting
 * @access  Private
 */
exports.createTasksFromMeeting = async (req, res) => {
  try {
    const { meetingId } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId)
      .populate('gundem.sorumlu', 'ad soyad email');

    if (!meeting) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Sadece organizatör task oluşturabilir
    if (meeting.organizator.toString() !== userId) {
      return res.status(403).json({ message: 'Görev oluşturma yetkiniz yok' });
    }

    const createdTasks = [];

    // Gündem maddelerinden görev oluştur
    for (const gundemMaddesi of meeting.gundem) {
      if (gundemMaddesi.sorumlu && gundemMaddesi.durum === 'karar-verildi') {
        const newTask = new MeetingTask({
          meeting: meetingId,
          gundemMaddesiId: gundemMaddesi._id,
          baslik: gundemMaddesi.baslik,
          aciklama: gundemMaddesi.aciklama,
          sorumlu: gundemMaddesi.sorumlu._id,
          durum: 'atandi',
          oncelik: 'normal',
          gorunurluk: 'katilimcilara'
        });

        await newTask.save();
        createdTasks.push(newTask);
      }
    }

    // Kararlardan da görev oluştur
    for (const karar of meeting.kararlar) {
      if (karar.sorumlu) {
        const newTask = new MeetingTask({
          meeting: meetingId,
          gundemMaddesiId: karar._id,
          baslik: karar.baslik,
          aciklama: karar.aciklama,
          sorumlu: karar.sorumlu,
          durum: 'atandi',
          oncelik: karar.oncelik || 'normal',
          teslimTarihi: karar.teslimTarihi,
          gorunurluk: 'katilimcilara'
        });

        await newTask.save();
        createdTasks.push(newTask);
      }
    }

    // Meeting'in durumunu tamamlandı olarak güncelle
    meeting.durum = 'tamamlandı';
    await meeting.save();

    res.json({
      message: `${createdTasks.length} görev başarıyla oluşturuldu`,
      tasks: createdTasks
    });

  } catch (error) {
    console.error('Create tasks from meeting error:', error);
    res.status(500).json({ message: 'Görevler oluşturulurken hata oluştu' });
  }
};