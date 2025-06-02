const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mesaj: {
    type: String,
    required: true,
  },
  okundu: {
    type: Boolean,
    default: false,
  },
  tarih: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);
