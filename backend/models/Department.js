const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    ad: {
      type: String,
      required: true,
      unique: true,
    },
    digerDepartmanYetkileri: [
      {
        hedefDepartman: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department',
          required: true,
        },
        gorebilir: {
          type: Boolean,
          default: false,
        },
        puanlayabilir: {
          type: Boolean,
          default: false,
        },
      },
    ],
    olusturmaTarihi: {
      type: Date,
      default: Date.now,
    },
    guncellemeTarihi: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'olusturmaTarihi', updatedAt: 'guncellemeTarihi' },
  },
);

module.exports = mongoose.model('Department', DepartmentSchema);
