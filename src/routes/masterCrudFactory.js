const express = require('express');

const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');

const createMasterRouter = (Model, requiredFields = []) => {
  const router = express.Router();

  router.get('/', protect, requireTenant, asyncHandler(async (req, res) => {
    const items = await Model.find(tenantFilter(req)).sort({ createdAt: -1 });
    res.json(items);
  }));

  router.post('/', protect, requireTenant, authorize('admin', 'procurement'), asyncHandler(async (req, res) => {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        res.status(400);
        throw new Error(`${field} is required`);
      }
    }
    const payload = { ...req.body, tenantId: req.tenantId };
    const item = await Model.create(payload);
    res.status(201).json(item);
  }));

  router.get('/:id', protect, requireTenant, asyncHandler(async (req, res) => {
    const item = await Model.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  }));

  router.patch('/:id', protect, requireTenant, authorize('admin', 'procurement'), asyncHandler(async (req, res) => {
    delete req.body.tenantId;
    const item = await Model.findOneAndUpdate(
      tenantFilter(req, { _id: req.params.id }),
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }

    res.json(item);
  }));

  router.patch('/:id/deactivate', protect, requireTenant, authorize('admin', 'procurement'), asyncHandler(async (req, res) => {
    const item = await Model.findOneAndUpdate(
      tenantFilter(req, { _id: req.params.id }),
      { isActive: false },
      { new: true }
    );

    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }

    res.json(item);
  }));

  return router;
};

module.exports = createMasterRouter;