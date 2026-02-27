const mongoose = require('mongoose');

const qualityAdjustmentSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, trim: true },
    operator: { type: String, enum: ['lt', 'lte', 'gt', 'gte', 'eq'], required: true },
    value: { type: Number, required: true },
    adjustmentPerTon: { type: Number, required: true },
  },
  { _id: false }
);

const rateCardSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    partyType: {
      type: String,
      required: true,
      enum: ['farmer', 'collection-center', 'land-lease', 'supplier'],
    },
    partyId: { type: String, required: true, trim: true },
    feedstockTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedstockType', required: true },
    effectiveFrom: { type: Date, required: true },
    ratePerTon: { type: Number, required: true, min: 0 },
    qualityAdjustments: { type: [qualityAdjustmentSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rateCardSchema.index(
  { tenantId: 1, partyType: 1, partyId: 1, feedstockTypeId: 1, effectiveFrom: 1 },
  { unique: true }
);

module.exports = mongoose.model('RateCard', rateCardSchema);
