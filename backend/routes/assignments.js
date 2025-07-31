const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { auth, checkModulePermission } = require('../middleware/auth');

// @route   GET /api/assignments
// @desc    Get all assignments with filters
// @access  Private
router.get(
  '/',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const { userId, equipmentId, status, expiringDays } = req.query;
      const filter = {};

      if (userId) {
        filter.userId = userId;
      }
      if (equipmentId) {
        filter.equipmentId = equipmentId;
      }
      if (status) {
        filter.status = status;
      }

      // Expiring assignments filter
      if (expiringDays) {
        const days = parseInt(expiringDays);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        filter.expiresAt = { $lte: expiryDate };
        filter.status = 'active';
      }

      const assignments = await Assignment.find(filter)
        .populate('equipmentId', 'name category')
        .populate('userId', 'ad soyad departmanlar')
        .populate('assignedBy', 'ad soyad')
        .populate('returnedBy', 'ad soyad')
        .sort('-assignedAt');

      res.json(assignments);
    } catch (error) {
      console.error('Assignments list error:', error);
      res
        .status(500)
        .json({ message: 'Atama listesi getirilirken hata oluştu' });
    }
  },
);

// @route   GET /api/assignments/user/:userId
// @desc    Get assignments for specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    console.log('🔍 Assignment Debug: Request for user:', userId);
    console.log('🔍 Request user:', req.user.id);
    console.log('🔍 Status filter:', status);

    // Check if user can view this data
    if (
      req.user.id !== userId &&
      !req.user.hasModulePermission?.([
        'İnsan Kaynakları Yönetimi',
        'Ekipman Yönetimi',
      ])
    ) {
      console.log('❌ Permission denied for user:', req.user.id);
      return res
        .status(403)
        .json({ message: 'Bu verileri görme yetkiniz yok' });
    }

    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    console.log('🔍 Assignment filter:', filter);

    const assignments = await Assignment.find(filter)
      .populate('equipmentId', 'name category description imageUrl')
      .populate('assignedBy', 'ad soyad')
      .populate('returnedBy', 'ad soyad')
      .sort('-assignedAt');

    console.log('📦 Found assignments count:', assignments.length);
    console.log('📦 Assignments data:', assignments);

    res.json(assignments);
  } catch (error) {
    console.error('User assignments error:', error);
    res
      .status(500)
      .json({ message: 'Kullanıcı atamaları getirilirken hata oluştu' });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get assignment by ID
// @access  Private
router.get(
  '/:id',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id)
        .populate('equipmentId')
        .populate('userId', 'ad soyad departmanlar email')
        .populate('assignedBy', 'ad soyad')
        .populate('returnedBy', 'ad soyad');

      if (!assignment) {
        return res.status(404).json({ message: 'Atama bulunamadı' });
      }

      res.json(assignment);
    } catch (error) {
      console.error('Assignment detail error:', error);
      res
        .status(500)
        .json({ message: 'Atama detayı getirilirken hata oluştu' });
    }
  },
);

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private
router.post(
  '/',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const { equipmentId, userId, assignedAt, notes, condition } = req.body;

      // Validation
      if (!equipmentId || !userId) {
        return res.status(400).json({
          message: 'Ekipman ve kullanıcı seçimi zorunludur',
        });
      }

      // Check if equipment exists and is active
      const equipment = await Equipment.findById(equipmentId);
      if (!equipment || !equipment.isActive) {
        return res
          .status(404)
          .json({ message: 'Geçerli bir ekipman bulunamadı' });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      // Check if user already has an active assignment for this equipment
      const existingAssignment = await Assignment.findOne({
        equipmentId,
        userId,
        status: 'active',
      });

      if (existingAssignment) {
        return res.status(400).json({
          message:
            'Bu kullanıcının bu ekipman için zaten aktif bir ataması bulunmaktadır',
        });
      }

      // Calculate expiry date
      const assignmentDate = assignedAt ? new Date(assignedAt) : new Date();
      const expiryDate = new Date(assignmentDate);
      expiryDate.setDate(
        expiryDate.getDate() + equipment.defaultUsagePeriodDays,
      );

      const assignment = new Assignment({
        equipmentId,
        userId,
        assignedAt: assignmentDate,
        expiresAt: expiryDate,
        notes,
        condition: condition || 'perfect',
        assignedBy: req.user.id,
      });

      await assignment.save();

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('equipmentId', 'name category')
        .populate('userId', 'ad soyad')
        .populate('assignedBy', 'ad soyad');

      res.status(201).json({
        message: 'Ekipman başarıyla atandı',
        assignment: populatedAssignment,
      });
    } catch (error) {
      console.error('Assignment creation error:', error);
      res.status(500).json({ message: 'Atama oluşturulurken hata oluştu' });
    }
  },
);

// @route   PUT /api/assignments/:id/return
// @desc    Return assignment (mark as returned)
// @access  Private
router.put(
  '/:id/return',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const { returnedAt, notes, condition } = req.body;

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: 'Atama bulunamadı' });
      }

      if (assignment.status !== 'active') {
        return res
          .status(400)
          .json({ message: 'Bu atama zaten sonlandırılmış' });
      }

      assignment.returnedAt = returnedAt ? new Date(returnedAt) : new Date();
      assignment.status = 'returned';
      assignment.returnedBy = req.user.id;

      if (notes) {
        assignment.notes = (assignment.notes || '') + '\n' + notes;
      }
      if (condition) {
        assignment.condition = condition;
      }

      await assignment.save();

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('equipmentId', 'name category')
        .populate('userId', 'ad soyad')
        .populate('assignedBy', 'ad soyad')
        .populate('returnedBy', 'ad soyad');

      res.json({
        message: 'Ekipman başarıyla iade edildi',
        assignment: populatedAssignment,
      });
    } catch (error) {
      console.error('Assignment return error:', error);
      res
        .status(500)
        .json({ message: 'Ekipman iadesi işlenirken hata oluştu' });
    }
  },
);

// @route   PUT /api/assignments/:id/extend
// @desc    Extend assignment expiry date
// @access  Private
router.put(
  '/:id/extend',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const { additionalDays, notes } = req.body;

      if (!additionalDays || additionalDays < 1) {
        return res.status(400).json({
          message: 'Geçerli bir uzatma süresi belirtmelisiniz',
        });
      }

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: 'Atama bulunamadı' });
      }

      if (assignment.status !== 'active') {
        return res
          .status(400)
          .json({ message: 'Sadece aktif atamalar uzatılabilir' });
      }

      // Extend expiry date
      const newExpiryDate = new Date(assignment.expiresAt);
      newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(additionalDays));

      assignment.expiresAt = newExpiryDate;

      if (notes) {
        assignment.notes = (assignment.notes || '') + '\n' + notes;
      }

      await assignment.save();

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('equipmentId', 'name category')
        .populate('userId', 'ad soyad')
        .populate('assignedBy', 'ad soyad');

      res.json({
        message: `Atama süresi ${additionalDays} gün uzatıldı`,
        assignment: populatedAssignment,
      });
    } catch (error) {
      console.error('Assignment extension error:', error);
      res.status(500).json({ message: 'Atama uzatılırken hata oluştu' });
    }
  },
);

// @route   GET /api/assignments/dashboard/stats
// @desc    Get assignment statistics for dashboard
// @access  Private
router.get(
  '/dashboard/stats',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const [totalActive, expiredToday, expiringThisWeek, totalExpired] =
        await Promise.all([
          Assignment.countDocuments({ status: 'active' }),
          Assignment.countDocuments({
            status: 'active',
            expiresAt: { $lte: tomorrow },
          }),
          Assignment.countDocuments({
            status: 'active',
            expiresAt: { $lte: nextWeek },
          }),
          Assignment.countDocuments({ status: 'expired' }),
        ]);

      res.json({
        totalActive,
        expiredToday,
        expiringThisWeek,
        totalExpired,
      });
    } catch (error) {
      console.error('Assignment stats error:', error);
      res
        .status(500)
        .json({ message: 'İstatistikler getirilirken hata oluştu' });
    }
  },
);

module.exports = router;
