const mongoose = require('mongoose');

// Center stock ledger:
// Immutable movement records for each center receipt lot.
// This enables auditable quantity tracking over time.
const centerStockLedgerSchema = new mongoose.Schema(
  {
    // Tenant boundary for strict customer isolation.
    tenantId: { type: String, required: true, index: true },

    // Which collection center the movement belongs to.
    collectionCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionCenter', required: true },

    // Which receipt lot this movement affects.
    centerReceiptLotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CenterReceiptLot', required: true },

    // Movement type:
    // IN = receipt/addition
    // OUT = dispatch/consumption/reduction
    // ADJUST = manual correction
    movementType: { type: String, enum: ['IN', 'OUT', 'ADJUST'], required: true },

    // Signed quantity should be controlled by service layer.
    qtyTon: { type: Number, required: true },

    // Running balance after this movement.
    balanceAfterTon: { type: Number, required: true, min: 0 },

    // Optional reference for traceability to transaction source.
    refType: { type: String, trim: true }, // e.g. center-receipt, dispatch-trip, manual-adjustment
    refId: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// Useful indexes for list screens and audits.
centerStockLedgerSchema.index({ tenantId: 1, collectionCenterId: 1, createdAt: -1 });
centerStockLedgerSchema.index({ tenantId: 1, centerReceiptLotId: 1, createdAt: -1 });

module.exports = mongoose.model('CenterStockLedger', centerStockLedgerSchema);
