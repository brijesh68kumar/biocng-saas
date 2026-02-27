const express = require('express');
const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');
const DispatchTrip = require('../models/DispatchTrip');

const router = express.Router();

// List dispatch trips with optional filters.
router.get(
  '/',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const filter = tenantFilter(req);

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.sourceType) {
      filter.sourceType = req.query.sourceType;
    }
    if (req.query.vehicleId) {
      if (!mongoose.isValidObjectId(req.query.vehicleId)) {
        res.status(400);
        throw new Error('vehicleId must be a valid ObjectId');
      }
      filter.vehicleId = req.query.vehicleId;
    }
    if (req.query.collectionCenterId) {
      if (!mongoose.isValidObjectId(req.query.collectionCenterId)) {
        res.status(400);
        throw new Error('collectionCenterId must be a valid ObjectId');
      }
      filter.collectionCenterId = req.query.collectionCenterId;
    }
    if (req.query.landParcelId) {
      if (!mongoose.isValidObjectId(req.query.landParcelId)) {
        res.status(400);
        throw new Error('landParcelId must be a valid ObjectId');
      }
      filter.landParcelId = req.query.landParcelId;
    }

    const items = await DispatchTrip.find(filter).sort({ createdAt: -1 });
    res.json(items);
  })
);

// Create dispatch trip.
router.post(
  '/',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const { sourceType, collectionCenterId, landParcelId, vehicleId, driverName, driverPhone, destinationPlantName, plannedLots, status, dispatchDate, arrivalDate, notes } = req.body;

    if (!sourceType) {
      res.status(400);
      throw new Error('sourceType is required');
    }
    if (collectionCenterId && !mongoose.isValidObjectId(collectionCenterId)) {
      res.status(400);
      throw new Error('collectionCenterId must be a valid ObjectId');
    }
    if (landParcelId && !mongoose.isValidObjectId(landParcelId)) {
      res.status(400);
      throw new Error('landParcelId must be a valid ObjectId');
    }
    if (vehicleId && !mongoose.isValidObjectId(vehicleId)) {
      res.status(400);
      throw new Error('vehicleId must be a valid ObjectId');
    }

    const item = await DispatchTrip.create({
      tenantId: req.tenantId,
      sourceType,
      collectionCenterId: collectionCenterId || undefined,
      landParcelId: landParcelId || undefined,
      vehicleId: vehicleId || undefined,
      driverName,
      driverPhone,
      destinationPlantName,
      plannedLots: plannedLots || [],
      status: status || 'planned',
      dispatchDate,
      arrivalDate,
      notes,
    });

    res.status(201).json(item);
  })
);

// Get one dispatch trip by id.
router.get(
  '/:id',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const item = await DispatchTrip.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!item) {
      res.status(404);
      throw new Error('Record not found');
    }
    res.json(item);
  })
);

// Partial update for dispatch trip.
router.patch(
  '/:id',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    delete req.body.tenantId;
    const item = await DispatchTrip.findOneAndUpdate(tenantFilter(req, { _id: req.params.id }), req.body, {
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

// Status-only update endpoint for workflow transitions.
router.patch(
  '/:id/status',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const { status, dispatchDate, arrivalDate } = req.body;
    if (!status) {
      res.status(400);
      throw new Error('status is required');
    }

    const allowedStatus = ['planned', 'dispatched', 'in_transit', 'arrived', 'closed', 'cancelled'];
    if (!allowedStatus.includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }

    const patch = { status };
    if (dispatchDate) {
      patch.dispatchDate = dispatchDate;
    }
    if (arrivalDate) {
      patch.arrivalDate = arrivalDate;
    }

    const item = await DispatchTrip.findOneAndUpdate(tenantFilter(req, { _id: req.params.id }), patch, {
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
    const item = await DispatchTrip.findOneAndUpdate(
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
