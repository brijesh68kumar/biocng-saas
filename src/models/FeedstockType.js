const mongoose = require('mongoose');

const feedstockTypeSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    uom: { type: String, default: 'ton', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

feedstockTypeSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('FeedstockType', feedstockTypeSchema);