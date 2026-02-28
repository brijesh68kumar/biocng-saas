const express = require('express');

const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant, tenantFilter } = require('../middleware/tenant');
const InvoiceCycle = require('../models/InvoiceCycle');
const Invoice = require('../models/Invoice');
const PlantIntakeEntry = require('../models/PlantIntakeEntry');
const RateCard = require('../models/RateCard');

const router = express.Router();

// Party type mapping from intake source to rate card party type.
const partyTypeMap = {
  farmer: 'farmer',
  supplier: 'supplier',
  'collection-center': 'collection-center',
};

// Comparison operators used by quality-adjustment rules in rate cards.
const compareByOperator = {
  lt: (left, right) => left < right,
  lte: (left, right) => left <= right,
  gt: (left, right) => left > right,
  gte: (left, right) => left >= right,
  eq: (left, right) => left === right,
};

// Evaluates quality adjustments against one intake row and returns total per-ton impact.
const evaluateQualityAdjustments = (qualityAdjustments, intakeRow) => {
  const adjustments = Array.isArray(qualityAdjustments) ? qualityAdjustments : [];
  let totalAdjustmentPerTon = 0;
  const appliedRules = [];

  for (const rule of adjustments) {
    const metric = String(rule.metric || '').trim();
    if (!metric || typeof compareByOperator[rule.operator] !== 'function') {
      continue;
    }

    const metricValue = Number(intakeRow[metric]);
    const thresholdValue = Number(rule.value);
    const adjustmentPerTon = Number(rule.adjustmentPerTon);
    if (Number.isNaN(metricValue) || Number.isNaN(thresholdValue) || Number.isNaN(adjustmentPerTon)) {
      continue;
    }

    if (compareByOperator[rule.operator](metricValue, thresholdValue)) {
      totalAdjustmentPerTon += adjustmentPerTon;
      appliedRules.push({
        metric,
        operator: rule.operator,
        thresholdValue,
        intakeMetricValue: metricValue,
        adjustmentPerTon,
      });
    }
  }

  return {
    totalAdjustmentPerTon: Number(totalAdjustmentPerTon.toFixed(4)),
    appliedRules,
  };
};

// Generate weekly invoices from intake records.
router.post(
  '/generate-weekly',
  protect,
  requireTenant,
  authorize('admin', 'procurement', 'operations'),
  asyncHandler(async (req, res) => {
    const { weekStartDate, weekEndDate, partyType = 'farmer', forceRegen = false, notes } = req.body;

    if (!weekStartDate || !weekEndDate) {
      res.status(400);
      throw new Error('weekStartDate and weekEndDate are required');
    }
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      res.status(400);
      throw new Error('weekStartDate and weekEndDate must be valid dates');
    }
    if (end < start) {
      res.status(400);
      throw new Error('weekEndDate must be greater than or equal to weekStartDate');
    }
    if (!['farmer', 'supplier', 'collection-center'].includes(partyType)) {
      res.status(400);
      throw new Error('partyType must be one of farmer, supplier, collection-center');
    }

    // Create or reuse cycle for this window.
    let cycle = await InvoiceCycle.findOne(
      tenantFilter(req, {
        weekStartDate: start,
        weekEndDate: end,
      })
    );
    if (!cycle) {
      cycle = await InvoiceCycle.create({
        tenantId: req.tenantId,
        weekStartDate: start,
        weekEndDate: end,
        status: 'open',
      });
    }

    const existingCount = await Invoice.countDocuments(
      tenantFilter(req, {
        cycleId: cycle._id,
        partyType,
      })
    );
    if (existingCount > 0 && !forceRegen) {
      res.status(409);
      throw new Error('Invoices already generated for this cycle and partyType. Use forceRegen=true to regenerate.');
    }
    if (existingCount > 0 && forceRegen) {
      await Invoice.deleteMany(
        tenantFilter(req, {
          cycleId: cycle._id,
          partyType,
        })
      );
    }

    // Pull intake records in date window for requested party type.
    const sourceTypeForParty = Object.keys(partyTypeMap).find((k) => partyTypeMap[k] === partyType);
    const intakeRows = await PlantIntakeEntry.find(
      tenantFilter(req, {
        sourceType: sourceTypeForParty,
        intakeDate: { $gte: start, $lte: end },
        acceptedQtyTon: { $gt: 0 },
        sourceRefId: { $ne: null },
      })
    ).sort({ intakeDate: 1 });

    const grouped = new Map();
    let skippedNoRate = 0;

    for (const row of intakeRows) {
      const resolvedRate = await RateCard.findOne(
        tenantFilter(req, {
          partyType,
          partyId: String(row.sourceRefId),
          feedstockTypeId: row.feedstockTypeId,
          isActive: true,
          effectiveFrom: { $lte: row.intakeDate },
        })
      ).sort({ effectiveFrom: -1, createdAt: -1 });

      if (!resolvedRate) {
        skippedNoRate += 1;
        continue;
      }

      const key = `${partyType}:${String(row.sourceRefId)}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          partyType,
          partyRefId: String(row.sourceRefId),
          totalQtyTon: 0,
          totalAmount: 0,
          lines: [],
        });
      }

      const group = grouped.get(key);
      const qty = row.acceptedQtyTon;
      const baseRatePerTon = Number(resolvedRate.ratePerTon);
      const { totalAdjustmentPerTon, appliedRules } = evaluateQualityAdjustments(resolvedRate.qualityAdjustments, row);
      const adjustedRate = Number((baseRatePerTon + totalAdjustmentPerTon).toFixed(4));
      const finalRatePerTon = adjustedRate < 0 ? 0 : adjustedRate;
      const amount = Number((qty * finalRatePerTon).toFixed(2));

      group.totalQtyTon = Number((group.totalQtyTon + qty).toFixed(3));
      group.totalAmount = Number((group.totalAmount + amount).toFixed(2));
      group.lines.push({
        intakeEntryId: row._id,
        feedstockTypeId: row.feedstockTypeId,
        qtyTon: qty,
        baseRatePerTon,
        qualityAdjustmentPerTon: totalAdjustmentPerTon,
        ratePerTon: finalRatePerTon,
        amount,
        appliedQualityRules: appliedRules,
      });
    }

    const invoices = [];
    for (const group of grouped.values()) {
      const doc = await Invoice.create({
        tenantId: req.tenantId,
        cycleId: cycle._id,
        partyType: group.partyType,
        partyRefId: group.partyRefId,
        weekStartDate: start,
        weekEndDate: end,
        totalQtyTon: group.totalQtyTon,
        totalAmount: group.totalAmount,
        lines: group.lines,
        status: 'generated',
        notes: notes || undefined,
      });
      invoices.push(doc);
    }

    // Mark cycle generated when at least one invoice is produced.
    if (invoices.length > 0) {
      cycle.status = 'generated';
      await cycle.save();
    }

    res.status(201).json({
      cycle: {
        id: cycle._id,
        cycleCode: cycle.cycleCode,
        status: cycle.status,
        weekStartDate: cycle.weekStartDate,
        weekEndDate: cycle.weekEndDate,
      },
      generatedCount: invoices.length,
      skippedNoRate,
      invoices,
    });
  })
);

// List generated invoices with optional filters.
router.get(
  '/',
  protect,
  requireTenant,
  asyncHandler(async (req, res) => {
    const filter = tenantFilter(req);
    if (req.query.cycleId) {
      filter.cycleId = req.query.cycleId;
    }
    if (req.query.partyType) {
      filter.partyType = req.query.partyType;
    }
    if (req.query.partyRefId) {
      filter.partyRefId = req.query.partyRefId;
    }

    const items = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(items);
  })
);

module.exports = router;
