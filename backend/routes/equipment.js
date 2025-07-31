const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const Assignment = require('../models/Assignment');
const { auth, checkModulePermission } = require('../middleware/auth');

// @route   GET /api/equipment/public/categories
// @desc    Get equipment categories for requests (public access)
// @access  Private (no module permission required)
router.get('/public/categories', auth, async (req, res) => {
  try {
    const categories = [
      'Bilgisayar',
      'Telefon',
      'Araç',
      'Kıyafet',
      'Donanım',
      'Diğer',
    ];

    // Her kategori için aktif ekipman sayısını hesapla
    const categoriesWithCounts = await Promise.all(
      categories.map(async category => {
        const count = await Equipment.countDocuments({
          category,
          isActive: true,
        });
        return { name: category, count };
      }),
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Public categories list error:', error);
    res
      .status(500)
      .json({ message: 'Kategori listesi getirilirken hata oluştu' });
  }
});

// @route   GET /api/equipment/public/list
// @desc    Get equipment list for requests (public access)
// @access  Private (no module permission required)
router.get('/public/list', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'all' && category !== '') {
      filter.category = category;
    }

    const equipment = await Equipment.find(filter)
      .select('name description category defaultUsagePeriodDays')
      .sort('category name');

    res.json(equipment);
  } catch (error) {
    console.error('Public equipment list error:', error);
    res
      .status(500)
      .json({ message: 'Ekipman listesi getirilirken hata oluştu' });
  }
});

// @route   GET /api/equipment
// @desc    Get all equipment with filters
// @access  Private
router.get(
  '/',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const { category, status, search } = req.query;
      const filter = {};

      if (category && category !== 'all') {
        filter.category = category;
      }

      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const equipment = await Equipment.find(filter)
        .populate('createdBy', 'isim soyisim')
        .sort('-createdAt');

      // Her ekipman için aktif atama sayısını hesapla
      const equipmentWithStats = await Promise.all(
        equipment.map(async item => {
          const activeAssignments = await Assignment.countDocuments({
            equipmentId: item._id,
            status: 'active',
          });

          return {
            ...item.toJSON(),
            totalAssigned: activeAssignments,
          };
        }),
      );

      res.json(equipmentWithStats);
    } catch (error) {
      console.error('Equipment list error:', error);
      res
        .status(500)
        .json({ message: 'Ekipman listesi getirilirken hata oluştu' });
    }
  },
);

// @route   GET /api/equipment/:id
// @desc    Get equipment by ID
// @access  Private
router.get(
  '/:id',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const equipment = await Equipment.findById(req.params.id).populate(
        'createdBy',
        'isim soyisim',
      );

      if (!equipment) {
        return res.status(404).json({ message: 'Ekipman bulunamadı' });
      }

      // Ekipman için aktif atamaları getir
      const assignments = await Assignment.find({
        equipmentId: equipment._id,
        status: 'active',
      })
        .populate('userId', 'isim soyisim')
        .populate('assignedBy', 'isim soyisim')
        .sort('-assignedAt');

      res.json({
        ...equipment.toJSON(),
        assignments,
      });
    } catch (error) {
      console.error('Equipment detail error:', error);
      res
        .status(500)
        .json({ message: 'Ekipman detayı getirilirken hata oluştu' });
    }
  },
);

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Private
router.post(
  '/',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const { name, description, defaultUsagePeriodDays, category, imageUrl } =
        req.body;

      // Validation
      if (!name || !defaultUsagePeriodDays || !category) {
        return res.status(400).json({
          message: 'Ekipman adı, kullanım süresi ve kategori zorunludur',
        });
      }

      if (defaultUsagePeriodDays < 1) {
        return res.status(400).json({
          message: 'Kullanım süresi en az 1 gün olmalıdır',
        });
      }

      // Check if equipment name already exists
      const existingEquipment = await Equipment.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
      });

      if (existingEquipment) {
        return res.status(400).json({
          message: 'Bu isimde bir ekipman zaten mevcut',
        });
      }

      const equipment = new Equipment({
        name,
        description,
        defaultUsagePeriodDays,
        category,
        imageUrl,
        createdBy: req.user.id,
      });

      await equipment.save();

      const populatedEquipment = await Equipment.findById(
        equipment._id,
      ).populate('createdBy', 'isim soyisim');

      res.status(201).json({
        message: 'Ekipman başarıyla oluşturuldu',
        equipment: populatedEquipment,
      });
    } catch (error) {
      console.error('Equipment creation error:', error);
      res.status(500).json({ message: 'Ekipman oluşturulurken hata oluştu' });
    }
  },
);

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private
router.put(
  '/:id',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const {
        name,
        description,
        defaultUsagePeriodDays,
        category,
        imageUrl,
        isActive,
      } = req.body;

      const equipment = await Equipment.findById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ message: 'Ekipman bulunamadı' });
      }

      // Check if new name conflicts with existing equipment
      if (name && name !== equipment.name) {
        const existingEquipment = await Equipment.findOne({
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: req.params.id },
        });

        if (existingEquipment) {
          return res.status(400).json({
            message: 'Bu isimde bir ekipman zaten mevcut',
          });
        }
      }

      // Update fields
      if (name !== undefined) {
        equipment.name = name;
      }
      if (description !== undefined) {
        equipment.description = description;
      }
      if (defaultUsagePeriodDays !== undefined) {
        equipment.defaultUsagePeriodDays = defaultUsagePeriodDays;
      }
      if (category !== undefined) {
        equipment.category = category;
      }
      if (imageUrl !== undefined) {
        equipment.imageUrl = imageUrl;
      }
      if (isActive !== undefined) {
        equipment.isActive = isActive;
      }

      await equipment.save();

      const populatedEquipment = await Equipment.findById(
        equipment._id,
      ).populate('createdBy', 'isim soyisim');

      res.json({
        message: 'Ekipman başarıyla güncellendi',
        equipment: populatedEquipment,
      });
    } catch (error) {
      console.error('Equipment update error:', error);
      res.status(500).json({ message: 'Ekipman güncellenirken hata oluştu' });
    }
  },
);

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment (soft delete)
// @access  Private
router.delete(
  '/:id',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi']),
  async (req, res) => {
    try {
      const equipment = await Equipment.findById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ message: 'Ekipman bulunamadı' });
      }

      // Check if equipment has active assignments
      const activeAssignments = await Assignment.countDocuments({
        equipmentId: equipment._id,
        status: 'active',
      });

      if (activeAssignments > 0) {
        return res.status(400).json({
          message: `Bu ekipmanın ${activeAssignments} aktif ataması bulunmaktadır. Önce atamaları sonlandırın.`,
        });
      }

      // Soft delete
      equipment.isActive = false;
      await equipment.save();

      res.json({ message: 'Ekipman başarıyla silindi' });
    } catch (error) {
      console.error('Equipment deletion error:', error);
      res.status(500).json({ message: 'Ekipman silinirken hata oluştu' });
    }
  },
);

// @route   GET /api/equipment/categories/list
// @desc    Get equipment categories
// @access  Private
router.get(
  '/categories/list',
  auth,
  checkModulePermission(['İnsan Kaynakları Yönetimi', 'Ekipman Yönetimi']),
  async (req, res) => {
    try {
      const categories = [
        'Bilgisayar',
        'Telefon',
        'Araç',
        'Kıyafet',
        'Donanım',
        'Diğer',
      ];

      // Her kategori için ekipman sayısını hesapla
      const categoriesWithCounts = await Promise.all(
        categories.map(async category => {
          const count = await Equipment.countDocuments({
            category,
            isActive: true,
          });
          return { name: category, count };
        }),
      );

      res.json(categoriesWithCounts);
    } catch (error) {
      console.error('Categories list error:', error);
      res
        .status(500)
        .json({ message: 'Kategori listesi getirilirken hata oluştu' });
    }
  },
);

module.exports = router;
