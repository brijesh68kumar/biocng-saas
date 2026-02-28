// Loads values from .env into process.env
const dotenv = require('dotenv');

// Initialize environment variables first
dotenv.config();

// Shared environment config includes startup validation.
const config = require('./src/config/env');

// Express app (routes + middleware) and MongoDB connector
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Start server only after a successful DB connection
connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((error) => {
    // Exit process so deployment/PM2 can restart and surface the failure
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
