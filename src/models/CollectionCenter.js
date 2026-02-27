const mongoose = require('mongoose');

// Collection centers receive feedstock from local farmers.
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

// Center code is unique per tenant.
collectionCenterSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('CollectionCenter', collectionCenterSchema);
