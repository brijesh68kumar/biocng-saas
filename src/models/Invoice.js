const mongoose = require('mongoose');

// Utility to generate readable invoice numbers.
// Example: INV-20260227-483921
const buildInvoiceNo = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `INV-${y}${m}${d}-${random}`;
};

// Invoice line details derived from intake entries.
const appliedQualityRuleSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, trim: true },
    operator: { type: String, enum: ['lt', 'lte', 'gt', 'gte', 'eq'], required: true },
    thresholdValue: { type: Number, required: true },
    intakeMetricValue: { type: Number, required: true },
    adjustmentPerTon: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceLineSchema = new mongoose.Schema(
  {
    intakeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantIntakeEntry', required: true },
    feedstockTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedstockType', required: true },
    qtyTon: { type: Number, required: true, min: 0 },
    baseRatePerTon: { type: Number, required: true, min: 0 },
    qualityAdjustmentPerTon: { type: Number, default: 0 },
    ratePerTon: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    appliedQualityRules: { type: [appliedQualityRuleSchema], default: [] },
  },
  { _id: false }
);

// Invoice document generated for one party within one cycle.
const invoiceSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    invoiceNo: { type: String, required: true, trim: true },
    cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceCycle', required: true, index: true },

    // Party billed in this invoice.
    partyType: { type: String, enum: ['farmer', 'supplier', 'collection-center'], required: true },
    partyRefId: { type: String, required: true, trim: true },

    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },

    totalQtyTon: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    lines: { type: [invoiceLineSchema], default: [] },

    status: { type: String, enum: ['generated', 'finalized'], default: 'generated' },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate invoice number.
invoiceSchema.pre('validate', function setInvoiceNo() {
  if (!this.invoiceNo) {
    this.invoiceNo = buildInvoiceNo(this.weekStartDate || new Date());
  }
});

// One invoice per party per cycle in one tenant.
invoiceSchema.index({ tenantId: 1, cycleId: 1, partyType: 1, partyRefId: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
