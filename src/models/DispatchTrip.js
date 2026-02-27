const mongoose = require('mongoose');

// Utility to generate readable trip code.
// Example: DT-20260227-483921
const buildTripCode = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `DT-${y}${m}${d}-${random}`;
};

// Planned lot references attached to a dispatch trip.
const plannedLotSchema = new mongoose.Schema(
  {
    // Source of lot.
    lotSourceType: {
      type: String,
      enum: ['center-receipt', 'harvest-batch'],
      required: true,
    },
    // Reference record ID stored as string for flexible source model linking.
    lotRefId: { type: String, required: true, trim: true },
    // Planned quantity to move from this lot.
    qtyTon: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Dispatch trip:
// Represents transportation movement from source to plant.
const dispatchTripSchema = new mongoose.Schema(
  {
    // Tenant boundary for strict customer isolation.
    tenantId: { type: String, required: true, index: true },

    // Human-readable trip code used by operations team.
    tripCode: { type: String, required: true, trim: true },

    // Source mode for this trip.
    sourceType: {
      type: String,
      enum: ['collection-center', 'own-farm', 'mixed'],
      required: true,
    },

    // Source location references (optional depending on sourceType).
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter' },
    landParcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'LandParcel' },

    // Transport references.
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },

    // Destination details.
    destinationPlantName: { type: String, default: 'Main Plant', trim: true },

    // Lot-wise plan to move feedstock.
    plannedLots: { type: [plannedLotSchema], default: [] },

    // Operational status lifecycle.
    status: {
      type: String,
      enum: ['planned', 'dispatched', 'in_transit', 'arrived', 'closed', 'cancelled'],
      default: 'planned',
      index: true,
    },
    dispatchDate: { type: Date },
    arrivalDate: { type: Date },

    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate trip code when omitted.
dispatchTripSchema.pre('validate', function setTripCode() {
  if (!this.tripCode) {
    this.tripCode = buildTripCode(this.dispatchDate || new Date());
  }
});

// Enforce unique trip code inside tenant.
dispatchTripSchema.index({ tenantId: 1, tripCode: 1 }, { unique: true });

module.exports = mongoose.model('DispatchTrip', dispatchTripSchema);
