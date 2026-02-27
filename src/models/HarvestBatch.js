const mongoose = require('mongoose');

// Utility to build readable codes for operations teams.
// Example output:
// - batchCode: HB-20260227-839271
// - lotNo: LOT-20260227-839271
const buildCode = (prefix, date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `${prefix}-${y}${m}${d}-${random}`;
};

// Harvest batch:
// Represents one harvested lot from farm land that will enter supply chain.
const harvestBatchSchema = new mongoose.Schema(
  {
    // Tenant boundary for strict customer isolation.
    tenantId: { type: String, required: true, index: true },

    // Human-readable unique batch code.
    batchCode: { type: String, required: true, trim: true },

    // Operational lot number used for traceability across modules.
    lotNo: { type: String, required: true, trim: true },

    // Source references.
    landParcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'LandParcel', required: true },
    cropPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'CropPlan' },
    feedstockTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedstockType', required: true },

    // Harvest details.
    harvestDate: { type: Date, required: true },
    grossQtyTon: { type: Number, required: true, min: 0 },
    moisturePercent: { type: Number, min: 0, max: 100 },
    qualityGrade: { type: String, trim: true },
    notes: { type: String, trim: true },

    // Soft-delete style activity flag.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate codes if caller does not provide them.
harvestBatchSchema.pre('validate', function setCodes(next) {
  if (!this.batchCode) {
    this.batchCode = buildCode('HB', this.harvestDate || new Date());
  }
  if (!this.lotNo) {
    this.lotNo = buildCode('LOT', this.harvestDate || new Date());
  }
  next();
});

// Enforce uniqueness per tenant.
harvestBatchSchema.index({ tenantId: 1, batchCode: 1 }, { unique: true });
harvestBatchSchema.index({ tenantId: 1, lotNo: 1 }, { unique: true });

module.exports = mongoose.model('HarvestBatch', harvestBatchSchema);
