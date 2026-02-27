const mongoose = require('mongoose');

// Master list of feedstock categories per tenant.
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

// Enforces unique feedstock code inside one tenant.
feedstockTypeSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('FeedstockType', feedstockTypeSchema);
