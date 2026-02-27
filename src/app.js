const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const feedstockTypeRoutes = require('./routes/feedstockTypes');
const farmerRoutes = require('./routes/farmers');
const collectionCenterRoutes = require('./routes/collectionCenters');
const vehicleRoutes = require('./routes/vehicles');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('BioCNG SaaS API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/feedstock-types', feedstockTypeRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/collection-centers', collectionCenterRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;