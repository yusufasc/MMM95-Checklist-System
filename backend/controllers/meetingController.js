const Meeting = require('../models/Meeting');
const MeetingNote = require('../models/MeetingNote');
const MeetingTask = require('../models/MeetingTask');
const Task = require('../models/Task');
const User = require('../models/User');
const Department = require('../models/Department');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

/**
 * @desc    Tüm toplantıları listele
 * @route   GET /api/meetings
 * @access  Private (Toplantı Yönetimi modülü erişim yetkisi)
 */
const getMeetings = async (req, res) => {
  try {
    const {
      tarih,
      baslangicTarih,
      bitisTarih,
      durum,
      kategori,
      departman,
      organizator,
      katilimci,
      limit = 50,
      page = 1,
    } = req.query;

    // Build query object
    const query = { silindiMi: false };

    // Date filters
    if (tarih) {
      const selectedDate = new Date(tarih);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.tarih = {
        $gte: selectedDate,
        $lt: nextDay,
      };
    } else if (baslangicTarih && bitisTarih) {
      query.tarih = {
        $gte: new Date(baslangicTarih),
        $lte: new Date(bitisTarih),
      };
    }

    // Other filters
    if (durum) {
      query.durum = durum;
    }
    if (kategori) {
      query.kategori = kategori;
    }
    if (departman) {
      query.departman = departman;
    }
    if (organizator) {
      query.organizator = organizator;
    }
    if (katilimci) {
      query['katilimcilar.kullanici'] = katilimci;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const meetings = await Meeting.find(query)
      .populate('organizator', 'ad soyad kullaniciAdi')
      .populate('departman', 'ad')
      .populate('makina', 'ad dinamikAlanlar')
      .populate('katilimcilar.kullanici', 'ad soyad kullaniciAdi')
      .populate('ilgiliChecklist', 'ad')
      .sort({ tarih: -1, baslangicSaati: -1 })
      .limit(limit * 1)
      .skip(skip);

    // Get total count for pagination
    const total = await Meeting.countDocuments(query);

    res.json({
      meetings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('getMeetings error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Toplantı detaylarını getir
 * @route   GET /api/meetings/:id
 * @access  Private (Toplantı Yönetimi modülü erişim yetkisi)
 */
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizator', 'ad soyad kullaniciAdi roller departmanlar')
      .populate('departman', 'ad')
      .populate('makina', 'ad dinamikAlanlar')
      .populate('katilimcilar.kullanici', 'ad soyad kullaniciAdi roller')
      .populate('gundem.sorumlu', 'ad soyad')
      .populate('kararlar.sorumlu', 'ad soyad')
      .populate('ilgiliChecklist', 'ad aciklama')
      .populate('olusuturulanGorevler');

    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Check if user has access to this meeting
    const userId = req.user.id;
    const isOrganizator = meeting.organizator._id.toString() === userId;
    const isParticipant = meeting.katilimcilar.some(
      k => k.kullanici._id.toString() === userId,
    );
    const isAdmin = req.user.roller.some(rol => rol.ad === 'Admin');

    if (!isOrganizator && !isParticipant && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Bu toplantıya erişim yetkiniz yok' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('getMeetingById error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Yeni toplantı oluştur
 * @route   POST /api/meetings
 * @access  Private (Toplantı Yönetimi modülü düzenleme yetkisi)
 */
const createMeeting = async (req, res) => {
  try {
    const {
      baslik,
      aciklama,
      kategori,
      tarih,
      baslangicSaati,
      bitisSaati,
      lokasyon,
      oncelik,
      departman,
      makina,
      katilimcilar,
      gundem,
      tekrarlamaAyarlari,
      ilgiliChecklist,
    } = req.body;

    // Validation
    if (!baslik || !tarih || !baslangicSaati) {
      return res.status(400).json({
        message: 'Başlık, tarih ve başlangıç saati zorunludur',
      });
    }

    // Create meeting object
    const meetingData = {
      baslik: baslik.trim(),
      aciklama: aciklama?.trim(),
      kategori: kategori || 'rutin',
      tarih: new Date(tarih),
      baslangicSaati,
      bitisSaati,
      lokasyon: lokasyon?.trim(),
      oncelik: oncelik || 'normal',
      organizator: req.user.id,
      departman: departman || null,
      makina: makina || null,
      katilimcilar: katilimcilar || [],
      gundem: (gundem || []).map(item => ({
        ...item,
        sorumlu: item.sorumlu && item.sorumlu.trim() !== '' ? item.sorumlu : null,
      })),
      tekrarlamaAyarlari: tekrarlamaAyarlari || { tip: 'yok' },
      ilgiliChecklist: ilgiliChecklist || null,
    };

    // Add organizator as participant if not already included
    const organizatorExists = meetingData.katilimcilar.some(
      k => k.kullanici.toString() === req.user.id,
    );
    if (!organizatorExists) {
      meetingData.katilimcilar.unshift({
        kullanici: req.user.id,
        rol: 'sunucu',
        katilimDurumu: 'onaylandı',
      });
    }

    const meeting = new Meeting(meetingData);
    await meeting.save();

    // Populate the saved meeting for response
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizator', 'ad soyad kullaniciAdi email')
      .populate('departman', 'ad')
      .populate('makina', 'ad')
      .populate('katilimcilar.kullanici', 'ad soyad kullaniciAdi email')
      .populate('ilgiliChecklist', 'ad');

    // 📧 Send meeting invitation emails (async, don't block response)
    if (
      process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' &&
      process.env.MEETING_INVITATION_ENABLED === 'true'
    ) {
      setTimeout(async () => {
        try {
          // Get participant emails
          const participants = populatedMeeting.katilimcilar
            .map(k => k.kullanici)
            .filter(user => user && user.email);

          if (participants.length > 0) {
            console.log(
              `📧 Sending meeting invitations to ${participants.length} participants`,
            );
            await emailService.sendMeetingInvitation(
              populatedMeeting,
              participants,
            );

            // 🔔 Send in-app notifications
            console.log(
              `🔔 Sending in-app notifications to ${participants.length} participants`,
            );
            await notificationService.sendMeetingInvitationNotification(
              populatedMeeting,
              populatedMeeting.katilimcilar,
            );
          }
        } catch (emailError) {
          console.error('❌ Email invitation error:', emailError.message);
          // Don't fail the meeting creation if email fails
        }
      }, 0);
    }

    res.status(201).json({
      message: 'Toplantı başarıyla oluşturuldu',
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error('createMeeting error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Toplantı güncelle
 * @route   PUT /api/meetings/:id
 * @access  Private (Organizatör veya Admin)
 */
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Check permissions
    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isAdmin = req.user.roller.some(rol => rol.ad === 'Admin');

    if (!isOrganizator && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Bu toplantıyı güncelleme yetkiniz yok' });
    }

    // Update fields
    const allowedUpdates = [
      'baslik',
      'aciklama',
      'kategori',
      'tarih',
      'baslangicSaati',
      'bitisSaati',
      'lokasyon',
      'durum',
      'oncelik',
      'departman',
      'makina',
      'katilimcilar',
      'gundem',
      'kararlar',
      'tekrarlamaAyarlari',
      'ilgiliChecklist',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        meeting[field] = req.body[field];
      }
    });

    await meeting.save();

    // Populate updated meeting
    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizator', 'ad soyad kullaniciAdi')
      .populate('departman', 'ad')
      .populate('makina', 'ad')
      .populate('katilimcilar.kullanici', 'ad soyad kullaniciAdi')
      .populate('ilgiliChecklist', 'ad');

    res.json({
      message: 'Toplantı başarıyla güncellendi',
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('updateMeeting error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Toplantı sil (soft delete)
 * @route   DELETE /api/meetings/:id
 * @access  Private (Organizatör veya Admin)
 */
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Check permissions
    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isAdmin = req.user.roller.some(rol => rol.ad === 'Admin');

    if (!isOrganizator && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Bu toplantıyı silme yetkiniz yok' });
    }

    // Soft delete
    meeting.silindiMi = true;
    meeting.silen = userId;
    meeting.silmeTarihi = new Date();
    await meeting.save();

    res.json({ message: 'Toplantı başarıyla silindi' });
  } catch (error) {
    console.error('deleteMeeting error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Toplantı başlat (durum güncelle)
 * @route   POST /api/meetings/:id/start
 * @access  Private (Organizatör veya Sunucu)
 */
const startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Check permissions
    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isSunucu = meeting.katilimcilar.some(
      k => k.kullanici.toString() === userId && k.rol === 'sunucu',
    );

    if (!isOrganizator && !isSunucu) {
      return res
        .status(403)
        .json({ message: 'Bu toplantıyı başlatma yetkiniz yok' });
    }

    if (meeting.durum === 'devam-ediyor') {
      return res.status(400).json({ message: 'Toplantı zaten devam ediyor' });
    }

    // Update meeting status
    meeting.durum = 'devam-ediyor';
    meeting.gercekBaslangicSaati = new Date();
    await meeting.save();

    res.json({
      message: 'Toplantı başlatıldı',
      meeting: {
        _id: meeting._id,
        durum: meeting.durum,
        gercekBaslangicSaati: meeting.gercekBaslangicSaati,
      },
    });
  } catch (error) {
    console.error('startMeeting error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};



/**
 * @desc    Toplantıdan görev oluştur
 * @route   POST /api/meetings/:id/create-task
 * @access  Private (Organizatör veya Karar Verici)
 */
const createTaskFromMeeting = async (req, res) => {
  try {
    const { kararIndex, taskData } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Check permissions
    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isKararVerici = meeting.katilimcilar.some(
      k => k.kullanici.toString() === userId && k.rol === 'karar-verici',
    );

    if (!isOrganizator && !isKararVerici) {
      return res.status(403).json({ message: 'Görev oluşturma yetkiniz yok' });
    }

    // Create task with meeting reference
    const task = new Task({
      ...taskData,
      kaynakToplanti: meeting._id,
      meetingGoreviMi: true,
      toplantiBaglantisi: {
        tip: 'karar',
        referansId: kararIndex?.toString(),
      },
    });

    await task.save();

    // Add task to meeting's created tasks
    meeting.olusuturulanGorevler.push(task._id);
    await meeting.save();

    const populatedTask = await Task.findById(task._id)
      .populate('kullanici', 'ad soyad email')
      .populate('checklist', 'ad')
      .populate('kaynakToplanti', 'baslik');

    // 📧 Send task assignment email (async, don't block response)
    if (
      process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' &&
      process.env.TASK_ASSIGNMENT_ENABLED === 'true' &&
      populatedTask.kullanici &&
      populatedTask.kullanici.email
    ) {
      setTimeout(async () => {
        try {
          console.log(
            `📧 Sending task assignment email to: ${populatedTask.kullanici.email}`,
          );
          await emailService.sendTaskAssignment(
            populatedTask,
            populatedTask.kullanici,
          );

          // 🔔 Send in-app notification
          console.log(
            `🔔 Sending task assignment notification to: ${populatedTask.kullanici._id}`,
          );
          await notificationService.sendTaskAssignmentNotification(
            populatedTask,
            populatedTask.kullanici,
          );
        } catch (emailError) {
          console.error('❌ Task assignment email error:', emailError.message);
          // Don't fail the task creation if email fails
        }
      }, 0);
    }

    res.status(201).json({
      message: 'Görev başarıyla oluşturuldu',
      task: populatedTask,
    });
  } catch (error) {
    console.error('createTaskFromMeeting error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Kullanıcının toplantılarını getir (dashboard için)
 * @route   GET /api/meetings/my-meetings
 * @access  Private
 */
const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, upcoming = false } = req.query;

    let dateQuery = {};
    if (upcoming === 'true') {
      dateQuery = { tarih: { $gte: new Date() } };
    }

    const meetings = await Meeting.find({
      $or: [{ organizator: userId }, { 'katilimcilar.kullanici': userId }],
      silindiMi: false,
      ...dateQuery,
    })
      .populate('organizator', 'ad soyad')
      .populate('departman', 'ad')
      .sort({ tarih: upcoming === 'true' ? 1 : -1 })
      .limit(limit * 1);

    res.json(meetings);
  } catch (error) {
    console.error('getMyMeetings error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Toplantıyı bitir ve görevleri oluştur
 * @route   PUT /api/meetings/:id/finish
 * @access  Private (Organizatör)
 */
const finishMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Meeting'i bul
    const meeting = await Meeting.findById(id)
      .populate('gundem.sorumlu', 'ad soyad email')
      .populate('kararlar.sorumlu', 'ad soyad email');

    if (!meeting) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Admin kullanıcı veya organizatör bitirebilir
    const isAdmin = req.user.roller.some(rol => rol.ad === 'Admin');
    if (meeting.organizator.toString() !== userId && !isAdmin) {
      return res.status(403).json({ 
        message: 'Sadece toplantı organizatörü veya admin toplantıyı bitirebilir' 
      });
    }

    // Meeting zaten bitmiş mi kontrol et
    if (meeting.durum === 'tamamlandı') {
      return res.status(400).json({ 
        message: 'Bu toplantı zaten tamamlandı' 
      });
    }

    console.log('📅 Meeting bitirilme işlemi başlatıldı:', meeting.baslik);

    // Meeting durumunu güncelle
    meeting.durum = 'tamamlandı';
    meeting.gercekBitisSaati = new Date();
    await meeting.save();

    // Görevleri oluştur
    const createdTasks = await createTasksFromMeetingHelper(meeting);

    console.log(`✅ ${createdTasks.length} görev oluşturuldu`);

    // Katılımcılara email bildirim gönder
    try {
      for (const katilimci of meeting.katilimcilar) {
        if (katilimci.kullanici && katilimci.durum === 'katildi') {
          const user = await User.findById(katilimci.kullanici);
          if (user && user.email) {
            await emailService.sendMeetingSummary(user.email, {
              meetingTitle: meeting.baslik,
              meetingDate: meeting.tarih,
              tasksCount: createdTasks.filter(t => 
                t.sorumlu.toString() === user._id.toString()
              ).length
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
      // Email hatası toplantı bitirme işlemini durdurmaz
    }

    res.json({
      message: 'Toplantı başarıyla tamamlandı',
      meeting: {
        _id: meeting._id,
        baslik: meeting.baslik,
        durum: meeting.durum,
        gercekBitisSaati: meeting.gercekBitisSaati
      },
      createdTasks: createdTasks.length,
      tasks: createdTasks
    });

  } catch (error) {
    console.error('finishMeeting error:', error);
    res.status(500).json({ 
      message: 'Toplantı bitirme sırasında hata oluştu',
      error: error.message 
    });
  }
};

/**
 * @desc    Meeting'den görev oluştur (internal function)
 * @param   {Object} meeting - Meeting objesi
 * @returns {Array} - Oluşturulan görevler
 */
const createTasksFromMeetingHelper = async (meeting) => {
  const createdTasks = [];

  try {
    console.log('🎯 Görev oluşturma işlemi başladı...');

    // 1. Gündem maddelerinden görev oluştur
    for (const gundemMaddesi of meeting.gundem) {
      if (gundemMaddesi.sorumlu && 
          ['karar-verildi', 'tamamlandı'].includes(gundemMaddesi.durum)) {
        
        console.log(`📋 Gündem maddesi: ${gundemMaddesi.baslik} - Sorumlu: ${gundemMaddesi.sorumlu.ad}`);

        const newTask = new MeetingTask({
          meeting: meeting._id,
          gundemMaddesiId: gundemMaddesi._id,
          baslik: gundemMaddesi.baslik,
          aciklama: gundemMaddesi.aciklama || 'Toplantı gündem maddesinden oluşturulan görev',
          sorumlu: gundemMaddesi.sorumlu._id,
          durum: 'atandi',
          oncelik: 'normal',
          gorunurluk: 'katilimcilara'
        });

        await newTask.save();
        createdTasks.push(newTask);

        // Notification gönder
        try {
          await notificationService.createNotification({
            kullanici: gundemMaddesi.sorumlu._id,
            baslik: 'Yeni Toplantı Görevi',
            mesaj: `"${meeting.baslik}" toplantısından size görev atandı: ${gundemMaddesi.baslik}`,
            tip: 'task-assigned',
            referansId: newTask._id,
            oncelik: 'normal'
          });
        } catch (notifError) {
          console.error('Notification gönderme hatası:', notifError);
        }
      }
    }

    // 2. Kararlardan görev oluştur
    for (const karar of meeting.kararlar) {
      if (karar.sorumlu && karar.durum !== 'iptal') {
        
        console.log(`📝 Karar: ${karar.baslik} - Sorumlu: ${karar.sorumlu.ad || 'Bilinmiyor'}`);

        const newTask = new MeetingTask({
          meeting: meeting._id,
          gundemMaddesiId: karar._id,
          baslik: karar.baslik,
          aciklama: karar.aciklama || 'Toplantı kararından oluşturulan görev',
          sorumlu: karar.sorumlu,
          durum: 'atandi',
          oncelik: karar.oncelik || 'normal',
          teslimTarihi: karar.teslimTarihi,
          gorunurluk: 'katilimcilara'
        });

        await newTask.save();
        createdTasks.push(newTask);

        // Notification gönder
        try {
          await notificationService.createNotification({
            kullanici: karar.sorumlu,
            baslik: 'Yeni Toplantı Görevi',
            mesaj: `"${meeting.baslik}" toplantısından size görev atandı: ${karar.baslik}`,
            tip: 'task-assigned',
            referansId: newTask._id,
            oncelik: karar.oncelik || 'normal'
          });
        } catch (notifError) {
          console.error('Notification gönderme hatası:', notifError);
        }
      }
    }

    console.log(`✅ Toplam ${createdTasks.length} görev oluşturuldu`);
    return createdTasks;

  } catch (error) {
    console.error('createTaskFromMeeting error:', error);
    throw error;
  }
};

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  finishMeeting,
  createTaskFromMeeting,
  getMyMeetings,
};
