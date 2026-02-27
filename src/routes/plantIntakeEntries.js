const express = require('express');
const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');
const PlantIntakeEntry = require('../models/PlantIntakeEntry');

const router = express.Router();

// List intake entries with optional filters.
router.get(
  '/',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const filter = tenantFilter(req);

    if (req.query.sourceType) {
      filter.sourceType = req.query.sourceType;
    }
    if (req.query.feedstockTypeId) {
      if (!mongoose.isValidObjectId(req.query.feedstockTypeId)) {
        res.status(400);
        throw new Error('feedstockTypeId must be a valid ObjectId');
      }
      filter.feedstockTypeId = req.query.feedstockTypeId;
    }
    if (req.query.dispatchTripId) {
      if (!mongoose.isValidObjectId(req.query.dispatchTripId)) {
        res.status(400);
        throw new Error('dispatchTripId must be a valid ObjectId');
      }
      filter.dispatchTripId = req.query.dispatchTripId;
    }

    const items = await PlantIntakeEntry.find(filter).sort({ createdAt: -1 });
    res.json(items);
  })
);

// Create intake entry.
router.post(
  '/',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const {
      dispatchTripId,
      feedstockTypeId,
      sourceType,
      sourceRefId,
      grossWeightTon,
      tareWeightTon,
      netWeightTon,
      moisturePercent,
      contaminationPercent,
      qualityGrade,
      acceptedQtyTon,
      rejectedQtyTon,
      rejectionReason,
      intakeDate,
      notes,
    } = req.body;

    if (!feedstockTypeId || !sourceType || grossWeightTon == null || tareWeightTon == null || intakeDate == null) {
      res.status(400);
      throw new Error('feedstockTypeId, sourceType, grossWeightTon, tareWeightTon and intakeDate are required');
    }
    if (!mongoose.isValidObjectId(feedstockTypeId)) {
      res.status(400);
      throw new Error('feedstockTypeId must be a valid ObjectId');
    }
    if (dispatchTripId && !mongoose.isValidObjectId(dispatchTripId)) {
      res.status(400);
      throw new Error('dispatchTripId must be a valid ObjectId');
    }
    if (grossWeightTon < tareWeightTon) {
      res.status(400);
      throw new Error('grossWeightTon cannot be less than tareWeightTon');
    }

    const item = await PlantIntakeEntry.create({
      tenantId: req.tenantId,
      dispatchTripId: dispatchTripId || undefined,
      feedstockTypeId,
      sourceType,
      sourceRefId: sourceRefId || undefined,
      grossWeightTon,
      tareWeightTon,
      netWeightTon,
      moisturePercent,
      contaminationPercent,
      qualityGrade,
      acceptedQtyTon,
      rejectedQtyTon,
      rejectionReason,
      intakeDate,
      notes,
    });

    res.status(201).json(item);
  })
);

// Get one intake entry by id.
router.get(
  '/:id',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const item = await PlantIntakeEntry.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  })
);

// Partial update intake entry by id.
router.patch(
  '/:id',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    delete req.body.tenantId;
    const item = await PlantIntakeEntry.findOneAndUpdate(tenantFilter(req, { _id: req.params.id }), req.body, {
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

// Soft delete style deactivation.
router.patch(
  '/:id/deactivate',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const item = await PlantIntakeEntry.findOneAndUpdate(
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
