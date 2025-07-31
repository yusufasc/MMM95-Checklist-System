const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  defaultUsagePeriodDays: {
    type: Number,
    required: true,
    min: 1,
  },
  category: {
    type: String,
    required: true,
    enum: ['Bilgisayar', 'Telefon', 'Araç', 'Kıyafet', 'Donanım', 'Diğer'],
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
equipmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for equipment status
equipmentSchema.virtual('totalAssigned').get(function () {
  // Bu değer populate edilmeli
  return this._totalAssigned || 0;
});

equipmentSchema.set('toJSON', { virtuals: true });
equipmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
