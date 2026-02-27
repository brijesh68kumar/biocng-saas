const mongoose = require('mongoose');

// Vehicle master for dispatch and transport operations.
const vehicleSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    number: { type: String, required: true, trim: true },
    capacityTon: { type: Number, default: 0 },
    ownerType: { type: String, enum: ['owned', 'contracted'], default: 'contracted' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Vehicle number is unique per tenant.
vehicleSchema.index({ tenantId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
