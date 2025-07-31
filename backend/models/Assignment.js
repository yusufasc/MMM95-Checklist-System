const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  returnedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'expired'],
    default: 'active',
  },
  notes: {
    type: String,
    trim: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  condition: {
    type: String,
    enum: ['perfect', 'good', 'fair', 'poor'],
    default: 'perfect',
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
assignmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Status güncellemesi
  if (this.returnedAt && this.status === 'active') {
    this.status = 'returned';
  } else if (this.expiresAt < new Date() && this.status === 'active') {
    this.status = 'expired';
  }

  next();
});

// Virtual for remaining days
assignmentSchema.virtual('remainingDays').get(function () {
  if (this.status !== 'active') {
    return 0;
  }

  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is expired
assignmentSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date() && this.status === 'active';
});

// Virtual for is expiring soon (within 7 days)
assignmentSchema.virtual('isExpiringSoon').get(function () {
  const remainingDays = this.remainingDays;
  return remainingDays > 0 && remainingDays <= 7;
});

assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

// Index for performance
assignmentSchema.index({ userId: 1, status: 1 });
assignmentSchema.index({ equipmentId: 1, status: 1 });
assignmentSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
