const express = require('express');
const router = express.Router();
const { auth, checkModulePermission } = require('../middleware/auth');
const emailService = require('../services/emailService');

/**
 * 📧 Email Test Routes
 * Email service functionality testing endpoints
 */

// @route   GET /api/email-test/status
// @desc    Email service durumunu kontrol et
// @access  Private (Admin only)
router.get('/status', auth, async (req, res) => {
  try {
    // Only admin can check email status
    if (req.user.rol !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Sadece admin bu endpoint\'e erişebilir' });
    }

    const status = emailService.getStatus();
    res.json({
      message: 'Email service durumu',
      status,
      environment: {
        EMAIL_NOTIFICATIONS_ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED,
        MEETING_INVITATION_ENABLED: process.env.MEETING_INVITATION_ENABLED,
        MEETING_REMINDER_ENABLED: process.env.MEETING_REMINDER_ENABLED,
        TASK_ASSIGNMENT_ENABLED: process.env.TASK_ASSIGNMENT_ENABLED,
        TASK_OVERDUE_ENABLED: process.env.TASK_OVERDUE_ENABLED,
      },
    });
  } catch (error) {
    console.error('Email status check error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// @route   POST /api/email-test/send-test
// @desc    Test email gönder
// @access  Private (Admin only)
router.post('/send-test', auth, async (req, res) => {
  try {
    // Only admin can send test emails
    if (req.user.rol !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Sadece admin test email gönderebilir' });
    }

    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res
        .status(400)
        .json({ message: 'Geçerli bir email adresi girin' });
    }

    console.log(`📧 Sending test email to: ${recipientEmail}`);
    await emailService.sendTestEmail(recipientEmail);

    res.json({
      message: `Test email başarıyla gönderildi: ${recipientEmail}`,
      recipient: recipientEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      message: 'Test email gönderilemedi',
      error: error.message,
      details: 'Email servis ayarlarınızı kontrol edin',
    });
  }
});

// @route   POST /api/email-test/send-meeting-invitation
// @desc    Test meeting invitation email gönder
// @access  Private (Admin only)
router.post('/send-meeting-invitation', auth, async (req, res) => {
  try {
    // Only admin can send test emails
    if (req.user.rol !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Sadece admin test email gönderebilir' });
    }

    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    // Create dummy meeting data for testing
    const dummyMeeting = {
      _id: 'test-meeting-id',
      baslik: 'Test Toplantısı - Email Kontrolü',
      aciklama:
        'Bu bir test toplantısıdır. Email sisteminin doğru çalıştığını kontrol etmek için gönderilmiştir.',
      kategori: 'test',
      tarih: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      baslangicSaati: '14:00',
      bitisSaati: '15:00',
      lokasyon: 'Test Toplantı Salonu',
      organizator: {
        ad: req.user.ad,
        soyad: req.user.soyad,
      },
      gundem: [
        { baslik: 'Email sistem testi', siraNo: 1, sure: 30 },
        { baslik: 'Template kontrolü', siraNo: 2, sure: 30 },
      ],
    };

    const dummyParticipants = [
      {
        email: recipientEmail,
        ad: 'Test',
        soyad: 'Kullanıcı',
      },
    ];

    console.log(`📧 Sending test meeting invitation to: ${recipientEmail}`);
    await emailService.sendMeetingInvitation(dummyMeeting, dummyParticipants);

    res.json({
      message: `Test meeting invitation başarıyla gönderildi: ${recipientEmail}`,
      recipient: recipientEmail,
      meetingTitle: dummyMeeting.baslik,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test meeting invitation error:', error);
    res.status(500).json({
      message: 'Test meeting invitation gönderilemedi',
      error: error.message,
    });
  }
});

// @route   POST /api/email-test/send-task-assignment
// @desc    Test task assignment email gönder
// @access  Private (Admin only)
router.post('/send-task-assignment', auth, async (req, res) => {
  try {
    // Only admin can send test emails
    if (req.user.rol !== 'Admin') {
      return res
        .status(403)
        .json({ message: 'Sadece admin test email gönderebilir' });
    }

    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    // Create dummy task data for testing
    const dummyTask = {
      _id: 'test-task-id',
      baslik: 'Test Görevi - Email Kontrolü',
      aciklama:
        'Bu bir test görevidir. Email sisteminin doğru çalıştığını kontrol etmek için oluşturulmuştur.',
      oncelik: 'normal',
      teslimTarihi: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      kaynakToplanti: {
        baslik: 'Test Toplantısı',
      },
    };

    const dummyAssignee = {
      email: recipientEmail,
      ad: 'Test',
      soyad: 'Kullanıcı',
    };

    console.log(`📧 Sending test task assignment to: ${recipientEmail}`);
    await emailService.sendTaskAssignment(dummyTask, dummyAssignee);

    res.json({
      message: `Test task assignment başarıyla gönderildi: ${recipientEmail}`,
      recipient: recipientEmail,
      taskTitle: dummyTask.baslik,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test task assignment error:', error);
    res.status(500).json({
      message: 'Test task assignment gönderilemedi',
      error: error.message,
    });
  }
});

module.exports = router;
