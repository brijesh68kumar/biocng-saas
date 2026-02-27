// Reads tenantId either from logged-in user or fallback request header.
const getTenantId = (req) => {
  if (req.user && req.user.tenantId) {
    return String(req.user.tenantId);
  }
  if (req.headers['x-tenant-id']) {
    return String(req.headers['x-tenant-id']);
  }
  return null;
};

// Ensures every multi-tenant request has tenant context.
const requireTenant = (req, res, next) => {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400);
    throw new Error('Tenant context is required');
  }
  req.tenantId = tenantId;
  next();
};

// Helper used in queries: always applies tenant filter first.
const tenantFilter = (req, extra = {}) => ({
  tenantId: req.tenantId,
  ...extra,
});

module.exports = { getTenantId, requireTenant, tenantFilter };
