const express = require('express');
const cors = require('cors');

// Route modules grouped by business area
const authRoutes = require('./routes/auth');
const feedstockTypeRoutes = require('./routes/feedstockTypes');
const farmerRoutes = require('./routes/farmers');
const collectionCenterRoutes = require('./routes/collectionCenters');
const vehicleRoutes = require('./routes/vehicles');
const rateCardRoutes = require('./routes/rateCards');
const landParcelRoutes = require('./routes/landParcels');
const cropPlanRoutes = require('./routes/cropPlans');
const harvestBatchRoutes = require('./routes/harvestBatches');
const centerReceiptLotRoutes = require('./routes/centerReceiptLots');
const centerStockLedgerRoutes = require('./routes/centerStockLedger');
const dispatchTripRoutes = require('./routes/dispatchTrips');
const plantIntakeEntryRoutes = require('./routes/plantIntakeEntries');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global middleware: allow cross-origin calls and JSON request bodies
app.use(cors());
app.use(express.json());

// Basic health route to verify API is up
app.get('/', (req, res) => {
  res.send('BioCNG SaaS API is running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/feedstock-types', feedstockTypeRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/collection-centers', collectionCenterRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rate-cards', rateCardRoutes);
app.use('/api/land-parcels', landParcelRoutes);
app.use('/api/crop-plans', cropPlanRoutes);
app.use('/api/harvest-batches', harvestBatchRoutes);
app.use('/api/center-receipt-lots', centerReceiptLotRoutes);
app.use('/api/center-stock-ledger', centerStockLedgerRoutes);
app.use('/api/dispatch-trips', dispatchTripRoutes);
app.use('/api/plant-intake-entries', plantIntakeEntryRoutes);

// Error handling should be last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
