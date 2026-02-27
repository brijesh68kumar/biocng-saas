const mongoose = require('mongoose');

// Utility to generate readable plant intake entry code.
// Example: PIE-20260227-483921
const buildIntakeCode = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `PIE-${y}${m}${d}-${random}`;
};

// Plant intake entry:
// Represents weighbridge + quality outcome at plant gate.
const plantIntakeEntrySchema = new mongoose.Schema(
  {
    // Tenant boundary for strict customer isolation.
    tenantId: { type: String, required: true, index: true },

    // Human-readable intake code.
    intakeCode: { type: String, required: true, trim: true },

    // Linked dispatch trip (optional for manual direct intake).
    dispatchTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchTrip' },

    // Material and source references.
    feedstockTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedstockType', required: true },
    sourceType: { type: String, enum: ['farmer', 'collection-center', 'own-farm', 'supplier'], required: true },
    sourceRefId: { type: String, trim: true },

    // Weighbridge measurements.
    grossWeightTon: { type: Number, required: true, min: 0 },
    tareWeightTon: { type: Number, required: true, min: 0 },
    netWeightTon: { type: Number, required: true, min: 0 },

    // Quality checks and acceptance results.
    moisturePercent: { type: Number, min: 0, max: 100 },
    contaminationPercent: { type: Number, min: 0, max: 100 },
    qualityGrade: { type: String, trim: true },
    acceptedQtyTon: { type: Number, required: true, min: 0 },
    rejectedQtyTon: { type: Number, required: true, min: 0 },
    rejectionReason: { type: String, trim: true },

    // Operational timestamps.
    intakeDate: { type: Date, required: true },
    notes: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate intake code when omitted.
plantIntakeEntrySchema.pre('validate', function setIntakeCode() {
  if (!this.intakeCode) {
    this.intakeCode = buildIntakeCode(this.intakeDate || new Date());
  }
});

// Basic data integrity checks.
plantIntakeEntrySchema.pre('validate', function validateWeights() {
  if (this.netWeightTon == null && this.grossWeightTon != null && this.tareWeightTon != null) {
    this.netWeightTon = Math.max(this.grossWeightTon - this.tareWeightTon, 0);
  }

  if (this.acceptedQtyTon == null && this.rejectedQtyTon == null && this.netWeightTon != null) {
    this.acceptedQtyTon = this.netWeightTon;
    this.rejectedQtyTon = 0;
  }
});

// Enforce unique intake code inside tenant.
plantIntakeEntrySchema.index({ tenantId: 1, intakeCode: 1 }, { unique: true });

module.exports = mongoose.model('PlantIntakeEntry', plantIntakeEntrySchema);
