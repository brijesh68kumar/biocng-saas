// Loads values from .env into process.env
const dotenv = require('dotenv');

// Express app (routes + middleware) and MongoDB connector
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Initialize environment variables first
dotenv.config();

// Fallback to 5000 if PORT is not provided in environment
const PORT = process.env.PORT || 5000;

// Start server only after a successful DB connection
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // Exit process so deployment/PM2 can restart and surface the failure
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
