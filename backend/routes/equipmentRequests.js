const express = require('express');
const router = express.Router();
const EquipmentRequest = require('../models/EquipmentRequest');
const Assignment = require('../models/Assignment');
const { auth, checkModulePermission } = require('../middleware/auth');

// @route   GET /api/equipment-requests
// @desc    Get all equipment requests with filters and pagination
// @access  Private
router.get(
  '/',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const { status, priority, requestType, page = 1, limit = 10 } = req.query;
      const filter = {};

      if (status && status !== 'all') {
        filter.status = status;
      }
      if (priority && priority !== 'all') {
        filter.priority = priority;
      }
      if (requestType && requestType !== 'all') {
        filter.requestType = requestType;
      }

      // Calculate pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Get total count for pagination
      const totalCount = await EquipmentRequest.countDocuments(filter);

      // Get paginated requests
      const requests = await EquipmentRequest.find(filter)
        .populate('userId', 'ad soyad departmanlar')
        .populate('equipmentId', 'name category')
        .populate('assignmentId', 'assignedAt expiresAt')
        .populate('processedBy', 'ad soyad')
        .sort('-requestDate')
        .skip(skip)
        .limit(limitNum);

      res.json({
        requests,
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
      });
    } catch (error) {
      console.error('Equipment requests list error:', error);
      res
        .status(500)
        .json({ message: 'Talep listesi getirilirken hata oluştu' });
    }
  },
);

// @route   GET /api/equipment-requests/user/:userId
// @desc    Get equipment requests for specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can view this data - allow users to see their own requests
    if (
      req.user.id !== userId &&
      !req.user.hasModulePermission?.([
        'İnsan Kaynakları Yönetimi',
        'Ekipman Yönetimi',
      ])
    ) {
      return res
        .status(403)
        .json({ message: 'Bu verileri görme yetkiniz yok' });
    }

    const requests = await EquipmentRequest.find({ userId })
      .populate('equipmentId', 'name category')
      .populate('assignmentId', 'assignedAt expiresAt')
      .populate('processedBy', 'ad soyad')
      .sort('-requestDate');

    res.json(requests);
  } catch (error) {
    console.error('User equipment requests error:', error);
    res
      .status(500)
      .json({ message: 'Kullanıcı talepleri getirilirken hata oluştu' });
  }
});

// @route   GET /api/equipment-requests/my-requests
// @desc    Get current user's equipment requests
// @access  Private
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await EquipmentRequest.find({ userId: req.user.id })
      .populate('equipmentId', 'name category')
      .populate('assignmentId', 'assignedAt expiresAt')
      .populate('processedBy', 'ad soyad')
      .sort('-createdAt');

    res.json(requests);
  } catch (error) {
    console.error('My equipment requests error:', error);
    res.status(500).json({ message: 'Taleplerimi getirilirken hata oluştu' });
  }
});

// @route   GET /api/equipment-requests/:id
// @desc    Get equipment request by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id)
      .populate('userId', 'ad soyad departmanlar')
      .populate('equipmentId')
      .populate('assignmentId')
      .populate('processedBy', 'ad soyad');

    if (!request) {
      return res.status(404).json({ message: 'Talep bulunamadı' });
    }

    // Check if user can view this data
    if (
      req.user.id !== request.userId._id.toString() &&
      !req.user.hasModulePermission?.([
        'İnsan Kaynakları Yönetimi',
        'Ekipman Yönetimi',
      ])
    ) {
      return res.status(403).json({ message: 'Bu talebi görme yetkiniz yok' });
    }

    res.json(request);
  } catch (error) {
    console.error('Equipment request detail error:', error);
    res.status(500).json({ message: 'Talep detayı getirilirken hata oluştu' });
  }
});

// @route   POST /api/equipment-requests
// @desc    Create new equipment request (user creates)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { assignmentId, requestedDate, reason, priority, requestType } =
      req.body;

    // Validation
    if (!assignmentId || !requestedDate || !reason) {
      return res.status(400).json({
        message: 'Atama, talep tarihi ve açıklama zorunludur',
      });
    }

    // Check if assignment exists and belongs to user
    const assignment =
      await Assignment.findById(assignmentId).populate('equipmentId');

    if (!assignment) {
      return res.status(404).json({ message: 'Atama bulunamadı' });
    }

    if (assignment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu atama size ait değil' });
    }

    if (assignment.status !== 'active') {
      return res
        .status(400)
        .json({ message: 'Sadece aktif atamalar için talep oluşturulabilir' });
    }

    // Check if user already has a pending request for this assignment
    const existingRequest = await EquipmentRequest.findOne({
      assignmentId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'Bu atama için zaten bekleyen bir talebiniz bulunmaktadır',
      });
    }

    // Validate requested date
    const reqDate = new Date(requestedDate);
    const currentExpiry = assignment.expiresAt;

    if (reqDate >= currentExpiry) {
      return res.status(400).json({
        message: 'Talep tarihi mevcut bitiş tarihinden önce olmalıdır',
      });
    }

    const equipmentRequest = new EquipmentRequest({
      userId: req.user.id,
      equipmentId: assignment.equipmentId._id,
      assignmentId,
      currentExpiryDate: currentExpiry,
      requestedDate: reqDate,
      reason,
      priority: priority || 'normal',
      requestType: requestType || 'early_replacement',
    });

    await equipmentRequest.save();

    const populatedRequest = await EquipmentRequest.findById(
      equipmentRequest._id,
    )
      .populate('equipmentId', 'name category')
      .populate('assignmentId', 'assignedAt expiresAt');

    res.status(201).json({
      message: 'Talebiniz başarıyla oluşturuldu',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Equipment request creation error:', error);
    res.status(500).json({ message: 'Talep oluşturulurken hata oluştu' });
  }
});

// @route   POST /api/equipment-requests/new-equipment
// @desc    Create new equipment request (for new equipment)
// @access  Private
router.post('/new-equipment', auth, async (req, res) => {
  try {
    const {
      equipmentId,
      customDescription,
      priority,
      justification,
      requestType,
    } = req.body;

    // Validation
    if (requestType === 'equipment' && !equipmentId) {
      return res.status(400).json({
        message: 'Ekipman seçimi zorunludur',
      });
    }

    if (requestType === 'custom' && !customDescription) {
      return res.status(400).json({
        message: 'Özel talep açıklaması zorunludur',
      });
    }

    const equipmentRequest = new EquipmentRequest({
      userId: req.user.id,
      equipmentId: equipmentId || null,
      customDescription: customDescription || null,
      priority: priority || 'normal',
      justification: justification || '',
      requestType: requestType || 'equipment',
      status: 'pending',
      requestDate: new Date(),
    });

    await equipmentRequest.save();

    const populatedRequest = await EquipmentRequest.findById(
      equipmentRequest._id,
    )
      .populate('equipmentId', 'name category')
      .populate('userId', 'ad soyad');

    res.status(201).json({
      message: 'Talebiniz başarıyla oluşturuldu',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('New equipment request creation error:', error);
    res.status(500).json({ message: 'Talep oluşturulurken hata oluştu' });
  }
});

// @route   PUT /api/equipment-requests/:id/process
// @desc    Process equipment request (approve/reject)
// @access  Private
router.put(
  '/:id/process',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const { status, responseNote, newExpiryDate } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          message: 'Geçerli bir durum belirtmelisiniz (approved/rejected)',
        });
      }

      const request = await EquipmentRequest.findById(req.params.id).populate(
        'assignmentId',
      );

      if (!request) {
        return res.status(404).json({ message: 'Talep bulunamadı' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Bu talep zaten işlenmiş' });
      }

      // Update request
      request.status = status;
      request.responseNote = responseNote;
      request.processedBy = req.user.id;
      request.processedAt = new Date();

      // If approved, update the assignment
      if (status === 'approved' && request.assignmentId) {
        const assignment = await Assignment.findById(request.assignmentId._id);
        if (assignment && assignment.status === 'active') {
          if (newExpiryDate) {
            assignment.expiresAt = new Date(newExpiryDate);
          } else {
            assignment.expiresAt = request.requestedDate;
          }
          await assignment.save();
        }
      }

      await request.save();

      const populatedRequest = await EquipmentRequest.findById(request._id)
        .populate('userId', 'ad soyad')
        .populate('equipmentId', 'name category')
        .populate('assignmentId')
        .populate('processedBy', 'ad soyad');

      res.json({
        message: `Talep başarıyla ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`,
        request: populatedRequest,
      });
    } catch (error) {
      console.error('Equipment request processing error:', error);
      res.status(500).json({ message: 'Talep işlenirken hata oluştu' });
    }
  },
);

// @route   PUT /api/equipment-requests/:id/approve
// @desc    Approve equipment request
// @access  Private
router.put(
  '/:id/approve',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const { responseNote, newExpiryDate } = req.body;

      const request = await EquipmentRequest.findById(req.params.id).populate(
        'assignmentId',
      );

      if (!request) {
        return res.status(404).json({ message: 'Talep bulunamadı' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Bu talep zaten işlenmiş' });
      }

      // Update request
      request.status = 'approved';
      request.responseNote = responseNote || 'Talep onaylandı';
      request.processedBy = req.user.id;
      request.processedAt = new Date();

      // If approved, update the assignment
      if (request.assignmentId) {
        const assignment = await Assignment.findById(request.assignmentId._id);
        if (assignment && assignment.status === 'active') {
          if (newExpiryDate) {
            assignment.expiresAt = new Date(newExpiryDate);
          } else if (request.requestedDate) {
            assignment.expiresAt = request.requestedDate;
          }
          await assignment.save();
        }
      }

      await request.save();

      const populatedRequest = await EquipmentRequest.findById(request._id)
        .populate('userId', 'ad soyad')
        .populate('equipmentId', 'name category')
        .populate('assignmentId')
        .populate('processedBy', 'ad soyad');

      res.json({
        message: 'Talep başarıyla onaylandı',
        request: populatedRequest,
      });
    } catch (error) {
      console.error('Equipment request approval error:', error);
      res.status(500).json({ message: 'Talep onaylanırken hata oluştu' });
    }
  },
);

// @route   PUT /api/equipment-requests/:id/reject
// @desc    Reject equipment request
// @access  Private
router.put(
  '/:id/reject',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const { responseNote } = req.body;

      const request = await EquipmentRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ message: 'Talep bulunamadı' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Bu talep zaten işlenmiş' });
      }

      // Update request
      request.status = 'rejected';
      request.responseNote = responseNote || 'Talep reddedildi';
      request.processedBy = req.user.id;
      request.processedAt = new Date();

      await request.save();

      const populatedRequest = await EquipmentRequest.findById(request._id)
        .populate('userId', 'ad soyad')
        .populate('equipmentId', 'name category')
        .populate('assignmentId')
        .populate('processedBy', 'ad soyad');

      res.json({
        message: 'Talep başarıyla reddedildi',
        request: populatedRequest,
      });
    } catch (error) {
      console.error('Equipment request rejection error:', error);
      res.status(500).json({ message: 'Talep reddedilirken hata oluştu' });
    }
  },
);

// @route   DELETE /api/equipment-requests/:id
// @desc    Cancel equipment request (user cancels)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Talep bulunamadı' });
    }

    // Check if user owns this request or has HR permission
    if (
      request.userId.toString() !== req.user.id &&
      !req.user.hasModulePermission?.(['İnsan Kaynakları Yönetimi'])
    ) {
      return res.status(403).json({ message: 'Bu talebi silme yetkiniz yok' });
    }

    if (request.status !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Sadece bekleyen talepler iptal edilebilir' });
    }

    await EquipmentRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Talep başarıyla iptal edildi' });
  } catch (error) {
    console.error('Equipment request cancellation error:', error);
    res.status(500).json({ message: 'Talep iptal edilirken hata oluştu' });
  }
});

// @route   GET /api/equipment-requests/dashboard/stats
// @desc    Get equipment request statistics for dashboard
// @access  Private
router.get(
  '/dashboard/stats',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const [totalPending, totalApproved, totalRejected, urgentRequests] =
        await Promise.all([
          EquipmentRequest.countDocuments({ status: 'pending' }),
          EquipmentRequest.countDocuments({ status: 'approved' }),
          EquipmentRequest.countDocuments({ status: 'rejected' }),
          EquipmentRequest.countDocuments({
            status: 'pending',
            priority: { $in: ['high', 'urgent'] },
          }),
        ]);

      res.json({
        totalPending,
        totalApproved,
        totalRejected,
        urgentRequests,
      });
    } catch (error) {
      console.error('Equipment request stats error:', error);
      res
        .status(500)
        .json({ message: 'İstatistikler getirilirken hata oluştu' });
    }
  },
);

module.exports = router;
