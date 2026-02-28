const mongoose = require('mongoose');
const config = require('./env');

// Connects application to MongoDB using env value or local default
const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');
};

module.exports = connectDB;
