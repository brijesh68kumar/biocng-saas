const express = require('express');
const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');
const CenterStockLedger = require('../models/CenterStockLedger');
const CenterReceiptLot = require('../models/CenterReceiptLot');

const router = express.Router();

// List center stock ledger entries with optional filters.
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

    if (req.query.centerReceiptLotId) {
      if (!mongoose.isValidObjectId(req.query.centerReceiptLotId)) {
        res.status(400);
        throw new Error('centerReceiptLotId must be a valid ObjectId');
      }
      filter.centerReceiptLotId = req.query.centerReceiptLotId;
    }

    if (req.query.movementType) {
      filter.movementType = req.query.movementType;
    }

    const items = await CenterStockLedger.find(filter).sort({ createdAt: -1 });
    res.json(items);
  })
);

// Post OUT movement for a center receipt lot (e.g. dispatch to plant).
router.post(
  '/out',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const { centerReceiptLotId, qtyTon, refType, refId, remarks } = req.body;

    if (!centerReceiptLotId || qtyTon == null) {
      res.status(400);
      throw new Error('centerReceiptLotId and qtyTon are required');
    }
    if (!mongoose.isValidObjectId(centerReceiptLotId)) {
      res.status(400);
      throw new Error('centerReceiptLotId must be a valid ObjectId');
    }
    if (qtyTon <= 0) {
      res.status(400);
      throw new Error('qtyTon must be greater than 0 for OUT movement');
    }

    const lot = await CenterReceiptLot.findOne(tenantFilter(req, { _id: centerReceiptLotId }));
    if (!lot) {
      res.status(404);
      throw new Error('Center receipt lot not found');
    }
    if (lot.availableQtyTon < qtyTon) {
      res.status(400);
      throw new Error('Insufficient available quantity in lot');
    }

    const newBalance = lot.availableQtyTon - qtyTon;

    // Update lot balance first.
    lot.availableQtyTon = newBalance;
    await lot.save();

    // Record immutable stock movement.
    const entry = await CenterStockLedger.create({
      tenantId: req.tenantId,
      collectionCenterId: lot.collectionCenterId,
      centerReceiptLotId: lot._id,
      movementType: 'OUT',
      qtyTon: -Math.abs(qtyTon),
      balanceAfterTon: newBalance,
      refType: refType || 'manual-out',
      refId: refId || undefined,
      remarks: remarks || undefined,
    });

    res.status(201).json(entry);
  })
);

module.exports = router;
