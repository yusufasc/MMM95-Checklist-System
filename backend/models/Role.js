const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true,
    unique: true,
  },
  moduller: [
    {
      modul: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
      },
      erisebilir: {
        type: Boolean,
        default: false,
      },
      duzenleyebilir: {
        type: Boolean,
        default: false,
      },
    },
  ],
  // Modern modulePermissions - String bazlı
  modulePermissions: [
    {
      moduleName: {
        type: String,
        required: true,
      },
      gorebilir: {
        type: Boolean,
        default: false,
      },
      duzenleyebilir: {
        type: Boolean,
        default: false,
      },
    },
  ],
  checklistYetkileri: [
    {
      hedefRol: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
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
      onaylayabilir: {
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
});

module.exports = mongoose.model('Role', RoleSchema);
