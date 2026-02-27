const mongoose = require('mongoose');

// Land parcel master:
// Represents one rented/owned piece of land used for feedstock cultivation.
const landParcelSchema = new mongoose.Schema(
  {
    // Tenant boundary (one customer/plant scope)
    tenantId: { type: String, required: true, index: true },

    // Human-readable unique code inside tenant, e.g. LP-001
    parcelCode: { type: String, required: true, trim: true },

    // Ownership mode helps track legal/financial nature
    landType: { type: String, enum: ['rented', 'owned'], default: 'rented' },

    // Who owns the land when rented
    lessorName: { type: String, trim: true },

    // Basic location and size fields for planning
    village: { type: String, trim: true },
    district: { type: String, trim: true },
    areaAcres: { type: Number, required: true, min: 0 },

    // Lease period (optional for owned land)
    leaseStartDate: { type: Date },
    leaseEndDate: { type: Date },

    // Agreed rent amount (if applicable)
    rentPerAcrePerYear: { type: Number, min: 0 },

    // Soft-delete style activity flag
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One parcel code cannot repeat within same tenant.
landParcelSchema.index({ tenantId: 1, parcelCode: 1 }, { unique: true });

module.exports = mongoose.model('LandParcel', landParcelSchema);
