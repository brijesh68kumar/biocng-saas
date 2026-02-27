const mongoose = require('mongoose');

// User accounts belong to one tenant (plant/customer) and one role.
const userSchema = new mongoose.Schema(
  {
    // Tenant boundary for multi-tenant data isolation
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Email is global unique for this MVP
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Stored as bcrypt hash, never plain text
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'operations', 'procurement', 'driver'],
      default: 'operations',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
