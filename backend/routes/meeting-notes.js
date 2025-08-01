const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');

// Import meeting note controller
const {
  getMeetingNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleReaction,
  getNoteSummary,
} = require('../controllers/meetingNoteController');

// @route   GET /api/meeting-notes/meeting/:meetingId
// @desc    Toplantı notlarını getir (real-time support)
// @access  Private (Toplantı katılımcısı)
router.get(
  '/meeting/:meetingId',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  getMeetingNotes,
);

// @route   GET /api/meeting-notes/summary/:meetingId
// @desc    Toplantı not özetini getir
// @access  Private (Toplantı katılımcısı)
router.get(
  '/summary/:meetingId',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  getNoteSummary,
);

// @route   POST /api/meeting-notes
// @desc    Yeni not ekle
// @access  Private (Toplantı katılımcısı)
router.post('/', auth, checkModulePermission('Toplantı Yönetimi'), createNote);

// @route   PUT /api/meeting-notes/:id
// @desc    Not güncelle
// @access  Private (Not sahibi veya Organizatör)
router.put(
  '/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  updateNote,
);

// @route   DELETE /api/meeting-notes/:id
// @desc    Not sil (soft delete)
// @access  Private (Not sahibi veya Organizatör)
router.delete(
  '/:id',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  deleteNote,
);

// @route   POST /api/meeting-notes/:id/reaction
// @desc    Nota reaksiyon ekle/kaldır
// @access  Private (Toplantı katılımcısı)
router.post(
  '/:id/reaction',
  auth,
  checkModulePermission('Toplantı Yönetimi'),
  toggleReaction,
);

module.exports = router;
