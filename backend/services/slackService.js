const axios = require('axios');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.enabled = process.env.SLACK_ENABLED === 'true';
    this.channel = process.env.SLACK_CHANNEL || '#general';
    this.username = process.env.SLACK_USERNAME || 'MMM-Bot';
  }

  async sendMessage(message, options = {}) {
    if (!this.enabled || !this.webhookUrl) {
      console.log('Slack disabled or webhook URL not configured');
      return;
    }

    const payload = {
      channel: options.channel || this.channel,
      username: options.username || this.username,
      text: message,
      icon_emoji: options.emoji || ':robot_face:',
      ...options,
    };

    try {
      await axios.post(this.webhookUrl, payload);
      console.log('Slack mesajı gönderildi:', message.substring(0, 50) + '...');
    } catch (error) {
      console.error('Slack mesaj gönderme hatası:', error.message);
    }
  }

  // Sistem durumu bildirimi
  async sendSystemStatus(status, details = {}) {
    const emoji = status === 'up' ? ':white_check_mark:' : ':x:';
    const message =
      `${emoji} **MMM Checklist System ${status.toUpperCase()}**\n` +
      `🕐 Zaman: ${new Date().toLocaleString('tr-TR')}\n` +
      `🖥️ Port: ${details.port || 'N/A'}\n` +
      `💾 Memory: ${details.memory || 'N/A'}\n` +
      `⏱️ Uptime: ${details.uptime || 'N/A'}`;

    await this.sendMessage(message, {
      emoji,
      channel: '#mmm-notifications',
    });
  }

  // Hata bildirimi
  async sendError(error, context = {}) {
    const message =
      '🚨 **HATA RAPORU**\n' +
      `❌ Hata: ${error.message}\n` +
      `📍 Endpoint: ${context.endpoint || 'N/A'}\n` +
      `👤 Kullanıcı: ${context.user || 'Anonymous'}\n` +
      `🕐 Zaman: ${new Date().toLocaleString('tr-TR')}`;

    await this.sendMessage(message, {
      emoji: ':warning:',
      channel: '#mmm-errors',
    });
  }

  // Görev tamamlama bildirimi
  async sendTaskCompletion(task, user) {
    const message =
      '✅ **GÖREV TAMAMLANDI**\n' +
      `📋 Görev: ${task.ad || task.name}\n` +
      `👤 Kullanıcı: ${user.username || user.ad}\n` +
      `🏭 Makina: ${task.makina || 'N/A'}\n` +
      `🏆 Puan: ${task.puan || 'N/A'}\n` +
      `🕐 Zaman: ${new Date().toLocaleString('tr-TR')}`;

    await this.sendMessage(message, {
      emoji: ':white_check_mark:',
      channel: '#mmm-tasks',
    });
  }

  // Performance uyarısı
  async sendPerformanceAlert(metrics) {
    const message =
      '⚠️ **PERFORMANCE UYARISI**\n' +
      `💾 Memory: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB\n` +
      `⏱️ Uptime: ${Math.round(metrics.uptime / 3600)}h\n` +
      `🔗 Connections: ${metrics.connections || 'N/A'}\n` +
      `🕐 Zaman: ${new Date().toLocaleString('tr-TR')}`;

    await this.sendMessage(message, {
      emoji: ':warning:',
      channel: '#mmm-monitoring',
    });
  }
}

module.exports = new SlackService();
