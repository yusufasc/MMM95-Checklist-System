const MeetingNote = require('../models/MeetingNote');
const Meeting = require('../models/Meeting');

/**
 * @desc    Toplantı notlarını getir
 * @route   GET /api/meeting-notes/meeting/:meetingId
 * @access  Private (Toplantı katılımcısı)
 */
const getMeetingNotes = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { lastNoteId, limit = 50 } = req.query;

    // Check if meeting exists and user has access
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    // Check user access to meeting
    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isParticipant = meeting.katilimcilar.some(
      k => k.kullanici.toString() === userId,
    );
    const isAdmin = req.user.roller.some(rol => rol.ad === 'Admin');

    if (!isOrganizator && !isParticipant && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Bu toplantı notlarına erişim yetkiniz yok' });
    }

    // Build query
    const query = {
      toplanti: meetingId,
      silindiMi: false,
      durum: { $ne: 'silindi' },
    };

    // Real-time functionality - get notes after lastNoteId
    if (lastNoteId) {
      query._id = { $gt: lastNoteId };
    }

    const notes = await MeetingNote.find(query)
      .populate('olusturan', 'ad soyad kullaniciAdi')
      .populate('konusanKisi', 'ad soyad')
      .populate('yanit.hedefNot')
      .populate('reaksiyonlar.kullanici', 'ad soyad')
      .sort({ siraNo: 1 })
      .limit(limit * 1);

    res.json({
      notes,
      hasMore: notes.length === limit,
      lastNoteId: notes.length > 0 ? notes[notes.length - 1]._id : null,
    });
  } catch (error) {
    console.error('getMeetingNotes error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Geçersiz ID formatı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Yeni not ekle
 * @route   POST /api/meeting-notes
 * @access  Private (Toplantı katılımcısı)
 */
const createNote = async (req, res) => {
  try {
    const {
      toplanti,
      icerik,
      tip,
      etiketler,
      gundemMaddesi,
      alintiliMetin,
      yanit,
      konusanKisi,
      gorunurluk,
    } = req.body;

    // Validation
    if (!toplanti || !icerik) {
      return res.status(400).json({
        message: 'Toplantı ID ve içerik zorunludur',
      });
    }

    // Check if meeting exists and user has access
    const meeting = await Meeting.findById(toplanti);
    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isParticipant = meeting.katilimcilar.some(
      k => k.kullanici.toString() === userId,
    );

    if (!isOrganizator && !isParticipant) {
      return res
        .status(403)
        .json({ message: 'Bu toplantıya not ekleme yetkiniz yok' });
    }

    // Create note
    const noteData = {
      toplanti,
      olusturan: userId,
      icerik: icerik.trim(),
      tip: tip || 'not',
      etiketler: etiketler || [],
      gundemMaddesi: gundemMaddesi || null,
      alintiliMetin: alintiliMetin || null,
      yanit: yanit || null,
      konusanKisi: konusanKisi || null,
      gorunurluk: gorunurluk || 'katılımcılara',
      toplantıZamaniSaati: new Date(),
    };

    const note = new MeetingNote(noteData);
    await note.save();

    // Populate the created note
    const populatedNote = await MeetingNote.findById(note._id)
      .populate('olusturan', 'ad soyad kullaniciAdi')
      .populate('konusanKisi', 'ad soyad')
      .populate('yanit.hedefNot');

    res.status(201).json({
      message: 'Not başarıyla eklendi',
      note: populatedNote,
    });
  } catch (error) {
    console.error('createNote error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Not güncelle
 * @route   PUT /api/meeting-notes/:id
 * @access  Private (Not sahibi veya Organizatör)
 */
const updateNote = async (req, res) => {
  try {
    const note = await MeetingNote.findById(req.params.id);

    if (!note || note.silindiMi) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    // Check permissions
    const userId = req.user.id;
    const isOwner = note.olusturan.toString() === userId;

    // Get meeting to check if user is organizator
    const meeting = await Meeting.findById(note.toplanti);
    const isOrganizator = meeting && meeting.organizator.toString() === userId;

    if (!isOwner && !isOrganizator) {
      return res
        .status(403)
        .json({ message: 'Bu notu güncelleme yetkiniz yok' });
    }

    // Save old content for version history
    if (req.body.icerik && req.body.icerik !== note.icerik) {
      note.duzenlemeler.push({
        eskiIcerik: note.icerik,
        yeniIcerik: req.body.icerik,
        duzenleyen: userId,
        duzenlemeTarihi: new Date(),
        neden: req.body.duzenlemNedeni || 'Düzeltme',
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'icerik',
      'tip',
      'etiketler',
      'gundemMaddesi',
      'gorunurluk',
      'konusanKisi',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    await note.save();

    // Populate updated note
    const updatedNote = await MeetingNote.findById(note._id)
      .populate('olusturan', 'ad soyad kullaniciAdi')
      .populate('konusanKisi', 'ad soyad')
      .populate('duzenlemeler.duzenleyen', 'ad soyad');

    res.json({
      message: 'Not başarıyla güncellendi',
      note: updatedNote,
    });
  } catch (error) {
    console.error('updateNote error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Not sil
 * @route   DELETE /api/meeting-notes/:id
 * @access  Private (Not sahibi veya Organizatör)
 */
const deleteNote = async (req, res) => {
  try {
    const note = await MeetingNote.findById(req.params.id);

    if (!note || note.silindiMi) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    // Check permissions
    const userId = req.user.id;
    const isOwner = note.olusturan.toString() === userId;

    // Get meeting to check if user is organizator
    const meeting = await Meeting.findById(note.toplanti);
    const isOrganizator = meeting && meeting.organizator.toString() === userId;

    if (!isOwner && !isOrganizator) {
      return res.status(403).json({ message: 'Bu notu silme yetkiniz yok' });
    }

    // Soft delete
    note.silindiMi = true;
    note.durum = 'silindi';
    note.silinmeTarihi = new Date();
    await note.save();

    res.json({ message: 'Not başarıyla silindi' });
  } catch (error) {
    console.error('deleteNote error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Nota reaksiyon ekle/kaldır
 * @route   POST /api/meeting-notes/:id/reaction
 * @access  Private (Toplantı katılımcısı)
 */
const toggleReaction = async (req, res) => {
  try {
    const { tip } = req.body;
    const noteId = req.params.id;
    const userId = req.user.id;

    if (!tip) {
      return res.status(400).json({ message: 'Reaksiyon tipi zorunludur' });
    }

    const note = await MeetingNote.findById(noteId);
    if (!note || note.silindiMi) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    // Check if user has access to meeting
    const meeting = await Meeting.findById(note.toplanti);
    const isOrganizator = meeting.organizator.toString() === userId;
    const isParticipant = meeting.katilimcilar.some(
      k => k.kullanici.toString() === userId,
    );

    if (!isOrganizator && !isParticipant) {
      return res
        .status(403)
        .json({ message: 'Bu nota reaksiyon verme yetkiniz yok' });
    }

    // Check if user already has this reaction
    const existingReactionIndex = note.reaksiyonlar.findIndex(
      r => r.kullanici.toString() === userId && r.tip === tip,
    );

    if (existingReactionIndex > -1) {
      // Remove existing reaction
      note.reaksiyonlar.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      note.reaksiyonlar.push({
        kullanici: userId,
        tip,
        tarih: new Date(),
      });
    }

    await note.save();

    // Get reaction counts
    const reactionCounts = note.reaksiyonlar.reduce((acc, reaction) => {
      acc[reaction.tip] = (acc[reaction.tip] || 0) + 1;
      return acc;
    }, {});

    res.json({
      message:
        existingReactionIndex > -1
          ? 'Reaksiyon kaldırıldı'
          : 'Reaksiyon eklendi',
      reactionCounts,
    });
  } catch (error) {
    console.error('toggleReaction error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/**
 * @desc    Toplantı not özetini getir
 * @route   GET /api/meeting-notes/summary/:meetingId
 * @access  Private (Toplantı katılımcısı)
 */
const getNoteSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Check meeting access
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || meeting.silindiMi) {
      return res.status(404).json({ message: 'Toplantı bulunamadı' });
    }

    const userId = req.user.id;
    const isOrganizator = meeting.organizator.toString() === userId;
    const isParticipant = meeting.katilimcilar.some(
      k => k.kullanici.toString() === userId,
    );

    if (!isOrganizator && !isParticipant) {
      return res
        .status(403)
        .json({ message: 'Bu toplantı özetine erişim yetkiniz yok' });
    }

    // Get summary using static method
    const summary = await MeetingNote.getNoteSummary(meetingId);

    // Get total note count
    const totalNotes = await MeetingNote.countDocuments({
      toplanti: meetingId,
      silindiMi: false,
    });

    res.json({
      totalNotes,
      byType: summary,
      meetingId,
    });
  } catch (error) {
    console.error('getNoteSummary error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Geçersiz ID formatı' });
    }
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

module.exports = {
  getMeetingNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleReaction,
  getNoteSummary,
};
