const express = require('express');
const mongoose = require('mongoose');

const RateCard = require('../models/RateCard');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');

const router = express.Router();

// List rate cards for current tenant, with optional query filters.
router.get(
  '/',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const filter = tenantFilter(req);
    if (req.query.partyType) {
      filter.partyType = req.query.partyType;
    }
    if (req.query.partyId) {
      filter.partyId = req.query.partyId;
    }
    if (req.query.feedstockTypeId) {
      filter.feedstockTypeId = req.query.feedstockTypeId;
    }
    if (req.query.isActive) {
      filter.isActive = req.query.isActive === 'true';
    }

    const items = await RateCard.find(filter).sort({ effectiveFrom: -1, createdAt: -1 });
    res.json(items);
  })
);

// Create a new rate card version (effective date based).
router.post(
  '/',
  protect,
  requireTenant,
  authorize('admin', 'procurement'),
  asyncHandler(async (req, res) => {
    const { partyType, partyId, feedstockTypeId, effectiveFrom, ratePerTon, qualityAdjustments } = req.body;

    if (!partyType || !partyId || !feedstockTypeId || !effectiveFrom || ratePerTon == null) {
      res.status(400);
      throw new Error('partyType, partyId, feedstockTypeId, effectiveFrom and ratePerTon are required');
    }
    if (!mongoose.isValidObjectId(feedstockTypeId)) {
      res.status(400);
      throw new Error('feedstockTypeId must be a valid ObjectId');
    }

    const item = await RateCard.create({
      tenantId: req.tenantId,
      partyType,
      partyId,
      feedstockTypeId,
      effectiveFrom,
      ratePerTon,
      qualityAdjustments: qualityAdjustments || [],
    });

    res.status(201).json(item);
  })
);

// Resolve active rate card as of a given date.
// Example use: invoicing engine asks "what price was valid on delivery date?"
router.get(
  '/resolve',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const { partyType, partyId, feedstockTypeId, asOf } = req.query;
    if (!partyType || !partyId || !feedstockTypeId) {
      res.status(400);
      throw new Error('partyType, partyId and feedstockTypeId are required');
    }
    if (!mongoose.isValidObjectId(feedstockTypeId)) {
      res.status(400);
      throw new Error('feedstockTypeId must be a valid ObjectId');
    }

    const asOfDate = asOf ? new Date(asOf) : new Date();
    if (Number.isNaN(asOfDate.getTime())) {
      res.status(400);
      throw new Error('asOf must be a valid date');
    }

    const item = await RateCard.findOne(
      tenantFilter(req, {
        partyType,
        partyId,
        feedstockTypeId,
        isActive: true,
        effectiveFrom: { $lte: asOfDate },
      })
    ).sort({ effectiveFrom: -1, createdAt: -1 });

    if (!item) {
      res.status(404);
      throw new Error('No active rate card found for the given criteria');
    }

    res.json(item);
  })
);

// Get one rate card row by ID.
router.get(
  '/:id',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const item = await RateCard.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  })
);

// Update editable fields in one rate card.
router.patch(
  '/:id',
  protect,
  requireTenant,
  authorize('admin', 'procurement'),
  asyncHandler(async (req, res) => {
    delete req.body.tenantId;
    const item = await RateCard.findOneAndUpdate(tenantFilter(req, { _id: req.params.id }), req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  })
);

// Deactivate a rate card without hard deleting historical data.
router.patch(
  '/:id/deactivate',
  protect,
  requireTenant,
  authorize('admin', 'procurement'),
  asyncHandler(async (req, res) => {
    const item = await RateCard.findOneAndUpdate(
      tenantFilter(req, { _id: req.params.id }),
      { isActive: false },
      { new: true }
    );
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  })
);

module.exports = router;
