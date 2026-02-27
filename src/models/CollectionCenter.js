const mongoose = require('mongoose');

const collectionCenterSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    managerName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

collectionCenterSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('CollectionCenter', collectionCenterSchema);