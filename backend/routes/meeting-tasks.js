const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const {
  getMyTasks,
  getMeetingTasks,
  getTaskDetail,
  updateTaskProgress,
  addTaskComment,
  updateTaskStatus,
  createTasksFromMeeting
} = require('../controllers/meetingTaskController');

// @route   GET /api/meeting-tasks/my-tasks
// @desc    Kullanıcının tüm meeting görevlerini getir
// @access  Private
router.get(
  '/my-tasks',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'gorebilir'),
  getMyTasks
);

// @route   GET /api/meeting-tasks/meeting/:meetingId
// @desc    Meeting'in tüm görevlerini getir
// @access  Private
router.get(
  '/meeting/:meetingId',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'gorebilir'),
  getMeetingTasks
);

// @route   GET /api/meeting-tasks/:taskId
// @desc    Görev detayını getir
// @access  Private
router.get(
  '/:taskId',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'gorebilir'),
  getTaskDetail
);

// @route   PUT /api/meeting-tasks/:taskId/progress
// @desc    Görev progress'ini güncelle
// @access  Private (Sadece sorumlu kişi)
router.put(
  '/:taskId/progress',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  updateTaskProgress
);

// @route   POST /api/meeting-tasks/:taskId/comments
// @desc    Göreve yorum ekle
// @access  Private (Katılımcılar)
router.post(
  '/:taskId/comments',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  addTaskComment
);

// @route   PUT /api/meeting-tasks/:taskId/status
// @desc    Görev durumunu güncelle
// @access  Private (Sadece sorumlu kişi)
router.put(
  '/:taskId/status',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  updateTaskStatus
);

// @route   POST /api/meeting-tasks/create-from-meeting
// @desc    Meeting bittiğinde gündem maddelerinden görev oluştur
// @access  Private (Sadece organizatör)
router.post(
  '/create-from-meeting',
  auth,
  checkModulePermission('Toplantı Yönetimi', 'duzenleyebilir'),
  createTasksFromMeeting
);

module.exports = router;