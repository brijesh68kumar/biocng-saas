const mongoose = require('mongoose');

// Connects application to MongoDB using env value or local default
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/biogas';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');
};

module.exports = connectDB;
