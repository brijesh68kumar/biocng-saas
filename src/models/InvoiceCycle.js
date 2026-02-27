const mongoose = require('mongoose');

// Utility to generate readable invoice cycle code.
// Example: IC-20260227-483921
const buildInvoiceCycleCode = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `IC-${y}${m}${d}-${random}`;
};

// Invoice cycle:
// Defines accounting time window for invoice generation.
const invoiceCycleSchema = new mongoose.Schema(
  {
    // Tenant boundary for strict customer isolation.
    tenantId: { type: String, required: true, index: true },

    // Human-readable cycle code.
    cycleCode: { type: String, required: true, trim: true },

    // Weekly cycle range.
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },

    // Operational status.
    status: {
      type: String,
      enum: ['open', 'generated', 'closed'],
      default: 'open',
      index: true,
    },

    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate cycle code if not provided.
invoiceCycleSchema.pre('validate', function setCycleCode() {
  if (!this.cycleCode) {
    this.cycleCode = buildInvoiceCycleCode(this.weekStartDate || new Date());
  }
});

// Unique cycle code within one tenant.
invoiceCycleSchema.index({ tenantId: 1, cycleCode: 1 }, { unique: true });

module.exports = mongoose.model('InvoiceCycle', invoiceCycleSchema);
