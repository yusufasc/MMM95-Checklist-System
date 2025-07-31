// HR Templates Routes - Template CRUD Operations
// Refactored from: hr.js (1050 satır → modüler yapı)
// 🎯 Amaç: HR şablonlarıyla ilgili tüm operations

const express = require('express');
const router = express.Router();
const HRTemplate = require('../../models/HRTemplate');

// Aktif İK şablonlarını getir
router.get('/active', async (req, res) => {
  try {
    const templates = await HRTemplate.find({ aktif: true })
      .select('ad maddeler hedefRoller aktif aciklama')
      .populate('hedefRoller', 'ad')
      .sort('ad');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Tüm İK şablonlarını getir
router.get('/', async (req, res) => {
  try {
    const templates = await HRTemplate.find()
      .populate('hedefRoller', 'ad')
      .populate('olusturanKullanici', 'ad soyad')
      .sort('-olusturmaTarihi');

    res.json(templates);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// Tek bir İK şablonunu getir
router.get('/:id', async (req, res) => {
  try {
    const template = await HRTemplate.findById(req.params.id)
      .populate('hedefRoller', 'ad')
      .populate('olusturanKullanici', 'ad soyad');

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK şablonu oluştur
router.post('/', async (req, res) => {
  try {
    const { ad, maddeler, hedefRoller, aktif } = req.body;

    const template = new HRTemplate({
      ad,
      maddeler,
      hedefRoller,
      aktif: aktif !== undefined ? aktif : true,
      olusturanKullanici: req.user.id,
    });

    await template.save();
    await template.populate('hedefRoller', 'ad');
    await template.populate('olusturanKullanici', 'ad soyad');

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK şablonu güncelle
router.put('/:id', async (req, res) => {
  try {
    const { ad, maddeler, hedefRoller, aktif } = req.body;

    const template = await HRTemplate.findByIdAndUpdate(
      req.params.id,
      {
        ad,
        maddeler,
        hedefRoller,
        aktif,
        guncellemeTarihi: Date.now(),
      },
      { new: true },
    )
      .populate('hedefRoller', 'ad')
      .populate('olusturanKullanici', 'ad soyad');

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json(template);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

// İK şablonu sil
router.delete('/:id', async (req, res) => {
  try {
    const template = await HRTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Şablon bulunamadı' });
    }

    res.json({ message: 'Şablon başarıyla silindi' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
