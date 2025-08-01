const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * 📧 MMM95 Email Service
 * Meeting notification ve reminder sistemi
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  /**
   * Email transporter setup
   */
  async initializeTransporter() {
    try {
      // Email provider configuration (Gmail/Outlook/SMTP)
      const emailConfig = {
        // Gmail configuration
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'your-app-password',
        },

        // Alternative SMTP configuration
        // host: process.env.SMTP_HOST,
        // port: process.env.SMTP_PORT || 587,
        // secure: false,
        // auth: {
        //   user: process.env.SMTP_USER,
        //   pass: process.env.SMTP_PASSWORD,
        // },
      };

      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection - safely handle development environment
      if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        try {
          await this.transporter.verify();
          logger.info('✅ Email service initialized successfully');
        } catch (error) {
          logger.warn(
            '⚠️ Email verification failed, continuing without email service',
          );
        }
      } else {
        logger.info(
          '📧 Email service in development mode - verification skipped',
        );
      }

      this.initialized = true;
    } catch (error) {
      logger.error('❌ Email service initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Email template render
   */
  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(
        __dirname,
        '../views/emails',
        `${templateName}.ejs`,
      );
      const html = await ejs.renderFile(templatePath, data);
      return html;
    } catch (error) {
      logger.error(`❌ Email template render error (${templateName}):`, error);
      throw new Error(`Email template render failed: ${templateName}`);
    }
  }

  /**
   * 📧 Meeting Invitation Email
   */
  async sendMeetingInvitation(meetingData, participants) {
    if (!this.initialized) {
      logger.warn('⚠️ Email service not initialized, skipping invitation');
      return false;
    }

    try {
      const emailData = {
        meeting: meetingData,
        organizerName:
          meetingData.organizator?.ad + ' ' + meetingData.organizator?.soyad,
        meetingDate: new Date(meetingData.tarih).toLocaleDateString('tr-TR'),
        meetingTime: meetingData.baslangicSaati,
        location: meetingData.lokasyon || 'Toplantı salonu',
        agenda: meetingData.gundem || [],
        meetingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meetings/${meetingData._id}`,
        companyName: 'MMM95 Ekipman Yönetim Sistemi',
      };

      const htmlContent = await this.renderTemplate(
        'meeting-invitation',
        emailData,
      );

      // Send to all participants
      const emailPromises = participants.map(async participant => {
        const mailOptions = {
          from: `"${emailData.companyName}" <${process.env.EMAIL_USER}>`,
          to: participant.email,
          subject: `📅 Toplantı Daveti: ${meetingData.baslik}`,
          html: htmlContent,
          attachments: [
            // Optional: Add iCal attachment
            // {
            //   filename: 'meeting.ics',
            //   content: this.generateICalContent(meetingData),
            //   contentType: 'text/calendar'
            // }
          ],
        };

        await this.transporter.sendMail(mailOptions);
        logger.info(`✅ Meeting invitation sent to: ${participant.email}`);
      });

      await Promise.all(emailPromises);
      logger.info(
        `📧 Meeting invitations sent to ${participants.length} participants`,
      );
      return true;
    } catch (error) {
      logger.error('❌ Meeting invitation email error:', error);
      return false;
    }
  }

  /**
   * ⏰ Meeting Reminder Email
   */
  async sendMeetingReminder(meetingData, participants, reminderType = '15min') {
    if (!this.initialized) {
      logger.warn('⚠️ Email service not initialized, skipping reminder');
      return false;
    }

    try {
      const reminderTexts = {
        '15min': '15 dakika',
        '1hour': '1 saat',
        '1day': '1 gün',
      };

      const emailData = {
        meeting: meetingData,
        organizerName:
          meetingData.organizator?.ad + ' ' + meetingData.organizator?.soyad,
        meetingDate: new Date(meetingData.tarih).toLocaleDateString('tr-TR'),
        meetingTime: meetingData.baslangicSaati,
        location: meetingData.lokasyon || 'Toplantı salonu',
        reminderTime: reminderTexts[reminderType],
        meetingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meetings/${meetingData._id}`,
        companyName: 'MMM95 Ekipman Yönetim Sistemi',
      };

      const htmlContent = await this.renderTemplate(
        'meeting-reminder',
        emailData,
      );

      // Send to all participants
      const emailPromises = participants.map(async participant => {
        const mailOptions = {
          from: `"${emailData.companyName}" <${process.env.EMAIL_USER}>`,
          to: participant.email,
          subject: `⏰ Toplantı Hatırlatması: ${meetingData.baslik} (${reminderTexts[reminderType]} kaldı)`,
          html: htmlContent,
        };

        await this.transporter.sendMail(mailOptions);
        logger.info(`✅ Meeting reminder sent to: ${participant.email}`);
      });

      await Promise.all(emailPromises);
      logger.info(
        `⏰ Meeting reminders sent to ${participants.length} participants`,
      );
      return true;
    } catch (error) {
      logger.error('❌ Meeting reminder email error:', error);
      return false;
    }
  }

  /**
   * 📋 Task Assignment Email
   */
  async sendTaskAssignment(taskData, assigneeData) {
    if (!this.initialized) {
      logger.warn('⚠️ Email service not initialized, skipping task assignment');
      return false;
    }

    try {
      const emailData = {
        task: taskData,
        assigneeName: assigneeData.ad + ' ' + assigneeData.soyad,
        taskTitle: taskData.baslik,
        taskDescription: taskData.aciklama || 'Açıklama mevcut değil',
        dueDate: taskData.teslimTarihi
          ? new Date(taskData.teslimTarihi).toLocaleDateString('tr-TR')
          : 'Belirsiz',
        priority: taskData.oncelik || 'normal',
        meetingTitle: taskData.kaynakToplanti?.baslik || 'Genel Görev',
        taskUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${taskData._id}`,
        companyName: 'MMM95 Ekipman Yönetim Sistemi',
      };

      const htmlContent = await this.renderTemplate(
        'task-assignment',
        emailData,
      );

      const mailOptions = {
        from: `"${emailData.companyName}" <${process.env.EMAIL_USER}>`,
        to: assigneeData.email,
        subject: `📋 Yeni Görev Ataması: ${taskData.baslik}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Task assignment email sent to: ${assigneeData.email}`);
      return true;
    } catch (error) {
      logger.error('❌ Task assignment email error:', error);
      return false;
    }
  }

  /**
   * ⚠️ Overdue Task Alert Email
   */
  async sendOverdueTaskAlert(taskData, assigneeData) {
    if (!this.initialized) {
      logger.warn('⚠️ Email service not initialized, skipping overdue alert');
      return false;
    }

    try {
      const emailData = {
        task: taskData,
        assigneeName: assigneeData.ad + ' ' + assigneeData.soyad,
        taskTitle: taskData.baslik,
        dueDate: new Date(taskData.teslimTarihi).toLocaleDateString('tr-TR'),
        daysOverdue: Math.floor(
          (new Date() - new Date(taskData.teslimTarihi)) / (1000 * 60 * 60 * 24),
        ),
        taskUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${taskData._id}`,
        companyName: 'MMM95 Ekipman Yönetim Sistemi',
      };

      const htmlContent = await this.renderTemplate('task-overdue', emailData);

      const mailOptions = {
        from: `"${emailData.companyName}" <${process.env.EMAIL_USER}>`,
        to: assigneeData.email,
        subject: `⚠️ Süresi Geçen Görev: ${taskData.baslik}`,
        html: htmlContent,
        priority: 'high',
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Overdue task alert sent to: ${assigneeData.email}`);
      return true;
    } catch (error) {
      logger.error('❌ Overdue task alert email error:', error);
      return false;
    }
  }

  /**
   * 📊 Meeting Summary Email
   */
  async sendMeetingSummary(meetingData, participants, notes, tasks) {
    if (!this.initialized) {
      logger.warn('⚠️ Email service not initialized, skipping summary');
      return false;
    }

    try {
      const emailData = {
        meeting: meetingData,
        meetingDate: new Date(meetingData.tarih).toLocaleDateString('tr-TR'),
        duration: meetingData.toplamSure || 'Belirsiz',
        notes: notes || [],
        tasks: tasks || [],
        participantCount: participants.length,
        companyName: 'MMM95 Ekipman Yönetim Sistemi',
      };

      const htmlContent = await this.renderTemplate(
        'meeting-summary',
        emailData,
      );

      // Send to all participants
      const emailPromises = participants.map(async participant => {
        const mailOptions = {
          from: `"${emailData.companyName}" <${process.env.EMAIL_USER}>`,
          to: participant.email,
          subject: `📊 Toplantı Özeti: ${meetingData.baslik}`,
          html: htmlContent,
        };

        await this.transporter.sendMail(mailOptions);
        logger.info(`✅ Meeting summary sent to: ${participant.email}`);
      });

      await Promise.all(emailPromises);
      logger.info(
        `📊 Meeting summary sent to ${participants.length} participants`,
      );
      return true;
    } catch (error) {
      logger.error('❌ Meeting summary email error:', error);
      return false;
    }
  }

  /**
   * Test email functionality
   */
  async sendTestEmail(recipientEmail) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: `"MMM95 Test" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: '✅ MMM95 Email Service Test',
        html: `
          <h2>🎉 MMM95 Email Service Çalışıyor!</h2>
          <p>Bu test email'i başarıyla aldınız.</p>
          <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          <hr>
          <small>MMM95 Ekipman Yönetim Sistemi</small>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Test email sent to: ${recipientEmail}`);
      return true;
    } catch (error) {
      logger.error('❌ Test email error:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      provider: process.env.EMAIL_SERVICE || 'gmail',
      user: process.env.EMAIL_USER || 'not-configured',
    };
  }
}

// Export singleton instance
module.exports = new EmailService();
