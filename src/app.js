const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');

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
const invoiceRoutes = require('./routes/invoices');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers help reduce common web vulnerabilities for API responses.
app.use(helmet());

// Basic request throttling to protect API from abusive traffic spikes.
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS policy:
// 1) If no origin list is configured, allow all origins for local/dev convenience.
// 2) If origins are configured, allow only explicit matches.
const corsOptions = {
  origin(origin, callback) {
    if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
};
app.use(cors(corsOptions));
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
app.use('/api/invoices', invoiceRoutes);

// Error handling should be last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
