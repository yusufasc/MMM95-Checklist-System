const express = require('express');
const Department = require('../models/Department');
const { auth, checkModulePermission } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/departments
// @desc    Tüm departmanları listele
// @access  Private (Departman Yönetimi modülü erişim yetkisi)
router.get('/', auth, checkModulePermission('Departman Yönetimi'), async (req, res) => {
  try {
    const departments = await Department.find().populate(
      'digerDepartmanYetkileri.hedefDepartman',
      'ad',
    );
    res.json(departments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// @route   POST /api/departments
// @desc    Yeni departman ekle
// @access  Private (Departman Yönetimi modülü düzenleme yetkisi)
router.post(
  '/',
  auth,
  checkModulePermission('Departman Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, digerDepartmanYetkileri } = req.body;

      const department = new Department({
        ad,
        digerDepartmanYetkileri: digerDepartmanYetkileri || [],
      });

      await department.save();

      // Populate edilmiş hali ile döndür
      const populatedDepartment = await Department.findById(department._id).populate(
        'digerDepartmanYetkileri.hedefDepartman',
        'ad',
      );

      res.status(201).json(populatedDepartment);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Sunucu hatası');
    }
  },
);

// @route   PUT /api/departments/:id
// @desc    Departman güncelle
// @access  Private (Departman Yönetimi modülü düzenleme yetkisi)
router.put(
  '/:id',
  auth,
  checkModulePermission('Departman Yönetimi', 'duzenleyebilir'),
  async (req, res) => {
    try {
      const { ad, digerDepartmanYetkileri } = req.body;

      const department = await Department.findByIdAndUpdate(
        req.params.id,
        {
          ad,
          digerDepartmanYetkileri: digerDepartmanYetkileri || [],
          guncellemeTarihi: Date.now(),
        },
        { new: true },
      ).populate('digerDepartmanYetkileri.hedefDepartman', 'ad');

      if (!department) {
        return res.status(404).json({ message: 'Departman bulunamadı' });
      }

      res.json(department);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Geçersiz departman ID' });
      }
      res.status(500).send('Sunucu hatası');
    }
  },
);

module.exports = router;
