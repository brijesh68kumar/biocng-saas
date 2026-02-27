const mongoose = require('mongoose');

// Crop plan:
// Defines what feedstock crop is planned on which land parcel and for what dates.
const cropPlanSchema = new mongoose.Schema(
  {
    // Tenant boundary for strict multi-tenant separation
    tenantId: { type: String, required: true, index: true },

    // Human-readable plan code, e.g. CP-2026-001
    planCode: { type: String, required: true, trim: true },

    // Land parcel where this crop is planned
    landParcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'LandParcel', required: true },

    // Feedstock type expected from this crop cycle
    feedstockTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedstockType', required: true },

    // Operational planning timeline
    sowingDate: { type: Date, required: true },
    expectedHarvestDate: { type: Date, required: true },

    // Planning values for production and economics
    expectedYieldTon: { type: Number, required: true, min: 0 },
    estimatedCost: { type: Number, min: 0 },
    notes: { type: String, trim: true },

    // Soft-delete style activity flag
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Keep plan code unique inside tenant.
cropPlanSchema.index({ tenantId: 1, planCode: 1 }, { unique: true });

module.exports = mongoose.model('CropPlan', cropPlanSchema);
