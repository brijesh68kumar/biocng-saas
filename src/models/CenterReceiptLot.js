const mongoose = require('mongoose');

// Utility for readable receipt lot codes.
// Example: CRL-20260227-482915
const buildReceiptLotCode = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `CRL-${y}${m}${d}-${random}`;
};

// Center receipt lot:
// A lot created when feedstock is received at a collection center.
const centerReceiptLotSchema = new mongoose.Schema(
  {
    // Tenant boundary for strict customer isolation.
    tenantId: { type: String, required: true, index: true },

    // Human-readable lot code for operations team.
    receiptLotCode: { type: String, required: true, trim: true },

    // Which collection center received this lot.
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },

    // Source of this inward lot.
    sourceType: { type: String, enum: ['farmer', 'own-farm', 'supplier'], required: true },
    sourceRefId: { type: String, trim: true },

    // Material and quantity details.
    feedstockTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedstockType', required: true },
    receiptDate: { type: Date, required: true },
    grossQtyTon: { type: Number, required: true, min: 0 },
    moisturePercent: { type: Number, min: 0, max: 100 },
    qualityGrade: { type: String, trim: true },

    // Used for stock ledger calculations.
    availableQtyTon: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },

    // Soft-delete style activity flag.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate code and default available quantity at create time.
centerReceiptLotSchema.pre('validate', function setDefaults() {
  if (!this.receiptLotCode) {
    this.receiptLotCode = buildReceiptLotCode(this.receiptDate || new Date());
  }
  if (this.availableQtyTon == null && this.grossQtyTon != null) {
    this.availableQtyTon = this.grossQtyTon;
  }
});

// Enforce unique lot code inside tenant.
centerReceiptLotSchema.index({ tenantId: 1, receiptLotCode: 1 }, { unique: true });

module.exports = mongoose.model('CenterReceiptLot', centerReceiptLotSchema);
