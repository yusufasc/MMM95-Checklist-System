const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: false,
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: false,
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  currentExpiryDate: {
    type: Date,
    required: false,
  },
  requestedDate: {
    type: Date,
    required: false,
  },
  reason: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
  },
  customDescription: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
  },
  justification: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  responseNote: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  requestType: {
    type: String,
    enum: ['early_replacement', 'extension', 'repair', 'equipment', 'custom'],
    default: 'equipment',
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
equipmentRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Otomatik işlem tarihi
  if (this.status !== 'pending' && !this.processedAt) {
    this.processedAt = new Date();
  }

  next();
});

// Virtual for days until current expiry
equipmentRequestSchema.virtual('daysUntilExpiry').get(function () {
  const now = new Date();
  const diffTime = this.currentExpiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for requested days early
equipmentRequestSchema.virtual('requestedDaysEarly').get(function () {
  const diffTime = this.currentExpiryDate - this.requestedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is urgent (expires soon)
equipmentRequestSchema.virtual('isUrgent').get(function () {
  return this.daysUntilExpiry <= 3;
});

equipmentRequestSchema.set('toJSON', { virtuals: true });
equipmentRequestSchema.set('toObject', { virtuals: true });

// Index for performance
equipmentRequestSchema.index({ userId: 1, status: 1 });
equipmentRequestSchema.index({ status: 1, requestDate: -1 });
equipmentRequestSchema.index({ equipmentId: 1, status: 1 });

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);
