const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    village: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

farmerSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Farmer', farmerSchema);