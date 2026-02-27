const express = require('express');
const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');
const CenterReceiptLot = require('../models/CenterReceiptLot');
const CenterStockLedger = require('../models/CenterStockLedger');

const router = express.Router();

// List receipt lots for current tenant with optional filters.
router.get(
  '/',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const filter = tenantFilter(req);

    if (req.query.collectionCenterId) {
      if (!mongoose.isValidObjectId(req.query.collectionCenterId)) {
        res.status(400);
        throw new Error('collectionCenterId must be a valid ObjectId');
      }
      filter.collectionCenterId = req.query.collectionCenterId;
    }

    if (req.query.feedstockTypeId) {
      if (!mongoose.isValidObjectId(req.query.feedstockTypeId)) {
        res.status(400);
        throw new Error('feedstockTypeId must be a valid ObjectId');
      }
      filter.feedstockTypeId = req.query.feedstockTypeId;
    }

    if (req.query.sourceType) {
      filter.sourceType = req.query.sourceType;
    }

    const items = await CenterReceiptLot.find(filter).sort({ createdAt: -1 });
    res.json(items);
  })
);

// Create receipt lot and automatically post IN movement in center stock ledger.
router.post(
  '/',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const { collectionCenterId, sourceType, sourceRefId, feedstockTypeId, receiptDate, grossQtyTon, moisturePercent, qualityGrade, notes } = req.body;

    if (!collectionCenterId || !sourceType || !feedstockTypeId || !receiptDate || grossQtyTon == null) {
      res.status(400);
      throw new Error('collectionCenterId, sourceType, feedstockTypeId, receiptDate and grossQtyTon are required');
    }
    if (!mongoose.isValidObjectId(collectionCenterId)) {
      res.status(400);
      throw new Error('collectionCenterId must be a valid ObjectId');
    }
    if (!mongoose.isValidObjectId(feedstockTypeId)) {
      res.status(400);
      throw new Error('feedstockTypeId must be a valid ObjectId');
    }
    if (grossQtyTon < 0) {
      res.status(400);
      throw new Error('grossQtyTon must be >= 0');
    }

    // Create center receipt lot.
    const lot = await CenterReceiptLot.create({
      tenantId: req.tenantId,
      collectionCenterId,
      sourceType,
      sourceRefId: sourceRefId || undefined,
      feedstockTypeId,
      receiptDate,
      grossQtyTon,
      moisturePercent,
      qualityGrade,
      notes,
    });

    // Create corresponding IN ledger movement.
    await CenterStockLedger.create({
      tenantId: req.tenantId,
      collectionCenterId: lot.collectionCenterId,
      centerReceiptLotId: lot._id,
      movementType: 'IN',
      qtyTon: Math.abs(lot.grossQtyTon),
      balanceAfterTon: lot.availableQtyTon,
      refType: 'center-receipt',
      refId: String(lot._id),
      remarks: lot.notes || undefined,
    });

    res.status(201).json(lot);
  })
);

// Get one receipt lot by id in current tenant scope.
router.get(
  '/:id',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const item = await CenterReceiptLot.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  })
);

// Partial update receipt lot by id.
router.patch(
  '/:id',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    delete req.body.tenantId;
    const item = await CenterReceiptLot.findOneAndUpdate(tenantFilter(req, { _id: req.params.id }), req.body, {
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

// Soft-delete by setting isActive=false.
router.patch(
  '/:id/deactivate',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const item = await CenterReceiptLot.findOneAndUpdate(
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
